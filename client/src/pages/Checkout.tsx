import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapPin, CreditCard, Banknote, MessageCircle, Tag, Gift, Plus, Check, AlertCircle, Clock } from "lucide-react";
import { isStoreOpen, getStoreStatusMessage } from "@/lib/storeHours";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DELIVERY_FEE = 5.0;
const POINTS_TO_BRL = 0.05; // 100 pts = R$5

type PaymentMethod = "pix_whatsapp" | "cartao" | "dinheiro";

const PAYMENT_OPTIONS = [
  {
    id: "pix_whatsapp" as PaymentMethod,
    label: "PIX via WhatsApp",
    desc: "Envie o comprovante pelo WhatsApp após confirmar",
    icon: MessageCircle,
    color: "text-green-600",
  },
  {
    id: "cartao" as PaymentMethod,
    label: "Cartão (débito/crédito)",
    desc: "Pagamento na entrega com maquininha",
    icon: CreditCard,
    color: "text-blue-600",
  },
  {
    id: "dinheiro" as PaymentMethod,
    label: "Dinheiro",
    desc: "Pagamento em dinheiro na entrega",
    icon: Banknote,
    color: "text-emerald-600",
  },
];

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix_whatsapp");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [usePoints, setUsePoints] = useState(0);
  const [notes, setNotes] = useState("");
  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: "Casa",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    zipCode: "",
  });

  const { data: cartItems = [] } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: addresses = [], refetch: refetchAddresses } = trpc.address.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const validateCoupon = trpc.coupon.validate.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon({ code: couponCode.toUpperCase(), discount: data.discount });
      toast.success(`Cupom aplicado! Desconto de R$ ${data.discount.toFixed(2)}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertAddress = trpc.address.upsert.useMutation({
    onSuccess: () => {
      refetchAddresses();
      setNewAddressOpen(false);
      toast.success("Endereço salvo!");
    },
    onError: (err) => toast.error(err.message),
  });

  const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
      utils.cart.get.invalidate();

      // Montar mensagem completa para WhatsApp
      const paymentLabels: Record<string, string> = {
        pix_whatsapp: "PIX via WhatsApp",
        cartao: "Cart\u00e3o (d\u00e9bito/cr\u00e9dito) na entrega",
        dinheiro: "Dinheiro na entrega",
      };

      const addr = data.addressSnapshot as Record<string, string> | null;
      const enderecoStr = addr
        ? `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ""} — ${addr.neighborhood}, ${addr.city ?? "Bauru"}`
        : "(endere\u00e7o n\u00e3o informado)";

      const itensStr = data.items
        .map((i) => {
          let linha = `  • ${i.quantity}x ${i.productName} — R$ ${parseFloat(i.itemTotal).toFixed(2)}`;
          if (i.observations) linha += `\n    Obs: ${i.observations}`;
          return linha;
        })
        .join("\n");

      const descontoStr =
        parseFloat(data.discount) > 0
          ? `\nDesconto: -R$ ${parseFloat(data.discount).toFixed(2)}`
          : "";

      const obsStr = data.notes ? `\n\n\uD83D\uDCDD Observa\u00e7\u00f5es: ${data.notes}` : "";

      const msg =
        `\uD83C\uDF54 *NOVO PEDIDO #${data.orderId} — Pantanal Lanches*\n\n` +
        `*Itens:*\n${itensStr}\n\n` +
        `*Subtotal:* R$ ${parseFloat(data.subtotal).toFixed(2)}\n` +
        `*Taxa de entrega:* R$ ${parseFloat(data.deliveryFee).toFixed(2)}` +
        descontoStr +
        `\n*TOTAL: R$ ${parseFloat(data.total).toFixed(2)}*\n\n` +
        `*Pagamento:* ${paymentLabels[data.paymentMethod] ?? data.paymentMethod}\n` +
        `*Endere\u00e7o:* ${enderecoStr}` +
        obsStr;

      const whatsappUrl = `https://wa.me/5514997779977?text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, "_blank");

      toast.success("Pedido confirmado! Enviando para o WhatsApp...");
      navigate(`/minha-conta/pedidos/${data.orderId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const storeOpen = isStoreOpen();
  const storeStatus = getStoreStatusMessage();

  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product?.price ?? "0");
    const extrasTotal = ((item.extras as Array<{ price: number }> | null) ?? []).reduce(
      (s, e) => s + e.price,
      0
    );
    return sum + (price + extrasTotal) * item.quantity;
  }, 0);

  const maxPointsToUse = Math.min(user?.loyaltyPoints ?? 0, Math.floor(subtotal / POINTS_TO_BRL));
  const pointsDiscount = usePoints * POINTS_TO_BRL;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const totalDiscount = couponDiscount + pointsDiscount;
  const total = Math.max(0, subtotal + DELIVERY_FEE - totalDiscount);

  const handleSubmit = () => {
    if (!storeOpen) {
      toast.error("A loja está fechada no momento. Funcionamos de terça a domingo, das 19h às 23h.");
      return;
    }
    if (!selectedAddressId && addresses.length > 0) {
      toast.error("Selecione um endereço de entrega");
      return;
    }
    createOrder.mutate({
      paymentMethod,
      addressId: selectedAddressId,
      couponCode: appliedCoupon?.code,
      notes: notes || undefined,
      usePoints,
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="container py-16 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="font-display text-2xl mb-2">Carrinho vazio</h2>
        <p className="text-muted-foreground mb-6">Adicione produtos antes de finalizar o pedido</p>
        <Button onClick={() => navigate("/cardapio")} className="bg-primary text-primary-foreground">
          Ver Cardápio
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-foreground mb-6">Finalizar Pedido</h1>

      <div className="flex flex-col gap-5">

        {/* ── Resumo dos Itens ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display text-lg mb-3">Itens do Pedido</h2>
          <div className="flex flex-col gap-2 mb-4">
            {cartItems.map((item) => {
              const price = parseFloat(item.product?.price ?? "0");
              const extrasTotal = ((item.extras as Array<{ price: number }> | null) ?? []).reduce(
                (s, e) => s + e.price,
                0
              );
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground/80">
                    {item.quantity}x {item.product?.name}
                  </span>
                  <span className="font-semibold">
                    R$ {((price + extrasTotal) * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span>R$ {DELIVERY_FEE.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Desconto</span>
                <span>-R$ {totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* ── Endereço de Entrega ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Endereço de Entrega
            </h2>
            <Dialog open={newAddressOpen} onOpenChange={setNewAddressOpen}>
              <DialogTrigger asChild>
                <button className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Novo
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Endereço</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  {[
                    { key: "label", label: "Apelido", placeholder: "Casa, Trabalho..." },
                    { key: "street", label: "Rua", placeholder: "Nome da rua" },
                    { key: "number", label: "Número", placeholder: "123" },
                    { key: "complement", label: "Complemento", placeholder: "Apto, Bloco..." },
                    { key: "neighborhood", label: "Bairro", placeholder: "Bairro" },
                    { key: "zipCode", label: "CEP", placeholder: "17000-000" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                        {label}
                      </label>
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={(newAddr as Record<string, string>)[key]}
                        onChange={(e) => setNewAddr((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  ))}
                  <Button
                    onClick={() =>
                      upsertAddress.mutate({ ...newAddr, isDefault: addresses.length === 0 })
                    }
                    disabled={!newAddr.street || !newAddr.number || !newAddr.neighborhood}
                    className="bg-primary text-primary-foreground"
                  >
                    Salvar Endereço
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum endereço cadastrado. Clique em "Novo" para adicionar.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedAddressId === addr.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="font-semibold text-sm">{addr.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {addr.street}, {addr.number}
                      {addr.complement ? ` - ${addr.complement}` : ""} — {addr.neighborhood},{" "}
                      {addr.city}/{addr.state}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* ── Forma de Pagamento ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Forma de Pagamento
          </h2>
          <div className="flex flex-col gap-3">
            {PAYMENT_OPTIONS.map(({ id, label, desc, icon: Icon, color }) => (
              <label
                key={id}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === id}
                  onChange={() => setPaymentMethod(id)}
                  className="accent-primary w-4 h-4 shrink-0"
                />
                <Icon className={`w-6 h-6 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {paymentMethod === id && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </label>
            ))}
          </div>
          {paymentMethod === "pix_whatsapp" && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              ✅ Após confirmar o pedido, envie o comprovante PIX para:{" "}
              <strong>(14) 99777-9977</strong>
            </div>
          )}
          {paymentMethod === "cartao" && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              💳 Maquininha de cartão levada pelo entregador na entrega.
            </div>
          )}
          {paymentMethod === "dinheiro" && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
              💵 Tenha o valor exato ou informe o troco necessário nas observações.
            </div>
          )}
        </section>

        {/* ── Cupom de Desconto ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display text-lg mb-3 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" /> Cupom de Desconto
          </h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <span className="text-sm font-semibold text-green-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> {appliedCoupon.code} — -R${" "}
                {appliedCoupon.discount.toFixed(2)}
              </span>
              <button
                onClick={() => setAppliedCoupon(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Remover
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="CÓDIGO DO CUPOM"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
              />
              <Button
                onClick={() => validateCoupon.mutate({ code: couponCode, orderValue: subtotal })}
                disabled={!couponCode || validateCoupon.isPending}
                variant="outline"
                className="shrink-0"
              >
                Aplicar
              </Button>
            </div>
          )}
        </section>

        {/* ── Pontos de Fidelidade ── */}
        {(user?.loyaltyPoints ?? 0) > 0 && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-display text-lg mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" /> Pontos de Fidelidade
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Você tem <strong>{user?.loyaltyPoints} pontos</strong>. Use para obter desconto!
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={maxPointsToUse}
                step={100}
                value={usePoints}
                onChange={(e) => setUsePoints(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="text-sm font-bold text-amber-700 w-28 text-right shrink-0">
                {usePoints} pts = R$ {pointsDiscount.toFixed(2)}
              </span>
            </div>
          </section>
        )}

        {/* ── Observações ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display text-lg mb-3">Observações do Pedido</h2>
          <textarea
            placeholder="Ex: campainha não funciona, ligar ao chegar, troco para R$50..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            rows={3}
          />
        </section>

        {/* ── Aviso de Loja Fechada ── */}
        {!storeOpen && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4 text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Loja fechada no momento</p>
              <p>{storeStatus} · Funcionamos de <strong>terça a domingo, das 19h às 23h</strong>.</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                <Clock className="w-3 h-3" /> Você pode montar seu pedido agora e confirmar quando abrirmos!
              </p>
            </div>
          </div>
        )}

        {/* ── Aviso de Envio ── */}
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
          <span className="text-xl shrink-0">📲</span>
          <p className="leading-relaxed">
            <strong>Ao confirmar, o WhatsApp será aberto automaticamente</strong> com o resumo completo do seu pedido já preenchido.
            Basta apertar <strong>Enviar</strong> para concluir. Ao enviar, você concorda com o pedido em anexo.
          </p>
        </div>

        {/* ── Botão Confirmar ── */}
        <Button
          onClick={handleSubmit}
          disabled={createOrder.isPending || cartItems.length === 0 || !storeOpen}
          className={`w-full font-bold py-4 rounded-xl text-lg ${
            storeOpen
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {createOrder.isPending
            ? "Processando..."
            : storeOpen
              ? `Confirmar Pedido • R$ ${total.toFixed(2)}`
              : `Loja fechada · Abre às 19h`}
        </Button>
      </div>
    </div>
  );
}

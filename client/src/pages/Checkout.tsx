import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapPin, CreditCard, Banknote, MessageCircle, Tag, Gift, Plus, Check, AlertCircle, Clock, Store, Copy } from "lucide-react";
import { isStoreOpen, getStoreStatusMessage, STORE_INFO, DELIVERY_FEE } from "@/lib/storeHours";
import { formatBRL, formatPhoneBR, phoneDigits } from "@shared/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [fulfillment, setFulfillment] = useState<"entrega" | "retirada">("entrega");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cashChange, setCashChange] = useState("");
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

  useEffect(() => {
    if (!user) return;
    setCustomerName((current) => current || user.name || "");
    setCustomerPhone((current) => current || user.phone || "");
  }, [user]);

  useEffect(() => {
    if (selectedAddressId || addresses.length === 0) return;
    const preferred = addresses.find((addr) => addr.isDefault) ?? addresses[0];
    if (preferred) setSelectedAddressId(preferred.id);
  }, [addresses, selectedAddressId]);

  const validateCoupon = trpc.coupon.validate.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon({ code: couponCode.toUpperCase(), discount: data.discount });
      toast.success(`Cupom aplicado! Desconto de ${formatBRL(data.discount)}`);
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
          const numero = i.menuNumber ? `#${i.menuNumber} ` : "";
          let linha = `  • ${i.quantity}x ${numero}${i.productName} — ${formatBRL(i.itemTotal)}`;
          if (i.observations) linha += `\n    Obs: ${i.observations}`;
          return linha;
        })
        .join("\n");

      const descontoStr =
        parseFloat(data.discount) > 0
          ? `\nDesconto: -${formatBRL(data.discount)}`
          : "";

      const entregaStr =
        data.fulfillment === "retirada"
          ? `*Retirada na loja:* ${STORE_INFO.streetLine}, ${STORE_INFO.neighborhoodLine}`
          : `*Endereço:* ${enderecoStr}`;

      const trocoStr =
        data.paymentMethod === "dinheiro"
          ? data.cashChange
            ? `\n*Troco para:* ${formatBRL(data.cashChange)} (devolver ${formatBRL(data.cashChange - parseFloat(data.total))})`
            : "\n*Troco:* valor exato"
          : "";

      const obsStr = data.notes ? `\n\n📝 Observações: ${data.notes}` : "";

      const msg =
        `🍔 *NOVO PEDIDO #${data.orderId} — Pantanal Lanches*\n\n` +
        `*Cliente:* ${data.customerName}\n` +
        `*Telefone:* ${data.customerPhone}\n` +
        `*Tipo:* ${data.fulfillment === "retirada" ? "Retirada na loja" : "Entrega"}\n\n` +
        `*Itens:*\n${itensStr}\n\n` +
        `*Subtotal:* ${formatBRL(data.subtotal)}\n` +
        `*Taxa de entrega:* ${parseFloat(data.deliveryFee) === 0 ? "Grátis" : formatBRL(data.deliveryFee)}` +
        descontoStr +
        `\n*TOTAL: ${formatBRL(data.total)}*\n\n` +
        `*Pagamento:* ${paymentLabels[data.paymentMethod] ?? data.paymentMethod}` +
        trocoStr +
        `\n${entregaStr}` +
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

  const deliveryFee = fulfillment === "retirada" ? 0 : DELIVERY_FEE;
  const maxPointsToUse = Math.min(user?.loyaltyPoints ?? 0, Math.floor(subtotal / POINTS_TO_BRL));
  const pointsDiscount = usePoints * POINTS_TO_BRL;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const totalDiscount = couponDiscount + pointsDiscount;
  const total = Math.max(0, subtotal + deliveryFee - totalDiscount);
  const cashChangeValue = cashChange.trim() === "" ? undefined : Number(cashChange.replace(",", "."));
  const contactReady = customerName.trim().length >= 2 && phoneDigits(customerPhone).length >= 10 && phoneDigits(customerPhone).length <= 11;
  const needsAddress = fulfillment === "entrega" && !selectedAddressId;
  const cashInvalid = paymentMethod === "dinheiro" && cashChangeValue != null && (!Number.isFinite(cashChangeValue) || cashChangeValue + 0.001 < total);

  const handleSubmit = () => {
    if (!storeOpen) {
      toast.error(`${getStoreStatusMessage()}. Funcionamos de terça a domingo, das 19h às 23h.`);
      return;
    }
    if (!contactReady) {
      toast.error("Informe seu nome e um telefone com DDD.");
      return;
    }
    if (needsAddress) {
      toast.error("Cadastre e selecione um endereço de entrega.");
      return;
    }
    if (cashInvalid) {
      toast.error(`O valor para troco precisa ser maior ou igual ao total de ${formatBRL(total)}.`);
      return;
    }
    createOrder.mutate({
      paymentMethod,
      fulfillment,
      addressId: fulfillment === "entrega" ? selectedAddressId : undefined,
      couponCode: appliedCoupon?.code,
      notes: notes || undefined,
      usePoints,
      customerName: customerName.trim(),
      customerPhone: formatPhoneBR(customerPhone),
      cashChange: paymentMethod === "dinheiro" ? cashChangeValue : undefined,
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
                <div key={item.id} className="flex justify-between text-sm gap-3">
                  <span className="text-foreground/80">
                    {item.quantity}x {item.product?.menuNumber ? `#${item.product.menuNumber} ` : ""}{item.product?.name}
                  </span>
                  <span className="font-semibold shrink-0">
                    {formatBRL((price + extrasTotal) * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{fulfillment === "retirada" ? "Retirada na loja" : "Taxa de entrega"}</span>
              <span>{deliveryFee === 0 ? "Grátis" : formatBRL(deliveryFee)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Desconto</span>
                <span>-{formatBRL(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>
          </div>
        </section>

        {/* ── Contato ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display text-lg mb-3">Seus dados</h2>
          <p className="text-sm text-muted-foreground mb-4">O nome e o telefone vão na mensagem do pedido para a loja conseguir falar com você.</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Telefone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(14) 99999-9999"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* ── Entrega ou retirada ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display text-lg mb-4">Como você quer receber</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setFulfillment("entrega")}
              className={`text-left p-4 rounded-xl border transition-colors ${
                fulfillment === "entrega" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
              }`}
            >
              <p className="font-semibold text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Entrega</p>
              <p className="text-xs text-muted-foreground mt-1">Taxa de {formatBRL(DELIVERY_FEE)}</p>
            </button>
            <button
              type="button"
              onClick={() => setFulfillment("retirada")}
              className={`text-left p-4 rounded-xl border transition-colors ${
                fulfillment === "retirada" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
              }`}
            >
              <p className="font-semibold text-sm flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Retirar na loja</p>
              <p className="text-xs text-muted-foreground mt-1">Sem taxa de entrega</p>
            </button>
          </div>

          {fulfillment === "retirada" ? (
            <div className="p-3 bg-secondary rounded-xl text-sm">
              <p className="font-semibold">Retirada em</p>
              <p className="text-muted-foreground">{STORE_INFO.streetLine}</p>
              <p className="text-muted-foreground">{STORE_INFO.neighborhoodLine}</p>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Endereço de entrega
            </h3>
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
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Cadastre um endereço para conseguir confirmar a entrega.
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
          </>
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
              <p className="font-semibold mb-1">Chave PIX (celular)</p>
              <div className="flex items-center justify-between gap-3">
                <strong className="text-base">{STORE_INFO.pixKeyLabel}</strong>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(STORE_INFO.pixKey).then(
                      () => toast.success("Chave PIX copiada"),
                      () => toast.error("Não foi possível copiar a chave")
                    );
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-green-300 rounded-lg px-2.5 py-1.5 hover:bg-green-100"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
              <p className="mt-2">Depois de confirmar, envie o comprovante para este WhatsApp.</p>
            </div>
          )}
          {paymentMethod === "cartao" && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              💳 Maquininha de cartão levada pelo entregador na entrega.
            </div>
          )}
          {paymentMethod === "dinheiro" && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
              <label className="font-semibold mb-1 block">Troco para quanto?</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="Ex: 50 — deixe vazio para valor exato"
                value={cashChange}
                onChange={(e) => setCashChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              {cashChangeValue != null && Number.isFinite(cashChangeValue) && cashChangeValue + 0.001 >= total && (
                <p className="mt-2">Troco a devolver: <strong>{formatBRL(cashChangeValue - total)}</strong></p>
              )}
              {cashInvalid && (
                <p className="mt-2 text-red-700">O valor precisa ser maior ou igual ao total de {formatBRL(total)}.</p>
              )}
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
                <Check className="w-4 h-4" /> {appliedCoupon.code} — -{formatBRL(appliedCoupon.discount)}
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
                {usePoints} pts = {formatBRL(pointsDiscount)}
              </span>
            </div>
          </section>
        )}

        {/* ── Observações ── */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display text-lg mb-3">Observações do Pedido</h2>
          <textarea
            placeholder="Ex: campainha não funciona, ligar ao chegar, sem cebola..."
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
          disabled={createOrder.isPending || cartItems.length === 0 || !storeOpen || !contactReady || needsAddress || cashInvalid}
          className={`w-full font-bold py-4 rounded-xl text-lg ${
            storeOpen && contactReady && !needsAddress && !cashInvalid
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {createOrder.isPending
            ? "Processando..."
            : !storeOpen
              ? `Loja fechada · ${storeStatus}`
              : needsAddress
                ? "Cadastre o endereço de entrega"
                : !contactReady
                  ? "Informe nome e telefone"
                  : `Confirmar Pedido • ${formatBRL(total)}`}
        </Button>
      </div>
    </div>
  );
}

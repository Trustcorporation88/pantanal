import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  User, Package, Gift, Star, ChevronRight, Clock,
  CheckCircle, Truck, ChefHat, XCircle, MapPin, Phone
} from "lucide-react";
import { formatBRL } from "@shared/format";

const STATUS_CONFIG = {
  recebido: { label: "Recebido", icon: Clock, color: "text-blue-600 bg-blue-50", step: 1 },
  em_preparo: { label: "Em Preparo", icon: ChefHat, color: "text-orange-600 bg-orange-50", step: 2 },
  saiu_para_entrega: { label: "Saiu para Entrega", icon: Truck, color: "text-purple-600 bg-purple-50", step: 3 },
  entregue: { label: "Entregue", icon: CheckCircle, color: "text-green-600 bg-green-50", step: 4 },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-red-600 bg-red-50", step: 0 },
};

const STEPS = ["recebido", "em_preparo", "saiu_para_entrega", "entregue"];

function OrderStatusBar({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.step ?? 0;
  if (status === "cancelado") return (
    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-xl text-sm font-semibold">
      <XCircle className="w-4 h-4" /> Pedido Cancelado
    </div>
  );
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const cfg = STATUS_CONFIG[step as keyof typeof STATUS_CONFIG];
        const done = idx + 1 <= currentStep;
        const active = idx + 1 === currentStep;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`flex flex-col items-center gap-1 ${done ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${active ? "bg-primary text-white" : done ? "bg-green-500 text-white" : "bg-border text-muted-foreground"}`}>
                <cfg.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-medium text-center w-16 leading-tight">{cfg.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 mb-4 ${idx + 1 < currentStep ? "bg-green-500" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderDetail({ orderId }: { orderId: number }) {
  // Polling a cada 20s para atualizar status do pedido em tempo real
  const { data: order } = trpc.order.detail.useQuery(orderId, {
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Para de fazer polling quando pedido foi entregue ou cancelado
      if (status === 'entregue' || status === 'cancelado') return false;
      return 20_000;
    },
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const createReview = trpc.review.create.useMutation({
    onSuccess: () => { toast.success("Avaliação enviada!"); setReviewProductId(null); },
    onError: (e) => toast.error(e.message),
  });

  if (!order) return <div className="animate-pulse h-40 bg-secondary rounded-2xl" />;

  const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const addr = order.addressSnapshot as Record<string, string> | null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Pedido #{order.id}</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusCfg?.color}`}>{statusCfg?.label}</span>
        </div>
        <OrderStatusBar status={order.status} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h4 className="font-semibold mb-3">Itens do Pedido</h4>
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{item.quantity}x {item.productName}</span>
                {(item.extras as unknown[])?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    + {(item.extras as Array<{ name: string }>).map((e) => e.name).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>{formatBRL(item.itemTotal)}</span>
                {order.status === "entregue" && (
                  <button
                    onClick={() => setReviewProductId(item.productId)}
                    className="text-xs text-primary hover:underline"
                  >
                    Avaliar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>{formatBRL(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{parseFloat(order.deliveryFee) === 0 ? "Retirada na loja" : "Entrega"}</span>
            <span>{parseFloat(order.deliveryFee) === 0 ? "Grátis" : formatBRL(order.deliveryFee)}</span>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Desconto</span><span>-{formatBRL(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
            <span>Total</span><span className="text-primary">{formatBRL(order.total)}</span>
          </div>
        </div>
      </div>

      {addr ? (
        <div className="bg-card border border-border rounded-2xl p-4 text-sm">
          <p className="font-semibold flex items-center gap-1 mb-1"><MapPin className="w-4 h-4 text-primary" /> Endereço de Entrega</p>
          <p className="text-muted-foreground">{addr.street}, {addr.number} — {addr.neighborhood}, {addr.city}</p>
        </div>
      ) : parseFloat(order.deliveryFee) === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-4 text-sm">
          <p className="font-semibold">Retirada na loja</p>
        </div>
      ) : null}

      {order.notes && (
        <div className="bg-card border border-border rounded-2xl p-4 text-sm">
          <p className="font-semibold mb-1">Detalhes do pedido</p>
          <p className="text-muted-foreground whitespace-pre-line">{order.notes}</p>
        </div>
      )}

      {/* Review modal */}
      {reviewProductId && (
        <div className="bg-card border border-primary rounded-2xl p-5">
          <h4 className="font-semibold mb-3">Avaliar produto</h4>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star className={`w-7 h-7 ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-border"}`} />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Deixe seu comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => createReview.mutate({ productId: reviewProductId, orderId: order.id, rating, comment: comment || undefined })}
              disabled={createReview.isPending}
              className="bg-primary text-primary-foreground"
            >
              Enviar Avaliação
            </Button>
            <Button variant="outline" onClick={() => setReviewProductId(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyAccount() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/minha-conta/pedidos/:id");
  const orderId = params?.id ? parseInt(params.id) : null;

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "loyalty" | "reviews">(
    orderId ? "orders" : "profile"
  );
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const utils = trpc.useUtils();
  // Polling a cada 30s para atualizar status dos pedidos em tempo real
  const { data: orders = [] } = trpc.order.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const { data: loyaltyTx = [] } = trpc.loyalty.transactions.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myReviews = [] } = trpc.review.myReviews.useQuery(undefined, { enabled: isAuthenticated });

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); toast.success("Perfil atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <div className="container py-16 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-display text-2xl mb-2">Faça login para continuar</h2>
        <p className="text-muted-foreground mb-6">Acesse sua conta para ver pedidos e muito mais</p>
        <a href="/como-entrar" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
          Entrar
        </a>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "orders", label: "Pedidos", icon: Package },
    { id: "loyalty", label: "Fidelidade", icon: Gift },
    { id: "reviews", label: "Avaliações", icon: Star },
  ] as const;

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl text-foreground mb-6">Minha Conta</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-56 shrink-0">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-3 p-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{user?.name ?? "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${
                  activeTab === id ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === "orders" && orders.length > 0 && (
                  <span className="ml-auto bg-primary/10 text-primary text-xs rounded-full px-1.5">{orders.length}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl mb-5">Dados do Perfil</h2>
              <div className="flex flex-col gap-4 max-w-md">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(14) 99999-9999"
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">E-mail</label>
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-secondary text-muted-foreground"
                  />
                </div>
                <Button
                  onClick={() => updateProfile.mutate({ name, phone })}
                  disabled={updateProfile.isPending}
                  className="bg-primary text-primary-foreground w-fit"
                >
                  {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="flex flex-col gap-4">
              {orderId ? (
                <>
                  <button onClick={() => navigate("/minha-conta")} className="text-sm text-primary font-semibold hover:underline self-start">
                    ← Voltar para pedidos
                  </button>
                  <OrderDetail orderId={orderId} />
                </>
              ) : orders.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-display text-lg mb-1">Nenhum pedido ainda</p>
                  <p className="text-muted-foreground text-sm mb-4">Faça seu primeiro pedido agora!</p>
                  <Button onClick={() => navigate("/cardapio")} className="bg-primary text-primary-foreground">Ver Cardápio</Button>
                </div>
              ) : (
                orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                  return (
                    <button
                      key={order.id}
                      onClick={() => navigate(`/minha-conta/pedidos/${order.id}`)}
                      className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow text-left w-full"
                    >
                      <div>
                        <p className="font-semibold">Pedido #{order.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${cfg?.color}`}>{cfg?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{formatBRL(order.total)}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "loyalty" && (
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
                <p className="text-sm font-semibold opacity-80 mb-1">Seus pontos</p>
                <p className="font-display text-5xl font-bold">{user?.loyaltyPoints ?? 0}</p>
                <p className="text-sm opacity-80 mt-1">= {formatBRL((user?.loyaltyPoints ?? 0) * POINTS_TO_BRL)} em descontos</p>
                <div className="mt-4 bg-white/20 rounded-xl p-3 text-sm">
                  <p>🎯 Ganhe 1 ponto por cada R$1 em pedidos</p>
                  <p>💰 100 pontos = R$5 de desconto</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-display text-lg mb-3">Histórico de Pontos</h3>
                {loyaltyTx.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma transação ainda</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {loyaltyTx.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <span className={`font-bold ${tx.type === "earn" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "earn" ? "+" : "-"}{tx.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-display text-xl mb-4">Minhas Avaliações</h2>
              {myReviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">Avalie produtos após receber seus pedidos</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myReviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-xl p-3">
                      <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-border"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{new Date(review.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {review.comment && <p className="text-sm text-foreground/80">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const POINTS_TO_BRL = 0.05;

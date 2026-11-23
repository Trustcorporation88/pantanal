import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Package, ShoppingBag, Tag, ChevronRight,
  Plus, Edit2, Trash2, Check, X, TrendingUp, Users, DollarSign, Clock
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { formatBRL } from "@shared/format";

const STATUS_LABELS: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  recebido: { label: "Recebido", color: "bg-blue-100 text-blue-800", next: "em_preparo", nextLabel: "Iniciar Preparo" },
  em_preparo: { label: "Em Preparo", color: "bg-orange-100 text-orange-800", next: "saiu_para_entrega", nextLabel: "Saiu para Entrega" },
  saiu_para_entrega: { label: "Saiu para Entrega", color: "bg-purple-100 text-purple-800", next: "entregue", nextLabel: "Marcar Entregue" },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ProductForm({ categories, product, onClose }: {
  categories: Array<{ id: number; name: string }>;
  product?: Record<string, unknown>;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    id: (product?.id as number) ?? undefined,
    categoryId: (product?.categoryId as number) ?? categories[0]?.id ?? 1,
    name: (product?.name as string) ?? "",
    description: (product?.description as string) ?? "",
    price: (product?.price as string) ?? "",
    imageUrl: (product?.imageUrl as string) ?? "",
    badge: (product?.badge as string) ?? "",
    available: (product?.available as boolean) ?? true,
    stockQty: (product?.stockQty as number) ?? 999,
    extras: JSON.stringify(product?.extras ?? []),
    dietaryTags: JSON.stringify(product?.dietaryTags ?? []),
    sortOrder: (product?.sortOrder as number) ?? 0,
  });

  const upsert = trpc.admin.upsertProduct.useMutation({
    onSuccess: () => { utils.admin.products.invalidate(); utils.catalog.products.invalidate(); toast.success("Produto salvo!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    let extras, dietaryTags;
    try { extras = JSON.parse(form.extras); } catch { extras = []; }
    try { dietaryTags = JSON.parse(form.dietaryTags); } catch { dietaryTags = []; }
    upsert.mutate({
      ...form,
      badge: (form.badge || undefined) as never,
      extras,
      dietaryTags,
    });
  };

  return (
    <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome *</label>
          <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoria *</label>
          <select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Preço (R$) *</label>
          <input type="number" step="0.01" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
          <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">URL da Imagem</label>
          <input type="url" value={form.imageUrl} onChange={(e) => setForm(p => ({ ...p, imageUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Badge</label>
          <select value={form.badge} onChange={(e) => setForm(p => ({ ...p, badge: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Nenhum</option>
            <option value="favorito">⭐ Favorito</option>
            <option value="destaque">🌟 Destaque</option>
            <option value="promocao">💥 Promoção</option>
            <option value="premium">👑 Premium</option>
            <option value="especialidade">🎯 Especialidade</option>
            <option value="mais_pedido">🔥 Mais Pedido</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Estoque</label>
          <input type="number" value={form.stockQty} onChange={(e) => setForm(p => ({ ...p, stockQty: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Adicionais (JSON)</label>
          <textarea value={form.extras} onChange={(e) => setForm(p => ({ ...p, extras: e.target.value }))} rows={2}
            placeholder='[{"name":"Bacon extra","price":3.00}]'
            className="w-full px-3 py-2 rounded-lg border border-border text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="available" checked={form.available} onChange={(e) => setForm(p => ({ ...p, available: e.target.checked }))} className="accent-primary" />
          <label htmlFor="available" className="text-sm font-medium">Disponível para venda</label>
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={!form.name || !form.price || upsert.isPending} className="bg-primary text-primary-foreground">
        {upsert.isPending ? "Salvando..." : "Salvar Produto"}
      </Button>
    </div>
  );
}

function CouponForm({ coupon, onClose }: { coupon?: Record<string, unknown>; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    id: (coupon?.id as number) ?? undefined,
    code: (coupon?.code as string) ?? "",
    description: (coupon?.description as string) ?? "",
    discountType: (coupon?.discountType as "percent" | "fixed") ?? "percent",
    discountValue: (coupon?.discountValue as string) ?? "",
    minOrderValue: (coupon?.minOrderValue as string) ?? "0",
    maxUses: (coupon?.maxUses as number | null) ?? null,
    active: (coupon?.active as boolean) ?? true,
  });

  const upsert = trpc.admin.upsertCoupon.useMutation({
    onSuccess: () => { utils.admin.coupons.invalidate(); toast.success("Cupom salvo!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Código *</label>
        <input type="text" value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
          placeholder="DESCONTO10" className="w-full px-3 py-2 rounded-lg border border-border text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
        <input type="text" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
          <select value={form.discountType} onChange={(e) => setForm(p => ({ ...p, discountType: e.target.value as "percent" | "fixed" }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valor *</label>
          <input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pedido mínimo (R$)</label>
          <input type="number" step="0.01" value={form.minOrderValue} onChange={(e) => setForm(p => ({ ...p, minOrderValue: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Usos máximos</label>
          <input type="number" value={form.maxUses ?? ""} onChange={(e) => setForm(p => ({ ...p, maxUses: e.target.value ? Number(e.target.value) : null }))}
            placeholder="Ilimitado" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm(p => ({ ...p, active: e.target.checked }))} className="accent-primary" />
        <label htmlFor="active" className="text-sm font-medium">Ativo</label>
      </div>
      <Button onClick={() => upsert.mutate({ ...form, maxUses: form.maxUses ?? undefined } as never)} disabled={!form.code || !form.discountValue || upsert.isPending} className="bg-primary text-primary-foreground">
        {upsert.isPending ? "Salvando..." : "Salvar Cupom"}
      </Button>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "products" | "coupons">("dashboard");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Record<string, unknown> | undefined>();
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Record<string, unknown> | undefined>();
  const [statusFilter, setStatusFilter] = useState("");

  const utils = trpc.useUtils();
  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: orders = [] } = trpc.admin.orders.useQuery({ status: statusFilter || undefined }, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: products = [] } = trpc.admin.products.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: coupons = [] } = trpc.admin.coupons.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: categories = [] } = trpc.admin.categories.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => { utils.admin.products.invalidate(); toast.success("Produto desativado!"); },
  });

  // Verificar se o PIN foi confirmado nesta sessão
  const pinConfirmed = typeof window !== 'undefined' && sessionStorage.getItem('admin_pin_ok') === '1';

  if (loading) return <div className="container py-16 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-16 text-center">
        <p className="font-display text-2xl mb-2">Acesso Restrito</p>
        <p className="text-muted-foreground mb-4">Apenas administradores podem acessar esta área.</p>
        <a href="/admin/login" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
          Ir para Login Admin
        </a>
      </div>
    );
  }
  if (!pinConfirmed) {
    navigate("/admin/login");
    return <div className="container py-16 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "products", label: "Produtos", icon: Package },
    { id: "coupons", label: "Cupons", icon: Tag },
  ] as const;

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-foreground">Painel Administrativo</h1>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">Admin</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
              activeTab === id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ShoppingBag} label="Total de Pedidos" value={stats?.totalOrders ?? 0} color="bg-blue-100 text-blue-600" />
            <StatCard icon={DollarSign} label="Faturamento" value={formatBRL(stats?.totalRevenue ?? 0)} color="bg-green-100 text-green-600" />
            <StatCard icon={Clock} label="Pedidos Pendentes" value={stats?.pendingOrders ?? 0} color="bg-orange-100 text-orange-600" />
            <StatCard icon={Package} label="Produtos Ativos" value={stats?.totalProducts ?? 0} color="bg-purple-100 text-purple-600" />
          </div>

          {/* Recent orders */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg">Pedidos Recentes</h2>
              <button onClick={() => setActiveTab("orders")} className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
                Ver todos <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {orders.slice(0, 5).map((order) => {
                const cfg = STATUS_LABELS[order.status];
                return (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-semibold text-sm">Pedido #{order.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg?.color}`}>{cfg?.label}</span>
                      <span className="font-bold text-primary text-sm">{formatBRL(order.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Orders */}
      {activeTab === "orders" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {["", "recebido", "em_preparo", "saiu_para_entrega", "entregue", "cancelado"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"
                }`}
              >
                {s === "" ? "Todos" : STATUS_LABELS[s]?.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const cfg = STATUS_LABELS[order.status];
              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">Pedido #{order.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg?.color}`}>{cfg?.label}</span>
                      <span className="font-bold text-primary">{formatBRL(order.total)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {cfg?.next && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: order.id, status: cfg.next as never })}
                        disabled={updateStatus.isPending}
                        className="bg-primary text-primary-foreground text-xs"
                      >
                        {cfg.next === "saiu_para_entrega" && parseFloat(order.deliveryFee) === 0 ? "Pronto para retirada" : cfg.nextLabel}
                      </Button>
                    )}
                    {order.status !== "cancelado" && order.status !== "entregue" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ id: order.id, status: "cancelado" })}
                        className="text-xs text-destructive border-destructive hover:bg-destructive/10"
                      >
                        Cancelar
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {parseFloat(order.deliveryFee) === 0 ? "Retirada · " : "Entrega · "}
                      {order.paymentMethod === "pix_whatsapp" ? "PIX/WhatsApp" : order.paymentMethod === "cartao" ? "Cartão" : "Dinheiro"}
                    </span>
                  </div>
                  {order.notes && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line mt-3">{order.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products */}
      {activeTab === "products" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Dialog open={productDialogOpen} onOpenChange={(v) => { setProductDialogOpen(v); if (!v) setEditProduct(undefined); }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                </DialogHeader>
                <ProductForm categories={categories} product={editProduct} onClose={() => { setProductDialogOpen(false); setEditProduct(undefined); }} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className={`bg-card border rounded-2xl p-4 flex flex-col gap-2 ${!p.available ? "opacity-50 border-dashed" : "border-border"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{categories.find(c => c.id === p.categoryId)?.name}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => { setEditProduct(p as unknown as Record<string, unknown>); setProductDialogOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteProduct.mutate(p.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{formatBRL(p.price)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Estoque: {p.stockQty}</span>
                    {p.available ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Inativo</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupons */}
      {activeTab === "coupons" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Dialog open={couponDialogOpen} onOpenChange={(v) => { setCouponDialogOpen(v); if (!v) setEditCoupon(undefined); }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Novo Cupom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
                </DialogHeader>
                <CouponForm coupon={editCoupon} onClose={() => { setCouponDialogOpen(false); setEditCoupon(undefined); }} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-col gap-3">
            {coupons.map((c) => (
              <div key={c.id} className={`bg-card border rounded-2xl p-4 flex items-center justify-between ${!c.active ? "opacity-50 border-dashed" : "border-border"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold font-mono text-primary">{c.code}</p>
                    {c.active ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ativo</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Inativo</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.discountType === "percent" ? `${c.discountValue}% de desconto` : `${formatBRL(c.discountValue)} de desconto`}
                    {parseFloat(c.minOrderValue ?? "0") > 0 && ` • Mínimo ${formatBRL(c.minOrderValue ?? "0")}`}
                    {c.maxUses && ` • ${c.usedCount}/${c.maxUses} usos`}
                  </p>
                </div>
                <button
                  onClick={() => { setEditCoupon(c as unknown as Record<string, unknown>); setCouponDialogOpen(true); }}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

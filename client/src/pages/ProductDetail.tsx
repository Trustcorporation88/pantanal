import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCartContext } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react";

const PLACEHOLDER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop";

const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  favorito: { label: "⭐ Favorito", color: "bg-yellow-100 text-yellow-800" },
  destaque: { label: "🌟 Destaque", color: "bg-blue-100 text-blue-800" },
  promocao: { label: "💥 Promoção", color: "bg-red-100 text-red-800" },
  premium: { label: "👑 Premium", color: "bg-purple-100 text-purple-800" },
  especialidade: { label: "🎯 Especialidade", color: "bg-green-100 text-green-800" },
  mais_pedido: { label: "🔥 Mais Pedido", color: "bg-orange-100 text-orange-800" },
};

type Extra = { name: string; price: number };

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const [, navigate] = useLocation();
  const productId = params?.id ? parseInt(params.id) : null;
  const { isAuthenticated } = useAuth();
  const { openCart } = useCartContext();
  const utils = trpc.useUtils();

  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [observations, setObservations] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data: products = [] } = trpc.catalog.products.useQuery({});
  const product = products.find((p) => p.id === productId);
  const { data: reviews = [], isLoading: reviewsLoading } = trpc.catalog.reviews.useQuery(productId ?? 0, {
    enabled: !!productId,
  });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success(`${product?.name} adicionado ao carrinho!`);
      openCart();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!productId || (!product && products.length > 0)) {
    return (
      <div className="container py-16 text-center">
        <span className="text-6xl block mb-4">🔍</span>
        <h2 className="font-display text-2xl mb-2">Produto não encontrado</h2>
        <Button onClick={() => navigate("/cardapio")} className="bg-primary text-primary-foreground mt-4">
          Ver Cardápio
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-16">
        <div className="max-w-2xl mx-auto animate-pulse">
          <div className="aspect-[4/3] bg-secondary rounded-2xl mb-6" />
          <div className="h-8 bg-secondary rounded w-3/4 mb-3" />
          <div className="h-4 bg-secondary rounded w-full mb-2" />
          <div className="h-4 bg-secondary rounded w-2/3" />
        </div>
      </div>
    );
  }

  const extras = (product.extras as Extra[] | null) ?? [];
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const unitPrice = parseFloat(product.price) + extrasTotal;
  const totalPrice = unitPrice * quantity;
  const badge = product.badge ? BADGE_CONFIG[product.badge] : null;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    addToCart.mutate({
      productId: product.id,
      quantity,
      extras: selectedExtras,
      observations: observations || undefined,
    });
  };

  return (
    <div className="container py-8">
      <button
        onClick={() => navigate("/cardapio")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Cardápio
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        {/* Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
          <img
            src={product.imageUrl ?? PLACEHOLDER}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {(product as any).menuNumber && (
            <span className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-lg">
              {(product as any).menuNumber}
            </span>
          )}
          {badge && (
            <span className={`absolute top-4 left-4 text-sm font-bold px-3 py-1.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl text-foreground mb-2">
              {(product as any).menuNumber && (
                <span className="text-primary font-bold mr-2">#{(product as any).menuNumber}</span>
              )}
              {product.name}
            </h1>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Rating */}
          {avgRating !== null && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= Math.round(avgRating) ? "text-yellow-500 fill-yellow-500" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">({reviews.length} avaliações)</span>
            </div>
          )}

          <div className="text-3xl font-display font-bold text-primary">
            R$ {parseFloat(product.price).toFixed(2)}
          </div>

          {/* Extras */}
          {extras.length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-3">Adicionais</p>
              <div className="flex flex-col gap-2">
                {extras.map((extra) => (
                  <label
                    key={extra.name}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedExtras.some((e) => e.name === extra.name)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedExtras.some((e) => e.name === extra.name)}
                        onChange={() => toggleExtra(extra)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{extra.name}</span>
                    </div>
                    <span className="text-sm text-primary font-semibold">+R$ {extra.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Observations */}
          <div>
            <p className="font-semibold text-sm mb-2">Observações</p>
            <Textarea
              placeholder="Ex: sem cebola, molho à parte..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="resize-none text-sm"
              rows={2}
            />
          </div>

          {/* Quantity + Add */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Quantidade:</span>
              <div className="flex items-center gap-3 bg-secondary rounded-xl p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-base flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {addToCart.isPending ? "Adicionando..." : `Adicionar ao Carrinho • R$ ${totalPrice.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 max-w-2xl">
        <h2 className="font-display text-2xl mb-6">Avaliações dos Clientes</h2>
        {reviewsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
                <div className="h-3 bg-secondary rounded w-full" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a avaliar após seu pedido!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

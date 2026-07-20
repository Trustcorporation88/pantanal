import { useState } from "react";
import { Plus, Star, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCartContext } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";

type Extra = { name: string; price: number };

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  badge: string | null;
  extras: unknown;
  categoryId: number;
  menuNumber: number | null;
};

const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  favorito: { label: "⭐ Favorito", color: "bg-yellow-100 text-yellow-800" },
  destaque: { label: "🌟 Destaque", color: "bg-blue-100 text-blue-800" },
  promocao: { label: "💥 Promoção", color: "bg-red-100 text-red-800" },
  premium: { label: "👑 Premium", color: "bg-purple-100 text-purple-800" },
  especialidade: { label: "🎯 Especialidade", color: "bg-green-100 text-green-800" },
  mais_pedido: { label: "🔥 Mais Pedido", color: "bg-orange-100 text-orange-800" },
};

const PLACEHOLDER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop";

export default function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated } = useAuth();
  const { openCart } = useCartContext();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [observations, setObservations] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data: reviews } = trpc.catalog.reviews.useQuery(product.id, { retry: false });
  const avgRating = reviews?.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success(`${product.name} adicionado ao carrinho!`);
      setDialogOpen(false);
      setSelectedExtras([]);
      setObservations("");
      setQuantity(1);
      openCart();
    },
    onError: (err) => toast.error(err.message),
  });

  const extras = (product.extras as Extra[] | null) ?? [];

  const handleAdd = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (extras.length > 0) {
      setDialogOpen(true);
    } else {
      addToCart.mutate({ productId: product.id, quantity: 1 });
    }
  };

  const handleConfirm = () => {
    addToCart.mutate({
      productId: product.id,
      quantity,
      extras: selectedExtras,
      observations: observations || undefined,
    });
  };

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const badge = product.badge ? BADGE_CONFIG[product.badge] : null;
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const totalPrice = (parseFloat(product.price) + extrasTotal) * quantity;

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
        {/* Image */}
        <Link href={`/produto/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <img
            src={product.imageUrl ?? PLACEHOLDER}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.menuNumber && (
            <span className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md">
              {product.menuNumber}
            </span>
          )}
          {badge && (
            <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
        </Link>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          <h3 className="font-display text-base text-foreground leading-tight">
            {product.menuNumber && <span className="text-primary font-bold mr-1">#{product.menuNumber}</span>}
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
          )}

          {/* Rating */}
          {avgRating !== null && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold text-foreground">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviews?.length})</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 gap-2">
            <span className="font-display text-lg text-primary font-bold shrink-0">
              R$ {parseFloat(product.price).toFixed(2)}
            </span>
            <button
              onClick={handleAdd}
              disabled={addToCart.isPending}
              className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customization Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">{product.name}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Extras */}
            {extras.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Adicionais</p>
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
              <p className="text-sm font-semibold text-foreground mb-2">Observações</p>
              <Textarea
                placeholder="Ex: sem cebola, molho à parte..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Quantidade</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"
                >
                  -
                </button>
                <span className="font-bold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90"
                >
                  +
                </button>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={addToCart.isPending}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl"
            >
              {addToCart.isPending ? "Adicionando..." : `Adicionar • R$ ${totalPrice.toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

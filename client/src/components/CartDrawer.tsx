import { useState } from "react";
import { useCartContext } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CartDrawer() {
  const { isOpen, closeCart } = useCartContext();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [confirmClear, setConfirmClear] = useState(false);

  const { data: cartItems = [], isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const updateItem = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
    onError: () => toast.error("Erro ao remover item"),
  });

  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      setConfirmClear(false);
      toast.success("Carrinho limpo!");
    },
  });

  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product?.price ?? "0");
    const extrasTotal = ((item.extras as Array<{ price: number }> | null) ?? []).reduce((s, e) => s + e.price, 0);
    return sum + (price + extrasTotal) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      window.location.href = "/como-entrar";
      return;
    }
    closeCart();
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    closeCart();
    navigate("/cardapio");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl text-foreground">Seu Carrinho</h2>
          <button onClick={closeCart} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">Faça login para ver seu carrinho</p>
              <a href="/como-entrar" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                Entrar
              </a>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">Adicione itens do cardápio para começar</p>
              <Button
                onClick={handleContinueShopping}
                className="mt-2 bg-primary text-primary-foreground flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Ver Cardápio
              </Button>
            </div>
          ) : (
            <>
              {cartItems.map((item) => {
                const price = parseFloat(item.product?.price ?? "0");
                const extras = (item.extras as Array<{ name: string; price: number }> | null) ?? [];
                const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
                const unitPrice = price + extrasTotal;

                return (
                  <div key={item.id} className="bg-secondary/50 rounded-xl p-3 flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{item.product?.name}</p>
                      {extras.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          + {extras.map((e) => e.name).join(", ")}
                        </p>
                      )}
                      {item.observations && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">"{item.observations}"</p>
                      )}
                      <p className="text-sm font-bold text-primary mt-1">
                        R$ {(unitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem.mutate(item.id);
                            } else {
                              updateItem.mutate({ id: item.id, quantity: item.quantity - 1 });
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        className="text-destructive hover:opacity-70 transition-opacity"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Botão Limpar Carrinho com confirmação */}
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 text-sm text-destructive hover:opacity-70 transition-opacity self-end mt-1 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar carrinho
                </button>
              ) : (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Limpar todos os itens?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => clearCart.mutate()}
                      disabled={clearCart.isPending}
                      className="flex-1 bg-destructive text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {clearCart.isPending ? "Limpando..." : "Sim, limpar"}
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="flex-1 bg-secondary text-foreground text-sm font-semibold py-2 rounded-lg hover:bg-border transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && cartItems.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-bold text-lg text-foreground">R$ {subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Taxa de entrega calculada no checkout</p>
            <Button
              onClick={handleCheckout}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold py-3 rounded-xl text-base"
            >
              Finalizar Pedido
            </Button>
            {/* Botão Continuar Comprando */}
            <button
              onClick={handleContinueShopping}
              className="flex items-center justify-center gap-2 text-sm text-primary font-semibold hover:opacity-70 transition-opacity py-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}

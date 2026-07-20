import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type CartContextType = {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: number;
};

const CartContext = createContext<CartContextType>({
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
  itemCount: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: cartItems } = trpc.cart.get.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  // Limpa o carrinho automaticamente quando o usuário faz login (nova sessão)
  const clearOnLogin = trpc.cart.clearOnLogin.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  // Controla se já limpou nesta sessão (evita limpar múltiplas vezes)
  const clearedRef = useRef(false);
  const prevAuthRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    // Detecta quando o usuário acabou de fazer login (transição false → true)
    if (isAuthenticated && !prevAuthRef.current && !clearedRef.current) {
      clearedRef.current = true;
      clearOnLogin.mutate();
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, loading]);

  const itemCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((v) => !v),
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCartContext = () => useContext(CartContext);

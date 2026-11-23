import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCartContext } from "@/contexts/CartContext";
import { ShoppingCart, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "/images/tucano-logo_1bed142e.jpg";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const { toggleCart, itemCount } = useCartContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/cardapio", label: "Cardápio" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src={LOGO_URL} alt="Pantanal Lanches" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-display text-xl text-primary hidden sm:block">Pantanal Lanches</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-foreground/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart button */}
            <button
              onClick={toggleCart}
              className="relative p-2 rounded-xl hover:bg-secondary transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                <Link href="/minha-conta" className="p-2 rounded-xl hover:bg-secondary transition-colors" title="Minha Conta">
                  <User className="w-5 h-5 text-foreground" />
                </Link>
                <button
                  onClick={() => logout.mutate()}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5 text-foreground/60" />
                </button>
              </div>
            ) : (
              <Link
                href="/como-entrar"
                className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                Entrar
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

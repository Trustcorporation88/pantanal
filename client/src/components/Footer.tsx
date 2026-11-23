import { MapPin, Phone, Clock } from "lucide-react";
import { Link } from "wouter";

const LOGO_URL = "/images/tucano-logo_1bed142e.jpg";

export default function Footer() {
  return (
    <footer className="bg-[oklch(0.18_0.04_30)] text-white mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Pantanal Lanches" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-display text-xl text-white">Pantanal Lanches</p>
                <p className="text-sm text-white/60">Sabor que voa!</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Os melhores lanches de Bauru, feitos com ingredientes frescos e muito carinho. Peça agora e receba em casa!
            </p>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-lg text-white">Informações</h3>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p>Alameda dos Heliotrópos, 5-31</p>
                  <p>Parque Vista Alegre, Bauru/SP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="https://wa.me/5514997779977" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  (14) 99777-9977
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p>Ter–Dom: 19h às 23h</p>
                  <p className="text-white/50 text-xs">Fechado às segundas-feiras</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-lg text-white">Links Rápidos</h3>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              <Link href="/cardapio" className="hover:text-white transition-colors">Cardápio</Link>
              <Link href="/minha-conta" className="hover:text-white transition-colors">Minha Conta</Link>
              <Link href="/minha-conta/pedidos" className="hover:text-white transition-colors">Meus Pedidos</Link>
              <Link href="/minha-conta/fidelidade" className="hover:text-white transition-colors">Programa de Fidelidade</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/40">
          <p>© {new Date().getFullYear()} Pantanal Lanches — Bauru, SP. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

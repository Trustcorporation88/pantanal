import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import ProductCard from "@/components/ProductCard";
import { ChevronRight, Truck, Clock, Star, Shield, MapPin, Phone, AlertCircle } from "lucide-react";
import { isStoreOpen, getStoreStatusMessage, STORE_INFO } from "@/lib/storeHours";

const LOGO_URL = "/images/tucano-logo_1bed142e.jpg";

const FEATURES = [
  { icon: Truck, title: "Entrega Rápida", desc: "Em até 45 min em Bauru" },
  { icon: Clock, title: "Sempre Fresquinho", desc: "Feito na hora do seu pedido" },
  { icon: Star, title: "Qualidade Premium", desc: "Ingredientes selecionados" },
  { icon: Shield, title: "Pagamento Seguro", desc: "PIX, cartão ou dinheiro" },
];

export default function Home() {
  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const { data: featuredProducts = [] } = trpc.catalog.products.useQuery({
    categoryId: undefined,
    search: undefined,
  });

  const highlighted = featuredProducts
    .filter((p) => p.badge && ["destaque", "mais_pedido", "especialidade"].includes(p.badge))
    .slice(0, 6);

  const storeOpen = isStoreOpen();
  const storeStatus = getStoreStatusMessage();

  return (
    <div className="min-h-screen">
      {/* Banner de loja fechada */}
      {!storeOpen && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container py-3 flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium">
              <span className="font-bold">Loja fechada no momento.</span>{" "}
              {storeStatus} · Funcionamos de terça a domingo, das 19h às 23h.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[oklch(0.55_0.22_30)] via-[oklch(0.62_0.22_38)] to-[oklch(0.72_0.20_50)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="container relative py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              {/* Status da loja */}
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-4 ${
                storeOpen
                  ? "bg-green-500/30 text-green-100"
                  : "bg-white/20 text-white/80"
              }`}>
                <span className={`w-2 h-2 rounded-full ${storeOpen ? "bg-green-300 animate-pulse" : "bg-white/50"}`} />
                {storeOpen ? "🔥 Aberto agora · Delivery em Bauru" : `⏰ ${storeStatus}`}
              </div>
              <h1 className="font-display text-4xl md:text-6xl leading-tight mb-4">
                Sabor que<br />
                <span className="text-yellow-300">voa até você!</span>
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-md">
                Os melhores lanches de Bauru, feitos com ingredientes frescos. Peça agora e receba em até 45 minutos!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/cardapio"
                  className="bg-white text-primary font-bold px-8 py-3.5 rounded-2xl hover:bg-yellow-50 transition-colors text-center shadow-lg"
                >
                  Ver Cardápio
                </Link>
                <a
                  href="https://wa.me/5514997779977"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-white/30 transition-colors text-center border border-white/30"
                >
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-3xl scale-110" />
                <img
                  src={LOGO_URL}
                  alt="Pantanal Lanches"
                  className="relative w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-border">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Horário e Endereço */}
      <section className="bg-primary/5 border-b border-border">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center">
            {/* Horário */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Horário de Funcionamento</p>
                <p className="text-sm text-muted-foreground">Terça a Domingo · 19h às 23h</p>
                <p className="text-xs text-muted-foreground">Fechado às segundas-feiras</p>
              </div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-border" />

            {/* Endereço */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Endereço</p>
                <p className="text-sm text-muted-foreground">Alameda dos Heliotrópos, 5-31</p>
                <p className="text-xs text-muted-foreground">Parque Vista Alegre, Bauru/SP</p>
              </div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-border" />

            {/* WhatsApp */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">WhatsApp</p>
                <a
                  href="https://wa.me/5514997779977"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline font-medium"
                >
                  (14) 99777-9977
                </a>
                <p className="text-xs text-muted-foreground">Pedidos e informações</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl text-foreground">Categorias</h2>
            <Link href="/cardapio" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              Ver tudo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/cardapio?categoria=${cat.slug}`}
                className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl px-5 py-4 hover:border-primary hover:shadow-md transition-all shrink-0 min-w-[90px]"
              >
                <span className="text-3xl">{cat.emoji ?? "🍔"}</span>
                <span className="text-xs font-semibold text-foreground text-center whitespace-nowrap">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {highlighted.length > 0 && (
        <section className="container pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl text-foreground">🔥 Mais Pedidos</h2>
            <Link href="/cardapio" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {highlighted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="container pb-12">
        <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-white blur-2xl" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl mb-3">Programa de Fidelidade</h2>
            <p className="text-white/80 text-lg mb-6 max-w-lg mx-auto">
              Ganhe pontos a cada pedido e troque por descontos incríveis. Quanto mais você pede, mais você economiza!
            </p>
            <Link
              href="/minha-conta/fidelidade"
              className="inline-flex bg-white text-primary font-bold px-8 py-3.5 rounded-2xl hover:bg-yellow-50 transition-colors shadow-lg"
            >
              Saiba Mais
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

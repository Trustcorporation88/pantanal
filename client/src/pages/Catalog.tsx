import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearch } from "wouter";

export default function Catalog() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const initialSlug = params.get("categoria") ?? "";

  const { data: categories = [] } = trpc.catalog.categories.useQuery();
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [dietaryTag, setDietaryTag] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Set initial category from URL param
  useEffect(() => {
    if (initialSlug && categories.length > 0) {
      const cat = categories.find((c) => c.slug === initialSlug);
      if (cat) setActiveCategoryId(cat.id);
    }
  }, [initialSlug, categories]);

  const { data: products = [], isLoading } = trpc.catalog.products.useQuery({
    categoryId: activeCategoryId,
    search: search || undefined,
    minPrice,
    maxPrice,
    dietaryTag,
  });

  const hasFilters = minPrice !== undefined || maxPrice !== undefined || dietaryTag !== undefined;

  const clearFilters = () => {
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setDietaryTag(undefined);
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Cardápio</h1>
        <p className="text-muted-foreground">Escolha seus favoritos e peça agora</p>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar no cardápio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
            hasFilters || showFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasFilters && <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço mínimo</label>
            <input
              type="number"
              placeholder="R$ 0"
              value={minPrice ?? ""}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço máximo</label>
            <input
              type="number"
              placeholder="R$ 100"
              value={maxPrice ?? ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de dieta</label>
            <select
              value={dietaryTag ?? ""}
              onChange={(e) => setDietaryTag(e.target.value || undefined)}
              className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">Todos</option>
              <option value="vegetariano">Vegetariano</option>
              <option value="sem_gluten">Sem Glúten</option>
            </select>
          </div>
          {hasFilters && (
            <div className="flex items-end">
              <button onClick={clearFilters} className="text-sm text-destructive font-semibold hover:underline flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveCategoryId(undefined)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            !activeCategoryId
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card border border-border text-foreground hover:bg-secondary"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? undefined : cat.id)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeCategoryId === cat.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-foreground hover:bg-secondary"
            }`}
          >
            {cat.emoji && <span>{cat.emoji}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-secondary" />
              <div className="p-3 flex flex-col gap-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-full" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <span className="text-6xl">🔍</span>
          <p className="font-display text-xl text-foreground">Nenhum produto encontrado</p>
          <p className="text-muted-foreground">Tente outros filtros ou termos de busca</p>
          <button
            onClick={() => { setSearch(""); clearFilters(); setActiveCategoryId(undefined); }}
            className="text-primary font-semibold hover:underline"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {products.length} {products.length === 1 ? "produto encontrado" : "produtos encontrados"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

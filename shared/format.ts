export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^55/, "");
}

export function formatPhoneBR(value: string): string {
  const d = phoneDigits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value.trim();
}

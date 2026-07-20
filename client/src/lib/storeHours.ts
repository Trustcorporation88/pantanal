/**
 * Horário de funcionamento: Terça a Domingo, 19h–23h (horário de Brasília)
 * Segunda-feira: fechado
 */

export const STORE_INFO = {
  address: "Alameda dos Heliotrópos, 5-31 – Parque Vista Alegre, Bauru/SP",
  whatsapp: "+55 14 99777-9977",
  hours: "Ter–Dom: 19h às 23h",
  closedDays: "Fechado às segundas-feiras",
};

/** Retorna true se a loja estiver aberta agora (horário de Brasília) */
export function isStoreOpen(): boolean {
  // Brasília = UTC-3
  const now = new Date();
  const brasiliaOffset = -3 * 60; // minutos
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const brasiliaMinutes = ((utcMinutes + brasiliaOffset) % (24 * 60) + 24 * 60) % (24 * 60);
  const brasiliaHour = Math.floor(brasiliaMinutes / 60);
  const brasiliaMin = brasiliaMinutes % 60;

  // Dia da semana em Brasília
  const utcDay = now.getUTCDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
  const utcDayMinutes = now.getUTCDay() * 24 * 60 + utcMinutes;
  // Ajustar dia da semana para Brasília
  const brasiliaAbsoluteMinutes = utcDayMinutes + brasiliaOffset;
  const brasiliaWeekMinutes = ((brasiliaAbsoluteMinutes % (7 * 24 * 60)) + 7 * 24 * 60) % (7 * 24 * 60);
  const brasiliaDay = Math.floor(brasiliaWeekMinutes / (24 * 60)); // 0=Dom, 1=Seg, ..., 6=Sáb

  // Segunda-feira (1) = fechado
  if (brasiliaDay === 1) return false;

  // Aberto das 19h às 23h (23:00 exclusive)
  const openMinutes = 19 * 60;
  const closeMinutes = 23 * 60;
  const currentMinutes = brasiliaHour * 60 + brasiliaMin;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/** Retorna mensagem amigável sobre o status da loja */
export function getStoreStatusMessage(): string {
  if (isStoreOpen()) return "Aberto agora";

  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcDayMinutes = now.getUTCDay() * 24 * 60 + now.getUTCHours() * 60 + now.getUTCMinutes();
  const brasiliaAbsoluteMinutes = utcDayMinutes + brasiliaOffset;
  const brasiliaWeekMinutes = ((brasiliaAbsoluteMinutes % (7 * 24 * 60)) + 7 * 24 * 60) % (7 * 24 * 60);
  const brasiliaDay = Math.floor(brasiliaWeekMinutes / (24 * 60));
  const brasiliaMinutes = brasiliaWeekMinutes % (24 * 60);
  const brasiliaHour = Math.floor(brasiliaMinutes / 60);

  if (brasiliaDay === 1) return "Fechado hoje (segunda-feira)";
  if (brasiliaHour < 19) return "Abre às 19h";
  return "Fechado por hoje";
}

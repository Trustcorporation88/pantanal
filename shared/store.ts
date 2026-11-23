/**
 * Horário de funcionamento: Terça a Domingo, 19h–23h (horário de Brasília)
 * Segunda-feira: fechado
 */

export const DELIVERY_FEE = 5;

export const STORE_INFO = {
  address: "Alameda dos Heliotrópos, 5-31 – Parque Vista Alegre, Bauru/SP",
  streetLine: "Alameda dos Heliotrópos, 5-31",
  neighborhoodLine: "Parque Vista Alegre, Bauru/SP",
  whatsapp: "+55 14 99777-9977",
  whatsappDigits: "5514997779977",
  /** Chave PIX do celular da loja. Troque aqui se a chave for outra. */
  pixKey: "+5514997779977",
  pixKeyLabel: "(14) 99777-9977",
  hours: "Ter–Dom: 19h às 23h",
  closedDays: "Fechado às segundas-feiras",
};

function brasiliaClock(now = new Date()) {
  const brasiliaOffset = -3 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const utcDayMinutes = now.getUTCDay() * 24 * 60 + utcMinutes;
  const brasiliaWeekMinutes = ((utcDayMinutes + brasiliaOffset) % (7 * 24 * 60) + 7 * 24 * 60) % (7 * 24 * 60);
  const day = Math.floor(brasiliaWeekMinutes / (24 * 60));
  const minutes = brasiliaWeekMinutes % (24 * 60);
  return { day, minutes, hour: Math.floor(minutes / 60) };
}

/** Retorna true se a loja estiver aberta agora (horário de Brasília) */
export function isStoreOpen(now = new Date()): boolean {
  const { day, minutes } = brasiliaClock(now);
  if (day === 1) return false;
  return minutes >= 19 * 60 && minutes < 23 * 60;
}

/** Retorna mensagem amigável sobre o status da loja */
export function getStoreStatusMessage(now = new Date()): string {
  if (isStoreOpen(now)) return "Aberto agora";

  const { day, hour } = brasiliaClock(now);
  if (day === 1) return "Fechado hoje (segunda-feira)";
  if (hour < 19) return "Abre às 19h";
  return "Fechado por hoje";
}

import { describe, expect, it } from "vitest";
import { formatBRL, formatPhoneBR, phoneDigits } from "../shared/format";
import { getStoreStatusMessage, isStoreOpen } from "../shared/store";

describe("store hours", () => {
  it("stays closed on Monday evening", () => {
    const mondayEvening = new Date("2026-11-23T22:30:00Z");
    expect(isStoreOpen(mondayEvening)).toBe(false);
    expect(getStoreStatusMessage(mondayEvening)).toBe("Fechado hoje (segunda-feira)");
  });

  it("stays closed Tuesday and Wednesday", () => {
    expect(isStoreOpen(new Date("2026-11-24T22:30:00Z"))).toBe(false);
    expect(getStoreStatusMessage(new Date("2026-11-24T22:30:00Z"))).toBe("Fechado hoje (terça-feira)");
    expect(isStoreOpen(new Date("2026-11-25T22:30:00Z"))).toBe(false);
    expect(getStoreStatusMessage(new Date("2026-11-25T22:30:00Z"))).toBe("Fechado hoje (quarta-feira)");
  });

  it("opens Thursday at 19h and closes at 23h", () => {
    expect(isStoreOpen(new Date("2026-11-26T21:59:00Z"))).toBe(false);
    expect(getStoreStatusMessage(new Date("2026-11-26T21:00:00Z"))).toBe("Abre às 19h");
    expect(isStoreOpen(new Date("2026-11-26T22:00:00Z"))).toBe(true);
    expect(isStoreOpen(new Date("2026-11-27T01:59:00Z"))).toBe(true);
    expect(isStoreOpen(new Date("2026-11-27T02:00:00Z"))).toBe(false);
    expect(getStoreStatusMessage(new Date("2026-11-27T02:00:00Z"))).toBe("Fechado por hoje");
  });
});

describe("format", () => {
  it("formats money with a Brazilian decimal comma", () => {
    expect(formatBRL(25.9).replace(/\s/g, " ")).toBe("R$ 25,90");
  });

  it("formats the store phone", () => {
    expect(phoneDigits("+55 (14) 99777-9977")).toBe("14997779977");
    expect(formatPhoneBR("14997779977")).toBe("(14) 99777-9977");
  });
});

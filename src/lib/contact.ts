// Normaliza un teléfono venezolano a formato internacional para WhatsApp
// (wa.me espera dígitos sin "+" ni ceros iniciales). Heurística:
//  - "0412..." → "58412..."  (se quita el 0 de troncal y se antepone 58)
//  - "+58412..." / "58412..." → se deja con 58
//  - número local de 10 dígitos → se antepone 58
export function waNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("58")) return digits;
  if (digits.startsWith("0")) return "58" + digits.slice(1);
  if (digits.length === 10) return "58" + digits;
  return digits;
}

export function waLink(phone: string): string | null {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}` : null;
}

export function telLink(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

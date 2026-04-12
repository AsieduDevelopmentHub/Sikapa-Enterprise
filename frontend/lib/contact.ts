const WA_E164 = process.env.NEXT_PUBLIC_WHATSAPP_E164?.trim() || "233531558216";

export function getWhatsAppChatUrl(): string {
  return `https://wa.me/${WA_E164.replace(/^\+/, "")}`;
}

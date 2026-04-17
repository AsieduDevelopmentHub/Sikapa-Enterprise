import { HelpArticle } from "@/components/help/HelpArticle";
import { getWhatsAppChatUrl } from "@/lib/contact";

export const metadata = { title: "Contact support · Sikapa Help" };

const SUPPORT_EMAIL = "support@sikapa.com";

export default function HelpContactPage() {
  return (
    <HelpArticle title="Contact support" eyebrow="Help · Contact">
      <h2>Reach us</h2>
      <ul className="space-y-2">
        <li>
          <strong>WhatsApp:</strong>{" "}
          <a
            className="font-semibold text-sikapa-gold hover:underline"
            href={getWhatsAppChatUrl()}
            target="_blank"
            rel="noreferrer noopener"
          >
            Start a chat
          </a>
        </li>
        <li>
          <strong>Email:</strong>{" "}
          <a className="font-semibold text-sikapa-gold hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </li>
      </ul>
      <h2>Hours</h2>
      <p>Monday–Saturday, 9am – 6pm GMT. We respond within 24 hours on business days.</p>
      <h2>Before you write in</h2>
      <p>
        Please include your order reference (e.g. <span className="font-mono">#1234</span>) so we can pull it up
        immediately. Screenshots help a lot — attach them if something looks off.
      </p>
    </HelpArticle>
  );
}

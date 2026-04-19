import { HelpArticle } from "@/components/help/HelpArticle";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Returns & refunds", {
  description: "Return windows, eligible items, refunds, and how to start a return on Sikapa Enterprise.",
  path: "/help/returns",
});

export default function HelpReturnsPage() {
  return (
    <HelpArticle title="Returns & refunds" eyebrow="Help · Returns">
      <h2>Our return window</h2>
      <p>
        You may return eligible items within <strong>7 days</strong> of delivery. Products must be unused, in original
        packaging, and with proof of purchase.
      </p>
      <h2>What cannot be returned</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Opened skincare, cosmetics, and perfumes (for hygiene reasons).</li>
        <li>Customised or clearance items marked <em>final sale</em>.</li>
        <li>Items damaged after delivery through misuse.</li>
      </ul>
      <h2>How to start a return</h2>
      <p>
        Open the order from <strong>My orders</strong> and tap <strong>Request a return</strong>. Describe what&apos;s
        wrong, choose whether you want a refund or replacement, and submit. We respond within 24 hours on business days.
      </p>
      <h2>Refund method</h2>
      <p>
        Approved refunds are issued to the original payment channel — card, Mobile Money, or bank transfer — within 5
        business days of us receiving the returned item.
      </p>
    </HelpArticle>
  );
}

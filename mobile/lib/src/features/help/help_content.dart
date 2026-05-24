class HelpTopic {
  const HelpTopic({
    required this.slug,
    required this.title,
    required this.blurb,
    required this.sections,
  });

  final String slug;
  final String title;
  final String blurb;
  final List<HelpSection> sections;
}

class HelpSection {
  const HelpSection({required this.heading, required this.body});
  final String heading;
  final String body;
}

const helpTopics = <HelpTopic>[
  HelpTopic(
    slug: 'shipping',
    title: 'Shipping & delivery',
    blurb: 'Regions, delivery fees, dispatch times.',
    sections: [
      HelpSection(
        heading: 'Where we deliver',
        body:
            'We dispatch to all 16 regions of Ghana. Delivery fees are calculated at checkout based on your region — Greater Accra orders are typically the fastest.',
      ),
      HelpSection(
        heading: 'How long does it take?',
        body:
            'Greater Accra: 1–2 business days.\nAshanti, Eastern & Central: 2–3 business days.\nOther regions: 3–5 business days.\nStore pickup: ready within 24 hours after payment.',
      ),
      HelpSection(
        heading: 'Tracking',
        body:
            'Open My orders in the app to see status updates. We also email you when your order is confirmed, packed, shipped, and delivered.',
      ),
    ],
  ),
  HelpTopic(
    slug: 'returns',
    title: 'Returns & refunds',
    blurb: 'What can be returned, how, and when.',
    sections: [
      HelpSection(
        heading: 'Starting a return',
        body:
            'From an eligible order, tap Request a return, choose the items and quantity, and submit your reason. You can track requests under Returns & refunds in Account.',
      ),
      HelpSection(
        heading: 'Outcomes',
        body:
            'You may request a refund or replacement. Our team reviews each request and updates the status in the app.',
      ),
    ],
  ),
  HelpTopic(
    slug: 'payment',
    title: 'Payment & security',
    blurb: 'Paystack, cards, Mobile Money, receipts.',
    sections: [
      HelpSection(
        heading: 'How you pay',
        body:
            'Checkout uses Paystack for cards and Mobile Money. Payment completes in a secure hosted page inside the app.',
      ),
      HelpSection(
        heading: 'Unpaid orders',
        body:
            'If payment did not finish, open My orders and tap Pay now on the order to retry.',
      ),
    ],
  ),
  HelpTopic(
    slug: 'orders',
    title: 'Orders & tracking',
    blurb: 'Where your order is and how to track it.',
    sections: [
      HelpSection(
        heading: 'Order status',
        body:
            'Processing → confirmed → shipped → delivered. Filter orders by status from the Orders screen.',
      ),
      HelpSection(
        heading: 'Shipped alerts',
        body:
            'When an order moves to shipped, the app can show a local notification (enable notifications when prompted).',
      ),
    ],
  ),
  HelpTopic(
    slug: 'account',
    title: 'Account & privacy',
    blurb: 'Profile, addresses, password, 2FA.',
    sections: [
      HelpSection(
        heading: 'Profile & address',
        body:
            'Edit your name, phone, and email under Account → Edit profile. Set a delivery address before checkout.',
      ),
      HelpSection(
        heading: 'Security',
        body:
            'Change your password in-app, enable two-factor authentication with an authenticator app, and verify your email from Account.',
      ),
    ],
  ),
  HelpTopic(
    slug: 'contact',
    title: 'Contact us',
    blurb: 'Email, phone, WhatsApp support.',
    sections: [
      HelpSection(
        heading: 'Need more help?',
        body:
            'Reach our support team through the contact details on the Sikapa website. Include your order number for faster assistance.',
      ),
    ],
  ),
];

HelpTopic? helpTopicBySlug(String slug) {
  for (final t in helpTopics) {
    if (t.slug == slug) return t;
  }
  return null;
}

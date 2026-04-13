export type OrderStatus = "delivered" | "processing" | "shipped";

export type MockOrder = {
  id: string;
  orderNumber: string;
  name: string;
  price: number;
  /** Display like mockup: Apr 16, 2024 */
  dateLabel: string;
  status: OrderStatus;
  image: string;
  rating: number;
};

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "o1",
    orderNumber: "20234",
    name: "Luxury Curly Wig",
    price: 140,
    dateLabel: "Apr 16, 2024",
    status: "shipped",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop",
  },
  {
    id: "o2",
    orderNumber: "20198",
    name: "Sikapa Perfume",
    price: 79,
    dateLabel: "Apr 10, 2024",
    status: "delivered",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop",
  },
  {
    id: "o3",
    orderNumber: "20185",
    name: "Sikapa Cream",
    price: 39,
    dateLabel: "Apr 8, 2024",
    status: "processing",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop",
  },
];

export function statusLabel(s: OrderStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function statusClass(s: OrderStatus): string {
  switch (s) {
    case "delivered":
      return "bg-emerald-700 text-white ring-emerald-800";
    case "processing":
      return "bg-sikapa-crimson text-white ring-sikapa-crimson";
    case "shipped":
      return "bg-amber-100 text-amber-950 ring-sikapa-gold/60";
    default:
      return "bg-sikapa-gray-soft text-sikapa-text-secondary";
  }
}

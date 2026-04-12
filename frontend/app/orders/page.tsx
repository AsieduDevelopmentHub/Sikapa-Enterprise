import Image from "next/image";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FaFilterIcon } from "@/components/FaIcons";
import { StarRating } from "@/components/StarRating";
import { formatGhs } from "@/lib/mock-data";
import { MOCK_ORDERS, statusClass, statusLabel } from "@/lib/mock-orders";

export default function OrdersPage() {
  return (
    <main className="bg-sikapa-cream">
      <ScreenHeader
        variant="inner"
        title="My Orders"
        left="menu"
        menuHref="/#categories"
        right="profile"
      />
      <div className="mx-auto max-w-mobile px-4 pb-2 pt-3">
        <button
          type="button"
          className="sikapa-tap flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-small font-semibold text-sikapa-text-primary ring-1 ring-sikapa-gray-soft"
        >
          <FaFilterIcon />
          Filter
        </button>
      </div>
      <ul className="mx-auto max-w-mobile space-y-4 px-4 pb-6">
        {MOCK_ORDERS.map((order) => (
          <li
            key={order.id}
            className="overflow-hidden rounded-[10px] bg-white p-4 shadow-[0_2px_14px_rgba(59,42,37,0.06)] ring-1 ring-black/[0.05]"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-small font-semibold text-sikapa-text-primary">
                Order #{order.orderNumber}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${statusClass(order.status)}`}
              >
                {statusLabel(order.status)}
              </span>
            </div>
            <div className="flex gap-3">
              <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-sikapa-gray-soft">
                <Image
                  src={order.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="88px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="font-semibold leading-snug text-sikapa-text-primary">{order.name}</p>
                <StarRating value={order.rating} className="text-xs" />
                <p className="text-small text-sikapa-text-secondary">{order.dateLabel}</p>
                <p className="text-body font-semibold text-sikapa-gold">{formatGhs(order.price)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/80">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-pink-100 px-4 py-1 text-sm font-semibold text-pink-700">
                Beauty & lifestyle commerce
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Shop modern beauty essentials with ease.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Browse quality wigs, cosmetics, skin care, fragrances, and accessories on a fast, mobile-ready storefront built for Sikapa Enterprise.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="#products" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Explore products
                </a>
                <a href="#features" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  Platform features
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-8 text-white">
              <p className="text-sm uppercase tracking-[0.24em] text-pink-300">Customer experience</p>
              <h2 className="mt-4 text-3xl font-semibold">Fast browsing, secure checkout, and rich product discovery.</h2>
              <p className="mt-4 text-slate-300">
                The first wave of the implementation will focus on product browsing, SEO-friendly pages, cart flows, and secure payment integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="border-t border-slate-200 bg-slate-50 px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-pink-600">Shop categories</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Beauty collections for every customer.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {['Hair & Wigs', 'Nails & Beauty Care', 'Makeup & Skincare', 'Fragrances', 'Accessories'].map((category) => (
              <div key={category} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">{category}</h3>
                <p className="mt-3 text-slate-600">
                  Discover curated products, collections, and beauty essentials in this category.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              { title: 'Responsive storefront', description: 'Build a fast product catalog with mobile-first design.' },
              { title: 'Cart & checkout', description: 'Support add-to-cart, order summary, and secure payment flow.' },
              { title: 'Admin management', description: 'Prepare an admin interface for products, inventory, and orders.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

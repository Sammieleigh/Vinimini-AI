import Image from "next/image";

const tabs = [
  "Opportunity TOP10",
  "High Profit TOP10",
  "Low Competition TOP10",
  "Womens Fashion TOP10",
  "Summer TOP10",
];

const opportunities = [
  {
    rank: "01",
    name: "Linen Resort Two-Piece",
    brand: "Zara / Mango / Musinsa",
    price: "$89",
    reviews: "12.8K",
    rating: "4.8",
    score: 96,
    why: "Vacation capsules are peaking before July travel demand.",
    signal: "STRONG BUY",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=640&q=80",
  },
  {
    rank: "02",
    name: "Sheer Summer Cardigan",
    brand: "H&M / W Concept / SSF",
    price: "$42",
    reviews: "8.4K",
    rating: "4.7",
    score: 93,
    why: "Light layering is rising with office-to-evening styling.",
    signal: "STRONG BUY",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=640&q=80",
  },
  {
    rank: "03",
    name: "Soft Tailored Bermuda",
    brand: "COS / Low Classic / Musinsa",
    price: "$64",
    reviews: "6.1K",
    rating: "4.6",
    score: 91,
    why: "Quiet luxury tailoring has low SKU saturation in summer colors.",
    signal: "STRONG BUY",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=640&q=80",
  },
  {
    rank: "04",
    name: "Minimal Mesh Ballet Flat",
    brand: "Mango / Charles & Keith",
    price: "$58",
    reviews: "9.7K",
    rating: "4.8",
    score: 89,
    why: "Ballet flats remain durable while mesh adds summer novelty.",
    signal: "STRONG BUY",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=640&q=80",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#191816]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-[#ded8cc] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b7d68]">
              VINIMINI AI / Fashion Researcher
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[#11100f] sm:text-6xl">
              Morning market opportunities for womens fashion.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#686052]">
              A luxury executive view of high-margin, low-competition product
              openings with AI scoring, market timing, and buy signals.
            </p>
          </div>
          <div className="grid min-w-72 grid-cols-3 gap-3 rounded-[8px] border border-[#ded8cc] bg-white/70 p-3 shadow-[0_20px_60px_rgba(44,37,25,0.08)]">
            <Metric label="Avg AI Score" value="92" />
            <Metric label="Signals" value="10" />
            <Metric label="Margin" value="High" />
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab, index) => (
            <button
              className={`shrink-0 rounded-[8px] border px-4 py-3 text-sm font-medium transition ${
                index === 0
                  ? "border-[#171614] bg-[#171614] text-white"
                  : "border-[#ded8cc] bg-white/70 text-[#5d5549] hover:border-[#aaa08e] hover:text-[#171614]"
              }`}
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </nav>

        <section className="grid gap-4 lg:grid-cols-2">
          {opportunities.map((item) => (
            <article
              className="grid min-h-[310px] overflow-hidden rounded-[8px] border border-[#ded8cc] bg-white shadow-[0_24px_70px_rgba(41,35,24,0.08)] sm:grid-cols-[220px_1fr]"
              key={item.rank}
            >
              <div className="relative min-h-72 bg-[#e8e2d7] sm:min-h-full">
                <Image
                  alt={`${item.name} competitor thumbnail`}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(min-width: 1024px) 220px, 100vw"
                  src={item.image}
                />
                <div className="absolute left-4 top-4 rounded-[8px] bg-white/88 px-3 py-2 text-xs font-semibold text-[#171614] shadow-sm">
                  #{item.rank}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b8c75]">
                        {item.brand}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#171614]">
                        {item.name}
                      </h2>
                    </div>
                    <div className="rounded-[8px] bg-[#eff7e8] px-3 py-2 text-sm font-semibold text-[#2f6b36]">
                      {item.signal}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#665f53]">
                    {item.why}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <CardMetric label="Price" value={item.price} />
                  <CardMetric label="Reviews" value={item.reviews} />
                  <CardMetric label="Rating" value={item.rating} />
                  <CardMetric label="AI Score" value={`${item.score}`} />
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#f7f5f0] px-3 py-4 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8b7d68]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-[#171614]">{value}</p>
    </div>
  );
}

function CardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#ebe5da] bg-[#fbfaf7] p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9b8c75]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[#171614]">{value}</p>
    </div>
  );
}

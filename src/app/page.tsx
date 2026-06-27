import Image from "next/image";

const tabs = [
  "Coupang Opportunity TOP10",
  "High Profit TOP10",
  "Low Competition TOP10",
  "Coupang Womens Fashion TOP10",
  "Summer TOP10",
];

type CoupangOpportunity = {
  rank: string;
  productName: string;
  competitor: string;
  coupangCategory: string;
  price: string;
  reviews: string;
  rating: string;
  opportunityScore: number;
  highProfit: string;
  lowCompetition: string;
  whyNow: string;
  signal: "STRONG BUY";
  thumbnail: string;
};

const opportunities: CoupangOpportunity[] = [
  {
    rank: "01",
    productName: "여름 린넨 셋업",
    competitor: "Coupang competitor cluster",
    coupangCategory: "여성패션 / 셋업",
    price: "39,900원",
    reviews: "12,840",
    rating: "4.8",
    opportunityScore: 96,
    highProfit: "62%",
    lowCompetition: "Low",
    whyNow: "휴가철 검색량이 상승 중이고, 린넨 셋업은 상위권 이미지 품질 격차가 큽니다.",
    signal: "STRONG BUY",
    thumbnail:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=640&q=80",
  },
  {
    rank: "02",
    productName: "시스루 여름 가디건",
    competitor: "Coupang competitor cluster",
    coupangCategory: "여성패션 / 가디건",
    price: "24,900원",
    reviews: "8,410",
    rating: "4.7",
    opportunityScore: 93,
    highProfit: "58%",
    lowCompetition: "Medium-Low",
    whyNow: "냉방 실내와 출근룩 수요가 동시에 올라와 여름 얇은 아우터 전환율이 좋습니다.",
    signal: "STRONG BUY",
    thumbnail:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=640&q=80",
  },
  {
    rank: "03",
    productName: "핀턱 버뮤다 팬츠",
    competitor: "Coupang competitor cluster",
    coupangCategory: "여성패션 / 팬츠",
    price: "29,800원",
    reviews: "6,120",
    rating: "4.6",
    opportunityScore: 91,
    highProfit: "55%",
    lowCompetition: "Low",
    whyNow: "오피스 캐주얼 검색은 유지되지만 여름 컬러 옵션이 부족합니다.",
    signal: "STRONG BUY",
    thumbnail:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=640&q=80",
  },
  {
    rank: "04",
    productName: "메쉬 플랫슈즈",
    competitor: "Coupang competitor cluster",
    coupangCategory: "여성패션 / 슈즈",
    price: "32,900원",
    reviews: "9,760",
    rating: "4.8",
    opportunityScore: 89,
    highProfit: "51%",
    lowCompetition: "Medium",
    whyNow: "플랫슈즈 수요가 꾸준하고 메쉬 소재는 여름 키워드로 차별화됩니다.",
    signal: "STRONG BUY",
    thumbnail:
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
              VINIMINI AI for Coupang Seller
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[#11100f] sm:text-6xl">
              오늘 쿠팡에서 팔 상품을 먼저 추천합니다.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#686052]">
              쿠팡 여성패션 시장의 실제 경쟁상품 구조를 기준으로 가격, 리뷰,
              평점, Opportunity Score, Why Now, Strong Buy 신호를 한 화면에
              정리합니다.
            </p>
          </div>
          <div className="grid min-w-72 grid-cols-3 gap-3 rounded-[8px] border border-[#ded8cc] bg-white/70 p-3 shadow-[0_20px_60px_rgba(44,37,25,0.08)]">
            <Metric label="Avg Score" value="92" />
            <Metric label="Strong Buy" value="10" />
            <Metric label="Platform" value="Coupang" />
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
                  alt={`${item.productName} Coupang competitor thumbnail`}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(min-width: 1024px) 220px, 100vw"
                  src={item.thumbnail}
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
                        {item.coupangCategory}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#171614]">
                        {item.productName}
                      </h2>
                      <p className="mt-2 text-xs font-medium text-[#8b7d68]">
                        {item.competitor}
                      </p>
                    </div>
                    <div className="rounded-[8px] bg-[#eff7e8] px-3 py-2 text-sm font-semibold text-[#2f6b36]">
                      {item.signal}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#665f53]">
                    {item.whyNow}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <CardMetric label="Price" value={item.price} />
                  <CardMetric label="Reviews" value={item.reviews} />
                  <CardMetric label="Rating" value={item.rating} />
                  <CardMetric
                    label="Opportunity"
                    value={`${item.opportunityScore}`}
                  />
                  <CardMetric label="High Profit" value={item.highProfit} />
                  <CardMetric label="Competition" value={item.lowCompetition} />
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

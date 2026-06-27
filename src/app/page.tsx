"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ViniminiConcept = {
  name: "A" | "B" | "C";
  thumbnailDirection: string;
  expectedCtr: string;
  reason: string;
  purpose: "클릭률" | "구매전환" | "브랜드 강화";
};

type CoupangOpportunity = {
  thumbnail: string;
  productName: string;
  price: string;
  reviewCount: string;
  rating: string;
  productUrl: string;
  opportunityScore: number;
  highProfit: string;
  lowCompetition: string;
  whyNow: string;
  strongBuy: boolean;
  competitorCount: number;
  expectedMargin: string;
  entryDifficulty: string;
  recommendedPrice: string;
  reviewComplaints: string[];
  aiAnalysis: {
    recommendationReason: string;
    marketGrowth: string;
    competitionIntensity: string;
    marginForecast: string;
    entryDifficulty: string;
  };
  planningActions: {
    thumbnail: string;
    detailPage: string;
    copy: string;
    sizeChart: string;
    newImage: string;
    returnReduction: string;
  };
  viniminiConcepts: ViniminiConcept[];
};

const tabs = [
  "Coupang Opportunity TOP10",
  "High Profit TOP10",
  "Low Competition TOP10",
  "Womens Fashion TOP10",
  "Summer TOP10",
];

const imagePool = [
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=640&q=80",
];

const products: CoupangOpportunity[] = [
  createProduct(0, "여름 린넨 셋업", "39,900원", "12,840", "4.8", 96, "62%", "Low"),
  createProduct(1, "핀턱 버뮤다 팬츠", "29,800원", "6,120", "4.6", 94, "58%", "Low"),
  createProduct(2, "시스루 여름 가디건", "24,900원", "8,410", "4.7", 93, "57%", "Medium-Low"),
  createProduct(3, "메쉬 플랫슈즈", "32,900원", "9,760", "4.8", 91, "51%", "Medium"),
  createProduct(4, "냉감 와이드 슬랙스", "27,900원", "4,905", "4.5", 89, "55%", "Low"),
  createProduct(0, "캡소매 니트 티셔츠", "19,900원", "15,220", "4.7", 88, "49%", "Medium"),
  createProduct(1, "썸머 롱 원피스", "34,900원", "7,880", "4.6", 87, "53%", "Medium"),
  createProduct(2, "크롭 셔츠 블라우스", "22,900원", "5,430", "4.5", 85, "50%", "Medium-Low"),
  createProduct(3, "밴딩 플레어 스커트", "25,900원", "3,980", "4.6", 83, "52%", "Low"),
  createProduct(4, "UV 차단 셔츠 자켓", "31,900원", "4,210", "4.4", 82, "54%", "Medium"),
];

function createProduct(
  imageIndex: number,
  productName: string,
  price: string,
  reviewCount: string,
  rating: string,
  opportunityScore: number,
  highProfit: string,
  lowCompetition: string,
): CoupangOpportunity {
  return {
    thumbnail: imagePool[imageIndex],
    productName,
    price,
    reviewCount,
    rating,
    productUrl: "https://www.coupang.com/",
    opportunityScore,
    highProfit,
    lowCompetition,
    whyNow:
      "이번 주 여성패션 검색 수요가 오르지만 상위 경쟁상품의 썸네일, 실측, 리뷰 대응 품질이 아직 약합니다.",
    strongBuy: opportunityScore >= 88,
    competitorCount: 128 - imageIndex * 7,
    expectedMargin: highProfit,
    entryDifficulty: lowCompetition === "Low" ? "쉬움" : "보통",
    recommendedPrice: price,
    reviewComplaints: [
      "허리가 크게 느껴짐",
      "기장이 예상보다 김",
      "원단이 얇아 비침 걱정",
      "상세 실측표가 부족함",
      "배송 후 구김이 있음",
    ],
    aiAnalysis: {
      recommendationReason:
        "쿠팡 상위권은 리뷰 수는 많지만 상품기획 완성도가 낮아, 더 명확한 썸네일과 상세페이지로 진입 여지가 있습니다.",
      marketGrowth:
        "여름 출근룩, 휴가룩, 냉감 소재 키워드가 동시에 상승해 이번 주 전환 가능성이 높습니다.",
      competitionIntensity:
        "가격 경쟁은 있으나 브랜드형 상세페이지와 사이즈 안내가 약해 차별화 공간이 남아 있습니다.",
      marginForecast:
        "사입 단가와 쿠팡 판매가 기준으로 중상 마진을 기대할 수 있습니다.",
      entryDifficulty:
        "초기에는 대표 색상 2개와 사이즈 4개로 진입한 뒤 리뷰 반응을 보고 확장하는 방식이 적합합니다.",
    },
    planningActions: {
      thumbnail:
        "모델 착장 1장과 원단 클로즈업 1장을 분할해 첫눈에 핏과 소재를 동시에 보여줍니다.",
      detailPage:
        "첫 화면에는 여름 착용 상황, 핏 장점, 비침 방지 정보를 3초 안에 읽히게 배치합니다.",
      copy:
        "출근부터 휴가까지 하루 종일 시원한 핏이라는 문구로 사용 장면을 좁힙니다.",
      sizeChart:
        "리뷰 불만이 나오기 전 상세페이지 첫 30% 지점에 실측표와 모델 사이즈를 고정합니다.",
      newImage:
        "밝은 배경의 전신 착장, 앉은 자세 핏, 원단 투과도 비교 이미지를 새로 생성합니다.",
      returnReduction:
        "허리, 총장, 비침 정보를 썸네일 하단과 상세 첫 화면에 반복 노출해 기대 차이를 줄입니다.",
    },
    viniminiConcepts: [
      {
        name: "A",
        thumbnailDirection: "밝은 배경 전신 착장 + 핏 강조",
        expectedCtr: "7.8%",
        reason: "쿠팡 리스트에서 가장 빠르게 상품 형태와 핏을 이해시킵니다.",
        purpose: "클릭률",
      },
      {
        name: "B",
        thumbnailDirection: "원단 클로즈업 + 비침 걱정 해소",
        expectedCtr: "6.9%",
        reason: "리뷰 불만을 선제적으로 해결해 상세페이지 진입 후 이탈을 낮춥니다.",
        purpose: "구매전환",
      },
      {
        name: "C",
        thumbnailDirection: "차분한 톤의 브랜드형 룩북 컷",
        expectedCtr: "6.2%",
        reason: "저가 상품처럼 보이지 않게 만들어 장기 브랜드 신뢰를 쌓습니다.",
        purpose: "브랜드 강화",
      },
    ],
  };
}

export default function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = products[selectedIndex];
  const topPick = useMemo(() => products[0], []);

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#191816]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-6 sm:px-8 lg:px-10">
        <header className="grid gap-5 border-b border-[#ded8cc] pb-7 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b7d68]">
              VINIMINI AI for Coupang Seller
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-[#11100f] sm:text-6xl">
              오늘 팔 상품을 결정하는 AI 상품기획 회의실
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#686052]">
              쿠팡 여성패션 상위 경쟁상품을 기준으로 TOP10 기회, 리뷰 불만,
              썸네일 전략, 상세페이지 개선안을 한 번에 판단합니다.
            </p>
          </div>
          <div className="rounded-[8px] border border-[#ded8cc] bg-white p-4 shadow-[0_20px_60px_rgba(44,37,25,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b7d68]">
              Today Decision
            </p>
            <h2 className="mt-3 text-2xl font-semibold">{topPick.productName}</h2>
            <p className="mt-3 text-sm leading-6 text-[#665f53]">
              {topPick.whyNow}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Metric label="Score" value={`${topPick.opportunityScore}`} />
              <Metric label="Margin" value={topPick.highProfit} />
              <Metric label="Entry" value={topPick.entryDifficulty} />
            </div>
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

        <section className="grid gap-5 xl:grid-cols-[440px_1fr]">
          <div className="flex max-h-[980px] flex-col gap-3 overflow-y-auto pr-1">
            {products.map((item, index) => (
              <button
                className={`grid min-h-52 w-full overflow-hidden rounded-[8px] border bg-white text-left shadow-[0_18px_45px_rgba(41,35,24,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(41,35,24,0.11)] sm:grid-cols-[150px_1fr] ${
                  selectedIndex === index
                    ? "border-[#171614]"
                    : "border-[#ded8cc]"
                }`}
                key={`${item.productName}-${index}`}
                onClick={() => setSelectedIndex(index)}
                type="button"
              >
                <div className="relative min-h-48 bg-[#e8e2d7] sm:min-h-full">
                  <Image
                    alt={`${item.productName} Coupang competitor thumbnail`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1280px) 150px, 100vw"
                    src={item.thumbnail}
                  />
                  <div className="absolute left-3 top-3 rounded-[8px] bg-white/90 px-3 py-2 text-xs font-semibold">
                    #{String(index + 1).padStart(2, "0")}
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-semibold tracking-normal text-[#171614]">
                        {item.productName}
                      </h2>
                      {item.strongBuy ? (
                        <span className="rounded-[8px] bg-[#eff7e8] px-2.5 py-1.5 text-xs font-semibold text-[#2f6b36]">
                          STRONG BUY
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#665f53]">
                      {item.whyNow}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <CardMetric label="Price" value={item.price} />
                    <CardMetric label="Reviews" value={item.reviewCount} />
                    <CardMetric label="Score" value={`${item.opportunityScore}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <PlanningRoom product={selected} />
        </section>
      </section>
    </main>
  );
}

function PlanningRoom({ product }: { product: CoupangOpportunity }) {
  return (
    <section className="rounded-[8px] border border-[#ded8cc] bg-white shadow-[0_24px_70px_rgba(41,35,24,0.08)]">
      <div className="border-b border-[#ebe5da] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7d68]">
          AI Product Planning Room
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal">
              {product.productName}
            </h2>
            <p className="mt-2 text-sm text-[#665f53]">
              쿠팡 경쟁상품 {product.competitorCount}개 분석 / 추천 판매가{" "}
              {product.recommendedPrice}
            </p>
          </div>
          <a
            className="inline-flex rounded-[8px] border border-[#171614] px-4 py-3 text-sm font-semibold text-[#171614] transition hover:bg-[#171614] hover:text-white"
            href={product.productUrl}
            rel="noreferrer"
            target="_blank"
          >
            상품 URL
          </a>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-3">
        <Panel title="경쟁상품 분석">
          <div className="relative h-64 overflow-hidden rounded-[8px] bg-[#e8e2d7]">
            <Image
              alt={`${product.productName} competitor`}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              src={product.thumbnail}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <CardMetric label="Price" value={product.price} />
            <CardMetric label="Reviews" value={product.reviewCount} />
            <CardMetric label="Rating" value={product.rating} />
            <CardMetric label="Margin" value={product.expectedMargin} />
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#665f53]">
            <p>{product.aiAnalysis.recommendationReason}</p>
            <p>{product.aiAnalysis.marketGrowth}</p>
            <p>{product.aiAnalysis.competitionIntensity}</p>
          </div>
        </Panel>

        <Panel title="AI 리뷰 불만 TOP5">
          <ol className="space-y-3">
            {product.reviewComplaints.map((complaint, index) => (
              <li
                className="flex gap-3 rounded-[8px] border border-[#ebe5da] bg-[#fbfaf7] p-3 text-sm"
                key={complaint}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#171614] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="leading-7 text-[#4f493f]">{complaint}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-[8px] bg-[#f7f5f0] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b7d68]">
              AI Analysis
            </p>
            <p className="mt-3 text-sm leading-6 text-[#5f574b]">
              예상 마진은 {product.aiAnalysis.marginForecast} 진입 난이도는{" "}
              {product.aiAnalysis.entryDifficulty}
            </p>
          </div>
        </Panel>

        <Panel title="VINIMINI 제안 A/B/C">
          <div className="space-y-3">
            {product.viniminiConcepts.map((concept) => (
              <div
                className="rounded-[8px] border border-[#ebe5da] bg-[#fbfaf7] p-4"
                key={concept.name}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold">시안 {concept.name}</p>
                  <span className="rounded-[8px] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f6b36]">
                    CTR {concept.expectedCtr}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#171614]">
                  {concept.thumbnailDirection}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#665f53]">
                  {concept.reason}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7d68]">
                  목적 / {concept.purpose}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 text-sm leading-6 text-[#5f574b]">
            <Action label="썸네일 개선" value={product.planningActions.thumbnail} />
            <Action
              label="상세페이지 개선"
              value={product.planningActions.detailPage}
            />
            <Action label="문구 개선" value={product.planningActions.copy} />
            <Action label="실측표 위치" value={product.planningActions.sizeChart} />
            <Action label="새 이미지 생성" value={product.planningActions.newImage} />
            <Action
              label="반품률 감소 전략"
              value={product.planningActions.returnReduction}
            />
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="border-b border-[#ebe5da] p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#8b7d68]">
        {title}
      </h3>
      {children}
    </div>
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
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#9b8c75]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#171614]">{value}</p>
    </div>
  );
}

function Action({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#ebe5da] bg-white p-3">
      <p className="text-xs font-semibold text-[#171614]">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

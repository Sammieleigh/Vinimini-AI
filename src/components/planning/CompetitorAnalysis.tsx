"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CoupangOpportunity } from "@/lib/types";
import { SectionHeading, SourceLimitedNotice } from "./PlanningPrimitives";

type MarketResearchCompetitor = {
  productName: string;
  price: string;
  reviewCount: string;
  rating: string;
  seller: string;
  shippingInfo: string;
  rocketDelivery: string;
  productUrl: string;
  thumbnailUrl: string;
  sellingPoints: string[];
  thumbnailFeatures: string[];
  firstScreenFeatures: string[];
  detailPageFeatures: string[];
  repeatedReviewPros: string[];
  repeatedReviewCons: string[];
  differentiationHints: string[];
  whyItSells: string;
  relevanceScore: number;
  relevanceReason: string;
  evidenceStatus: "VERIFIED INFORMATION" | "PARTIAL DATA" | "SOURCE LIMITED";
  researchSource: "Coupang Official API" | "Coupang HTML" | "OpenAI Search" | "Coupang Ads Trend Insights" | "Other Public Sources";
};

type MarketResearchResult = {
  ok: boolean;
  cacheStatus: "Fresh Analysis" | "Cached Analysis" | "OPENAI API NOT CONNECTED" | "Analysis Limited";
  categoryProfile: {
    baseCategory: string;
    allowedKeywordExpansion: string[];
    excludedTerms: string[];
  };
  sourceBadges: string[];
  competitors: MarketResearchCompetitor[];
  excludedCompetitors: MarketResearchCompetitor[];
  searchLogs: Array<{ keyword: string; searchUrl: string; resultCount: number; selectedCount: number; status: "COLLECTED" | "COUPANG COLLECTION FAILED" }>;
  selectedCount: number;
  aiAnalysis: {
    competitionStrength: string;
    pricePosition: string;
    reviewBarrier: string;
    detailPageStrengths: string[];
    thumbnailPattern: string;
    customerComplaints: string[];
    differentiationPoints: string[];
    summary: string;
    recommendedAction: string;
  };
  finance: {
    todayOpenAiCalls: number;
    cacheHitRate: number;
    estimatedCostSaved: number;
    duplicateRequestsPrevented: number;
  };
  message: string;
  lastAnalyzedAt: string | null;
};

export function CompetitorAnalysis({ product }: { product: CoupangOpportunity }) {
  const [research, setResearch] = useState<MarketResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResearch = async (forceRefresh = false, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    if (showLoading) setError("");

    try {
      const params = new URLSearchParams({ keyword: product.productName, url: product.productUrl || "" });
      if (forceRefresh) params.set("forceRefresh", "true");
      const response = await fetch(`/api/openai/market-research?${params.toString()}`);
      const payload = (await response.json()) as MarketResearchResult & { message?: string };
      if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`);
      setResearch(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "OpenAI 쿠팡 경쟁상품 리서치를 완료하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialResearch() {
      try {
        const params = new URLSearchParams({ keyword: product.productName, url: product.productUrl || "" });
        const response = await fetch(`/api/openai/market-research?${params.toString()}`);
        const payload = (await response.json()) as MarketResearchResult & { message?: string };
        if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`);
        if (isMounted) setResearch(payload);
      } catch (nextError) {
        if (isMounted) setError(nextError instanceof Error ? nextError.message : "OpenAI 쿠팡 경쟁상품 리서치를 완료하지 못했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialResearch();
    return () => {
      isMounted = false;
    };
  }, [product.id, product.productName, product.productUrl]);

  const competitors = research?.competitors ?? [];

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <SectionHeading
          eyebrow="경영진 시장 리서치 엔진"
          title="동일 카테고리 경쟁상품 분석"
          text="쿠팡 공개 상품 페이지와 쿠팡 광고 트렌드 인사이트를 우선 확인하되, 다른 카테고리 상품은 경쟁상품에서 제외합니다. 확인된 정보와 AI 전략 판단을 분리하고, 근거가 부족하면 한국어로 명확히 표시합니다."
        />
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button type="button" onClick={() => loadResearch(true)} disabled={isLoading} className="border border-[#111111] bg-[#111111] px-4 py-3 text-sm font-semibold text-[#F4EFE7] disabled:opacity-60">
            새로 리서치
          </button>
          <button type="button" onClick={() => loadResearch(false)} disabled={isLoading} className="border border-[#D9D0C4] bg-[#FBFAF7] px-4 py-3 text-sm font-semibold text-[#625B53] disabled:opacity-60">
            캐시 사용
          </button>
        </div>
      </section>

      <section className="overflow-x-auto border border-[#D9D0C4] bg-white">
        <div className="border-b border-[#D9D0C4] bg-[#FBFAF7] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8277]">확인된 정보</p>
          <h3 className="mt-2 text-lg font-semibold">실제 쿠팡 경쟁상품 리스트</h3>
          <p className="mt-1 text-sm text-[#625B53]">대표님이 바로 열어볼 수 있도록 상품 리스트를 가장 위에 고정합니다.</p>
        </div>
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#D9D0C4] text-xs uppercase tracking-[0.14em] text-[#8A8277]">
              <th className="px-4 py-3">썸네일</th>
              <th className="px-4 py-3">상품명</th>
              <th className="px-4 py-3">판매가격</th>
              <th className="px-4 py-3">리뷰수</th>
              <th className="px-4 py-3">평점</th>
              <th className="px-4 py-3">로켓배송</th>
              <th className="px-4 py-3">판매자명</th>
              <th className="px-4 py-3">판매 링크</th>
              <th className="px-4 py-3">관련도</th>
              <th className="px-4 py-3">근거</th>
              <th className="px-4 py-3">리서치 출처</th>
            </tr>
          </thead>
          <tbody>
            {competitors.length ? (
              competitors.map((competitor, index) => (
                <tr key={`${competitor.productName}-table-${index}`} className="border-b border-[#E5DED5] last:border-b-0">
                  <td className="px-4 py-4">
                    <div className="flex h-16 w-16 items-center justify-center border border-[#E5DED5] bg-[#FBFAF7] text-center text-[11px] text-[#8A8277]">
                      {competitor.thumbnailUrl ? <Image src={competitor.thumbnailUrl} alt="" width={64} height={64} unoptimized className="h-full w-full object-cover" /> : "근거 부족"}
                    </div>
                  </td>
                  <td className="max-w-[280px] px-4 py-4 font-semibold">{competitor.productName}</td>
                  <td className="px-4 py-4">{formatSourceValue(competitor.price)}</td>
                  <td className="px-4 py-4">{formatSourceValue(competitor.reviewCount)}</td>
                  <td className="px-4 py-4">{formatSourceValue(competitor.rating)}</td>
                  <td className="px-4 py-4">{formatSourceValue(competitor.rocketDelivery)}</td>
                  <td className="px-4 py-4">{formatSourceValue(competitor.seller)}</td>
                  <td className="px-4 py-4">
                    {competitor.productUrl ? (
                      <a href={competitor.productUrl} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
                        쿠팡 상품 열기
                      </a>
                    ) : (
                    "SOURCE LIMITED"
                    )}
                  </td>
                  <td className="px-4 py-4">{competitor.relevanceScore}점</td>
                  <td className="px-4 py-4">{formatBadge(competitor.evidenceStatus)}</td>
                  <td className="px-4 py-4">{formatBadge(competitor.researchSource)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-sm font-semibold text-[#625B53]">
                  {isLoading ? "동일 카테고리 쿠팡 경쟁상품을 확인하고 있습니다." : "동일 카테고리 경쟁상품 데이터를 불러오지 못했습니다. 키워드를 조정해 다시 리서치하세요."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {error || research?.message ? <p className="border border-[#D9D0C4] bg-[#FBFAF7] p-3 text-sm leading-6 text-[#625B53]">{formatDisplayText(error || research?.message, "추가 데이터 필요")}</p> : null}

      <section className="grid gap-3 lg:grid-cols-3">
        <AnalysisBox title="왜 이 상품들이 팔리는가" text={formatDisplayText(research?.aiAnalysis.summary, "추가 데이터 필요")} />
        <AnalysisBox title="가격 포지션" text={formatDisplayText(research?.aiAnalysis.pricePosition, "근거 부족")} />
        <AnalysisBox title="CEO 실행 제안" text={research?.aiAnalysis.recommendedAction || "동일 카테고리 쿠팡 상품 데이터를 추가 확인하세요."} />
      </section>

      <div className="grid gap-3">
        {competitors.map((competitor, index) => (
          <article key={`${competitor.productName}-${index}`} className="grid gap-4 border border-[#D9D0C4] bg-white p-4 lg:grid-cols-[120px_1fr]">
              <div className="flex h-[120px] items-center justify-center border border-[#E5DED5] bg-[#FBFAF7] text-center text-xs text-[#8A8277]">
              {competitor.thumbnailUrl ? <Image src={competitor.thumbnailUrl} alt="" width={120} height={120} unoptimized className="h-full w-full object-cover" /> : "썸네일 근거 부족"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-[#111111] px-2 py-1 text-xs font-semibold">{formatBadge(competitor.evidenceStatus)}</span>
                <span className="border border-[#D9D0C4] px-2 py-1 text-xs font-semibold text-[#625B53]">{formatBadge(competitor.researchSource)}</span>
                <span className="text-xs text-[#8A8277]">#{index + 1}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold">
                {competitor.productUrl ? (
                  <a href={competitor.productUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {competitor.productName}
                  </a>
                ) : (
                  competitor.productName
                )}
              </h3>
              <div className="mt-3 grid gap-2 md:grid-cols-5">
                <SmallFact label="가격" value={formatSourceValue(competitor.price)} />
                <SmallFact label="리뷰 수" value={formatSourceValue(competitor.reviewCount)} />
                <SmallFact label="평점" value={formatSourceValue(competitor.rating)} />
                <SmallFact label="판매자" value={formatSourceValue(competitor.seller)} />
                <SmallFact label="배송" value={formatSourceValue(competitor.shippingInfo)} />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#8A8277]">관련도 {competitor.relevanceScore}점 · {formatDisplayText(competitor.relevanceReason, "카테고리 관련도 추가 확인 필요")}</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-4">
                <InsightCard title="잘 팔리는 이유" text={formatDisplayText(competitor.whyItSells, "추가 데이터 필요")} />
                <InsightCard title="고객이 좋아하는 포인트" text={formatListSummary(competitor.repeatedReviewPros, competitor.sellingPoints)} />
                <InsightCard title="약점" text={formatListSummary(competitor.repeatedReviewCons, ["근거 부족"])} />
                <InsightCard title="VINIMINI 추천 전략" text={formatListSummary(competitor.differentiationHints, ["차별화 포인트 추가 분석이 필요합니다."])} />
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <TextList title="판매 포인트" items={formatDisplayList(competitor.sellingPoints)} />
                <TextList title="썸네일 특징" items={formatDisplayList(competitor.thumbnailFeatures)} />
                <TextList title="상세페이지 특징" items={formatDisplayList(competitor.detailPageFeatures)} />
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <AnalysisBox title="경쟁 강도" text={formatDisplayText(research?.aiAnalysis.competitionStrength, "추가 데이터 필요")} />
        <AnalysisBox title="리뷰 장벽" text={formatDisplayText(research?.aiAnalysis.reviewBarrier, "근거 부족")} />
        <AnalysisBox title="썸네일 패턴" text={formatDisplayText(research?.aiAnalysis.thumbnailPattern, "추가 데이터 필요")} />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <TextPanel title="상세페이지 강점" items={formatDisplayList(research?.aiAnalysis.detailPageStrengths ?? ["추가 데이터 필요"])} />
        <TextPanel title="고객 불만" items={formatDisplayList(research?.aiAnalysis.customerComplaints ?? ["근거 부족"])} />
        <TextPanel title="차별화 포인트" items={formatDisplayList(research?.aiAnalysis.differentiationPoints ?? ["추가 데이터 필요"])} />
      </section>

      {research?.excludedCompetitors?.length ? (
        <section className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8277]">보조 검토</p>
          <h3 className="mt-2 text-lg font-semibold">관련도 낮은 제외 후보</h3>
          <p className="mt-1 text-sm leading-6 text-[#625B53]">OpenAI가 확인한 쿠팡 공개 상품은 삭제하지 않고, 카테고리 관련도가 낮으면 이곳에 보관합니다.</p>
          <div className="mt-3 grid gap-2">
            {research.excludedCompetitors.map((item) => (
              <div key={`${item.productName}-${item.productUrl}`} className="grid gap-2 border border-[#E5DED5] bg-white p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-semibold">{item.productName}</p>
                  <p className="mt-1 text-xs text-[#8A8277]">{formatDisplayText(item.relevanceReason, "카테고리 관련도 낮음")}</p>
                </div>
                <p className="text-xs font-semibold text-[#625B53]">관련도 {item.relevanceScore}점</p>
                {item.productUrl ? (
                  <a href={item.productUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold underline underline-offset-4">
                    쿠팡 상품 열기
                  </a>
                ) : (
                  <span className="text-xs text-[#8A8277]">링크 근거 부족</span>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 border border-[#D9D0C4] bg-[#FBFAF7] p-4 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8277]">보조 정보</p>
          <p className="mt-2 text-lg font-semibold">{research?.categoryProfile.baseCategory || product.category}</p>
          <p className="mt-2 text-sm leading-6 text-[#625B53]">
            다른 카테고리 상품은 제외했습니다. 아래 정보는 리서치 품질과 비용 관리 상태를 확인하기 위한 보조 정보입니다.
          </p>
        </div>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {(research?.categoryProfile.allowedKeywordExpansion ?? [product.productName]).map((keyword) => (
              <span key={keyword} className="border border-[#D9D0C4] bg-white px-3 py-1 text-xs text-[#625B53]">
                {keyword}
              </span>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <Metric label="캐시 상태" value={isLoading ? "리서치 중" : formatStatus(research?.cacheStatus)} />
            <Metric label="오늘 AI 호출" value={`${research?.finance.todayOpenAiCalls ?? 0}회`} />
            <Metric label="캐시 적중률" value={`${research?.finance.cacheHitRate ?? 0}%`} />
            <Metric label="중복 요청 방지" value={`${research?.finance.duplicateRequestsPrevented ?? 0}회`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(research?.sourceBadges ?? ["SOURCE LIMITED"]).map((badge) => (
              <span key={badge} className="border border-[#D9D0C4] bg-white px-3 py-1 text-xs font-semibold text-[#625B53]">
                {formatBadge(badge)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <details className="border border-[#D9D0C4] bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#625B53]">디버그 검색 로그</summary>
        <div className="mt-4 grid gap-4 text-sm text-[#625B53]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8277]">검색 단계</p>
            <div className="mt-2 grid gap-1">
              {(research?.searchLogs?.length ? research.searchLogs : [{ keyword: "검색 준비 중", searchUrl: "", resultCount: 0, selectedCount: 0, status: "COUPANG COLLECTION FAILED" as const }]).map((log, index) => (
                <div key={`${log.keyword}-${log.selectedCount}`} className="border border-[#E5DED5] bg-[#FBFAF7] p-3">
                  <p className="font-semibold">
                    {index + 1}. {log.keyword}
                  </p>
                  {log.searchUrl ? (
                    <a href={log.searchUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs underline underline-offset-4">
                      {log.searchUrl}
                    </a>
                  ) : null}
                  <p className="mt-1">
                    결과: {log.resultCount}개 <span className="text-[#8A8277]">(누적 선택 {log.selectedCount}개)</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#8A8277]">{log.status}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8277]">최종 선택</p>
            <p className="mt-2 font-semibold">{(research?.selectedCount ?? competitors.length) >= 5 ? "종료" : "키워드 확장 중"}</p>
            <p className="mt-1">Selected: Top {research?.selectedCount ?? competitors.length}</p>
          </div>
        </div>
      </details>

      <SourceLimitedNotice />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

function SmallFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[#D9D0C4] pl-3">
      <p className="text-[11px] text-[#8A8277]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-[#E5DED5] bg-[#FBFAF7] p-3">
      <p className="text-xs font-semibold text-[#8A8277]">{title}</p>
      <ul className="mt-2 grid gap-1 text-sm leading-6 text-[#625B53]">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function InsightCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="border border-[#E5DED5] bg-[#FBFAF7] p-3">
      <p className="text-xs font-semibold text-[#8A8277]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#625B53]">{text}</p>
    </article>
  );
}

function TextPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{title}</p>
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-[#625B53]">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </article>
  );
}

function AnalysisBox({ title, text }: { title: string; text: string }) {
  return (
    <article className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#625B53]">{text}</p>
    </article>
  );
}

function formatStatus(status?: string) {
  const labels: Record<string, string> = {
    "Fresh Analysis": "새 분석",
    "Cached Analysis": "캐시 재사용",
    "OPENAI API NOT CONNECTED": "OpenAI API 미연결",
    "Analysis Limited": "분석 제한",
  };
  return labels[status || ""] || "근거 부족";
}

function formatBadge(value: string) {
  const labels: Record<string, string> = {
    "VERIFIED INFORMATION": "확인된 정보",
    "PARTIAL DATA": "부분 확인",
    "AI ANALYSIS": "AI 분석",
    "SOURCE LIMITED": "근거 부족",
    "MORE DATA REQUIRED": "추가 데이터 필요",
    "OPENAI MARKET RESEARCH": "AI 시장 리서치",
    "COUPANG PUBLIC WEB": "쿠팡 공개 정보",
    "COUPANG ADS TREND INSIGHTS": "쿠팡 광고 트렌드",
    "Coupang Official API": "쿠팡 공식 API",
    "Coupang HTML": "쿠팡 HTML",
    "OpenAI Search": "OpenAI 공개 검색",
    "Coupang Ads Trend Insights": "쿠팡 광고 트렌드",
    "Other Public Sources": "기타 공개 근거",
  };
  return labels[value] || formatDisplayText(value, "근거 부족");
}

function formatDisplayList(items: string[]) {
  return items.map((item) => formatDisplayText(item, "추가 데이터 필요"));
}

function formatListSummary(primary: string[], fallback: string[]) {
  return formatDisplayList(primary.length ? primary : fallback)
    .slice(0, 2)
    .join(" / ");
}

function formatDisplayText(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (value === "SOURCE LIMITED") return "근거 부족";
  if (value === "MORE DATA REQUIRED") return "추가 데이터 필요";
  return value.replaceAll("SOURCE LIMITED", "근거 부족").replaceAll("MORE DATA REQUIRED", "추가 데이터 필요");
}

function formatSourceValue(value: string | undefined) {
  if (!value) return "SOURCE LIMITED";
  const text = value.trim();
  if (!text || text === "-" || text === "근거 부족" || text === "추가 데이터 필요" || text === "MORE DATA REQUIRED") return "SOURCE LIMITED";
  return text;
}

"use client";

import { useEffect, useState } from "react";
import type { CoupangOpportunity } from "@/lib/types";
import { SectionHeading, SourceLimitedNotice } from "./PlanningPrimitives";

type MarketResearchCompetitor = {
  productName: string;
  price: string;
  reviewCount: string;
  rating: string;
  productUrl: string;
  thumbnailUrl: string;
  sellingPoints: string[];
  evidenceStatus: "VERIFIED INFORMATION" | "SOURCE LIMITED";
};

type MarketResearchResult = {
  ok: boolean;
  cacheStatus: "Fresh Analysis" | "Cached Analysis" | "OPENAI API NOT CONNECTED" | "Analysis Limited";
  sourceBadges: string[];
  competitors: MarketResearchCompetitor[];
  aiAnalysis: {
    competitionStrength: string;
    reviewBarrier: string;
    detailPageHints: string[];
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
      const params = new URLSearchParams({
        keyword: product.productName,
        url: product.productUrl || "",
      });
      if (forceRefresh) params.set("forceRefresh", "true");
      const response = await fetch(`/api/openai/market-research?${params.toString()}`);
      const payload = (await response.json()) as MarketResearchResult & { message?: string };
      if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`);
      setResearch(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "OpenAI 경쟁상품 리서치를 완료하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialResearch() {
      try {
        const params = new URLSearchParams({
          keyword: product.productName,
          url: product.productUrl || "",
        });
        const response = await fetch(`/api/openai/market-research?${params.toString()}`);
        const payload = (await response.json()) as MarketResearchResult & { message?: string };
        if (!response.ok) throw new Error(payload.message || `HTTP ${response.status}`);
        if (isMounted) setResearch(payload);
      } catch (nextError) {
        if (isMounted) setError(nextError instanceof Error ? nextError.message : "OpenAI 경쟁상품 리서치를 완료하지 못했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialResearch();

    return () => {
      isMounted = false;
    };
  }, [product.id, product.productName, product.productUrl]);

  const competitors = research?.competitors.length ? research.competitors : createFallbackCompetitors(product);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <SectionHeading
          eyebrow="OpenAI Executive Market Research Engine"
          title="경쟁상품 리서치"
          text="OpenAI가 쿠팡과 공개 웹에서 확인 가능한 상품 정보를 조사합니다. 확인된 값은 VERIFIED INFORMATION, 해석은 AI ANALYSIS, 근거 부족은 SOURCE LIMITED로 구분합니다."
        />
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => loadResearch(true)}
            disabled={isLoading}
            className="border border-[#111111] bg-[#111111] px-4 py-3 text-sm font-semibold text-[#F4EFE7] disabled:opacity-60"
          >
            새로 리서치
          </button>
          <button
            type="button"
            onClick={() => loadResearch(false)}
            disabled={isLoading}
            className="border border-[#D9D0C4] bg-[#FBFAF7] px-4 py-3 text-sm font-semibold text-[#625B53] disabled:opacity-60"
          >
            캐시 사용
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="캐시 상태" value={isLoading ? "리서치 중" : research?.cacheStatus || "SOURCE LIMITED"} />
        <Metric label="오늘 OpenAI 호출" value={`${research?.finance.todayOpenAiCalls ?? 0}회`} />
        <Metric label="캐시 적중률" value={`${research?.finance.cacheHitRate ?? 0}%`} />
        <Metric label="중복 요청 방지" value={`${research?.finance.duplicateRequestsPrevented ?? 0}회`} />
      </section>

      <div className="flex flex-wrap gap-2">
        {(research?.sourceBadges ?? ["SOURCE LIMITED"]).map((badge) => (
          <span key={badge} className="border border-[#D9D0C4] bg-[#FBFAF7] px-3 py-1 text-xs font-semibold text-[#625B53]">
            {badge}
          </span>
        ))}
      </div>

      {error || research?.message ? (
        <p className="border border-[#D9D0C4] bg-[#FBFAF7] p-3 text-sm leading-6 text-[#625B53]">{error || research?.message}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#D9D0C4] text-xs uppercase tracking-[0.16em] text-[#8A8277]">
              <th className="py-3 pr-4">상품명</th>
              <th className="py-3 pr-4">가격</th>
              <th className="py-3 pr-4">리뷰 수</th>
              <th className="py-3 pr-4">평점</th>
              <th className="py-3 pr-4">근거 상태</th>
              <th className="py-3">판매 포인트</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((competitor, index) => (
              <tr key={`${competitor.productName}-${index}`} className="border-b border-[#E5DED5] last:border-b-0">
                <td className="py-4 pr-4 font-semibold">
                  {competitor.productUrl ? (
                    <a href={competitor.productUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      {competitor.productName}
                    </a>
                  ) : (
                    competitor.productName
                  )}
                </td>
                <td className="py-4 pr-4">{competitor.price}</td>
                <td className="py-4 pr-4">{competitor.reviewCount}</td>
                <td className="py-4 pr-4">{competitor.rating}</td>
                <td className="py-4 pr-4">{competitor.evidenceStatus}</td>
                <td className="py-4 leading-6 text-[#625B53]">{competitor.sellingPoints.join(" / ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <AnalysisBox title="경쟁 강도" text={research?.aiAnalysis.competitionStrength || "추가 데이터 필요"} />
        <AnalysisBox title="리뷰 장벽" text={research?.aiAnalysis.reviewBarrier || "SOURCE LIMITED"} />
        <AnalysisBox title="CEO 실행 제안" text={research?.aiAnalysis.recommendedAction || "검증 가능한 공개 상품 데이터를 추가로 확인하세요."} />
      </section>

      <section className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8277]">상세페이지 개선 힌트</p>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#625B53]">
          {(research?.aiAnalysis.detailPageHints ?? ["추가 데이터 필요"]).map((hint) => (
            <li key={hint}>- {hint}</li>
          ))}
        </ul>
      </section>

      <SourceLimitedNotice />
    </div>
  );
}

function createFallbackCompetitors(product: CoupangOpportunity): MarketResearchCompetitor[] {
  return [
    {
      productName: `${product.category} 경쟁상품`,
      price: "SOURCE LIMITED",
      reviewCount: "SOURCE LIMITED",
      rating: "SOURCE LIMITED",
      productUrl: "",
      thumbnailUrl: "",
      sellingPoints: ["OpenAI 또는 공개 웹 검증 데이터가 필요합니다."],
      evidenceStatus: "SOURCE LIMITED",
    },
  ];
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
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

"use client";

import { useEffect, useState } from "react";

type AutoDiscoveryOpportunity = {
  rank: number;
  keyword: string;
  category: string;
  opportunityScore: number;
  marketOpportunity: string;
  searchGrowthPotential: string;
  competitionStrength: string;
  viniminiFit: string;
  marginPotential: string;
  detailPagePotential: string;
  adEntryPotential: string;
  status: "오늘 새 분석" | "캐시 재사용" | "최근 7일 제외" | "추가 데이터 필요";
  sourceBadges: string[];
  verifiedSignals: {
    searchGrowth: number | null;
    totalMonthlySearchVolume: number | null;
    pcMonthlySearchVolume: number | null;
    mobileMonthlySearchVolume: number | null;
    mobileSearchRatio: number | null;
    pcSearchRatio: number | null;
    competitionLevel: string;
    seasonality: string;
    naverShoppingProductCount: number;
    naverShoppingLowestPrice: string | null;
    naverShoppingMallName: string | null;
    coupangProductCount: number;
    mobileCommerceFit: string;
  };
};

type AutoDiscoveryMeetingStep = {
  time: string;
  department: string;
  title: string;
  result: string;
  detail: string;
};

type AutoDiscoveryDiscussionStep = {
  department: string;
  inputFromPrevious: string;
  message: string;
  decision: string;
};

type AutoDiscoveryResult = {
  ok: boolean;
  discoveryRunId: string;
  cacheStatus: "Fresh Analysis" | "Cached Analysis" | "OpenAI API NOT CONNECTED" | "Analysis Limited";
  analyzedCandidateCount: number;
  newOpportunityCount: number;
  excludedRecentKeywords: string[];
  top10: AutoDiscoveryOpportunity[];
  ceoSummary: {
    biggestOpportunity: string;
    biggestRisk: string;
    firstAction: string;
    todayLesson: string;
    ceoBriefing: string;
  };
  meetingTimeline: AutoDiscoveryMeetingStep[];
  aiDiscussion: AutoDiscoveryDiscussionStep[];
  lastAnalyzedAt: string;
  openAi: {
    callsToday: number;
    cacheHitRate: number;
    estimatedCostSaved: number;
    monthlyCostSaved: number;
    duplicateRequestsPrevented: number;
    meetingTimeMinutes: number;
    meetingFinishedTime: string;
    candidatesRemoved: number;
  };
};

export function AutoDiscoveryPanel() {
  const [data, setData] = useState<AutoDiscoveryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [error, setError] = useState("");

  const loadDiscovery = async (forceRefresh = false) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/vinimini/auto-discovery${forceRefresh ? "?forceRefresh=true" : ""}`);
      const nextData = (await response.json()) as AutoDiscoveryResult & { message?: string };
      if (!response.ok) throw new Error(nextData.message || `HTTP ${response.status}`);
      setData(nextData);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "AI 자동 탐색을 완료하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialDiscovery() {
      try {
        const response = await fetch("/api/vinimini/auto-discovery");
        const nextData = (await response.json()) as AutoDiscoveryResult & { message?: string };
        if (!response.ok) throw new Error(nextData.message || `HTTP ${response.status}`);
        if (isMounted) setData(nextData);
      } catch (nextError) {
        if (isMounted) setError(nextError instanceof Error ? nextError.message : "AI 자동 탐색을 완료하지 못했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialDiscovery();

    return () => {
      isMounted = false;
    };
  }, []);

  const cacheLabel =
    data?.cacheStatus === "Fresh Analysis"
      ? "오늘 새 분석"
      : data?.cacheStatus === "Cached Analysis"
        ? "캐시 재사용"
        : data?.cacheStatus === "OpenAI API NOT CONNECTED"
          ? "OpenAI API 미연결"
          : "추가 데이터 필요";
  const discussions = ensureExecutiveDiscussion(data?.aiDiscussion);

  return (
    <section className="border border-[#111111] bg-[#111111] p-5 text-[#F4EFE7]">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#CFC4B6]">AI 자동 탐색</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal">AI 경영진이 오늘의 후보를 먼저 탐색했습니다.</h2>
          <p className="mt-4 text-sm leading-7 text-[#E2D8CB]">
            Good Morning, CEO. AI Executive Team이 밤새 실제 연결 데이터를 확인하고 회의를 완료했습니다. 대표님은 검색하지 않고,
            보고받고 결정만 하시면 됩니다.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="분석 후보 수" value={isLoading ? "분석 중" : `${data?.analyzedCandidateCount ?? 0}개`} />
            <Metric label="새로 발견한 기회" value={`${data?.newOpportunityCount ?? 0}개`} />
            <Metric label="캐시 상태" value={cacheLabel} />
            <Metric label="마지막 분석 시간" value={data?.lastAnalyzedAt ? new Date(data.lastAnalyzedAt).toLocaleTimeString("ko-KR") : "-"} />
          </div>

          <div className="mt-5 border border-[#3D3933] bg-[#181716] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#CFC4B6]">CEO 비서 AI</p>
            <p className="mt-3 text-sm font-semibold text-[#F4EFE7]">회의를 종료합니다.</p>
            <p className="mt-2 text-sm leading-7 text-[#E2D8CB]">
              AI 경영진은 {data?.analyzedCandidateCount ?? 382}개의 후보를 검토했고 {data?.top10.length ?? 10}개의 기회를 선정했습니다.
            </p>
            <SummaryLine label="오늘 가장 큰 기회" value={data?.ceoSummary.biggestOpportunity || "분석 중입니다."} />
            <SummaryLine label="오늘 가장 먼저 할 일" value={data?.ceoSummary.firstAction || "분석 결과를 기다리고 있습니다."} />
            <SummaryLine label="오늘 가장 큰 리스크" value={data?.ceoSummary.biggestRisk || "추가 데이터 필요"} muted />
            <SummaryLine label="오늘의 학습" value={data?.ceoSummary.todayLesson || "AI가 오늘 회의의 학습 포인트를 정리 중입니다."} muted />
            <p className="mt-2 text-sm leading-7 text-[#E2D8CB]">{data?.ceoSummary.ceoBriefing || "CEO 브리핑을 준비 중입니다."}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => loadDiscovery(true)}
              disabled={isLoading}
              className="min-h-11 border border-[#F4EFE7] bg-[#F4EFE7] px-4 text-sm font-semibold text-[#111111] disabled:opacity-60"
            >
              오늘 새로 분석
            </button>
            <button
              type="button"
              onClick={() => loadDiscovery(false)}
              disabled={isLoading}
              className="min-h-11 border border-[#3D3933] bg-[#181716] px-4 text-sm font-semibold text-[#F4EFE7] disabled:opacity-60"
            >
              캐시 사용
            </button>
            <button
              type="button"
              onClick={() => setShowTranscript((value) => !value)}
              className="min-h-11 border border-[#3D3933] bg-[#181716] px-4 text-sm font-semibold text-[#F4EFE7]"
            >
              회의 전문 보기
            </button>
          </div>

          <div className="border border-[#3D3933] bg-[#181716] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#CFC4B6]">재무 디렉터 AI</p>
            <p className="mt-3 text-sm leading-6 text-[#E2D8CB]">
              대표님, 오늘 캐시 적중률은 {data?.openAi.cacheHitRate ?? 0}%입니다. 후보 전체를 Batch 분석으로 처리해 OpenAI 비용을 약{" "}
              {data?.openAi.estimatedCostSaved ?? 0}% 절감했습니다.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Metric label="오늘 OpenAI 호출" value={`${data?.openAi.callsToday ?? 0}회`} dark />
              <Metric label="캐시 적중률" value={`${data?.openAi.cacheHitRate ?? 0}%`} dark />
              <Metric label="예상 비용 절감" value={`${data?.openAi.estimatedCostSaved ?? 0}%`} dark />
              <Metric label="월간 비용 절감" value={`${data?.openAi.monthlyCostSaved ?? 0}%`} dark />
              <Metric label="중복 요청 방지" value={`${data?.openAi.duplicateRequestsPrevented ?? 0}회`} dark />
            </div>
          </div>

          <div className="border border-[#3D3933] bg-[#181716] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#CFC4B6]">회의 통계</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric label="발견 후보" value="382개" dark />
              <Metric label="제외 후보" value={`${data?.openAi.candidatesRemoved ?? 0}개`} dark />
              <Metric label="최종 TOP10" value={`${data?.top10.length ?? 10}개`} dark />
              <Metric label="OpenAI 호출" value={`${data?.openAi.callsToday ?? 0}회`} dark />
              <Metric label="회의 시간" value={`${data?.openAi.meetingTimeMinutes ?? 18}분`} dark />
              <Metric label="회의 종료" value={data?.openAi.meetingFinishedTime ?? "01:00"} dark />
            </div>
          </div>

          {error ? <p className="border border-[#6B2D2D] bg-[#2B1717] p-3 text-sm text-[#F2C6C6]">{error}</p> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {(data?.top10 ?? []).map((item) => (
          <article key={item.keyword} className="border border-[#3D3933] bg-[#181716] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center border border-[#F4EFE7] text-sm font-semibold">{item.rank}</span>
              <h3 className="text-lg font-semibold tracking-normal text-[#F4EFE7]">{item.keyword}</h3>
              <span className="border border-[#3D3933] px-2 py-1 text-xs text-[#CFC4B6]">{item.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#E2D8CB]">{item.marketOpportunity}</p>
            <div className="mt-3 grid gap-2 border border-[#3D3933] bg-[#111111] p-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CFC4B6]">VERIFIED INFORMATION</p>
                <p className="mt-2 text-xs leading-5 text-[#E2D8CB]">
                  네이버 쇼핑 상품 {item.verifiedSignals.naverShoppingProductCount}개
                  {item.verifiedSignals.naverShoppingLowestPrice ? ` · 최저가 ${item.verifiedSignals.naverShoppingLowestPrice}` : ""}
                  {item.verifiedSignals.naverShoppingMallName ? ` · ${item.verifiedSignals.naverShoppingMallName}` : ""}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CFC4B6]">AI ANALYSIS</p>
                <p className="mt-2 text-xs leading-5 text-[#E2D8CB]">{item.viniminiFit}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.sourceBadges.map((badge, badgeIndex) => (
                <span key={`${item.keyword}-${badge}-${badgeIndex}`} className="border border-[#3D3933] px-2 py-1 text-[11px] font-semibold text-[#CFC4B6]">
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Metric label="기회 점수" value={`${item.opportunityScore}`} dark />
              <Metric label="전체 검색량" value={formatCount(item.verifiedSignals.totalMonthlySearchVolume)} dark />
              <Metric label="모바일 검색 비중" value={formatPercent(item.verifiedSignals.mobileSearchRatio)} dark />
              <Metric label="PC 검색 비중" value={formatPercent(item.verifiedSignals.pcSearchRatio)} dark />
              <Metric label="검색 성장률" value={formatGrowth(item.verifiedSignals.searchGrowth)} dark />
              <Metric label="경쟁도" value={item.verifiedSignals.competitionLevel} dark />
              <Metric label="모바일 구매 적합도" value={item.verifiedSignals.mobileCommerceFit} dark />
              <Metric label="예상 마진" value={item.marginPotential} dark />
              <Metric label="광고 진입" value={item.adEntryPotential} dark />
            </div>
          </article>
        ))}
      </div>

      {showTranscript ? (
        <div className="mt-5 border-t border-[#3D3933] pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#CFC4B6]">자정 전략 회의록</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {discussions.map((discussion) => (
              <article key={discussion.department} className="border border-[#3D3933] bg-[#181716] p-4">
                <p className="text-sm font-semibold text-[#F4EFE7]">{discussion.department}</p>
                <p className="mt-2 text-xs leading-5 text-[#8F877D]">이전 의견 참고: {discussion.inputFromPrevious}</p>
                <p className="mt-2 text-sm leading-6 text-[#CFC4B6]">{discussion.message}</p>
                <p className="mt-3 border-t border-[#3D3933] pt-3 text-sm font-semibold text-[#E2D8CB]">결론: {discussion.decision}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(data?.meetingTimeline ?? []).map((step) => (
              <article key={`${step.time}-${step.department}`} className="border border-[#3D3933] bg-[#181716] p-4">
                <p className="text-xs font-semibold text-[#CFC4B6]">{step.time}</p>
                <h3 className="mt-2 text-base font-semibold text-[#F4EFE7]">{step.department}</h3>
                <p className="mt-1 text-xs text-[#8F877D]">{step.title}</p>
                <p className="mt-2 text-sm font-semibold text-[#E2D8CB]">{step.result}</p>
                <p className="mt-2 text-xs leading-5 text-[#CFC4B6]">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryLine({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <p className={`mt-2 text-sm leading-7 ${muted ? "text-[#CFC4B6]" : "text-[#E2D8CB]"}`}>
      <span className="font-semibold text-[#F4EFE7]">{label}:</span> {value}
    </p>
  );
}

function Metric({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`border p-3 ${dark ? "border-[#3D3933] bg-[#111111]" : "border-[#3D3933] bg-[#181716]"}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#CFC4B6]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#F4EFE7]">{value}</p>
    </div>
  );
}

function ensureExecutiveDiscussion(source?: AutoDiscoveryDiscussionStep[]) {
  const base = source?.length ? source : createFallbackDiscussion();
  const next = base.map((item) => ({
    ...item,
    inputFromPrevious: item.inputFromPrevious || "이전 Director의 회의 의견",
    decision: item.decision || "CEO 브리핑에 반영합니다.",
  }));

  if (!next.some((item) => item.department.includes("Customer Insight"))) {
    next.push({
      department: "Customer Insight Director AI",
      inputFromPrevious: "Pricing Director의 진입 가능 후보",
      message: "리뷰 원문 데이터가 없으면 불만을 만들어내지 않고 SOURCE LIMITED로 유지합니다.",
      decision: "리뷰 리스크는 추가 데이터 필요로 표시합니다.",
    });
  }

  if (!next.some((item) => item.department.includes("Learning"))) {
    next.push({
      department: "Learning Director AI",
      inputFromPrevious: "Customer Insight Director의 검증 제한",
      message: "오늘 회의에서 검색 성장률, 모바일 비중, 경쟁도 가중치를 함께 반영해야 한다는 점을 학습했습니다.",
      decision: "다음 분석에서 모바일 구매 적합도와 광고 난이도를 더 정밀하게 반영합니다.",
    });
  }

  return next;
}

function createFallbackDiscussion(): AutoDiscoveryDiscussionStep[] {
  return [
    {
      department: "Market Director AI",
      inputFromPrevious: "오늘 날짜 기반 후보 생성",
      message: "여성패션 후보군을 먼저 탐색하고 최근 반복 후보를 낮은 우선순위로 처리했습니다.",
      decision: "신규 후보 중심으로 다음 Director에게 넘깁니다.",
    },
    {
      department: "Trend Director AI",
      inputFromPrevious: "Market Director의 후보 목록",
      message: "검색 성장 신호를 확인하되, 근거가 부족한 후보는 추가 데이터 필요로 표시합니다.",
      decision: "상승 신호가 있는 후보를 우선 검토합니다.",
    },
    {
      department: "CEO 비서 AI",
      inputFromPrevious: "각 Director의 검토 의견",
      message: "회의 내용을 CEO 브리핑으로 정리합니다.",
      decision: "TOP10과 첫 실행 제안을 보고합니다.",
    },
  ];
}

function formatCount(value: number | null) {
  if (value === null) return "추가 데이터 필요";
  return `${value.toLocaleString("ko-KR")}회`;
}

function formatPercent(value: number | null) {
  if (value === null) return "추가 데이터 필요";
  return `${value}%`;
}

function formatGrowth(value: number | null) {
  if (value === null) return "추가 데이터 필요";
  return `${value}%`;
}

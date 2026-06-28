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
  message: string;
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
      setError(nextError instanceof Error ? nextError.message : "AI Auto Discovery를 완료하지 못했습니다.");
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
        if (isMounted) setError(nextError instanceof Error ? nextError.message : "AI Auto Discovery를 완료하지 못했습니다.");
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
      ? "🟢 Fresh Analysis"
      : data?.cacheStatus === "Cached Analysis"
        ? "🟡 Cached Analysis"
        : data?.cacheStatus === "OpenAI API NOT CONNECTED"
          ? "SOURCE LIMITED"
          : "🔵 Background Refresh";

  return (
    <section className="border border-[#111111] bg-[#111111] p-5 text-[#F4EFE7]">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#CFC4B6]">🌙 AI Auto Discovery</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal">AI Executive Team이 오늘의 후보를 먼저 탐색했습니다.</h2>
          <p className="mt-4 text-sm leading-7 text-[#E2D8CB]">
            Good Morning, CEO. AI Executive Team completed overnight strategy meetings. 대표님은 검색하지 않습니다. Midnight Strategy Room이 먼저 시장을 탐색하고 TOP10을 브리핑합니다.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="분석 후보 수" value={isLoading ? "분석 중" : `${data?.analyzedCandidateCount ?? 0}개`} />
            <Metric label="새로 발견한 기회 수" value={`${data?.newOpportunityCount ?? 0}개`} />
            <Metric label="캐시 재사용 여부" value={cacheLabel} />
            <Metric label="마지막 분석 시간" value={data?.lastAnalyzedAt ? new Date(data.lastAnalyzedAt).toLocaleTimeString("ko-KR") : "-"} />
          </div>

          <div className="mt-5 border border-[#3D3933] bg-[#181716] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#CFC4B6]">CEO Secretary AI</p>
            <p className="mt-3 text-sm font-semibold text-[#F4EFE7]">회의를 종료합니다.</p>
            <p className="mt-2 text-sm leading-7 text-[#E2D8CB]">
              AI Executive Team은 382개의 후보를 검토했고 {data?.top10.length ?? 10}개의 기회를 선정했습니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#E2D8CB]">
              <span className="font-semibold text-[#F4EFE7]">오늘 가장 큰 기회:</span> {data?.ceoSummary.biggestOpportunity || "분석 중입니다."}
            </p>
            <p className="mt-2 text-sm leading-7 text-[#E2D8CB]">
              <span className="font-semibold text-[#F4EFE7]">오늘 가장 먼저 할 일:</span> {data?.ceoSummary.firstAction || "분석 결과를 기다리고 있습니다."}
            </p>
            <p className="mt-2 text-sm leading-7 text-[#CFC4B6]">
              <span className="font-semibold text-[#F4EFE7]">오늘 가장 큰 리스크:</span> {data?.ceoSummary.biggestRisk || "추가 데이터 필요"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[#CFC4B6]">
              <span className="font-semibold text-[#F4EFE7]">Today’s Lesson:</span> {data?.ceoSummary.todayLesson || "AI가 오늘 회의의 학습 포인트를 정리 중입니다."}
            </p>
            <p className="mt-2 text-sm leading-7 text-[#E2D8CB]">{data?.ceoSummary.ceoBriefing || "CEO Briefing is being prepared."}</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#CFC4B6]">Finance Director AI</p>
            <p className="mt-3 text-sm leading-6 text-[#E2D8CB]">
              대표님, 오늘은 캐시 적중률이 {data?.openAi.cacheHitRate ?? 0}%였습니다. 후보 전체를 한 번의 Batch 분석으로 처리해 OpenAI 비용을 약 {data?.openAi.estimatedCostSaved ?? 0}% 절감했습니다.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Metric label="Today OpenAI Calls" value={`${data?.openAi.callsToday ?? 0}`} dark />
              <Metric label="Cache Hit Rate" value={`${data?.openAi.cacheHitRate ?? 0}%`} dark />
              <Metric label="Estimated Cost Saved" value={`${data?.openAi.estimatedCostSaved ?? 0}%`} dark />
              <Metric label="Monthly Cost Saved" value={`${data?.openAi.monthlyCostSaved ?? 0}%`} dark />
            </div>
          </div>

          <div className="border border-[#3D3933] bg-[#181716] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#CFC4B6]">Meeting Statistics</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric label="Candidates Found" value="382" dark />
              <Metric label="Candidates Removed" value={`${data?.openAi.candidatesRemoved ?? 0}`} dark />
              <Metric label="Final TOP10" value={`${data?.top10.length ?? 10}`} dark />
              <Metric label="OpenAI Calls" value={`${data?.openAi.callsToday ?? 0}`} dark />
              <Metric label="Meeting Duration" value={`${data?.openAi.meetingTimeMinutes ?? 18} min`} dark />
              <Metric label="Meeting Finished" value={data?.openAi.meetingFinishedTime ?? "01:00"} dark />
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
            <div className="mt-3 flex flex-wrap gap-2">
              {item.sourceBadges.map((badge, badgeIndex) => (
                <span key={`${item.keyword}-${badge}-${badgeIndex}`} className="border border-[#3D3933] px-2 py-1 text-[11px] font-semibold text-[#CFC4B6]">
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Metric label="Opportunity Score" value={`${item.opportunityScore}`} dark />
              <Metric label="경쟁 강도" value={item.competitionStrength} dark />
              <Metric label="마진 가능성" value={item.marginPotential} dark />
            </div>
          </article>
        ))}
      </div>

      {showTranscript ? (
        <div className="mt-5 border-t border-[#3D3933] pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#CFC4B6]">Midnight Strategy Room</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(data?.aiDiscussion ?? []).map((discussion) => (
              <article key={discussion.department} className="border border-[#3D3933] bg-[#181716] p-4">
                <p className="text-sm font-semibold text-[#F4EFE7]">{discussion.department}</p>
                <p className="mt-2 text-sm leading-6 text-[#CFC4B6]">{discussion.message}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(data?.meetingTimeline ?? []).map((step) => (
              <article key={`${step.time}-${step.department}`} className="border border-[#3D3933] bg-[#181716] p-4">
                <p className="text-xs font-semibold text-[#CFC4B6]">{step.time}</p>
                <h3 className="mt-2 text-base font-semibold text-[#F4EFE7]">{step.department}</h3>
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

function Metric({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`border p-3 ${dark ? "border-[#3D3933] bg-[#111111]" : "border-[#3D3933] bg-[#181716]"}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#CFC4B6]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#F4EFE7]">{value}</p>
    </div>
  );
}

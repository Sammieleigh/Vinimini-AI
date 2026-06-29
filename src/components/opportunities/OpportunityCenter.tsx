"use client";

import { FormEvent, useMemo, useState } from "react";
import { AutoDiscoveryPanel } from "./AutoDiscoveryPanel";
import { NaverTrendPanel } from "./NaverTrendPanel";
import { OpportunityCard } from "./OpportunityCard";
import { dataEngineSources, scoreEngineSignals } from "@/lib/dailyBriefing";
import type { DataEngineSource } from "@/lib/viniminiDataEngine";
import type { CoupangOpportunity } from "@/lib/types";

const tabs = ["오늘의 기회상품 TOP10", "저경쟁 TOP10", "고마진 TOP10", "급성장 TOP10", "리뷰개선 TOP10"];
const sortOptions = ["기회 점수", "예상 마진", "경쟁 강도"];
const autoDiscoveryKeywords = ["와이드 슬랙스", "반팔 셋업", "치마바지", "린넨 팬츠", "여름 원피스", "냉감 티셔츠", "체형커버 스커트", "밴딩 팬츠", "시스루 셔츠", "민소매 니트"];

type CoupangDataStatus = "missing-keys" | "auth-failed" | "blocked" | "fallback" | "live";
type OpenAiCheckResult = {
  source: "cache" | "disabled" | "openai" | "openai-error";
  dataLabel: "OPENAI MARKET ANALYSIS" | "OPENAI API NOT CONNECTED" | "COUPANG API NOT CONNECTED";
  canOpenAiFetchLiveCoupangData: false;
  conclusion: string;
  allowedRole: string[];
  blockedRole: string[];
  openAiCallCount: number;
  lastOpenAiCallAt: string | null;
};
type PartnersCapabilityStatus = "가능" | "불가능" | "대체 필요";
type PartnersCapabilityReport = {
  mode: "mock-adapter" | "credentials-ready";
  label: "MOCK ADAPTER / NO LIVE AFFILIATE DATA" | "COUPANG PARTNERS CREDENTIALS READY";
  summary: string;
  requiredEnv: string[];
  endpointsToVerify: string[];
  capabilities: Array<{
    item: string;
    status: PartnersCapabilityStatus;
    officialData: string;
    viniminiDecision: string;
  }>;
};

const statusCopy: Record<CoupangDataStatus, { label: string; message: string }> = {
  "missing-keys": {
    label: "공식 API 키 없음",
    message: "COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY가 없어 COUPANG API NOT CONNECTED 상태로 표시합니다.",
  },
  "auth-failed": {
    label: "공식 API 인증 실패",
    message: "Wing OpenAPI 인증에 실패해 COUPANG API NOT CONNECTED 상태로 표시합니다.",
  },
  blocked: {
    label: "쿠팡 검색 접근 제한",
    message: "쿠팡 검색 HTML 요청이 차단되어 SOURCE LIMITED 상태로 표시합니다.",
  },
  fallback: {
    label: "출처 제한 데이터 사용 중",
    message: "실제 쿠팡 시장 전체 데이터가 아니므로 SOURCE LIMITED 상태로 표시합니다.",
  },
  live: {
    label: "실시간 쿠팡 데이터",
    message: "실제 쿠팡 연결 결과를 표시 중입니다.",
  },
};

export function OpportunityCenter({
  products,
  dataSources = dataEngineSources,
}: {
  products: CoupangOpportunity[];
  dataSources?: DataEngineSource[];
}) {
  const [items, setItems] = useState(products);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [category, setCategory] = useState("전체");
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [query, setQuery] = useState("와이드 슬랙스");
  const [localFilter, setLocalFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState<CoupangDataStatus>("missing-keys");
  const [dataMessage, setDataMessage] = useState(statusCopy["missing-keys"].message);
  const [isCheckingOpenAi, setIsCheckingOpenAi] = useState(false);
  const [openAiCheck, setOpenAiCheck] = useState<OpenAiCheckResult | null>(null);
  const [isCheckingPartners, setIsCheckingPartners] = useState(false);
  const [partnersReport, setPartnersReport] = useState<PartnersCapabilityReport | null>(null);
  const categories = useMemo(() => ["전체", ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const isLiveData = dataStatus === "live";

  const filtered = useMemo(() => {
    const base = [...items];
    if (activeTab === "저경쟁 TOP10" || sortBy === "경쟁 강도") base.sort((a, b) => a.lowCompetition.localeCompare(b.lowCompetition));
    if (activeTab === "고마진 TOP10" || sortBy === "예상 마진") base.sort((a, b) => b.expectedMargin.localeCompare(a.expectedMargin));
    if (activeTab === "급성장 TOP10" || activeTab === "오늘의 기회상품 TOP10" || sortBy === "기회 점수") base.sort((a, b) => b.opportunityScore - a.opportunityScore);
    if (activeTab === "리뷰개선 TOP10") base.sort((a, b) => b.reviewComplaints.length - a.reviewComplaints.length || b.opportunityScore - a.opportunityScore);

    return base.filter((item) => {
      const matchesQuery = item.productName.includes(localFilter.trim());
      const matchesCategory = category === "전체" || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [activeTab, category, items, localFilter, sortBy]);
  const topTen = filtered.slice(0, 10);
  const biggestOpportunity = topTen[0];
  const biggestRisk = topTen.find((item) => item.risk.level !== "Low") ?? topTen[0];

  const searchCoupang = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;

    setIsLoading(true);
    setDataStatus("fallback");
    setDataMessage("쿠팡 검색 결과를 불러오는 중입니다.");

    try {
      const response = await fetch(`/api/coupang/search?keyword=${encodeURIComponent(keyword)}`);
      const data = (await response.json()) as {
        ok: boolean;
        count?: number;
        dataStatus?: string;
        message?: string;
        error?: string;
        opportunities?: CoupangOpportunity[];
      };

      if (!response.ok || !data.ok || !data.opportunities?.length) {
        const nextStatus = normalizeCoupangDataStatus(data.dataStatus);
        setItems(products);
        setDataStatus(nextStatus);
        setDataMessage(`${statusCopy[nextStatus].message} ${data.message || data.error || ""}`.trim());
        return;
      }

      setItems(data.opportunities);
      setCategory("전체");
      setLocalFilter("");
      setDataStatus("live");
      setDataMessage(data.message || `LIVE COUPANG DATA: 쿠팡 검색 결과 ${data.count ?? data.opportunities.length}개를 연결했습니다.`);
    } catch (error) {
      setItems(products);
      setDataStatus("fallback");
      setDataMessage(`SOURCE LIMITED: 실제 쿠팡 데이터 연결에 실패했습니다. ${error instanceof Error ? error.message : ""}`.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPartnersCapability = async () => {
    setIsCheckingPartners(true);
    try {
      const response = await fetch("/api/coupang/partners/capability");
      const data = (await response.json()) as PartnersCapabilityReport;
      setPartnersReport(data);
    } finally {
      setIsCheckingPartners(false);
    }
  };

  const verifyOpenAiRole = async () => {
    const keyword = query.trim() || "여성패션";

    setIsCheckingOpenAi(true);
    try {
      const response = await fetch(`/api/openai/coupang-data-check?keyword=${encodeURIComponent(keyword)}`);
      const data = (await response.json()) as OpenAiCheckResult;
      setOpenAiCheck(data);
    } finally {
      setIsCheckingOpenAi(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4EFE7] text-[#111111]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="border-b border-[#D9D0C4] pb-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7D756B]">VINIMINI AI 경영본부</p>
              <h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-6xl">Good Morning, CEO.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#625B53]">
                각 부서의 Director AI가 밤사이 여성패션 시장 회의를 마쳤습니다. CEO 비서 AI가 경영진 보고를 정리했습니다.
              </p>
            </div>
            <aside className="border border-[#111111] bg-[#111111] p-5 text-[#F4EFE7]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#CFC4B6]">CEO 비서 AI</p>
              <p className="mt-4 text-2xl font-semibold tracking-normal">경영진 요약이 준비되었습니다.</p>
              <p className="mt-4 text-sm leading-7 text-[#E2D8CB]">
                대표님이 더 명확하고 자신 있게 결정하도록 경영진 보고를 첫 행동으로 압축했습니다. 오늘의 1위 후보는{" "}
                {biggestOpportunity?.productName ?? "분석 대기"}입니다.
              </p>
            </aside>
          </div>
        </header>

        <AutoDiscoveryPanel />

        <section className="grid gap-3 md:grid-cols-3">
          <BriefingCard eyebrow="경영진 요약" title="CEO 비서가 경영진 회의를 요약했습니다.">
            AI는 대표보다 앞서기 위해 존재하지 않습니다. 대표가 더 명확하고 자신 있게 결정하도록 돕기 위해 존재합니다.
          </BriefingCard>
          <BriefingCard eyebrow="오늘 가장 큰 기회" title={biggestOpportunity?.productName ?? "분석 대기"}>
            기회 점수 {biggestOpportunity?.opportunityScore ?? "-"} · 예상 마진 {biggestOpportunity?.expectedMargin ?? "-"} ·{" "}
            {biggestOpportunity?.whyNow ?? "시장 분석을 준비 중입니다."}
          </BriefingCard>
          <BriefingCard eyebrow="오늘 가장 큰 리스크" title={`${riskLabel(biggestRisk?.risk.level)} 리스크`}>
            {biggestRisk?.risk.reasons[0] ?? "공식 쿠팡 시장 데이터가 연결되기 전까지 출처와 신뢰도를 보수적으로 표시합니다."}
          </BriefingCard>
        </section>

        <section className="grid gap-4 border border-[#111111] bg-[#111111] p-5 text-[#F4EFE7] lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#CFC4B6]">오늘 첫 실행</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal">1위 상품의 썸네일과 첫 화면 메시지를 먼저 결정하세요.</h2>
            <p className="mt-4 text-sm leading-7 text-[#E2D8CB]">
              오늘의 목표는 더 많은 화면을 보는 것이 아니라, CEO가 한 가지 좋은 결정을 내리는 것입니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Market Director AI", "Marketing Director AI", "Creative Director AI", "Data Director AI"].map((department) => (
              <article key={department} className="border border-[#3D3933] bg-[#181716] p-4">
                <p className="text-sm font-semibold text-[#F4EFE7]">{department}</p>
                <p className="mt-2 text-xs leading-5 text-[#CFC4B6]">부서 보고 제출 완료 · CEO 비서 검토 완료</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border border-[#D9D0C4] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8277]">자정 전략 회의실</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">Director AI들이 제출한 시장 후보</h2>
              <p className="mt-3 text-sm leading-6 text-[#625B53]">
                검색창을 기다리지 않고 각 부서가 먼저 시장을 스캔하고 경영진 회의에 올릴 후보를 제출합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {autoDiscoveryKeywords.map((keyword) => (
                <span key={keyword} className="border border-[#D9D0C4] bg-[#FBFAF7] px-3 py-2 text-xs font-medium text-[#625B53]">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>

        <NaverTrendPanel />

        <section className="border border-[#D9D0C4] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8277]">부서 근거실</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">부서 보고는 출처와 신뢰도를 함께 제출합니다.</h2>
              <p className="mt-3 text-sm leading-6 text-[#625B53]">
                이상적인 경영진은 근거 없이 주장하지 않습니다. 각 Director AI는 데이터 출처, 한계, 신뢰도를 함께 보고합니다.
              </p>
            </div>
            <div className="grid gap-3">
              {dataSources.map((source) => (
                <article key={source.name} className="grid gap-2 border border-[#D9D0C4] bg-[#FBFAF7] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <p className="text-sm font-semibold text-[#111111]">{source.name}</p>
                  <p className="text-sm leading-6 text-[#625B53]">{source.role}</p>
                  <span className="border border-[#D9D0C4] bg-white px-3 py-1 text-xs font-semibold text-[#625B53]">{source.status}</span>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#D9D0C4] pt-4">
            {scoreEngineSignals.map((signal) => (
              <span key={signal} className="border border-[#D9D0C4] px-3 py-1 text-xs text-[#625B53]">
                {signal}
              </span>
            ))}
          </div>
        </section>

        <div className="grid gap-3 border border-[#D9D0C4] bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <span className={`border px-3 py-1 text-xs font-semibold ${isLiveData ? "border-[#111111] bg-[#111111] text-[#F4EFE7]" : "border-[#D9D0C4] bg-[#FBFAF7] text-[#625B53]"}`}>
            {isLiveData ? "LIVE COUPANG DATA" : "SOURCE LIMITED"}
          </span>
          <p className="text-sm leading-6 text-[#625B53]">
            <span className="font-semibold text-[#111111]">{statusCopy[dataStatus].label}</span> · {dataMessage}
          </p>
          <input
            value={localFilter}
            onChange={(event) => setLocalFilter(event.target.value)}
            placeholder="TOP10 안에서 조용히 필터"
            className="min-h-11 border border-[#D9D0C4] bg-white px-4 text-sm outline-none transition placeholder:text-[#8A8277] focus:border-[#111111] md:w-72"
          />
        </div>

        <section className="grid gap-4 border border-[#D9D0C4] bg-white p-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8277]">데이터 디렉터 AI</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal">분석 엔진은 근거를 넘어 주장하지 않습니다.</h2>
            <p className="mt-3 text-sm leading-6 text-[#625B53]">
              쿠팡 공식 데이터 소스가 없으면 상품명, 썸네일, 리뷰 수, 평점은 확정 사실처럼 말하지 않습니다. 현재 상태는{" "}
              <span className="font-semibold text-[#111111]">COUPANG API NOT CONNECTED</span>입니다.
            </p>
            {openAiCheck ? (
              <div className="mt-4 grid gap-3 border border-[#E5DED5] bg-[#FBFAF7] p-4 md:grid-cols-3">
                <MetricBox label="결과" value={openAiCheck.dataLabel} />
                <MetricBox label="출처" value={openAiCheck.source} />
                <MetricBox label="OpenAI 호출" value={`${openAiCheck.openAiCallCount}회 · ${openAiCheck.lastOpenAiCallAt || "호출 없음"}`} />
                <p className="text-sm leading-6 text-[#625B53] md:col-span-3">{openAiCheck.conclusion}</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={verifyOpenAiRole}
            disabled={isCheckingOpenAi}
            className="min-h-11 border border-[#111111] bg-white px-5 text-sm font-semibold text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCheckingOpenAi ? "검증 중" : "Director 보고 검증"}
          </button>
        </section>

        <section className="border border-[#D9D0C4] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8277]">향후 쿠팡 API 회의실</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">공식 API가 연결되면 데이터 소스만 교체합니다.</h2>
              <p className="mt-3 text-sm leading-6 text-[#625B53]">
                지금은 구조를 검증하고, 향후 쿠팡 공식 API가 들어오면 CEO 브리핑 스토리는 유지한 채 근거 데이터만 바꿉니다.
              </p>
            </div>
            <button
              type="button"
              onClick={verifyPartnersCapability}
              disabled={isCheckingPartners}
              className="min-h-11 border border-[#111111] bg-white px-5 text-sm font-semibold text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingPartners ? "검증 중" : "API 전환 준비도 확인"}
            </button>
          </div>

          {partnersReport ? (
            <div className="mt-5">
              <div className="grid gap-3 border border-[#E5DED5] bg-[#FBFAF7] p-4 md:grid-cols-[auto_1fr] md:items-center">
                <span className="border border-[#E5DED5] bg-white px-3 py-1 text-xs font-semibold text-[#6F6A63]">{partnersReport.label}</span>
                <p className="text-sm leading-6 text-[#6F6A63]">{partnersReport.summary}</p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5DED5] text-xs uppercase tracking-[0.18em] text-[#9B948B]">
                      <th className="py-3 pr-4 font-semibold">확인 항목</th>
                      <th className="py-3 pr-4 font-semibold">결과</th>
                      <th className="py-3 pr-4 font-semibold">공식 API 기준</th>
                      <th className="py-3 font-semibold">VINIMINI 판단</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnersReport.capabilities.map((capability) => (
                      <tr key={capability.item} className="border-b border-[#E5DED5] last:border-b-0">
                        <td className="py-4 pr-4 font-semibold text-[#111111]">{capability.item}</td>
                        <td className="py-4 pr-4">
                          <span className={`border px-3 py-1 text-xs font-semibold ${getCapabilityBadgeClass(capability.status)}`}>{capability.status}</span>
                        </td>
                        <td className="py-4 pr-4 leading-6 text-[#6F6A63]">{capability.officialData}</td>
                        <td className="py-4 leading-6 text-[#6F6A63]">{capability.viniminiDecision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>

        <form onSubmit={searchCoupang} className="grid gap-3 border border-[#D9D0C4] bg-white p-4 xl:grid-cols-[1fr_auto_auto_auto_auto] xl:items-center">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab ? "border-[#111111] bg-[#111111] text-[#F4EFE7]" : "border-[#D9D0C4] bg-white text-[#625B53] hover:border-[#111111]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Director AI에게 보조 검토 요청"
            className="min-h-11 border border-[#D9D0C4] bg-white px-4 text-sm outline-none transition placeholder:text-[#8A8277] focus:border-[#111111] lg:w-80"
          />
          <button type="submit" className="min-h-11 border border-[#111111] bg-[#111111] px-5 text-sm font-semibold text-[#F4EFE7] disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading}>
            {isLoading ? "검토 중" : "부서 재검토"}
          </button>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 border border-[#D9D0C4] bg-white px-4 text-sm outline-none transition focus:border-[#111111]">
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="min-h-11 border border-[#D9D0C4] bg-white px-4 text-sm outline-none transition focus:border-[#111111]">
            {sortOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </form>

        <section className="border-t border-[#D9D0C4] pt-6">
          <div className="mb-5 grid gap-2 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8277]">CEO 브리핑 보고서</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal">오늘의 기회상품 TOP10</h2>
            </div>
            <p className="text-sm leading-6 text-[#625B53]">각 카드는 부서 보고서입니다. CEO가 다음 회의에서 바로 결정할 수 있도록 압축했습니다.</p>
          </div>
          <div className="grid gap-3">
            {topTen.map((item, index) => (
              <OpportunityCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function BriefingCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <article className="border border-[#D9D0C4] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A8277]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-normal">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#625B53]">{children}</p>
    </article>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B948B]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#111111]">{value}</p>
    </div>
  );
}

function normalizeCoupangDataStatus(status?: string): CoupangDataStatus {
  if (status === "official-api-auth-failed") return "auth-failed";
  if (status === "coupang-html-403-blocked") return "blocked";
  if (status === "official-api-keys-missing") return "missing-keys";
  return "fallback";
}

function getCapabilityBadgeClass(status: PartnersCapabilityStatus) {
  if (status === "가능") return "border-[#111111] bg-[#111111] text-[#F6F2EC]";
  if (status === "대체 필요") return "border-[#D9C7A3] bg-[#FBFAF7] text-[#6F6A63]";
  return "border-[#E5DED5] bg-white text-[#6F6A63]";
}

function riskLabel(level?: string) {
  if (level === "Low") return "낮음";
  if (level === "High") return "높음";
  return "보통";
}

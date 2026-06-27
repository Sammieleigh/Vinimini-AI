"use client";

import { FormEvent, useMemo, useState } from "react";
import { OpportunityCard } from "./OpportunityCard";
import { dataEngineSources, scoreEngineSignals } from "@/lib/dailyBriefing";
import type { CoupangOpportunity } from "@/lib/types";

const tabs = ["오늘의 기회상품 TOP10", "저경쟁 TOP10", "고마진 TOP10", "급성장 TOP10", "리뷰개선 TOP10"];
const sortOptions = ["Opportunity Score", "High Profit", "Low Competition"];
const autoDiscoveryKeywords = [
  "와이드 슬랙스",
  "반팔 셋업",
  "치마바지",
  "린넨 팬츠",
  "여름 원피스",
  "냉감 티셔츠",
  "체형커버 스커트",
  "밴딩 팬츠",
  "시스루 셔츠",
  "나시 니트",
];

type CoupangDataStatus = "missing-keys" | "auth-failed" | "blocked" | "fallback" | "live";
type OpenAiCheckResult = {
  source: "cache" | "disabled" | "openai" | "openai-error";
  dataLabel: "DEMO DATA / NO LIVE COUPANG DATA";
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
    message: "COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY가 없어 DEMO DATA를 사용합니다.",
  },
  "auth-failed": {
    label: "공식 API 인증 실패",
    message: "WING OpenAPI 인증에 실패해 DEMO DATA를 사용합니다.",
  },
  blocked: {
    label: "쿠팡 검색 403 차단",
    message: "쿠팡 검색 HTML 요청이 차단되어 fallback 데이터를 표시합니다.",
  },
  fallback: {
    label: "fallback 데이터 사용 중",
    message: "실제 쿠팡 데이터가 아니며 제품 흐름 검증용 DEMO DATA입니다.",
  },
  live: {
    label: "LIVE COUPANG DATA",
    message: "실제 쿠팡 연결 결과를 표시 중입니다.",
  },
};

export function OpportunityCenter({ products }: { products: CoupangOpportunity[] }) {
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
    if (activeTab === "저경쟁 TOP10" || sortBy === "Low Competition") base.sort((a, b) => a.lowCompetition.localeCompare(b.lowCompetition));
    if (activeTab === "고마진 TOP10" || sortBy === "High Profit") base.sort((a, b) => b.expectedMargin.localeCompare(a.expectedMargin));
    if (activeTab === "급성장 TOP10" || activeTab === "오늘의 기회상품 TOP10" || sortBy === "Opportunity Score") base.sort((a, b) => b.opportunityScore - a.opportunityScore);
    if (activeTab === "리뷰개선 TOP10") base.sort((a, b) => b.reviewComplaints.length - a.reviewComplaints.length || b.opportunityScore - a.opportunityScore);

    return base.filter((item) => {
      const matchesQuery = item.productName.includes(localFilter.trim());
      const matchesCategory = category === "전체" || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [activeTab, category, items, localFilter, sortBy]);
  const topTen = filtered.slice(0, 10);

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
      setDataMessage(
        `DEMO DATA: 실제 쿠팡 데이터 연결에 실패해 fallback 데이터를 표시합니다. ${error instanceof Error ? error.message : ""}`.trim(),
      );
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
    <main className="min-h-screen bg-[#F6F2EC] text-[#111111]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-[#E5DED5] pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#6F6A63]">Opportunity Center</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">오늘의 여성패션 기회상품 TOP10</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#6F6A63]">
            VINIMINI는 사용자가 검색하기 전에 쿠팡 여성패션 시장을 먼저 탐색하고, 오늘 진입하기 좋은 상품을 CEO에게 추천합니다.
          </p>
        </header>

        <section className="rounded-sm border border-[#111111] bg-[#111111] p-5 text-[#F6F2EC]">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#C9BDAF]">AI Auto Discovery</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-normal">AI가 매일 먼저 탐색하는 여성패션 키워드</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {autoDiscoveryKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-[#C9BDAF] px-3 py-1 text-xs text-[#E8DED1]">
                {keyword}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-sm border border-[#E5DED5] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#9B948B]">VINIMINI Data Engine</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">쿠팡 여성패션만 분석합니다.</h2>
              <p className="mt-3 text-sm leading-6 text-[#6F6A63]">
                상품 데이터 엔진과 OpenAI 분석 엔진을 분리합니다. OpenAI는 데이터를 가져오지 않고, 수집된 데이터만 분석합니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["LIVE DATA", "PARTIAL DATA", "DEMO DATA"].map((label) => (
                  <span key={label} className="rounded-full border border-[#E5DED5] bg-[#FBFAF7] px-3 py-1 text-xs font-semibold text-[#6F6A63]">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              {dataEngineSources.map((source) => (
                <article key={source.name} className="grid gap-2 rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <p className="text-sm font-semibold text-[#111111]">{source.name}</p>
                  <p className="text-sm leading-6 text-[#6F6A63]">{source.role}</p>
                  <span className="rounded-full border border-[#E5DED5] bg-white px-3 py-1 text-xs font-semibold text-[#6F6A63]">
                    {source.status}
                  </span>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E5DED5] pt-4">
            {scoreEngineSignals.map((signal) => (
              <span key={signal} className="rounded-full border border-[#E5DED5] px-3 py-1 text-xs text-[#6F6A63]">
                {signal}
              </span>
            ))}
          </div>
        </section>

        <div className="grid gap-3 rounded-sm border border-[#E5DED5] bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isLiveData
                ? "border-[#111111] bg-[#111111] text-[#F6F2EC]"
                : "border-[#E5DED5] bg-[#FBFAF7] text-[#6F6A63]"
            }`}
          >
            {isLiveData ? "LIVE COUPANG DATA" : "DEMO DATA"}
          </span>
          <p className="text-sm leading-6 text-[#6F6A63]">
            <span className="font-semibold text-[#111111]">{statusCopy[dataStatus].label}</span>
            {" · "}
            {dataMessage}
          </p>
          <input
            value={localFilter}
            onChange={(event) => setLocalFilter(event.target.value)}
            placeholder="현재 TOP10 안에서 필터"
            className="min-h-11 rounded-sm border border-[#E5DED5] bg-white px-4 text-sm outline-none transition placeholder:text-[#9B948B] focus:border-[#111111] md:w-72"
          />
        </div>

        <section className="grid gap-3 rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4 md:grid-cols-4">
          {(["missing-keys", "auth-failed", "blocked", "fallback"] as const).map((status) => (
            <div key={status} className="rounded-sm border border-[#E5DED5] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B948B]">Coupang Status</p>
              <p className="mt-2 text-sm font-semibold text-[#111111]">{statusCopy[status].label}</p>
              <p className="mt-2 text-xs leading-5 text-[#6F6A63]">{dataStatus === status ? "현재 상태" : "필요 시 표시"}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-sm border border-[#E5DED5] bg-white p-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#9B948B]">OpenAI Data Guard</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal">OpenAI는 쿠팡 데이터 수집기가 아니라 분석 엔진입니다.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6F6A63]">
              실제 쿠팡 데이터 소스가 없으면 상품명, 썸네일, 리뷰수, 평점은 생성하지 않습니다. 현재 상태는{" "}
              <span className="font-semibold text-[#111111]">DEMO DATA / NO LIVE COUPANG DATA</span>입니다.
            </p>
            {openAiCheck ? (
              <div className="mt-4 grid gap-3 rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4 md:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B948B]">Result</p>
                  <p className="mt-2 text-sm font-semibold text-[#111111]">{openAiCheck.dataLabel}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B948B]">Source</p>
                  <p className="mt-2 text-sm font-semibold text-[#111111]">{openAiCheck.source}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B948B]">OpenAI Calls</p>
                  <p className="mt-2 text-sm font-semibold text-[#111111]">
                    {openAiCheck.openAiCallCount}회 · {openAiCheck.lastOpenAiCallAt || "호출 없음"}
                  </p>
                </div>
                <p className="text-sm leading-6 text-[#6F6A63] md:col-span-3">{openAiCheck.conclusion}</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={verifyOpenAiRole}
            disabled={isCheckingOpenAi}
            className="min-h-11 rounded-sm border border-[#111111] bg-white px-5 text-sm font-semibold text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCheckingOpenAi ? "검증 중" : "OpenAI 역할 검증"}
          </button>
        </section>

        <section className="rounded-sm border border-[#E5DED5] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#9B948B]">Coupang Partners API Check</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">쿠팡 파트너스 API로 가져올 수 있는 데이터 검증</h2>
              <p className="mt-3 text-sm leading-6 text-[#6F6A63]">
                API 키가 없으면 실제 호출 없이 Mock Adapter로 구조만 확인합니다. 리뷰수와 평점은 공식 상품 데이터로 확정하기 어렵기 때문에 대체 소스가 필요합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={verifyPartnersCapability}
              disabled={isCheckingPartners}
              className="min-h-11 rounded-sm border border-[#111111] bg-white px-5 text-sm font-semibold text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingPartners ? "검증 중" : "파트너스 API 검증"}
            </button>
          </div>

          {partnersReport ? (
            <div className="mt-5">
              <div className="grid gap-3 rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4 md:grid-cols-[auto_1fr] md:items-center">
                <span className="rounded-full border border-[#E5DED5] bg-white px-3 py-1 text-xs font-semibold text-[#6F6A63]">
                  {partnersReport.label}
                </span>
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
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCapabilityBadgeClass(capability.status)}`}>
                            {capability.status}
                          </span>
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

        <form onSubmit={searchCoupang} className="grid gap-3 rounded-sm border border-[#E5DED5] bg-white p-4 xl:grid-cols-[1fr_auto_auto_auto_auto] xl:items-center">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-sm border px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab
                    ? "border-[#111111] bg-[#111111] text-[#F6F2EC]"
                    : "border-[#E5DED5] bg-white text-[#6F6A63] hover:border-[#111111]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="보조 검색 키워드"
            className="min-h-11 rounded-sm border border-[#E5DED5] bg-white px-4 text-sm outline-none transition placeholder:text-[#9B948B] focus:border-[#111111] lg:w-80"
          />
          <button
            type="submit"
            className="min-h-11 rounded-sm border border-[#111111] bg-[#111111] px-5 text-sm font-semibold text-[#F6F2EC] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? "검색 중" : "쿠팡 검색"}
          </button>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 rounded-sm border border-[#E5DED5] bg-white px-4 text-sm outline-none transition focus:border-[#111111]"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="min-h-11 rounded-sm border border-[#E5DED5] bg-white px-4 text-sm outline-none transition focus:border-[#111111]"
          >
            {sortOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </form>

        <div className="grid gap-3">
          {topTen.map((item, index) => (
            <OpportunityCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>
    </main>
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

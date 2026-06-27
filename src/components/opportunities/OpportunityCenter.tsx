"use client";

import { FormEvent, useMemo, useState } from "react";
import { OpportunityCard } from "./OpportunityCard";
import type { CoupangOpportunity } from "@/lib/types";

const tabs = ["오늘의 기회상품 TOP10", "저경쟁 TOP10", "고마진 TOP10", "급성장 TOP10", "리뷰개선 TOP10"];
const sortOptions = ["Opportunity Score", "High Profit", "Low Competition"];

export function OpportunityCenter({ products }: { products: CoupangOpportunity[] }) {
  const [items, setItems] = useState(products);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [category, setCategory] = useState("전체");
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [query, setQuery] = useState("와이드 슬랙스");
  const [localFilter, setLocalFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState("현재는 기본 여성패션 데이터입니다. 키워드 검색 시 쿠팡 검색 결과를 불러옵니다.");
  const categories = useMemo(() => ["전체", ...Array.from(new Set(items.map((item) => item.category)))], [items]);

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

  const searchCoupang = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;

    setIsLoading(true);
    setDataMessage("쿠팡 검색 결과를 불러오는 중입니다.");

    try {
      const response = await fetch(`/api/coupang/search?keyword=${encodeURIComponent(keyword)}`);
      const data = (await response.json()) as {
        ok: boolean;
        count?: number;
        error?: string;
        opportunities?: CoupangOpportunity[];
      };

      if (!response.ok || !data.ok || !data.opportunities?.length) {
        throw new Error(data.error || "쿠팡 검색 결과가 비어 있습니다.");
      }

      setItems(data.opportunities);
      setCategory("전체");
      setLocalFilter("");
      setDataMessage(`쿠팡 검색 결과 ${data.count ?? data.opportunities.length}개를 연결했습니다.`);
    } catch (error) {
      setItems(products);
      setDataMessage(
        `쿠팡 데이터 연결에 실패해 기본 데이터를 표시합니다. ${error instanceof Error ? error.message : ""}`.trim(),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#111111]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-[#E5DED5] pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#6F6A63]">Opportunity Center</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">AI 추천 상품 리스트</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#6F6A63]">
            VINIMINI는 여성패션 전문 AI입니다. 쿠팡 여성패션 안에서 이미 결론이 나온 상품부터 추천합니다.
          </p>
        </header>

        <form onSubmit={searchCoupang} className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto] xl:items-center">
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
            placeholder="쿠팡 검색 키워드"
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

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm leading-6 text-[#6F6A63]">{dataMessage}</p>
          <input
            value={localFilter}
            onChange={(event) => setLocalFilter(event.target.value)}
            placeholder="현재 리스트 안에서 필터"
            className="min-h-11 rounded-sm border border-[#E5DED5] bg-white px-4 text-sm outline-none transition placeholder:text-[#9B948B] focus:border-[#111111] md:w-72"
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((item, index) => (
            <OpportunityCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}

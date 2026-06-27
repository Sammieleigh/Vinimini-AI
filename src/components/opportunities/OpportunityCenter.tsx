"use client";

import { useMemo, useState } from "react";
import { OpportunityCard } from "./OpportunityCard";
import type { CoupangOpportunity } from "@/lib/types";

const tabs = ["오늘의 기회 상품 TOP10", "고마진 TOP10", "저경쟁 TOP10"];
const sortOptions = ["Opportunity Score", "High Profit", "Low Competition"];

export function OpportunityCenter({ products }: { products: CoupangOpportunity[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [category, setCategory] = useState("전체");
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [query, setQuery] = useState("");
  const categories = useMemo(() => ["전체", ...Array.from(new Set(products.map((item) => item.category)))], [products]);

  const filtered = useMemo(() => {
    const base = [...products];
    if (activeTab === "고마진 TOP10" || sortBy === "High Profit") base.sort((a, b) => b.expectedMargin.localeCompare(a.expectedMargin));
    if (activeTab === "저경쟁 TOP10" || sortBy === "Low Competition") base.sort((a, b) => a.lowCompetition.localeCompare(b.lowCompetition));
    if (activeTab === "오늘의 기회 상품 TOP10" || sortBy === "Opportunity Score") base.sort((a, b) => b.opportunityScore - a.opportunityScore);

    return base.filter((item) => {
      const matchesQuery = item.productName.includes(query.trim());
      const matchesCategory = category === "전체" || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [activeTab, category, products, query, sortBy]);

  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#111111]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-[#E5DED5] pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#6F6A63]">Opportunity Center</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">AI 추천 상품 리스트</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#6F6A63]">
            이미 결론이 나온 상품부터 보여드립니다. 추천도, 진입 난이도, 예상 수익성만 먼저 보고 결정하세요.
          </p>
        </header>

        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
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
            placeholder="상품 검색"
            className="min-h-11 rounded-sm border border-[#E5DED5] bg-white px-4 text-sm outline-none transition placeholder:text-[#9B948B] focus:border-[#111111] lg:w-80"
          />
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

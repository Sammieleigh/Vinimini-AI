"use client";

import { useState } from "react";
import { ActionPlan } from "./ActionPlan";
import { CompetitorAnalysis } from "./CompetitorAnalysis";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { ExpectedResult } from "./ExpectedResult";
import { LearningNote } from "./LearningNote";
import { MeetingHistory } from "./MeetingHistory";
import { ReviewComplaints } from "./ReviewComplaints";
import { RiskAnalysis } from "./RiskAnalysis";
import { ViniminiProposal } from "./ViniminiProposal";
import type { CoupangOpportunity } from "@/lib/types";

const tabs = [
  "요약",
  "경쟁상품",
  "리뷰",
  "AI 제안",
  "실행",
  "성과",
  "위험",
  "회의기록",
  "학습",
];

export function PlanningRoom({ product }: { product: CoupangOpportunity }) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#111111]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 lg:px-10">
        <ExecutiveSummary product={product} />

        <nav className="sticky top-0 z-10 -mx-5 overflow-x-auto border-y border-[#E5DED5] bg-[#F6F2EC]/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-sm border px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab
                    ? "border-[#111111] bg-[#111111] text-[#F6F2EC]"
                    : "border-[#E5DED5] bg-white text-[#6F6A63] hover:border-[#111111] hover:text-[#111111]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        <section className="min-h-[520px]">
          {activeTab === "요약" ? <SummaryTab product={product} /> : null}
          {activeTab === "경쟁상품" ? <CompetitorAnalysis product={product} /> : null}
          {activeTab === "리뷰" ? <ReviewComplaints product={product} /> : null}
          {activeTab === "AI 제안" ? <ViniminiProposal product={product} /> : null}
          {activeTab === "실행" ? <ActionPlan product={product} /> : null}
          {activeTab === "성과" ? <ExpectedResult product={product} /> : null}
          {activeTab === "위험" ? <RiskAnalysis product={product} /> : null}
          {activeTab === "회의기록" ? <MeetingHistory product={product} /> : null}
          {activeTab === "학습" ? <LearningNote product={product} /> : null}
        </section>
      </section>
    </main>
  );
}

function SummaryTab({ product }: { product: CoupangOpportunity }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-sm border border-[#E5DED5] bg-white p-6">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#6F6A63]">AI 상품기획 회의</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-normal">CEO 추천 결론</h2>
        <p className="mt-4 text-base leading-8 text-[#6F6A63]">{product.recommendation}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {product.reasons.map((reason) => (
            <div key={reason} className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4 text-sm text-[#6F6A63]">
              {reason}
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-sm border border-[#111111] bg-[#111111] p-5 text-[#F6F2EC]">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#C9BDAF]">지금 해야 할 일</p>
          <p className="mt-3 text-sm leading-7 text-[#E8DED1]">
            지금은 상품을 더 찾지 말고, 이 상품의 상세페이지 첫 화면과 실측표부터 확정하세요.
          </p>
        </div>
      </section>

      <section className="rounded-sm border border-[#111111] bg-white p-6">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#6F6A63]">Competitive Advantage</p>
        <h2 className="mt-4 text-2xl font-semibold tracking-normal">우리가 이길 수 있는 포인트</h2>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-[#6F6A63]">
          {product.competitiveAdvantages.map((item) => (
            <li key={item} className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-3">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

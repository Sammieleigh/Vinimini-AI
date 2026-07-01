"use client";

import { useMemo, useState } from "react";
import type { CoupangOpportunity } from "@/lib/types";
import { AIDiscussion } from "./AIDiscussion";
import { CEORecommendation } from "./CEORecommendation";
import { CompetitorAnalysis } from "./CompetitorAnalysis";
import { DetailPageProposal } from "./DetailPageProposal";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { ExpectedResult } from "./ExpectedResult";
import { LearningNote } from "./LearningNote";
import { MeetingHistory } from "./MeetingHistory";
import { Pricing } from "./Pricing";
import { ReviewComplaints } from "./ReviewComplaints";
import { RiskAnalysis } from "./RiskAnalysis";
import { ThumbnailProposal } from "./ThumbnailProposal";

const ko = {
  planningRoom: "VINIMINI AI \uC0C1\uD488\uAE30\uD68D \uD68C\uC758\uC2E4",
  subtitle:
    "\uC774\uACF3\uC740 AI \uACBD\uC601\uC9C4\uC774 \uC0C1\uD488\uAE30\uD68D\uC744 \uB17C\uC758\uD558\uB294 \uD68C\uC758\uC2E4\uC785\uB2C8\uB2E4. \uB300\uD45C\uB2D8\uC740 \uAC80\uC0C9 \uACB0\uACFC\uB97C \uBCF4\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uACB0\uC815\uC5D0 \uD544\uC694\uD55C \uD310\uB2E8\uC744 \uBCF4\uACE0\uBC1B\uC2B5\uB2C8\uB2E4. OpenAI\uB294 \uACBD\uC601\uC9C4 \uBD84\uC11D \uC5D4\uC9C4\uC73C\uB85C\uC11C \uC5F0\uACB0\uB41C \uADFC\uAC70\uB97C \uBD84\uC11D\uD558\uACE0, \uC6B0\uC120\uC21C\uC704\uB97C \uC815\uB9AC\uD558\uACE0, \uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uC0C1\uD488 \uC0AC\uC2E4\uC744 \uB9CC\uB4E4\uC9C0 \uC54A\uACE0 CEO \uC694\uC57D\uC744 \uC900\uBE44\uD569\uB2C8\uB2E4.",
  secretary: "CEO \uBE44\uC11C AI",
  ready:
    "\uACBD\uC601\uC9C4 \uC694\uC57D\uC774 \uC900\uBE44\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB370\uC774\uD130 \uBD80\uC871 \uC0C1\uD0DC\uB294 \uCD9C\uCC98 \uC81C\uD55C\uC73C\uB85C \uBA85\uD655\uD788 \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
  coupangSource: "\uCFE0\uD321\uC719 \uC6B4\uC601 \uB370\uC774\uD130",
  limitedSource: "\uCD9C\uCC98 \uC81C\uD55C",
};

const tabs = [
  { id: "summary", label: "\uACBD\uC601\uC9C4 \uC694\uC57D" },
  { id: "discussion", label: "AI \uD68C\uC758\uB85D" },
  { id: "competitor", label: "\uACBD\uC7C1\uC0AC \uBD84\uC11D" },
  { id: "reviews", label: "\uB9AC\uBDF0 \uBD88\uB9CC TOP5" },
  { id: "thumbnail", label: "\uC378\uB124\uC77C \uC81C\uC548" },
  { id: "detail-page", label: "\uC0C1\uC138\uD398\uC774\uC9C0 \uC81C\uC548" },
  { id: "pricing", label: "\uAC00\uACA9 \uC804\uB7B5" },
  { id: "risk", label: "\uB9AC\uC2A4\uD06C" },
  { id: "expected-result", label: "\uC608\uC0C1 \uACB0\uACFC" },
  { id: "ceo-action", label: "CEO \uC2E4\uD589 \uC81C\uC548" },
  { id: "learning", label: "AI \uD559\uC2B5 \uB178\uD2B8" },
  { id: "history", label: "\uD68C\uC758 \uAE30\uB85D" },
] as const;

type PlanningTabId = (typeof tabs)[number]["id"];

export function PlanningRoom({ product, initialTab }: { product: CoupangOpportunity; initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<PlanningTabId>(() => getPlanningTabId(initialTab));
  const sourceStatus = product.dataSource === "coupang" ? ko.coupangSource : ko.limitedSource;
  const activePanel = useMemo(() => renderPlanningTab(activeTab, product), [activeTab, product]);
  const activateTab = (tab: PlanningTabId) => setActiveTab(tab);

  return (
    <main className="min-h-screen bg-[#F4EFE7] text-[#111111]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:px-10">
        <header className="border-b border-[#D9D0C4] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7D756B]">{ko.planningRoom}</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">{product.productName}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#625B53]">{ko.subtitle}</p>
            </div>
            <aside className="border border-[#111111] bg-[#111111] p-4 text-[#F4EFE7]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#CFC4B6]">{ko.secretary}</p>
              <p className="mt-3 text-sm leading-6 text-[#E2D8CB]">{ko.ready}</p>
              <div className="mt-4 inline-flex border border-[#F4EFE7] px-3 py-2 text-xs font-semibold">{sourceStatus}</div>
            </aside>
          </div>
        </header>

        <nav className="overflow-x-auto border border-[#D9D0C4] bg-white p-2">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={`/planning/${product.id}?tab=${tab.id}`}
                onPointerDown={() => activateTab(tab.id)}
                onClick={() => activateTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={`shrink-0 border px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-[#111111] bg-[#111111] text-[#F4EFE7]"
                    : "border-[#D9D0C4] bg-[#FBFAF7] text-[#625B53] hover:border-[#111111]"
                }`}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </nav>

        <section className="min-h-[560px] border border-[#D9D0C4] bg-white p-5">{activePanel}</section>
      </section>
    </main>
  );
}

function getPlanningTabId(tab?: string): PlanningTabId {
  return tabs.find((item) => item.id === tab)?.id ?? "summary";
}

function renderPlanningTab(activeTab: PlanningTabId, product: CoupangOpportunity) {
  switch (activeTab) {
    case "summary":
      return <ExecutiveSummary product={product} />;
    case "discussion":
      return <AIDiscussion product={product} />;
    case "competitor":
      return <CompetitorAnalysis product={product} />;
    case "reviews":
      return <ReviewComplaints product={product} />;
    case "thumbnail":
      return <ThumbnailProposal product={product} />;
    case "detail-page":
      return <DetailPageProposal product={product} />;
    case "pricing":
      return <Pricing product={product} />;
    case "risk":
      return <RiskAnalysis product={product} />;
    case "expected-result":
      return <ExpectedResult product={product} />;
    case "ceo-action":
      return <CEORecommendation product={product} />;
    case "learning":
      return <LearningNote product={product} />;
    case "history":
      return <MeetingHistory product={product} />;
  }
}

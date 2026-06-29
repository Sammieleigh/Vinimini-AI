import Link from "next/link";
import type { CoupangOpportunity } from "@/lib/types";

export function OpportunityCard({ item, index }: { item: CoupangOpportunity; index: number }) {
  const sourceBadges =
    item.dataSource === "coupang"
      ? ["COUPANG WING OPERATIONS", "SOURCE LIMITED"]
      : ["NAVER DATALAB", "OPENAI MARKET ANALYSIS", "SOURCE LIMITED"];

  return (
    <Link
      href={`/planning/${item.id}`}
      className="grid gap-5 border border-[#D9D0C4] bg-white p-5 transition hover:border-[#111111] lg:grid-cols-[72px_1fr_260px]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#111111] text-sm font-semibold">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8A8277]">Department Briefing</p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-normal">{item.productName}</h2>
          {item.strongBuy ? <span className="rounded-full border border-[#111111] px-3 py-1 text-xs font-medium">CEO PRIORITY</span> : null}
          {sourceBadges.map((badge) => (
            <span
              key={`${item.id}-${badge}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                badge === "COUPANG WING OPERATIONS" ? "border-[#111111] bg-[#111111] text-[#F6F2EC]" : "border-[#D9D0C4] text-[#625B53]"
              }`}
            >
              {badge}
            </span>
          ))}
          {item.isRocket ? <span className="rounded-full border border-[#D9D0C4] px-3 py-1 text-xs text-[#625B53]">Rocket</span> : null}
          {item.isAd ? <span className="rounded-full border border-[#D9D0C4] px-3 py-1 text-xs text-[#625B53]">Ad</span> : null}
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#625B53]">
          <span className="font-semibold text-[#111111]">Why Now:</span> {item.whyNow}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DecisionLine label="Search Growth" value={item.confidence.evidence[1] ?? "추가 데이터 필요"} />
          <DecisionLine label="Competition" value={`${item.lowCompetition} · 경쟁 후보 ${item.competitorCount}개`} />
          <DecisionLine label="Recommended Action" value={item.actionPlan[0] ?? item.recommendation} />
          <DecisionLine label="Confidence" value={`${item.confidence.percent}% · ${item.confidence.evidence[0] ?? "근거 추가 필요"}`} />
        </div>

        <p className="mt-3 text-sm font-medium text-[#111111]">Executive Evidence: {item.reasons.slice(0, 3).join(" · ")}</p>
        <p className="mt-2 text-xs text-[#625B53]">
          Reporting Department: Market Director AI · {item.sellerName ? `Seller/Brand ${item.sellerName}` : "시장 후보 분석"} · {item.category}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm lg:grid-cols-1">
        <Metric label="Opportunity Score" value={`${item.opportunityScore}`} />
        <Metric label="Entry Difficulty" value={item.entryDifficulty} />
        <Metric label="Estimated Margin" value={item.expectedMargin} />
      </div>
    </Link>
  );
}

function DecisionLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[#D9D0C4] pl-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8277]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#625B53]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#D9D0C4] bg-[#FBFAF7] p-3">
      <p className="text-[11px] text-[#625B53]">{label}</p>
      <p className="mt-1 font-semibold text-[#111111]">{value}</p>
    </div>
  );
}

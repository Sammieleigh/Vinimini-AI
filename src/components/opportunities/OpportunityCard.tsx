import Link from "next/link";
import type { CoupangOpportunity } from "@/lib/types";

export function OpportunityCard({ item, index }: { item: CoupangOpportunity; index: number }) {
  return (
    <Link
      href={`/planning/${item.id}`}
      className="grid gap-5 rounded-sm border border-[#E5DED5] bg-white p-5 transition hover:border-[#111111] lg:grid-cols-[72px_1fr_180px]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#111111] text-sm font-semibold">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-normal">{item.productName}</h2>
          {item.strongBuy ? (
            <span className="rounded-full border border-[#111111] px-3 py-1 text-xs font-medium">STRONG BUY</span>
          ) : null}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6F6A63]">{item.whyNow}</p>
        <p className="mt-3 text-sm font-medium text-[#111111]">추천 이유: {item.reasons.slice(0, 3).join(" · ")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm lg:grid-cols-1">
        <Metric label="추천도" value={`${item.opportunityScore}`} />
        <Metric label="예상 마진" value={item.expectedMargin} />
        <Metric label="진입 난이도" value={item.entryDifficulty} />
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-3">
      <p className="text-[11px] text-[#6F6A63]">{label}</p>
      <p className="mt-1 font-semibold text-[#111111]">{value}</p>
    </div>
  );
}

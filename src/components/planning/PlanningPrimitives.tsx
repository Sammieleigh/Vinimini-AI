export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8277]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal">{title}</h2>
      {text ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[#625B53]">{text}</p> : null}
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

export function BriefBox({ title, text }: { title: string; text: string }) {
  return (
    <article className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#625B53]">{text}</p>
    </article>
  );
}

export function SourceLimitedNotice() {
  return (
    <div className="border border-[#111111] bg-[#111111] p-4 text-sm leading-6 text-[#F4EFE7]">
      SOURCE LIMITED: OpenAI는 공개 웹과 연결된 근거를 분석할 수 있지만, 확인되지 않은 쿠팡 상품명, 가격, 리뷰 수, 평점,
      판매량, 순위를 사실처럼 만들지 않습니다. 검증되지 않은 항목은 추가 데이터 필요로 표시합니다.
    </div>
  );
}

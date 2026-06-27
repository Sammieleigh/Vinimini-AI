import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
};

export function SectionCard({ children, className = "", title, eyebrow }: SectionCardProps) {
  return (
    <section className={`rounded-sm border border-[#E5DED5] bg-white p-6 ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#6F6A63]">{eyebrow}</p>
      ) : null}
      {title ? <h2 className="mt-4 text-2xl font-semibold tracking-normal text-[#111111]">{title}</h2> : null}
      {children}
    </section>
  );
}

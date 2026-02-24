import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex gap-3 mb-9">
      <Link
        href="/author/paper_registration"
        className="flex items-center gap-2 rounded px-[22px] py-2.5 font-serif text-[13px] tracking-[0.5px] transition-all duration-300 border bg-[linear-gradient(135deg,rgba(180,160,120,0.2),rgba(160,140,100,0.1))] border-[rgba(180,160,120,0.4)] text-[#d4c8a8]"
      >
        <span className="text-base">+</span> Register New Paper
      </Link>
      <Link
        href="/author/contract_builder"
        className="flex items-center gap-2 rounded px-[22px] py-2.5 font-serif text-[13px] tracking-[0.5px] transition-all duration-300 border border-[rgba(120,110,95,0.25)] text-[#9a9080] bg-transparent"
      >
        <span className="text-base">{"\u27E1"}</span> Create Authorship Contract
      </Link>
    </div>
  );
}

const FOOTER_STYLE = {
  fontFamily: "var(--font-tinos), 'Times New Roman', serif",
  color: 'rgba(242, 242, 242, 0.45)',
  fontSize: '0.8125rem',
} as const;

export function LandingFooter() {
  return (
    <footer
      className="relative flex flex-col gap-1.5 py-16 text-center"
      style={FOOTER_STYLE}
    >
      <span>&copy;2026 Axiom</span>
      <span>Built on Hedera</span>
      <span>All on-chain records publicly verifiable.</span>
    </footer>
  );
}

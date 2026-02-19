import { TopBar, Footer } from "@/components/author-dashboard";
import { reviewerNavItems, mockReviewerUser } from "@/lib/mock-data/reviewer-dashboard";

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen text-[#d4ccc0] font-serif"
      style={{
        background: "#1a1816",
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, rgba(60,55,45,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(50,45,35,0.2) 0%, transparent 50%)",
      }}
    >
      <TopBar navItems={reviewerNavItems} user={mockReviewerUser} />
      {children}
      <Footer />
    </div>
  );
}

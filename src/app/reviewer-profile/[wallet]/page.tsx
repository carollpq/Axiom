import { notFound } from 'next/navigation';
import { getUserByWallet } from '@/src/features/users/queries';
import {
  getReviewerReputation,
  countCompletedReviews,
} from '@/src/features/reviewer/queries';
import { getBadgesForWallet } from '@/src/features/reviewer/lib/badge-definitions';
import { getInitials } from '@/src/shared/lib/format';
import { DashboardStatCard } from '@/src/shared/components/dashboard-stat-card';

interface Props {
  params: Promise<{ wallet: string }>;
}

export default async function ReviewerProfilePage({ params }: Props) {
  const { wallet } = await params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) notFound();

  const user = await getUserByWallet(wallet);
  if (!user) notFound();

  const [reputation, completedCount, badges] = await Promise.all([
    getReviewerReputation(wallet),
    countCompletedReviews(wallet),
    getBadgesForWallet(wallet),
  ]);

  const score = reputation?.overallScore ?? 0;
  const initials = getInitials(user.displayName ?? '??');

  return (
    <div
      className="min-h-screen font-serif"
      style={{ background: '#1a1816', color: '#d4ccc0' }}
    >
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-xl"
            style={{
              background: 'rgba(201,164,74,0.15)',
              border: '2px solid rgba(201,164,74,0.3)',
              color: '#c9a44a',
            }}
          >
            {initials}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e0d4' }}>
            {user.displayName ?? 'Anonymous Reviewer'}
          </h1>
          {user.institution && (
            <p className="text-sm" style={{ color: '#8a8070' }}>
              {user.institution}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <DashboardStatCard
            label="Reputation Score"
            value={Math.round(score * 10) / 10}
          />
          <DashboardStatCard label="Completed Reviews" value={completedCount} />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#e8e0d4' }}>
              Badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(201,164,74,0.12)',
                    border: '1px solid rgba(201,164,74,0.3)',
                    color: '#c9a44a',
                  }}
                >
                  {b.achievementName}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs" style={{ color: '#4a4238' }}>
          Axiom — Blockchain-backed peer review
        </p>
      </div>
    </div>
  );
}

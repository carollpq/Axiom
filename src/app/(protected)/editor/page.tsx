import { getSession } from "@/src/shared/lib/auth/auth";
import { getUserByWallet } from "@/src/features/users/queries";
import { getJournalByEditorWallet, listJournalSubmissions } from "@/src/features/editor/queries";
import { mapDbToEditorProfile } from "@/src/features/editor/mappers/journal";
import { getInitials } from "@/src/shared/lib/format";
import { DashboardHeader } from "@/src/shared/components";
import { StatsSection } from "@/src/features/editor/components/dashboard/stats.section";
import { CarouselSection } from "@/src/features/editor/components/dashboard/carousel.section";
import type { EditorProfile } from "@/src/features/editor/types";
import type { DbJournalSubmission } from "@/src/features/editor/queries";

export default async function JournalDashboard() {
  const sessionWallet = await getSession();

  let editorProfile: EditorProfile | null = null;
  let subs: DbJournalSubmission[] = [];

  if (sessionWallet) {
    const [user, journal] = await Promise.all([
      getUserByWallet(sessionWallet),
      getJournalByEditorWallet(sessionWallet),
    ]);

    editorProfile = mapDbToEditorProfile(user, journal, getInitials);

    if (journal) {
      subs = await listJournalSubmissions(journal.id);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Header row with compact profile */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <DashboardHeader role="editor" />
        </div>
        {editorProfile && (
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="rounded-full flex items-center justify-center font-serif text-sm"
              style={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, rgba(120,110,95,0.3), rgba(80,72,60,0.3))",
                border: "2px solid rgba(120,110,95,0.3)",
                color: "#c9b89e",
              }}
            >
              {editorProfile.initials}
            </div>
            <div>
              <div className="font-serif text-[13px] text-[#e8e0d4]">{editorProfile.name}</div>
              <div className="text-[11px] text-[#6a6050]">{editorProfile.journalName}</div>
            </div>
          </div>
        )}
      </div>

      <StatsSection subs={subs} />
      <CarouselSection subs={subs} />
    </div>
  );
}

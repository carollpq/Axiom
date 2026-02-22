"use client";

import { useState, useMemo, useEffect } from "react";
import type { DetailTab, SortOption, ExplorerPaper } from "@/types/explorer";
import { mockPapersExplorer, FILTER_STATUSES } from "@/lib/mock-data/explorer";
import { fetchApi } from "@/lib/api";
import { toPublicDisplayStatus } from "@/lib/status-map";
import type { ApiPublicPaper } from "@/types/api";

function mapApiPaperToExplorer(p: ApiPublicPaper, index: number): ExplorerPaper {
  const latestVersion = p.versions[0] ?? null;
  const contract = p.contracts[0] ?? null;

  // Build authors from contributors; fall back to owner if no contract yet
  const authors =
    contract?.contributors.length
      ? contract.contributors.map((c) => ({
          name: c.contributorName ?? c.contributorWallet.slice(0, 8) + "…",
          pct: c.contributionPct,
          orcid: "\u2014",
          role: c.roleDescription ?? "",
        }))
      : p.owner
      ? [
          {
            name: p.owner.displayName ?? p.owner.walletAddress.slice(0, 8) + "…",
            pct: 100,
            orcid: p.owner.orcidId ?? "\u2014",
            role: "Author",
          },
        ]
      : [];

  return {
    id: index + 1,
    title: p.title,
    authors,
    status: toPublicDisplayStatus(p.status),
    journal: "\u2014",
    field: "Unknown",
    date: p.updatedAt.slice(0, 10),
    abstract: p.abstract ?? "",
    paperHash: latestVersion?.paperHash ?? "",
    datasetHash: latestVersion?.datasetHash ?? "",
    codeCommit: latestVersion?.codeCommitHash ?? "",
    envHash: latestVersion?.envSpecHash ?? "",
    contractHash: contract?.contractHash ?? "",
    txHash: latestVersion?.hederaTxId ?? "",
    regTimestamp: latestVersion?.hederaTimestamp
      ? latestVersion.hederaTimestamp.replace("T", " ").slice(0, 19) + " UTC"
      : latestVersion?.createdAt
      ? latestVersion.createdAt.replace("T", " ").slice(0, 19) + " UTC"
      : "",
    codeUrl: latestVersion?.codeRepoUrl ?? "",
    datasetUrl: "",
    visibility: p.visibility,
    versions: p.versions.map((v, i) => ({
      v: `v${v.versionNumber}`,
      date: v.createdAt.slice(0, 10),
      label: i === p.versions.length - 1 ? toPublicDisplayStatus(p.status) : "Previous",
      hash: v.paperHash.length > 12
        ? `${v.paperHash.slice(0, 6)}…${v.paperHash.slice(-4)}`
        : v.paperHash,
    })),
    reviews: [],
    decision: p.status === "published" ? "Accepted" : p.status === "retracted" ? "Retracted" : null,
    retracted: p.status === "retracted",
  };
}

export function useExplorer() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [dbPapers, setDbPapers] = useState<ExplorerPaper[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApi<ApiPublicPaper[]>("/api/papers/public")
      .then((data) => {
        if (!cancelled) setDbPapers(data.map(mapApiPaperToExplorer));
      })
      .catch(() => {
        if (!cancelled) setDbPapers(null);
      });
    return () => { cancelled = true; };
  }, []);

  const papers = dbPapers ?? mockPapersExplorer;

  const fields = useMemo(
    () => ["All", ...new Set(papers.map((p) => p.field))],
    [papers],
  );

  const filtered = useMemo(() => {
    const result = papers.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.authors.some(
          (a) => a.name.toLowerCase().includes(q) || a.orcid.includes(q),
        ) ||
        p.paperHash.includes(q);
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchField = fieldFilter === "All" || p.field === fieldFilter;
      return matchSearch && matchStatus && matchField;
    });

    result.sort((a, b) =>
      sortBy === "newest"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );

    return result;
  }, [papers, search, statusFilter, fieldFilter, sortBy]);

  const paper = papers.find((p) => p.id === selectedPaper);

  const selectPaper = (id: number) => {
    setSelectedPaper(id);
    setDetailTab("overview");
  };

  const clearSelection = () => setSelectedPaper(null);

  return {
    search, setSearch,
    statusFilter, setStatusFilter,
    fieldFilter, setFieldFilter,
    sortBy, setSortBy,
    statuses: FILTER_STATUSES,
    fields,
    filtered,
    selectedPaper,
    paper,
    detailTab, setDetailTab,
    selectPaper,
    clearSelection,
  };
}

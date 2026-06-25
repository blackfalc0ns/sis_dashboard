"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ClipboardList,
  Send,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Users,
  Award,
  AlertTriangle,
  Clock3,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import ChartCard from "@/components/ui/chart-card/ChartCard";
import GaugeChart from "@/components/ui/chart-card/GaugeChart";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import { getBehaviorOverview } from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import type {
  BehaviorOverviewFilters,
  BehaviorOverviewResponse,
  BehaviorOverviewRecentItem,
} from "@/features/behavior/types";

// ─── Loading / Error / Empty states ────────────────────────────────────────
function StatePanel({ title, loading }: { title: string; loading?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      {loading && (
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary-color)", borderTopColor: "transparent" }} />
      )}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  );
}

// ─── Status / Type badge ───────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  draft:     { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-700)", border: "var(--color-neutral-200)" },
  submitted: { bg: "#fef3c7", fg: "#78350f", border: "#fde68a" },
  approved:  { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" },
  rejected:  { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
  cancelled: { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-500)", border: "var(--color-neutral-200)" },
};

function Badge({ label, colors }: { label: string; colors: { bg: string; fg: string; border: string } }) {
  return (
    <span
      className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.fg, borderColor: colors.border }}
    >
      {label}
    </span>
  );
}

// ─── Severity bar colors ───────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

// ─── Chart Y-axis tick for horizontal bars ─────────────────────────────────
function CategoryTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-8} y={0} dy={4} textAnchor="end" fill="var(--text-secondary)" fontSize="12">
        {payload?.value ?? ""}
      </text>
    </g>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function BehaviorOverviewPage() {
  const t = useTranslations("behavior.overview");
  const tBehavior = useTranslations("behavior");
  const tStatus = useTranslations("behavior.status");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { yearId, termId } = useBehaviorYearTermContext();

  const [data, setData] = useState<BehaviorOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!yearId || !termId) return;
    const filters: BehaviorOverviewFilters = { academicYearId: yearId, termId };
    setLoading(true);
    setError(null);
    try {
      const res = await getBehaviorOverview(filters);
      setData(res);
    } catch (error) {
      setError(
        behaviorUiError(error, "Failed to load overview data", tBehavior).message,
      );
    } finally {
      setLoading(false);
    }
  }, [yearId, termId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <StatePanel title={t("title")} loading />;
  if (error) return <StatePanel title={error} />;
  if (!data) return <StatePanel title={t("noData")} />;

  const { records, severity, review, points, categories, recentActivity, topStudents } = data;

  // ─── Section 1: Records KPI Bar ──────────────────────────────────────────
  const recordCards = [
    { label: t("totalRecords"), value: records.total, icon: ClipboardList, fg: "var(--color-neutral-700)", bg: "var(--color-neutral-100)" },
    { label: t("submitted"),    value: records.submitted, icon: Send,          fg: "var(--color-warning-700)", bg: "var(--color-warning-100)" },
    { label: t("approved"),     value: records.approved,  icon: CheckCircle2,  fg: "var(--color-success-700)", bg: "var(--color-success-100)" },
    { label: t("rejected"),     value: records.rejected,  icon: XCircle,       fg: "var(--color-accent-700)",  bg: "var(--color-accent-100)" },
    { label: t("positive"),     value: records.positive,  icon: ThumbsUp,      fg: "#16a34a",                 bg: "#dcfce7" },
    { label: t("negative"),     value: records.negative,  icon: ThumbsDown,    fg: "#dc2626",                 bg: "#fef2f2" },
  ];

  // ─── Section 3: Severity chart data ──────────────────────────────────────
  const severityData = [
    { name: t("low"),      value: severity.low },
    { name: t("medium"),   value: severity.medium },
    { name: t("high"),     value: severity.high },
    { name: t("critical"), value: severity.critical },
  ];

  // ─── Section 4: Top categories chart data ────────────────────────────────
  const topCatData = categories.topCategories.map((cat) => ({
    name: isRTL ? cat.nameAr : (cat.code + " – " + cat.nameEn),
    records: cat.totalRecords,
    points: cat.totalPoints,
    type: cat.type,
  }));

  // ─── Section 5: Top students chart data ──────────────────────────────────
  const topStudentData = topStudents.map((s) => ({
    name: isRTL ? (s.student.nameAr || s.student.displayName) : s.student.displayName,
    totalPoints: s.totalPoints,
    positivePoints: s.positivePoints,
    negativePoints: s.negativePoints,
  }));

  const approvalPct = Math.round(review.approvalRate * 100);

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* ── Row 1: Records KPI bar ──────────────────────────────────────── */}
      <div
        className="rounded-2xl border shadow-sm p-4"
        style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}
      >
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{t("recordsSummary")}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recordCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                  <Icon className="w-5 h-5" style={{ color: card.fg }} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</div>
                  <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 2: Points Summary ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICardV2
          title={t("totalPoints")}
          value={points.totalPoints}
          icon={Star}
          iconColor="#7c3aed"
          iconBgColor="#ede9fe"
          showChart={false}
          className="h-full"
        />
        <KPICardV2
          title={t("positivePoints")}
          value={points.positivePoints}
          valuePrefix="+"
          icon={TrendingUp}
          iconColor="#16a34a"
          iconBgColor="#dcfce7"
          showChart={false}
          className="h-full"
        />
        <KPICardV2
          title={t("negativePoints")}
          value={points.negativePoints}
          icon={AlertTriangle}
          iconColor="#dc2626"
          iconBgColor="#fef2f2"
          showChart={false}
          className="h-full"
        />
        <KPICardV2
          title={t("avgPerStudent")}
          value={points.averagePointsPerStudent}
          icon={Users}
          iconColor="#0284c7"
          iconBgColor="#e0f2fe"
          showChart={false}
          className="h-full"
        />
      </div>

      {/* ── Row 3: Review Status + Severity ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Review Status */}
        <div
          className="rounded-2xl border shadow-sm p-6"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("reviewStatus")}</div>
          <div className="flex flex-col items-center gap-4">
            <GaugeChart
              value={approvalPct}
              presentLabel={t("approved")}
              absentLabel={t("rejected")}
              presentColor="#16a34a"
              absentColor="#ef4444"
              size={180}
              thickness={32}
            />
            <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fef3c7" }}>
                  <Clock3 className="w-4 h-4" style={{ color: "#d97706" }} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{review.pendingReview}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{t("pendingReview")}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#dcfce7" }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#16a34a" }} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{review.reviewed}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{t("reviewed")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <ChartCard title={t("severityBreakdown")} showPeriodFilter={false}>
          <div className="h-64">
            {severityData.every((d) => d.value === 0) ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={70} tick={<CategoryTick />} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px" }}
                    formatter={(value) => [`${value}`, t("records")]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name.toLowerCase()] ?? SEVERITY_COLORS.low} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 4: Top Categories ───────────────────────────────────────── */}
      <ChartCard title={t("topCategories")} showPeriodFilter={false}>
        <div className="h-72">
          {topCatData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCatData} layout="vertical" margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={<CategoryTick />} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px" }}
                  formatter={(value, name) => [`${value}`, name === "records" ? t("records") : t("points")]}
                />
                <Bar dataKey="records" radius={[0, 6, 6, 0]}>
                  {topCatData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === "positive" ? "#16a34a" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {/* ── Row 5: Top Students + Recent Activity ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Students */}
        <ChartCard title={t("topStudents")} showPeriodFilter={false}>
          <div className="h-72">
            {topStudentData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudentData} layout="vertical" margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={<CategoryTick />} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px" }}
                    formatter={(value, name) => {
                      const label = name === "positivePoints" ? t("positivePoints") : name === "negativePoints" ? t("negativePoints") : t("totalPoints");
                      return [`${value}`, label];
                    }}
                  />
                  <Bar dataKey="positivePoints" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="negativePoints" stackId="a" fill="#ef4444" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* Recent Activity */}
        <div
          className="rounded-2xl border shadow-sm p-6"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("recentActivity")}</div>
          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {recentActivity.map((item) => (
                <RecentActivityRow key={item.id} item={item} locale={locale} tStatus={tStatus} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Recent activity row component ─────────────────────────────────────────
function RecentActivityRow({
  item,
  locale,
  tStatus,
  t,
}: {
  item: BehaviorOverviewRecentItem;
  locale: string;
  tStatus: (key: string) => string;
  t: (key: string) => string;
}) {
  const isRTL = locale === "ar";
  const statusColors = STATUS_COLORS[item.status] ?? STATUS_COLORS.draft;
  const typeColors = item.type === "positive"
    ? { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" }
    : { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(isRTL ? "ar-SA" : "en-US", { month: "short", day: "numeric" }) : null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-[var(--color-neutral-50)]"
      style={{ borderColor: "var(--border-color)" }}
    >
      {/* Points indicator */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          backgroundColor: item.type === "positive" ? "#dcfce7" : "#fef2f2",
          color: item.type === "positive" ? "#14532d" : "#991b1b",
        }}
      >
        {item.points > 0 ? `+${item.points}` : item.points}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={tStatus(item.status)} colors={statusColors} />
          <Badge label={t(item.type)} colors={typeColors} />
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {item.severity}
          </span>
        </div>
        <div className="text-xs mt-1 truncate" style={{ color: "var(--text-secondary)" }}>
          {fmt(item.occurredAt)} {item.submittedAt && `· ${isRTL ? "قُدم" : "submitted"} ${fmt(item.submittedAt)}`}
        </div>
      </div>

      {/* Status dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: statusColors.fg }}
      />
    </div>
  );
}

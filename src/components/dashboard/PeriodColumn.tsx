import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart3,
  Calendar,
  Edit2,
  Plus,
  RefreshCw,
  Settings,
} from "lucide-react";
import { PeriodConfig, Location, CompactCost, type PeriodQuery } from "@/shared/types";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { ChartSelectorModal } from '../ui/chart-selector-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeriodColumnProps {
  period: PeriodConfig;
  query: PeriodQuery;
  locations: Location[];
  onUpdatePeriod: (periodId: string, updates: Partial<PeriodConfig>) => void;
  onRetry?: () => void;
  onRefresh?: () => void;
  isCompact?: boolean;
  periodCosts?: CompactCost[];
}

interface PeriodColumnPropsExtended extends PeriodColumnProps {
  onAddPeriod?: (period: Omit<PeriodConfig, 'id'>) => void;
  onRefresh?: () => void;
  isFirstPeriod?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Color palette — assigned to referralType keys in sorted order
const REFERRAL_PALETTE = [
  '#1C2B6B', '#2E7D99', '#3BAD8E', '#E6A817', '#D95B3A', '#7B4FD4', '#C2496D', '#4A7FB5',
]

function getReferralColor(type: string, allTypes: string[]): string {
  const sorted = [...allTypes].sort()
  const idx = sorted.indexOf(type)
  return REFERRAL_PALETTE[idx % REFERRAL_PALETTE.length]
}

const fmt$ = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}k`
    : `$${Math.round(n).toLocaleString()}`

const fmtExact$ = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtPct = (n: number) => `${n.toFixed(1)}%`

// ─── Sub-components ──────────────────────────────────────────────────────────

function Tip({ label, tooltip, className = "" }: { label: string; tooltip: string; className?: string }) {
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`text-left underline decoration-dotted underline-offset-4 decoration-[#1d1d52]/35 ${className}`}>
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-center">{tooltip}</TooltipContent>
    </UITooltip>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1C1F4F]/35 mb-3">
      {children}
    </p>
  );
}

function formatPatientCreatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function MissingReferralNote({
  patients,
  message,
}: {
  patients: NonNullable<PeriodQuery['data']>['unmappedReferralPatients']
  message: string
}) {
  if (patients.length === 0) return null
  const visiblePatients = patients.slice(0, 6)
  const remaining = patients.length - visiblePatients.length

  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <button type="button" className="w-full rounded-md bg-amber-50 px-2 py-1 text-left text-[11px] text-amber-700 underline decoration-dotted underline-offset-4 decoration-amber-500/50">
          {message}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 text-left">
        <div className="space-y-2">
          <p className="font-medium">Patients missing from PATIENT_REFERRALS</p>
          <div className="space-y-1">
            {visiblePatients.map((patient) => (
              <div key={patient.id} className="border-t border-white/15 pt-1 first:border-t-0 first:pt-0">
                <p className="font-medium">{patient.name}</p>
                <p className="text-[11px] opacity-90">ID: {patient.id}</p>
                <p className="text-[11px] opacity-90">{patient.location} · Created {formatPatientCreatedAt(patient.createdAt)}</p>
              </div>
            ))}
          </div>
          {remaining > 0 && <p className="text-[11px] opacity-90">+{remaining} more not shown</p>}
        </div>
      </TooltipContent>
    </UITooltip>
  )
}

function MetricPill({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: number | string;
  tooltip?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-[#1C1F4F]/8 bg-white px-2.5 py-3 text-center flex flex-col items-center justify-center gap-0.5 hover:border-[#1C1F4F]/20 hover:shadow-sm transition-all duration-150">
      <div className="text-2xl font-bold tabular-nums text-[#1C1F4F] leading-none">
        {value}
      </div>
      <div className="text-[10px] font-medium text-[#1C1F4F]/40 leading-tight mt-0.5">{label}</div>
    </div>
  );

  if (!tooltip) return inner;
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default">{inner}</div>
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-center">{tooltip}</TooltipContent>
    </UITooltip>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PeriodColumn({
  period,
  query,
  onUpdatePeriod,
  onRetry,
  onRefresh,
  onAddPeriod,
  isFirstPeriod = false,
  isCompact = false,
  periodCosts = [],
}: PeriodColumnPropsExtended) {
  const data = query?.data;
  const isLoading = query?.isLoading;
  const error = query?.error;
  const STORAGE_KEY = `orthodash-charts-${period.id}`;
  const [selectedCharts, setSelectedCharts] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [isChartSelectorOpen, setIsChartSelectorOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCharts));
    } catch {
      // localStorage unavailable — non-fatal
    }
  }, [STORAGE_KEY, selectedCharts]);

  const showLoadingIndicator = isLoading;

  // Empty state
  if (!period.startDate || !period.endDate) {
    return (
      <Card className="w-full min-w-[350px] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{period.title}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => {
              const newTitle = prompt('Enter new period name:', period.title);
              if (newTitle?.trim()) onUpdatePeriod(period.id, { title: newTitle.trim() });
            }}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-4">Set dates and locations to load data for this period.</p>
            {isFirstPeriod && onAddPeriod && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="inline-flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <Plus className="h-3 w-3" />
                  <span>Use the + button above to add comparison periods</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Computed financials
  const netProductionFromGF = data?.totals.netProduction ?? 0;
  const totalCosts = data?.totals.acquisitionCosts ?? periodCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const netAfterCosts = data?.totals.netAfterCosts ?? netProductionFromGF - totalCosts;

  // NPL / NPE funnel
  const npl = data?.totals.npl ?? 0;
  const npe = data?.totals.npe ?? 0;
  const npeKept = data?.totals.npeKept ?? 0;

  // Referrals
  const referralEntries = data?.referralSources ?? [];
  const totalReferrals = referralEntries.reduce((s, entry) => s + entry.npl, 0);
  const allReferralTypes = referralEntries.map((entry) => entry.referralType);
  const unmappedPatients = data?.unmappedReferralPatients ?? [];
  const unmappedCount = unmappedPatients.length;

  const referralChartData = referralEntries.map((e) => ({
    name: e.referralType,
    value: e.npl,
    color: getReferralColor(e.referralType, allReferralTypes),
  }));

  // ─── Chart renderer ───────────────────────────────────────────────────────
  const renderChart = (chartId: string) => {
    const chartHeight = isCompact ? 140 : 200;
    // Vertical bar charts need ~50px per row to avoid label squishing
    const barChartHeight = (n: number) => Math.max(chartHeight, n * 52 + 20);

    switch (chartId) {
      case 'referral-sources': {
        const hasData = referralChartData.some((d) => d.value > 0);
        const displayData = hasData ? referralChartData : [{ name: 'No Data', value: 1, color: '#e5e7eb' }];
        return (
          <div key={chartId} className="bg-white p-3 rounded-lg border border-[#1C1F4F]/10">
            <h4 className="text-xs font-semibold text-[#1C1F4F]/50 uppercase tracking-wide mb-3">Referral Sources</h4>
            {unmappedCount > 0 && (
              <div className="mb-2">
                <MissingReferralNote
                  patients={unmappedPatients}
                  message={`${unmappedCount} NPL${unmappedCount !== 1 ? 's' : ''} missing referral source.`}
                />
              </div>
            )}
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie data={displayData} cx="50%" cy="50%" outerRadius={isCompact ? 55 : 75} innerRadius={isCompact ? 25 : 35} dataKey="value" paddingAngle={2}>
                  {displayData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} (${totalReferrals > 0 ? ((Number(v) / totalReferrals) * 100).toFixed(1) : 0}%)`, n]} />
              </PieChart>
            </ResponsiveContainer>
            {!hasData && <p className="text-center text-xs text-[#1C1F4F]/40 mt-1">No referral data</p>}
          </div>
        );
      }

      case 'conversion-rates': {
        const convData = referralEntries
          .filter((entry) => entry.npl > 0)
          .map((entry) => ({
            source: entry.referralType,
            rate: entry.conversionRate,
            kept: entry.npeKept,
            total: entry.npl,
            fill: getReferralColor(entry.referralType, allReferralTypes),
          }));
        const hasData = convData.some((d) => d.rate > 0);
        return (
          <div key={chartId} className="bg-white p-3 rounded-lg border border-[#1C1F4F]/10">
            <h4 className="text-xs font-semibold text-[#1C1F4F]/50 uppercase tracking-wide mb-3">Conversion Rates by Source</h4>
            {unmappedCount > 0 && (
              <div className="mb-2">
                <MissingReferralNote
                  patients={unmappedPatients}
                  message={`${unmappedCount} NPL${unmappedCount !== 1 ? 's' : ''} excluded because referral source is missing.`}
                />
              </div>
            )}
            {hasData ? (
              <ResponsiveContainer width="100%" height={barChartHeight(convData.length)}>
                <BarChart data={convData} layout="vertical" margin={{ top: 2, right: 8, left: 4, bottom: 2 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v, _name, item) => {
                    const payload = item.payload as { kept?: number; total?: number }
                    return [`${payload.kept ?? 0}/${payload.total ?? 0} (${Number(v).toFixed(1)}%)`, 'NPE Kept']
                  }} />
                  <Bar dataKey="rate" radius={[0, 3, 3, 0]}>
                    {convData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-xs text-[#1C1F4F]/40 py-8">No conversion data</p>
            )}
          </div>
        );
      }

      case 'financial-summary': {
        const finData = [
          { metric: 'Net Production', value: netProductionFromGF },
          { metric: 'Acq. Costs', value: totalCosts },
        ];
        const hasData = finData.some((d) => d.value > 0);
        return (
          <div key={chartId} className="bg-white p-3 rounded-lg border border-[#1C1F4F]/10">
            <h4 className="text-xs font-semibold text-[#1C1F4F]/50 uppercase tracking-wide mb-3">Financial Summary</h4>
            {hasData ? (
              <ResponsiveContainer width="100%" height={barChartHeight(finData.length)}>
                <BarChart data={finData} layout="vertical" margin={{ top: 2, right: 8, left: 4, bottom: 2 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt$(v)} />
                  <YAxis type="category" dataKey="metric" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v) => [fmt$(Number(v)), '']} />
                  <Bar dataKey="value" fill={REFERRAL_PALETTE[0]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-xs text-[#1C1F4F]/40 py-8">No financial data</p>
            )}
          </div>
        );
      }

      case 'patient-metrics': {
        const patData = [
          { metric: 'NPL', value: npl },
          { metric: 'NPE Scheduled', value: npe },
          { metric: 'NPE Kept', value: npeKept },
        ];
        const hasData = patData.some((d) => d.value > 0);
        return (
          <div key={chartId} className="bg-white p-3 rounded-lg border border-[#1C1F4F]/10">
            <h4 className="text-xs font-semibold text-[#1C1F4F]/50 uppercase tracking-wide mb-3">Patient Funnel</h4>
            {hasData ? (
              <ResponsiveContainer width="100%" height={barChartHeight(patData.length)}>
                <BarChart data={patData} layout="vertical" margin={{ top: 2, right: 8, left: 4, bottom: 2 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="metric" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill={REFERRAL_PALETTE[2]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-xs text-[#1C1F4F]/40 py-8">No patient data</p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const renderChartsSection = () => (
    <div className="space-y-3">
      <ChartSelectorModal
        selectedCharts={selectedCharts}
        onChartsChange={setSelectedCharts}
        open={isChartSelectorOpen}
        onOpenChange={setIsChartSelectorOpen}
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1C1F4F]/40">Charts</p>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px] gap-1 border-[#1C1F4F]/15 text-[#1C1F4F]/60 hover:text-[#1C1F4F]"
          onClick={() => setIsChartSelectorOpen(true)}
        >
          <Settings className="h-3 w-3" />
          {selectedCharts.length > 0 ? `${selectedCharts.length} selected` : 'Add Charts'}
        </Button>
      </div>

      {selectedCharts.length > 0 ? (
        <div className="space-y-3">
          {selectedCharts.map((id) => renderChart(id))}
        </div>
      ) : (
        <button
          onClick={() => setIsChartSelectorOpen(true)}
          className="w-full py-6 rounded-lg border border-dashed border-[#1C1F4F]/15 flex flex-col items-center gap-2 text-[#1C1F4F]/30 hover:border-[#1C1F4F]/30 hover:text-[#1C1F4F]/50 transition-colors"
        >
          <BarChart3 className="h-8 w-8" />
          <span className="text-xs">Click to add charts</span>
        </button>
      )}
    </div>
  );

  // ─── Compact layout ──────────────────────────────────────────────────────

  if (isCompact) {
    return (
      <div className="space-y-4 relative pb-4">
        {showLoadingIndicator && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1C1F4F] mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center justify-between gap-2">
            <p className="text-xs text-red-700">Data error</p>
            {onRetry && (
              <button onClick={onRetry} className="text-xs text-red-600 underline flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Funnel - compact */}
        <div className="grid grid-cols-3 gap-2">
          <MetricPill label="NPL" value={npl} tooltip="New Patient Leads created in this period" />
          <MetricPill label="NPE" value={npe} tooltip="NPLs that scheduled an appointment" />
          <MetricPill label="NPE Kept" value={npeKept} tooltip="NPLs that kept their appointment" />
        </div>

        {/* Financial - compact */}
        <div className="rounded-xl border border-[#1C1F4F]/8 bg-white overflow-hidden">
          <div className="divide-y divide-[#1C1F4F]/5">
            <div className="flex justify-between items-center px-3 py-2.5">
              <span className="text-xs text-[#1C1F4F]/50">Net Production</span>
              <span className="text-sm font-semibold tabular-nums text-[#1C1F4F]">{fmtExact$(netProductionFromGF)}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2.5">
              <span className="text-xs text-[#1C1F4F]/50">Acq. Costs</span>
              <span className="text-sm font-medium tabular-nums text-[#1C1F4F]/60">−{fmtExact$(totalCosts)}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2.5 bg-[#1C1F4F]/[0.025]">
              <span className="text-xs font-semibold text-[#1C1F4F]">Net After Costs</span>
              <span className="text-sm font-bold tabular-nums text-[#1C1F4F]">{fmtExact$(netAfterCosts)}</span>
            </div>
          </div>
        </div>

        {/* Charts - compact */}
        {renderChartsSection()}
      </div>
    );
  }

  // ─── Full layout ─────────────────────────────────────────────────────────

  return (
    <Card className="h-full border-[#1C1F4F]/10">
      <CardHeader className="pb-4 border-b border-[#1C1F4F]/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#1C1F4F]">{period.title}</CardTitle>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-[#1C1F4F]/40 hover:text-[#1C1F4F]"
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bypass cache &amp; refresh from Greyfinch</TooltipContent>
              </UITooltip>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[#1C1F4F]/40 hover:text-[#1C1F4F]"
              onClick={() => {
                const newTitle = prompt('Enter new period name:', period.title);
                if (newTitle?.trim()) onUpdatePeriod(period.id, { title: newTitle.trim() });
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5 pb-6 relative">
        {/* Loading overlay */}
        {showLoadingIndicator && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-b-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C1F4F] mx-auto mb-3" />
              <p className="text-sm text-[#1C1F4F]/60">Fetching Greyfinch reports…</p>
              <p className="text-xs text-[#1C1F4F]/40 mt-1">This can take 30–90 seconds</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-red-700">Failed to load data</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-100 transition-colors flex-shrink-0"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            )}
          </div>
        )}

        {/* ── Section 1: NPL / NPE Funnel ─────────────────────────────── */}
        <div>
          <SectionLabel>Patient Funnel</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <MetricPill
              label="NPL"
              value={npl}
              tooltip="New Patient Leads created in this period (pulled by Created On date)."
            />
            <MetricPill
              label="NPE Scheduled"
              value={npe}
              tooltip="NPLs that scheduled an appointment."
            />
            <MetricPill
              label="NPE Kept"
              value={npeKept}
              tooltip="NPLs that kept their appointment."
            />
          </div>
        </div>

        <Separator className="bg-[#1C1F4F]/5" />

        {/* ── Section 2: Referral Sources ─────────────────────────────── */}
        <div>
          <SectionLabel>Referral Sources</SectionLabel>

          {totalReferrals === 0 ? (
            <p className="text-sm text-[#1C1F4F]/40 py-2">No referral data for this period.</p>
          ) : (
            <div className="space-y-0.5">
              {referralEntries.map((e) => {
                const pct = totalReferrals > 0 ? (e.npl / totalReferrals) * 100 : 0
                return (
                  <div key={e.referralType} className="flex items-center gap-2.5 py-2 px-1 rounded-lg">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getReferralColor(e.referralType, allReferralTypes) }} />
                    <span className="flex-1 text-[13px] text-[#1C1F4F]/80">{e.referralType}</span>
                    <span className="text-[13px] font-semibold tabular-nums text-[#1C1F4F]">{e.npl}</span>
                    <span className="text-[11px] text-[#1C1F4F]/40 tabular-nums w-11 text-right">{fmtPct(pct)}</span>
                  </div>
                )
              })}
              {unmappedCount > 0 && (
                <MissingReferralNote
                  patients={unmappedPatients}
                  message={`${unmappedCount} NPL${unmappedCount !== 1 ? 's' : ''} missing referral source.`}
                />
              )}
              <div className="flex items-center gap-2.5 px-1 pt-2 mt-1 border-t border-[#1C1F4F]/6">
                <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-[#1C1F4F]/35">Total</span>
                <span className="text-sm font-bold text-[#1C1F4F]">{totalReferrals}</span>
                <span className="w-11" />
              </div>
            </div>
          )}

          {/* Referral pie chart */}
          {referralChartData.length > 0 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={referralChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={30}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {referralChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} (${totalReferrals > 0 ? ((Number(value) / totalReferrals) * 100).toFixed(1) : 0}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <Separator className="bg-[#1C1F4F]/5" />

        {/* ── Section 3: Financial Summary ────────────────────────────── */}
        <div>
          <SectionLabel>Financial</SectionLabel>
          <div className="rounded-xl border border-[#1C1F4F]/8 bg-white overflow-hidden">
            <div className="divide-y divide-[#1C1F4F]/5">
              <div className="flex justify-between items-center px-3 py-2.5">
                <Tip label="Net Production" tooltip="Net production sourced from PRACTICE_MONITOR." className="text-xs text-[#1C1F4F]/50" />
                <span className="text-sm font-semibold tabular-nums text-[#1C1F4F]">{fmtExact$(netProductionFromGF)}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2.5">
                <Tip label="Acquisition Costs" tooltip="Manually entered costs attached to this period." className="text-xs text-[#1C1F4F]/50" />
                <span className="text-sm font-medium tabular-nums text-[#1C1F4F]/60">−{fmtExact$(totalCosts)}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2.5 bg-[#1C1F4F]/[0.025]">
                <Tip label="Net After Costs" tooltip="Net production minus manually entered acquisition costs." className="text-xs font-semibold text-[#1C1F4F]" />
                <span className="text-sm font-bold tabular-nums text-[#1C1F4F]">{fmtExact$(netAfterCosts)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Charts ─────────────────────────────────────── */}
        <Separator className="bg-[#1C1F4F]/5" />
        {renderChartsSection()}
      </CardContent>
    </Card>
  );
}

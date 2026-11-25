// Administrative monitoring dashboard presenting participant sampling balance, quality metrics, and CSV export
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lock,
  RefreshCw,
  Download,
  AlertTriangle,
  Clock,
  Users,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { getAdminStats, downloadAdminCsv, ApiError } from "@/lib/apiClient";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Field from "@/components/ui/Field";

const STORAGE_KEY = "banglatrust:admin_secret";

function getStoredSecret() {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storeSecret(val) {
  if (typeof window === "undefined") return;
  try {
    if (val) {
      window.sessionStorage.setItem(STORAGE_KEY, val);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "–";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AdminDashboard() {
  const [secret, setSecret] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // CSV Export state
  const [completedOnly, setCompletedOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const fetchStats = useCallback(async (token, isSilent = false) => {
    if (!token) return;
    if (isSilent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const data = await getAdminStats(token);
      setStats(data);
      setSecret(token);
      storeSecret(token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Wrong password");
        storeSecret("");
        setSecret("");
        setStats(null);
      } else {
        setError(err.message || "Failed to load admin statistics");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Try silent login on mount if token is in sessionStorage
  useEffect(() => {
    const saved = getStoredSecret();
    if (saved) {
      fetchStats(saved, false);
    }
  }, [fetchStats]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !secret) return;
    const interval = setInterval(() => {
      fetchStats(secret, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, secret, fetchStats]);

  function handleUnlock(e) {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    fetchStats(passwordInput.trim());
    setPasswordInput("");
  }

  function handleLock() {
    storeSecret("");
    setSecret("");
    setStats(null);
    setPasswordInput("");
    setError("");
    setAutoRefresh(false);
  }

  async function handleExportCsv() {
    setIsExporting(true);
    setExportError("");
    try {
      await downloadAdminCsv(secret, { completedOnly });
    } catch (err) {
      setExportError(err.message || "Failed to download CSV export.");
    } finally {
      setIsExporting(false);
    }
  }

  // 1. Locked State Screen
  if (!secret || !stats) {
    return (
      <div className="max-w-sm mx-auto mt-16 px-4">
        <Card className="text-center">
          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
            Admin access
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Enter the secret key to access study metrics and data export.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <Field label="Password" htmlFor="admin-password">
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </Field>

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || !passwordInput.trim()}
              isLoading={isLoading}
              className="w-full min-h-[44px]"
            >
              Unlock
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // 2. Unlocked Dashboard Screen
  return (
    <div className="max-w-6xl mx-auto space-y-6 w-full overflow-x-hidden">
      {/* Header Row */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin — BanglaTrust-CoT
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time sampling balance, participant metrics, and dataset export
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchStats(secret, true)}
            disabled={isRefreshing}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer text-slate-700 inline-flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Refresh statistics"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Auto-refresh Toggle */}
          <label className="min-h-[44px] flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none px-1">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Auto-refresh 30s</span>
          </label>

          {/* Completed Only Filter Checkbox */}
          <label className="min-h-[44px] flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none px-1">
            <input
              type="checkbox"
              checked={completedOnly}
              onChange={(e) => setCompletedOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Completed only</span>
          </label>

          {/* Export Full CSV Button */}
          <Button
            onClick={handleExportCsv}
            isLoading={isExporting}
            className="px-4 py-2 text-sm min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Export Full CSV</span>
          </Button>

          {/* Lock Button */}
          <button
            type="button"
            onClick={handleLock}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer text-slate-700 inline-flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Lock admin session"
          >
            <Lock className="w-4 h-4" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Export Error Alert */}
      {exportError && (
        <Alert variant="error">
          {exportError}
        </Alert>
      )}

      {/* 3. Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Participants</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totals.participants}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">In progress</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totals.in_progress}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Completed</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totals.completed}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Avg completion time</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatDuration(stats.avg_completion_seconds)}
          </p>
        </Card>
      </div>

      {/* Main Grid: Routing Table (Left 2 cols) & Quality Controls (Right 1 col) */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* 4. Counterbalancing Cells Table */}
        <div className="lg:col-span-2">
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Counterbalancing cells
              </h2>
              <p className="text-xs text-slate-600">
                Participant distribution across the 8 Latin-square slot configurations
              </p>
            </div>

            <CellBalanceTable cells={stats.cells || []} />

            {/* Small Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-amber-100 border border-amber-300 inline-block" />
                <span>Lowest completed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-emerald-100 border border-emerald-300 inline-block" />
                <span>Highest completed</span>
              </span>
            </div>
          </Card>
        </div>

        {/* Quality Controls: Attention Checks & Speeders */}
        <div className="space-y-6">
          {/* 5. Attention Checks Card */}
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Attention checks
              </h2>
              <p className="text-xs text-slate-600">
                Pass criteria: Correct answer AND trust rating = 1
              </p>
            </div>
            <AttentionBars attention={stats.attention} total={stats.totals.completed} />
          </Card>

          {/* 6. Speeders Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Speeders
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                &lt; 5s median
              </span>
            </div>
            <SpeedersList speeders={stats.speeders || []} />
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helper Subcomponents ---------------- */

function CellBalanceTable({ cells }) {
  if (!cells || cells.length === 0) {
    return <p className="text-sm text-slate-600 italic">No cell data available.</p>;
  }

  const completedList = cells.map((c) => c.completed);
  const minCompleted = Math.min(...completedList);
  const maxCompleted = Math.max(...completedList);
  const hasVariance = minCompleted !== maxCompleted;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm divide-y divide-slate-100">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="py-2.5 px-3">Slot</th>
            <th className="py-2.5 px-3">Form</th>
            <th className="py-2.5 px-3">Block Order</th>
            <th className="py-2.5 px-3 text-right">In Progress</th>
            <th className="py-2.5 px-3 text-right">Completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cells.map((cell) => {
            const isLowest = hasVariance && cell.completed === minCompleted;
            const isHighest = hasVariance && cell.completed === maxCompleted;

            let rowBg = "hover:bg-slate-50 transition-colors";
            if (isLowest) rowBg = "bg-amber-50 hover:bg-amber-100/60";
            if (isHighest) rowBg = "bg-emerald-50 hover:bg-emerald-100/60";

            return (
              <tr key={cell.slot} className={rowBg}>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  Slot {cell.slot}
                </td>
                <td className="py-2.5 px-3 font-mono text-slate-600">
                  {cell.form_id}
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {cell.block_order === "BN_FIRST" ? "Bangla → English" : "English → Bangla"}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                  {cell.in_progress}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {cell.completed}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AttentionBars({ attention, total }) {
  const counts = {
    0: attention?.[0] || 0,
    1: attention?.[1] || 0,
    2: attention?.[2] || 0,
  };

  const denominator = total || (counts[0] + counts[1] + counts[2]);

  const items = [
    { label: "2 / 2 Passed", count: counts[2], color: "bg-emerald-500" },
    { label: "1 / 2 Passed", count: counts[1], color: "bg-amber-500" },
    { label: "0 / 2 Passed", count: counts[0], color: "bg-red-500" },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = denominator > 0 ? ((item.count / denominator) * 100).toFixed(1) : "0.0";
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>{item.label}</span>
              <span className="font-semibold text-slate-900">
                {item.count} ({pct}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-300 motion-reduce:transition-none`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpeedersList({ speeders }) {
  if (!speeders || speeders.length === 0) {
    return <p className="text-sm text-slate-500 italic">No speeders</p>;
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {speeders.map((s) => {
        const shortId = (s.participant_uuid || "").slice(0, 8);
        const medianSec = (s.median_rt_ms / 1000).toFixed(1);
        return (
          <div
            key={s.participant_uuid}
            className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 font-medium flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-mono font-bold">{shortId}…</span>
              <span className="text-[10px] uppercase font-semibold text-amber-700">
                ({s.status})
              </span>
            </div>
            <span className="font-semibold">{medianSec}s median</span>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const STORAGE_KEY = "household-ledger-v2";

const uid = () => Math.random().toString(36).slice(2, 9);

const fmt = (n) =>
  (isNaN(n) ? 0 : n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const monthLabel = (iso) => {
  const d = new Date(iso + "-01T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const DEFAULT_STATE = {
  partnerA: { label: "Partner 1", income: 4200 },
  partnerB: { label: "Partner 2", income: 3100 },
  emergencyFund: { target: 15000, current: 4200, monthly: 400 },
  investing: { target: 50000, current: 9800, monthly: 300 },
  debts: [
    { id: uid(), name: "Credit card", balance: 6200, rate: 22, payment: 350 },
    { id: uid(), name: "Car loan", balance: 9800, rate: 7, payment: 280 },
  ],
  upcomingCosts: [{ id: uid(), name: "Car registration", amount: 600, monthsAway: 3 }],
  categories: [
    { id: uid(), name: "Rent / Mortgage", allocated: 2200, spent: 2200 },
    { id: uid(), name: "Groceries", allocated: 800, spent: 640 },
    { id: uid(), name: "Utilities", allocated: 300, spent: 310 },
    { id: uid(), name: "Dining out", allocated: 250, spent: 295 },
    { id: uid(), name: "Transportation", allocated: 400, spent: 350 },
  ],
  history: [],
};

function mergeDefaults(loaded) {
  return {
    ...DEFAULT_STATE,
    ...loaded,
    partnerA: { ...DEFAULT_STATE.partnerA, ...(loaded.partnerA || {}) },
    partnerB: { ...DEFAULT_STATE.partnerB, ...(loaded.partnerB || {}) },
    emergencyFund: { ...DEFAULT_STATE.emergencyFund, ...(loaded.emergencyFund || loaded.savings || {}) },
    investing: { ...DEFAULT_STATE.investing, ...(loaded.investing || {}) },
    debts: loaded.debts || [],
    upcomingCosts: loaded.upcomingCosts || [],
    categories: loaded.categories || DEFAULT_STATE.categories,
    history: loaded.history || [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeDefaults(JSON.parse(raw)) : DEFAULT_STATE;
  } catch (e) {
    console.error("load failed", e);
    return DEFAULT_STATE;
  }
}

function useDebouncedSave(state) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("save failed", e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [state]);
}

function StatusPill({ status }) {
  const map = {
    ok: { label: "On track", cls: "bg-[#e4efe9] text-[#2f6e63]", icon: CheckCircle2 },
    near: { label: "Near limit", cls: "bg-[#faf1de] text-[#a5731f]", icon: AlertTriangle },
    over: { label: "Over budget", cls: "bg-[#f6e5e1] text-[#a5402f]", icon: AlertTriangle },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${m.cls}`}>
      <Icon size={12} strokeWidth={2.5} />
      {m.label}
    </span>
  );
}

function EditableAmount({ value, onChange, prefix = "$", className = "" }) {
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {prefix && <span className="opacity-60 mr-0.5">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent outline-none w-full tabular-nums focus:border-b focus:border-current"
      />
    </span>
  );
}

function SectionHeader({ label, action }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-10">
      <div className="text-[11px] uppercase tracking-[0.18em] opacity-50">{label}</div>
      {action}
    </div>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-white border border-[#dfe4de] hover:bg-[#f4f6f2] transition-colors"
      style={{ color: "#2F6E63" }}
    >
      <Plus size={13} strokeWidth={2.5} /> {label}
    </button>
  );
}

function GoalCard({ icon: Icon, title, sub, accent, data, onChange, monthlyLabel }) {
  const pct = Math.min(100, Math.round((data.current / Math.max(1, data.target)) * 100));
  return (
    <div className="relative bg-white/80 rounded-2xl border border-[#dfe4de] p-5 flex-1 min-w-[260px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: accent + "1f" }}>
          <Icon size={16} style={{ color: accent }} strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-serif text-[17px] leading-tight" style={{ color: "#1e2a28" }}>{title}</div>
          <div className="text-[11px] uppercase tracking-wide opacity-50">{sub}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide opacity-50 mb-0.5">Saved so far</div>
          <div className="font-serif text-2xl tabular-nums" style={{ color: accent }}>
            <EditableAmount value={data.current} onChange={(v) => onChange({ ...data, current: v })} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wide opacity-50 mb-0.5">Goal</div>
          <div className="font-serif text-lg tabular-nums opacity-70">
            <EditableAmount value={data.target} onChange={(v) => onChange({ ...data, target: v })} />
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-[#eceee9] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] opacity-55">
        <span>{pct}% funded</span>
        <span className="flex items-center gap-1">
          {monthlyLabel} <EditableAmount value={data.monthly} onChange={(v) => onChange({ ...data, monthly: v })} className="w-12" /> /mo
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  useDebouncedSave(state);

  const totalIncome = state.partnerA.income + state.partnerB.income;
  const totalAllocatedCategories = state.categories.reduce((s, c) => s + c.allocated, 0);
  const totalGoalsMonthly = state.emergencyFund.monthly + state.investing.monthly;
  const totalDebt = state.debts.reduce((s, d) => s + d.balance, 0);
  const totalDebtPayments = state.debts.reduce((s, d) => s + d.payment, 0);
  const totalUpcomingReserve = state.upcomingCosts.reduce(
    (s, u) => s + u.amount / Math.max(1, u.monthsAway),
    0
  );
  const totalCommitted = totalAllocatedCategories + totalGoalsMonthly + totalDebtPayments + totalUpcomingReserve;
  const remaining = totalIncome - totalCommitted;
  const overCommitted = remaining < 0;

  const updateCategory = (id, patch) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const addCategory = () =>
    setState((s) => ({ ...s, categories: [...s.categories, { id: uid(), name: "New category", allocated: 100, spent: 0 }] }));
  const removeCategory = (id) => setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));

  const updateDebt = (id, patch) =>
    setState((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  const addDebt = () =>
    setState((s) => ({ ...s, debts: [...s.debts, { id: uid(), name: "New debt", balance: 1000, rate: 10, payment: 50 }] }));
  const removeDebt = (id) => setState((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) }));

  const updateUpcoming = (id, patch) =>
    setState((s) => ({ ...s, upcomingCosts: s.upcomingCosts.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  const addUpcoming = () =>
    setState((s) => ({
      ...s,
      upcomingCosts: [...s.upcomingCosts, { id: uid(), name: "New expense", amount: 500, monthsAway: 2 }],
    }));
  const removeUpcoming = (id) =>
    setState((s) => ({ ...s, upcomingCosts: s.upcomingCosts.filter((u) => u.id !== id) }));

  const statusFor = (c) => {
    if (c.allocated <= 0) return c.spent > 0 ? "over" : "ok";
    const ratio = c.spent / c.allocated;
    if (ratio > 1) return "over";
    if (ratio >= 0.9) return "near";
    return "ok";
  };

  const logThisMonth = () => {
    const key = currentMonthKey();
    const entry = {
      month: key,
      debt: totalDebt,
      saved: state.emergencyFund.current + state.investing.current,
    };
    setState((s) => {
      const withoutCurrent = s.history.filter((h) => h.month !== key);
      return { ...s, history: [...withoutCurrent, entry].sort((a, b) => a.month.localeCompare(b.month)) };
    });
  };

  const chartData = state.history.map((h) => ({ name: monthLabel(h.month), Debt: h.debt, Saved: h.saved }));
  const alreadyLoggedThisMonth = state.history.some((h) => h.month === currentMonthKey());

  return (
    <div className="min-h-screen w-full" style={{ background: "#EDF0EB" }}>
      <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">
        {/* Header */}
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-50 mb-2">Household Ledger</div>
          <h1 className="font-serif text-[32px] md:text-[38px] leading-tight" style={{ color: "#1e2a28" }}>
            Two incomes, one plan.
          </h1>
          <p className="text-sm opacity-60 mt-1 max-w-md">
            Enter what you each bring in, set your shared goals, then build the budget around what's left.
          </p>
        </div>

        {/* Income → Pool */}
        <div className="relative mb-6">
          <div className="grid grid-cols-2 gap-4">
            {["partnerA", "partnerB"].map((key, i) => {
              const p = state[key];
              const accent = i === 0 ? "#2F6E63" : "#B3543F";
              return (
                <div key={key} className="bg-white/80 rounded-2xl border border-[#dfe4de] p-5">
                  <input
                    value={p.label}
                    onChange={(e) => setState((s) => ({ ...s, [key]: { ...p, label: e.target.value } }))}
                    className="bg-transparent outline-none text-[11px] uppercase tracking-wide opacity-50 mb-2 w-full"
                  />
                  <div className="font-serif text-2xl tabular-nums flex items-baseline" style={{ color: accent }}>
                    <EditableAmount value={p.income} onChange={(v) => setState((s) => ({ ...s, [key]: { ...p, income: v } }))} />
                  </div>
                  <div className="text-[11px] opacity-50 mt-0.5">monthly take-home</div>
                </div>
              );
            })}
          </div>

          <svg className="w-full h-8 -mt-1" viewBox="0 0 400 32" preserveAspectRatio="none">
            <path d="M 50 0 Q 50 32 200 32" fill="none" stroke="#2F6E63" strokeWidth="1.5" opacity="0.5" />
            <path d="M 350 0 Q 350 32 200 32" fill="none" stroke="#B3543F" strokeWidth="1.5" opacity="0.5" />
          </svg>

          <div className="bg-[#1e2a28] rounded-2xl px-6 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="opacity-70" />
              <span className="text-sm opacity-80">Household pool</span>
            </div>
            <div className="font-serif text-2xl tabular-nums">{fmt(totalIncome)}</div>
          </div>
        </div>

        {/* Debt payoff */}
        <SectionHeader label="Paying off debt" action={<AddButton onClick={addDebt} label="Debt" />} />
        <div className="bg-white/80 rounded-2xl border border-[#dfe4de] divide-y divide-[#eceee9] overflow-hidden">
          {state.debts.map((d) => (
            <div key={d.id} className="p-4 group">
              <div className="flex items-center justify-between gap-3 mb-2">
                <input
                  value={d.name}
                  onChange={(e) => updateDebt(d.id, { name: e.target.value })}
                  className="bg-transparent outline-none font-medium text-[14px] flex-1"
                  style={{ color: "#1e2a28" }}
                />
                <button onClick={() => removeDebt(d.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] opacity-70">
                <div className="flex items-center gap-1">
                  balance
                  <EditableAmount value={d.balance} onChange={(v) => updateDebt(d.id, { balance: v })} className="w-20 font-medium" />
                </div>
                <div className="flex items-center gap-1">
                  rate
                  <EditableAmount value={d.rate} prefix="" onChange={(v) => updateDebt(d.id, { rate: v })} className="w-10 font-medium" />
                  <span>%</span>
                </div>
                <div className="flex items-center gap-1">
                  paying
                  <EditableAmount value={d.payment} onChange={(v) => updateDebt(d.id, { payment: v })} className="w-16 font-medium" />
                  <span>/mo</span>
                </div>
              </div>
            </div>
          ))}
          {state.debts.length === 0 && (
            <div className="p-6 text-center text-sm opacity-50">No debts logged — nice. Add one if that changes.</div>
          )}
        </div>
        {state.debts.length > 0 && (
          <div className="mt-2 flex justify-between text-[12px] opacity-55 px-1">
            <span>Total owed</span>
            <span className="font-medium">{fmt(totalDebt)}</span>
          </div>
        )}

        {/* Goals */}
        <SectionHeader label="Shared goals" />
        <div className="flex flex-wrap gap-4">
          <GoalCard
            icon={PiggyBank}
            title="Emergency fund"
            sub="Cushion for the unexpected"
            accent="#C79A3D"
            data={state.emergencyFund}
            monthlyLabel="Setting aside"
            onChange={(v) => setState((s) => ({ ...s, emergencyFund: v }))}
          />
          <GoalCard
            icon={TrendingUp}
            title="Long-term investing"
            sub="Future wealth"
            accent="#2F6E63"
            data={state.investing}
            monthlyLabel="Investing"
            onChange={(v) => setState((s) => ({ ...s, investing: v }))}
          />
        </div>

        {/* Upcoming costs */}
        <SectionHeader label="Upcoming costs" action={<AddButton onClick={addUpcoming} label="Expense" />} />
        <div className="bg-white/80 rounded-2xl border border-[#dfe4de] divide-y divide-[#eceee9] overflow-hidden">
          {state.upcomingCosts.map((u) => (
            <div key={u.id} className="p-4 group flex items-center justify-between gap-3">
              <div className="flex-1">
                <input
                  value={u.name}
                  onChange={(e) => updateUpcoming(u.id, { name: e.target.value })}
                  className="bg-transparent outline-none font-medium text-[14px] block mb-1"
                  style={{ color: "#1e2a28" }}
                />
                <div className="flex items-center gap-4 text-[13px] opacity-70">
                  <div className="flex items-center gap-1">
                    <EditableAmount value={u.amount} onChange={(v) => updateUpcoming(u.id, { amount: v })} className="w-16 font-medium" />
                  </div>
                  <div className="flex items-center gap-1">
                    in
                    <EditableAmount value={u.monthsAway} prefix="" onChange={(v) => updateUpcoming(u.id, { monthsAway: v })} className="w-8 font-medium" />
                    mo
                  </div>
                  <div className="flex items-center gap-1 opacity-55">
                    <CalendarClock size={12} /> {fmt(u.amount / Math.max(1, u.monthsAway))}/mo to reserve
                  </div>
                </div>
              </div>
              <button onClick={() => removeUpcoming(u.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {state.upcomingCosts.length === 0 && (
            <div className="p-6 text-center text-sm opacity-50">Nothing known yet — add anything you can already see coming.</div>
          )}
        </div>

        {/* Budget categories */}
        <SectionHeader label="Monthly budget by category" action={<AddButton onClick={addCategory} label="Category" />} />
        <div className="bg-white/80 rounded-2xl border border-[#dfe4de] divide-y divide-[#eceee9] overflow-hidden">
          {state.categories.map((c) => {
            const status = statusFor(c);
            const barColor = status === "over" ? "#B14A3C" : status === "near" ? "#C79A3D" : "#2F6E63";
            const pct = c.allocated > 0 ? Math.min(100, Math.round((c.spent / c.allocated) * 100)) : c.spent > 0 ? 100 : 0;
            return (
              <div key={c.id} className="p-4 group">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <input
                    value={c.name}
                    onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                    className="bg-transparent outline-none font-medium text-[14px] flex-1"
                    style={{ color: "#1e2a28" }}
                  />
                  <StatusPill status={status} />
                  <button onClick={() => removeCategory(c.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[13px]">
                  <div className="flex items-center gap-1 opacity-70">
                    spent
                    <EditableAmount value={c.spent} onChange={(v) => updateCategory(c.id, { spent: v })} className="w-16 font-medium" />
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    of
                    <EditableAmount value={c.allocated} onChange={(v) => updateCategory(c.id, { allocated: v })} className="w-16 font-medium" />
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[#eceee9] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>
            );
          })}
          {state.categories.length === 0 && (
            <div className="p-6 text-center text-sm opacity-50">No categories yet — add one to start building the budget.</div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-8">
          <div className={`rounded-2xl p-5 flex items-center justify-between ${overCommitted ? "bg-[#f6e5e1]" : "bg-[#e4efe9]"}`}>
            <div>
              <div className="text-[11px] uppercase tracking-wide opacity-60 mb-0.5">
                {overCommitted ? "Over-committed" : "Safe to spend"}
              </div>
              <div className="font-serif text-xl tabular-nums" style={{ color: overCommitted ? "#A5402F" : "#2F6E63" }}>
                {fmt(Math.abs(remaining))}
              </div>
            </div>
            <div className="text-right text-[12px] opacity-60 max-w-[240px] leading-snug">
              {overCommitted
                ? "Debt payments + goals + categories + upcoming costs add up to more than your household pool. Something needs to give."
                : "Income minus debt payments, goal contributions, category budgets, and reserves for upcoming costs."}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/70 rounded-xl py-3">
              <div className="text-[11px] opacity-50 mb-0.5">Debt payments</div>
              <div className="font-serif text-sm tabular-nums" style={{ color: "#1e2a28" }}>{fmt(totalDebtPayments)}/mo</div>
            </div>
            <div className="bg-white/70 rounded-xl py-3">
              <div className="text-[11px] opacity-50 mb-0.5">Goals</div>
              <div className="font-serif text-sm tabular-nums" style={{ color: "#1e2a28" }}>{fmt(totalGoalsMonthly)}/mo</div>
            </div>
            <div className="bg-white/70 rounded-xl py-3">
              <div className="text-[11px] opacity-50 mb-0.5">Upcoming reserve</div>
              <div className="font-serif text-sm tabular-nums" style={{ color: "#1e2a28" }}>{fmt(totalUpcomingReserve)}/mo</div>
            </div>
          </div>
        </div>

        {/* Trend */}
        <SectionHeader
          label="Progress over time"
          action={
            <button
              onClick={logThisMonth}
              disabled={alreadyLoggedThisMonth}
              className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40"
              style={{ color: "#2F6E63", borderColor: "#dfe4de", background: "white" }}
            >
              <Sparkles size={13} strokeWidth={2.5} /> {alreadyLoggedThisMonth ? "Logged this month" : "Log this month"}
            </button>
          }
        />
        <div className="bg-white/80 rounded-2xl border border-[#dfe4de] p-4">
          {chartData.length === 0 ? (
            <div className="py-10 text-center text-sm opacity-50">
              Nothing logged yet. Hit "Log this month" once a month to start tracking debt going down and savings going up.
            </div>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceee9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#1e2a28aa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#1e2a28aa" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dfe4de" }} />
                  <Line type="monotone" dataKey="Debt" stroke="#B14A3C" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Saved" stroke="#2F6E63" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] opacity-35 mt-8">Your data is stored only in this browser.</div>
      </div>
    </div>
  );
}

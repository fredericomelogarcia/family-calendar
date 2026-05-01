"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  FunnelSimple,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Receipt,
  Tag,
  Trash,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Income {
  id: string;
  source: string;
  amount: string;
  date: string;
  period: string;
}

interface Expense {
  id: string;
  categoryId: string | null;
  amount: string;
  description: string | null;
  date: string;
  period: string;
}

type Period = "one-time" | "weekly" | "monthly" | "yearly";
type LedgerFilter = "all" | "income" | "expense";
type TransactionKind = "income" | "expense";

type TransactionDraft = {
  kind: TransactionKind;
  id?: string;
  amount: string;
  description: string;
  date: string;
  period: Period;
  categoryId: string;
};

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "one-time", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const emptyDraft = (): TransactionDraft => ({
  kind: "expense",
  amount: "",
  description: "",
  date: format(new Date(), "yyyy-MM-dd"),
  period: "one-time",
  categoryId: "",
});

function parseAmount(amount: string | number | null | undefined) {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount || "0");
  return Number.isFinite(value) ? value : 0;
}

function monthlyAmount(amount: string | number | null | undefined, period = "monthly") {
  const value = parseAmount(amount);

  switch (period) {
    case "weekly":
      return value * 4.33;
    case "yearly":
      return value / 12;
    case "one-time":
    case "monthly":
    default:
      return value;
  }
}

function isInMonth(date: string, month: string) {
  return date.startsWith(month);
}

function appliesToMonth(date: string, period: string, month: string) {
  return period !== "one-time" || isInMonth(date, month);
}

function periodLabel(period: string) {
  return PERIOD_OPTIONS.find((option) => option.value === period)?.label || "Monthly";
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + offset, 1);
  return format(date, "yyyy-MM");
}

export default function ExpensesClient() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>(emptyDraft);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, incRes, expRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/income"),
        fetch("/api/expenses"),
      ]);

      if (!catRes.ok || !incRes.ok || !expRes.ok) {
        throw new Error("Failed to load budget data");
      }

      const catData = await catRes.json();
      const incData = await incRes.json();
      const expData = await expRes.json();

      setCategories(catData.categories || []);
      setIncome(incData.income || []);
      setExpenses(expData.expenses || []);
    } catch (error) {
      console.error("Error fetching budget data:", error);
      showToast("error", "Could not load budget data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const monthlyIncome = useMemo(() => {
    return income.reduce((sum, item) => {
      if (!appliesToMonth(item.date, item.period, selectedMonth)) return sum;
      return sum + monthlyAmount(item.amount, item.period);
    }, 0);
  }, [income, selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => {
      if (!appliesToMonth(item.date, item.period, selectedMonth)) return sum;
      return sum + monthlyAmount(item.amount, item.period);
    }, 0);
  }, [expenses, selectedMonth]);

  const left = monthlyIncome - monthlyExpenses;
  const incomeUsedPercent = monthlyIncome > 0 ? clampPercent((monthlyExpenses / monthlyIncome) * 100) : 0;

  const ledgerItems = useMemo(() => {
    const incomeItems = income
      .filter((item) => appliesToMonth(item.date, item.period, selectedMonth))
      .map((item) => ({
        id: item.id,
        kind: "income" as const,
        date: item.date,
        description: item.source,
        categoryName: "Income",
        categoryId: "",
        amount: parseAmount(item.amount),
        period: item.period,
        original: item,
      }));

    const expenseItems = expenses
      .filter((item) => appliesToMonth(item.date, item.period, selectedMonth))
      .map((item) => {
        const category = item.categoryId ? categoryMap.get(item.categoryId) : null;
        return {
          id: item.id,
          kind: "expense" as const,
          date: item.date,
          description: item.description || "Expense",
          categoryName: category?.name || "Uncategorised",
          categoryId: item.categoryId || "uncategorised",
          amount: parseAmount(item.amount),
          period: item.period,
          original: item,
        };
      });

    const query = search.trim().toLowerCase();

    return [...incomeItems, ...expenseItems]
      .filter((item) => ledgerFilter === "all" || item.kind === ledgerFilter)
      .filter((item) => categoryFilter === "all" || item.categoryId === categoryFilter)
      .filter((item) => {
        if (!query) return true;
        return `${item.description} ${item.categoryName} ${item.amount}`.toLowerCase().includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [categoryFilter, categoryMap, expenses, income, ledgerFilter, search, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
  };

  const openCreateTransaction = (kind: TransactionKind = "expense") => {
    setTransactionDraft({ ...emptyDraft(), kind });
    setShowTransactionForm(true);
  };

  const openEditTransaction = (item: (typeof ledgerItems)[number]) => {
    if (item.kind === "income") {
      const original = item.original as Income;
      setTransactionDraft({
        kind: "income",
        id: original.id,
        amount: original.amount,
        description: original.source,
        date: original.date,
        period: original.period as Period,
        categoryId: "",
      });
    } else {
      const original = item.original as Expense;
      setTransactionDraft({
        kind: "expense",
        id: original.id,
        amount: original.amount,
        description: original.description || "",
        date: original.date,
        period: original.period as Period,
        categoryId: original.categoryId || "",
      });
    }

    setShowTransactionForm(true);
  };

  const closeTransactionForm = () => {
    setTransactionDraft(emptyDraft());
    setShowTransactionForm(false);
  };

  const saveTransaction = async () => {
    if (!transactionDraft.amount || !transactionDraft.date) {
      showToast("error", "Amount and date are required");
      return;
    }

    if (transactionDraft.kind === "income" && !transactionDraft.description.trim()) {
      showToast("error", "Income needs a source");
      return;
    }

    const isEditing = Boolean(transactionDraft.id);
    const endpoint = transactionDraft.kind === "income" ? "/api/income" : "/api/expenses";
    const body = transactionDraft.kind === "income"
      ? {
          id: transactionDraft.id,
          source: transactionDraft.description,
          amount: transactionDraft.amount,
          date: transactionDraft.date,
          period: transactionDraft.period,
        }
      : {
          id: transactionDraft.id,
          description: transactionDraft.description || null,
          amount: transactionDraft.amount,
          date: transactionDraft.date,
          period: transactionDraft.period,
          categoryId: transactionDraft.categoryId || null,
        };

    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed");
      showToast("success", isEditing ? "Transaction updated" : "Transaction added");
      closeTransactionForm();
      fetchData();
    } catch {
      showToast("error", "Could not save transaction");
    }
  };

  const deleteTransaction = async (item: (typeof ledgerItems)[number]) => {
    const endpoint = item.kind === "income" ? "/api/income" : "/api/expenses";

    try {
      const res = await fetch(`${endpoint}?id=${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("success", "Transaction deleted");
      fetchData();
    } catch {
      showToast("error", "Could not delete transaction");
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Budget</h1>
          <p className="text-sm text-text-secondary mt-1">Simple household money tracking: income, spending, categories, and what is left.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-xl border border-border bg-surface overflow-hidden">
            <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))} className="p-3 hover:bg-surface-alt" aria-label="Previous month">
              <ArrowLeft size={18} />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-11 bg-transparent px-2 text-sm font-semibold outline-none"
              aria-label="Budget month"
            />
            <button onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))} className="p-3 hover:bg-surface-alt" aria-label="Next month">
              <ArrowRight size={18} />
            </button>
          </div>
          <Link
            href="/settings"
            className="inline-flex h-11 items-center justify-center rounded-[--radius-lg] border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-alt"
          >
            Manage categories
          </Link>
          <Button onClick={() => openCreateTransaction("expense")} leftIcon={<Plus size={18} />}>Add transaction</Button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3 mb-6">
        <SummaryCard label="Income" value={formatCurrency(monthlyIncome)} tone="good" sublabel={`${income.length} total sources`} />
        <SummaryCard label="Spent" value={formatCurrency(monthlyExpenses)} tone="bad" sublabel={`${expenses.length} total expenses`} />
        <SummaryCard label="Left" value={formatCurrency(left)} tone={left >= 0 ? "good" : "bad"} sublabel={left >= 0 ? "Available this month" : "Over monthly income"} />
      </section>

      <section className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="font-semibold text-text-primary">Monthly flow</h2>
            <p className="text-sm text-text-secondary">How much of this month&apos;s income is already planned or spent.</p>
          </div>
          <p className="text-sm font-semibold text-text-primary">{Math.round(incomeUsedPercent)}%</p>
        </div>
        <div className="h-3 rounded-full bg-surface-alt overflow-hidden">
          <div className={left < 0 ? "h-full rounded-full bg-red-500" : "h-full rounded-full bg-primary"} style={{ width: `${incomeUsedPercent}%` }} />
        </div>
      </section>

      {showTransactionForm && (
        <section className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold text-text-primary">{transactionDraft.id ? "Edit transaction" : "Add transaction"}</h2>
            <button onClick={closeTransactionForm} className="p-2 text-text-tertiary hover:text-text-primary" aria-label="Close transaction form"><X size={18} /></button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[180px_1fr_1fr_1fr_1fr]">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Type</label>
              <div className="grid grid-cols-2 rounded-lg border border-border overflow-hidden h-12">
                <button
                  onClick={() => setTransactionDraft((draft) => ({ ...draft, kind: "expense" }))}
                  className={transactionDraft.kind === "expense" ? "bg-primary text-white font-semibold" : "bg-surface hover:bg-surface-alt"}
                  type="button"
                >
                  Expense
                </button>
                <button
                  onClick={() => setTransactionDraft((draft) => ({ ...draft, kind: "income", categoryId: "" }))}
                  className={transactionDraft.kind === "income" ? "bg-primary text-white font-semibold" : "bg-surface hover:bg-surface-alt"}
                  type="button"
                >
                  Income
                </button>
              </div>
            </div>
            <Input label="Amount" type="number" min="0" step="0.01" value={transactionDraft.amount} onChange={(event) => setTransactionDraft((draft) => ({ ...draft, amount: event.target.value }))} />
            <Input label={transactionDraft.kind === "income" ? "Source" : "Description"} value={transactionDraft.description} onChange={(event) => setTransactionDraft((draft) => ({ ...draft, description: event.target.value }))} placeholder={transactionDraft.kind === "income" ? "Salary" : "Groceries"} />
            <Input label="Date" type="date" value={transactionDraft.date} onChange={(event) => setTransactionDraft((draft) => ({ ...draft, date: event.target.value }))} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Repeat</label>
              <select value={transactionDraft.period} onChange={(event) => setTransactionDraft((draft) => ({ ...draft, period: event.target.value as Period }))} className="w-full h-12 border border-border bg-surface rounded-[--radius-sm] px-3">
                {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
          {transactionDraft.kind === "expense" && (
            <div className="mt-4 space-y-1.5">
              <label className="block text-sm font-medium">Category</label>
              <select value={transactionDraft.categoryId} onChange={(event) => setTransactionDraft((draft) => ({ ...draft, categoryId: event.target.value }))} className="w-full h-12 border border-border bg-surface rounded-[--radius-sm] px-3">
                <option value="">Uncategorised</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button onClick={saveTransaction} leftIcon={<Check size={18} />}>Save</Button>
            <Button variant="secondary" onClick={closeTransactionForm}>Cancel</Button>
          </div>
        </section>
      )}

      <section className="bg-surface border border-border rounded-xl p-5">
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-text-primary">Transactions</h2>
                <p className="text-sm text-text-secondary">A clean ledger for income and expenses in {format(new Date(`${selectedMonth}-01T00:00:00`), "MMMM yyyy")}.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openCreateTransaction("income")} leftIcon={<ArrowUp size={16} />}>Income</Button>
                <Button size="sm" onClick={() => openCreateTransaction("expense")} leftIcon={<ArrowDown size={16} />}>Expense</Button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_160px_190px]">
              <Input aria-label="Search transactions" placeholder="Search transactions" value={search} onChange={(event) => setSearch(event.target.value)} leftIcon={<MagnifyingGlass size={18} className="text-text-tertiary" />} />
              <div className="relative">
                <FunnelSimple size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                <select aria-label="Filter transaction type" value={ledgerFilter} onChange={(event) => setLedgerFilter(event.target.value as LedgerFilter)} className="w-full h-12 border border-border bg-surface rounded-[--radius-sm] pl-10 pr-3">
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>
              </div>
              <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full h-12 border border-border bg-surface rounded-[--radius-sm] px-3">
                <option value="all">All categories</option>
                <option value="uncategorised">Uncategorised</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
          </div>

          {ledgerItems.length === 0 ? (
            <div className="rounded-lg bg-surface-alt p-6 text-center">
              <Receipt size={28} className="mx-auto text-text-tertiary mb-2" />
              <p className="font-medium text-text-primary">No transactions here yet</p>
              <p className="text-sm text-text-secondary mt-1">Add income or an expense to start the month.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ledgerItems.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.kind === "income" ? <ArrowUp size={16} className="text-green-600" /> : <Tag size={16} className="text-text-tertiary" />}
                      <p className="font-medium truncate">{item.description}</p>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">
                      {format(new Date(`${item.date}T00:00:00`), "d MMM")} · {item.categoryName} · {periodLabel(item.period)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`font-bold ${item.kind === "income" ? "text-green-600" : "text-red-500"}`}>{item.kind === "income" ? "+" : "-"}{formatCurrency(item.amount)}</p>
                      {item.period !== "monthly" && item.period !== "one-time" && <p className="text-xs text-text-tertiary">{formatCurrency(monthlyAmount(item.amount, item.period))}/mo</p>}
                    </div>
                    <button onClick={() => openEditTransaction(item)} className="p-2 text-text-tertiary hover:text-primary" aria-label={`Edit ${item.description}`}><PencilSimple size={16} /></button>
                    <button onClick={() => deleteTransaction(item)} className="p-2 text-text-tertiary hover:text-red-500" aria-label={`Delete ${item.description}`}><Trash size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, sublabel, tone }: { label: string; value: string; sublabel: string; tone: "good" | "bad" | "neutral" }) {
  const valueClass = tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-500" : "text-text-primary";

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</p>
      <p className="text-xs text-text-tertiary mt-1">{sublabel}</p>
    </div>
  );
}

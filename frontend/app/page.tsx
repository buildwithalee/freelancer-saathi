"use client";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Sparkles,
  WalletCards,
  ShieldCheck,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Bell,
  Search,
  ChevronDown,
  TrendingUp,
  Landmark,
  UserRound,
  Check,
  X,
  Send,
  Paperclip,
  Mic,
  CircleDollarSign,
  LockKeyhole,
  ArrowRight,
  Settings,
  Laptop,
  BrainCircuit,
  BadgeCheck,
  Activity,
  Radio,
  Plus,
} from "lucide-react";

import SaathiLogo from "./components/SaathiLogo";
import { apiGet, apiPost } from "../lib/api";

/* =========================================================
   TYPES
========================================================= */

type IncomeSummary = {
  agent: string;
  period: string;
  payment_count: number;
  total_income: number;
  processed_amount: number;
  available_for_conversion: number;
  available_payment_count: number;
  currency: string;
  message: string;
};

type Approval = {
  id: number;
  action_type: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  created_at?: string | null;
  decided_at?: string | null;
};

type ApprovalsResponse = {
  success: boolean;
  total: number;
  approvals: Approval[];
};
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatResponse = {
  success: boolean;
  assistant: string;
  message: string;
  model: string | null;
  requires_approval: boolean;
  approval: unknown | null;
  approval_details: unknown | null;
  approval_decision: unknown | null;
  bank_execution: unknown | null;
  transaction: unknown | null;
  receipt: unknown | null;
};

type SectionName =
  | "Dashboard"
  | "AI Saathi"
  | "Income"
  | "Payments"
  | "Approvals"
  | "Transactions"
  | "Documents"
  | "Analytics";

type Payment = {
  id: number;
  amount: number;
  currency: string;
  platform: string;
  status: string;
  is_processed: boolean;
  received_at?: string | null;
};

type PaymentsResponse = { success?: boolean; total?: number; payments?: Payment[] };

type BankTransaction = {
  id?: number;
  transaction_id: string;
  approval_id?: number;
  source_amount: number;
  source_currency: string;
  target_amount: number;
  target_currency: string;
  exchange_rate: number;
  status: string;
  created_at?: string | null;
};

type TransactionsResponse = { success?: boolean; total?: number; transactions?: BankTransaction[] };
/* =========================================================
   HELPERS
========================================================= */

const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/* =========================================================
   SIDEBAR
========================================================= */

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "AI Saathi",
    icon: Sparkles,
    badge: "NEW",
  },
  {
    label: "Income",
    icon: WalletCards,
  },
  {
    label: "Payments",
    icon: CircleDollarSign,
  },
  {
    label: "Approvals",
    icon: ShieldCheck,
    count: 0,
  },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Documents",
    icon: FileText,
  },
  {
    label: "Analytics",
    icon: BarChart3,
  },
];

/* =========================================================
   AGENT JOURNEY
========================================================= */

const journey = [
  {
    title: "Freelance Income",
    description: "You receive payments from global clients",
    icon: Laptop,
    tone: "cyan",
  },
  {
    title: "AI Analysis",
    description: "Saathi analyzes income & suggests best actions",
    icon: BrainCircuit,
    tone: "purple",
  },
  {
    title: "FX Decision",
    description: "Uses FX signals to evaluate conversion timing",
    icon: TrendingUp,
    tone: "green",
  },
  {
    title: "Guardian",
    description: "Requires your approval for every action",
    icon: ShieldCheck,
    tone: "amber",
  },
  {
    title: "You",
    description: "Stay in control. Always.",
    icon: UserRound,
    tone: "cyan",
  },
  {
    title: "Execution",
    description: "Processed safely through mock banking",
    icon: Landmark,
    tone: "purple",
  },
];

/* =========================================================
   RECENT ACTIVITY
   Live activity comes later.
========================================================= */

const recentActivity = [
  {
    title: "Payment received",
    detail: "Latest freelance income",
    amount: "Verified",
    icon: CircleDollarSign,
    tone: "green",
  },
  {
    title: "Income analysis",
    detail: "Saathi income agent",
    amount: "Active",
    icon: TrendingUp,
    tone: "green",
  },
  {
    title: "Guardian protection",
    detail: "Human authorization enabled",
    amount: "Protected",
    icon: ShieldCheck,
    tone: "amber",
  },
  {
    title: "Mock banking",
    detail: "Sandbox execution environment",
    amount: "Ready",
    icon: Landmark,
    tone: "purple",
  },
];

const quickActions = [
  "Analyze my income",
  "Review pending approvals",
  "Explain FX rate",
  "Show my documents",
];

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionName>("Dashboard");
  const [message, setMessage] = useState("");
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
  {
    role: "assistant",
    content:
      "Assalam-o-Alaikum! Main aapka Freelancer Saathi hoon. Income, payments, conversion aur approvals ke bare mein mujhse pooch sakte hain.",
  },
]);

const [chatLoading, setChatLoading] = useState(false);
const [chatError, setChatError] = useState("");

  const [income, setIncome] = useState<IncomeSummary | null>(null);

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [documentNotice, setDocumentNotice] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPlatform, setPaymentPlatform] = useState("Upwork");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");
  const [paymentNoticeType, setPaymentNoticeType] = useState<"success" | "error" | "">("");

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");

  const [decisionLoading, setDecisionLoading] = useState(false);
  const [guardianNotice, setGuardianNotice] = useState("");
  const [guardianNoticeType, setGuardianNoticeType] =
    useState<"success" | "error" | "">("");

  /* =======================================================
     LOAD REAL BACKEND DATA
  ======================================================= */

  async function loadWorkspaceData() {
    setWorkspaceLoading(true);
    setWorkspaceError("");
    try {
      const [paymentResult, transactionResult] = await Promise.allSettled([
        apiGet<PaymentsResponse | Payment[]>("/payments/"),
        apiGet<TransactionsResponse | BankTransaction[]>("/bank/transactions"),
      ]);

      if (paymentResult.status === "fulfilled") {
        const data = paymentResult.value;
        setPayments(Array.isArray(data) ? data : data.payments ?? []);
      }
      if (transactionResult.status === "fulfilled") {
        const data = transactionResult.value;
        setTransactions(Array.isArray(data) ? data : data.transactions ?? []);
      }
      if (paymentResult.status === "rejected" && transactionResult.status === "rejected") {
        setWorkspaceError("Payments and transactions could not be synchronized.");
      }
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to load workspace data.");
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function handleAddPayment() {
    const amount = Number(paymentAmount);
    const platform = paymentPlatform.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentNotice("Enter a valid payment amount greater than 0.");
      setPaymentNoticeType("error");
      return;
    }

    if (!platform) {
      setPaymentNotice("Enter the freelance platform or client source.");
      setPaymentNoticeType("error");
      return;
    }

    setPaymentSaving(true);
    setPaymentNotice("");
    setPaymentNoticeType("");

    try {
      await apiPost("/payments/", {
        amount,
        currency: "USD",
        platform,
      });

      // Ask the deterministic workflow to analyze the new available balance.
      // A workflow failure must not undo a successfully recorded payment.
      try {
        await apiPost("/workflow/analyze", {});
      } catch {
        // Dashboard refresh below will still show the newly recorded payment.
      }

      setPaymentNotice(`${money(amount)} payment from ${platform} recorded successfully.`);
      setPaymentNoticeType("success");
      setPaymentAmount("");
      setPaymentPlatform("Upwork");
      setPaymentModalOpen(false);
      await loadDashboard();
      await loadWorkspaceData();
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "Payment could not be recorded.");
      setPaymentNoticeType("error");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function generateReceipt(transactionId: string) {
    setDocumentNotice("");
    try {
      await apiPost(`/documents/receipt/${transactionId}`, {});
      setDocumentNotice(`Receipt for ${transactionId} is ready.`);
      const base = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "/api" : "http://127.0.0.1:8000");
      window.open(`${base}/documents/receipt/${transactionId}/download`, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDocumentNotice(error instanceof Error ? error.message : "Receipt could not be generated.");
    }
  }

  async function loadDashboard() {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const [incomeData, approvalData] = await Promise.all([
        apiGet<IncomeSummary>("/agents/income-summary"),
        apiGet<ApprovalsResponse>("/approvals/"),
      ]);

      setIncome(incomeData);
      setApprovals(
        Array.isArray(approvalData.approvals)
          ? approvalData.approvals
          : []
      );
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data."
      );
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    void loadWorkspaceData();
  }, []);

  /* =======================================================
     VERIFIED APPROVAL STATE
  ======================================================= */

  const supportedPendingApprovals = approvals
    .filter(
      (approval) =>
        approval.status?.toUpperCase() ===
          "PENDING" &&
        approval.action_type ===
          "CONVERT_USD_TO_PKR" &&
        approval.currency?.toUpperCase() ===
          "USD"
    )
    .sort((a, b) => b.id - a.id);

  const pendingApprovalCount =
    supportedPendingApprovals.length;

  const actionableApproval =
    income &&
    income.available_for_conversion > 0
      ? supportedPendingApprovals.find(
          (approval) =>
            Math.abs(
              Number(approval.amount) -
                Number(
                  income.available_for_conversion
                )
            ) < 0.01
        ) ?? null
      : null;

  const liveNavItems = navItems.map(
    (item) =>
      item.label === "Approvals"
        ? {
            ...item,
            count: pendingApprovalCount,
          }
        : item
  );

  /* =======================================================
     VERIFIED INCOME
  ======================================================= */

  const totalIncome =
    income?.total_income ?? 0;

  const availableIncome =
    income?.available_for_conversion ?? 0;

  const processedIncome =
    income?.processed_amount ?? 0;

  const paymentCount =
    income?.payment_count ?? 0;

  const availablePaymentCount =
    income?.available_payment_count ?? 0;

  const processedPercentage =
    totalIncome > 0 ? Math.round((processedIncome / totalIncome) * 100) : 0;

  const availablePercentage =
    totalIncome > 0 ? Math.round((availableIncome / totalIncome) * 100) : 0;

  const averagePayment = paymentCount > 0 ? totalIncome / paymentCount : 0;

  async function handleApprovalDecision(
    decision: "APPROVED" | "REJECTED"
  ) {
    if (!actionableApproval || decisionLoading) {
      return;
    }

    const approvalId = actionableApproval.id;

    setDecisionLoading(true);
    setGuardianNotice("");
    setGuardianNoticeType("");

    try {
      await apiPost(`/approvals/${approvalId}/decision`, { decision });

      if (decision === "APPROVED") {
        await apiPost(`/bank/convert/${approvalId}`, {});
        setGuardianNotice(
          `Success! Approval #${approvalId} was authorized and the conversion was completed safely.`
        );
        setGuardianNoticeType("success");
      } else {
        setGuardianNotice(
          `Approval #${approvalId} was rejected. No financial action was executed.`
        );
        setGuardianNoticeType("success");
      }

      await loadDashboard();
      await loadWorkspaceData();
    } catch (error) {
      setGuardianNotice(
        error instanceof Error
          ? error.message
          : "Unable to complete the Guardian decision."
      );
      setGuardianNoticeType("error");
      await loadDashboard();
      await loadWorkspaceData();
    } finally {
      setDecisionLoading(false);
    }
  }
      
      async function handleSendMessage(customMessage?: string) {
  const text = (customMessage ?? message).trim();

  if (!text || chatLoading) return;

  setChatMessages((current) => [
    ...current,
    {
      role: "user",
      content: text,
    },
  ]);

  setMessage("");
  setChatError("");
  setChatLoading(true);

  try {
    const response = await apiPost<ChatResponse>("/chat/", {
      message: text,
    });

    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        content:
          response.message ||
          "Saathi se response receive nahi hua.",
      },
    ]);

    if (!response.success) {
      setChatError(
        "AI temporarily unavailable hai. Thori dair baad dobara try karein."
      );
    }

    await loadDashboard();
      await loadWorkspaceData();
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Saathi se connect nahi ho saka.";

    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        content:
          "Sorry, Saathi se abhi connection nahi ho saka. Thori dair baad dobara try karein.",
      },
    ]);

    setChatError(errorMessage);
  } finally {
    setChatLoading(false);
  }
}
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03101a] text-white">
      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-[230px] flex-col border-r border-cyan-100/[0.08] bg-[#03101a]/95 px-3 py-5 backdrop-blur-2xl xl:flex">

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(31,220,201,0.07),transparent_26%)]" />

          {/* BRAND */}

          <div className="relative flex flex-col items-center px-2 pb-5">

            <SaathiLogo
              size={78}
              animated
              showGlow
            />

            <h1 className="mt-2 text-center text-[20px] font-bold tracking-[-0.04em] text-white">

              Freelancer{" "}

              <span className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-transparent">
                Saathi
              </span>

            </h1>

            <p className="mt-1 text-[7px] font-semibold uppercase tracking-[0.23em] text-slate-500">
              Financial Intelligence
            </p>

          </div>

          <div className="relative h-px bg-gradient-to-r from-transparent via-cyan-200/10 to-transparent" />

          {/* NAVIGATION */}

          <nav className="relative mt-5 space-y-1.5">

            {liveNavItems.map(
              (item, index) => {

                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.label}
                    onClick={() => setActiveSection(item.label as SectionName)}
                    initial={{
                      opacity: 0,
                      x: -10,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.035,
                    }}
                    whileHover={{
                      x: 3,
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[11px] transition ${
                      activeSection === item.label
                        ? "border-cyan-300/25 bg-cyan-300/[0.075] text-cyan-100 shadow-[inset_0_0_25px_rgba(34,211,238,0.025)]"
                        : "border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-white"
                    }`}
                  >

                    {activeSection === item.label && (
                      <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                    )}

                    <Icon
                      size={16}
                      strokeWidth={1.7}
                      className={
                        activeSection === item.label
                          ? "text-cyan-300"
                          : "text-slate-500 group-hover:text-cyan-300"
                      }
                    />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {"badge" in item &&
                      item.badge && (
                        <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[7px] font-bold text-violet-300">
                          {item.badge}
                        </span>
                      )}

                    {"count" in item &&
                      Boolean(item.count) && (
                        <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.35)]">
                          {item.count}
                        </span>
                      )}

                  </motion.button>
                );
              }
            )}

          </nav>

          {/* SIDEBAR BOTTOM */}

          <div className="relative mt-auto">

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.045] p-3">

              <div className="flex items-center gap-2.5">

                <div className="grid h-9 w-9 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/10">

                  <ShieldCheck
                    size={16}
                    className="text-emerald-300"
                  />

                </div>

                <div>

                  <div className="flex items-center gap-2">

                    <p className="text-[9px] font-semibold text-emerald-200">
                      Guardian Active
                    </p>

                    <span className="relative flex h-1.5 w-1.5">

                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />

                      <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-300" />

                    </span>

                  </div>

                  <p className="mt-1 max-w-[135px] text-[7px] leading-4 text-slate-500">
                    Every financial action requires your approval.
                  </p>

                </div>

              </div>

            </div>

            {/* USER */}

            <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.018] p-2.5">

              <div className="grid h-9 w-9 place-items-center rounded-full border border-cyan-200/15 bg-[#102437] text-[9px] text-slate-300">
                AR
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-[9px] font-medium text-white">
                  Ali Raza Memon
                </p>

                <p className="mt-0.5 text-[7px] text-slate-600">
                  Freelancer
                </p>

              </div>

              <Settings
                size={14}
                className="text-slate-600"
              />

            </div>

            {/* ENVIRONMENT */}

            <div className="mt-3 border-t border-white/[0.05] pt-3">

              <div className="flex items-center gap-2 text-[7px] text-slate-500">

                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />

                Sandbox Environment

              </div>

              <p className="ml-3.5 mt-1 text-[6px] text-slate-700">
                Mock Banking • Dev Mode
              </p>

            </div>

          </div>

        </aside>

        {/* =====================================================
            MAIN
        ====================================================== */}

        <section className="min-w-0 flex-1 xl:ml-[230px]">

          {/* ===================================================
              TOPBAR
          ==================================================== */}

          <header className="sticky top-0 z-40 flex h-[72px] items-center gap-5 border-b border-white/[0.055] bg-[#03101a]/85 px-5 backdrop-blur-2xl md:px-6">

            <div className="flex items-center gap-2 xl:hidden">

              <SaathiLogo size={38} />

              <span className="text-sm font-semibold">
                Freelancer Saathi
              </span>

            </div>

            {/* SEARCH */}

            <div className="hidden w-full max-w-[465px] md:block">

              <div className="flex items-center gap-3 rounded-xl border border-cyan-100/[0.13] bg-[#081b29]/65 px-4 py-2.5">

                <Search
                  size={15}
                  className="text-slate-500"
                />

                <input
                  id="saathi-global-search"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && message.trim()) {
                      event.preventDefault();
                      setActiveSection("AI Saathi");
                      void handleSendMessage();
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent text-[9px] text-slate-300 outline-none placeholder:text-slate-500"
                  placeholder="Ask Saathi anything..."
                />

                <span className="rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[7px] text-slate-500">
                  Ctrl K
                </span>

              </div>

            </div>

            {/* STATUS */}

            <div className="ml-auto flex items-center gap-3">

              <div
                className={`hidden items-center gap-2 rounded-full border px-3 py-2 lg:flex ${
                  dashboardError
                    ? "border-red-300/10 bg-red-300/[0.04]"
                    : "border-emerald-300/10 bg-emerald-300/[0.04]"
                }`}
              >

                <span className="relative flex h-1.5 w-1.5">

                  {!dashboardError && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                  )}

                  <span
                    className={`relative h-1.5 w-1.5 rounded-full ${
                      dashboardError
                        ? "bg-red-400"
                        : "bg-emerald-300"
                    }`}
                  />

                </span>

                <span
                  className={`text-[7px] ${
                    dashboardError
                      ? "text-red-300"
                      : "text-emerald-200"
                  }`}
                >

                  {dashboardLoading
                    ? "Syncing Financial Data"
                    : dashboardError
                      ? "Backend Sync Issue"
                      : "All Systems Operational"}

                </span>

              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-400 transition hover:border-cyan-300/20 hover:text-white"
                  aria-label="Open notifications"
                >
                  <Bell size={15} />
                  {(pendingApprovalCount > 0 || availableIncome > 0) && (
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400" />
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-[80] w-[310px] overflow-hidden rounded-2xl border border-cyan-100/[0.12] bg-[#071725]/98 shadow-2xl backdrop-blur-2xl">
                    <div className="border-b border-white/[0.06] px-4 py-3">
                      <p className="text-[10px] font-semibold text-white">Notifications</p>
                      <p className="mt-1 text-[7px] text-slate-500">Live financial alerts from Saathi</p>
                    </div>
                    <div className="space-y-1 p-2">
                      {pendingApprovalCount > 0 && <NotificationItem title="Guardian approval required" detail={`${pendingApprovalCount} request${pendingApprovalCount === 1 ? "" : "s"} waiting for your decision`} tone="amber" />}
                      {availableIncome > 0 && <NotificationItem title="Funds available" detail={`${money(availableIncome)} is ready for conversion analysis`} tone="cyan" />}
                      {!dashboardError && <NotificationItem title="Systems operational" detail="Frontend, API and financial agents are connected" tone="green" />}
                      {dashboardError && <NotificationItem title="Backend sync needs attention" detail={dashboardError} tone="red" />}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid h-9 w-9 place-items-center rounded-full border border-cyan-100/15 bg-[#102437] text-[9px] text-slate-300">
                AR
              </div>

              <div className="hidden sm:block">

                <p className="text-[7px] text-slate-500">
                  Good to see you,
                </p>

                <p className="text-[9px] font-semibold text-white">
                  Ali Raza
                </p>

              </div>

              <ChevronDown
                size={13}
                className="text-slate-600"
              />

            </div>

          </header>

          {/* ===================================================
              PAGE CONTENT
          ==================================================== */}

          <div className="relative p-4 md:p-5">

            <div className="pointer-events-none absolute left-[20%] top-[-120px] h-[400px] w-[500px] rounded-full bg-cyan-400/[0.04] blur-[130px]" />

            {/* ERROR */}

            {dashboardError && (
              <div className="relative z-20 mb-4 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-[9px] text-red-200">

                Live dashboard data could not be loaded:{" "}
                {dashboardError}

              </div>
            )}

            {/* =================================================
                DASHBOARD GRID
            ================================================== */}

            {activeSection === "Dashboard" ? (
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_375px]">

              {/* =================================================
                  LEFT
              ================================================== */}

              <div className="min-w-0">

                {/* ===============================================
                    HERO
                ================================================ */}

                <section className="relative grid min-h-[210px] overflow-hidden rounded-[22px] border border-white/[0.055] bg-[#061522]/55 px-5 py-5 lg:grid-cols-[0.95fr_1.05fr]">

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(34,211,238,0.08),transparent_30%)]" />

                  {/* HERO TEXT */}

                  <div className="relative z-10 flex flex-col justify-center">

                    <div className="flex flex-wrap items-center gap-2 text-[6px] font-semibold uppercase tracking-[0.22em]">

                      <span className="text-cyan-300">
                        ● Agentic AI
                      </span>

                      <span className="text-slate-700">
                        •
                      </span>

                      <span className="text-cyan-100/70">
                        Human Controlled
                      </span>

                      <span className="text-slate-700">
                        •
                      </span>

                      <span className="text-slate-500">
                        Built for Freelancers
                      </span>

                    </div>

                    <motion.h2
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mt-4 text-[36px] font-bold leading-none tracking-[-0.055em] md:text-[44px]"
                    >

                      Freelancer{" "}

                      <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
                        Saathi
                      </span>

                    </motion.h2>

                    <p className="mt-2 text-[17px] font-semibold tracking-[-0.025em] text-white">

                      Autonomous intelligence.{" "}

                      <span className="text-cyan-200">
                        Human authority.
                      </span>

                    </p>

                    <p className="mt-3 max-w-[510px] text-[10px] leading-5 text-slate-400">

                      An agentic financial operating layer built for the way
                      freelancers actually earn, receive and manage their money.

                    </p>

                  </div>

                  {/* =============================================
                      AI CORE
                  ============================================== */}

                  <div className="relative hidden min-h-[190px] items-center justify-center lg:flex">

                    <div className="relative grid h-[205px] w-[330px] place-items-center">

                      <motion.div
                        className="absolute h-[185px] w-[185px] rounded-full border border-cyan-300/15"
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 22,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />

                      <motion.div
                        className="absolute h-[145px] w-[260px] rounded-[50%] border border-violet-400/20"
                        animate={{
                          rotate: -360,
                        }}
                        transition={{
                          duration: 18,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />

                      <motion.div
                        className="absolute h-[95px] w-[280px] rounded-[50%] border border-cyan-300/20"
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 13,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />

                      <div className="absolute h-[145px] w-[145px] rounded-full bg-cyan-400/[0.08] blur-[35px]" />

                      {/* CORE */}

                      <motion.div
                        animate={{
                          scale: [
                            1,
                            1.035,
                            1,
                          ],
                          boxShadow: [
                            "0 0 45px rgba(34,211,238,0.12)",
                            "0 0 80px rgba(139,92,246,0.22)",
                            "0 0 45px rgba(34,211,238,0.12)",
                          ],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="relative z-10 grid h-[125px] w-[125px] place-items-center rounded-full border border-cyan-200/25 bg-[radial-gradient(circle_at_35%_30%,#103d4c,#061622_55%,#07101a)]"
                      >

                        <div className="absolute inset-[8px] rounded-full border border-cyan-200/10" />

                        <SaathiLogo
                          size={75}
                          animated
                          showGlow
                        />

                      </motion.div>

                      {/* AI ANALYSIS */}

                      <motion.div
                        animate={{
                          y: [
                            -3,
                            3,
                            -3,
                          ],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                        }}
                        className="absolute left-0 top-5 rounded-lg border border-blue-400/30 bg-[#071827]/90 px-3 py-2 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      >

                        <div className="flex items-center gap-2">

                          <BrainCircuit
                            size={12}
                            className="text-blue-300"
                          />

                          <span className="text-[7px] text-slate-200">
                            AI Analysis
                          </span>

                        </div>

                      </motion.div>

                      {/* GUARDIAN */}

                      <motion.div
                        animate={{
                          y: [
                            3,
                            -3,
                            3,
                          ],
                        }}
                        transition={{
                          duration: 4.5,
                          repeat: Infinity,
                        }}
                        className="absolute right-0 top-6 rounded-lg border border-amber-300/25 bg-[#17140d]/90 px-3 py-2"
                      >

                        <div className="flex items-center gap-2">

                          <ShieldCheck
                            size={12}
                            className="text-amber-200"
                          />

                          <span className="text-[7px] text-slate-200">
                            Guardian Protection
                          </span>

                        </div>

                      </motion.div>

                      {/* FX */}

                      <motion.div
                        animate={{
                          x: [
                            -2,
                            2,
                            -2,
                          ],
                        }}
                        transition={{
                          duration: 4.2,
                          repeat: Infinity,
                        }}
                        className="absolute bottom-4 left-2 rounded-lg border border-cyan-300/25 bg-[#071b1e]/90 px-3 py-2"
                      >

                        <div className="flex items-center gap-2">

                          <TrendingUp
                            size={12}
                            className="text-cyan-300"
                          />

                          <span className="text-[7px] text-slate-200">
                            FX Decisions
                          </span>

                        </div>

                      </motion.div>

                      {/* CONTROL */}

                      <motion.div
                        animate={{
                          x: [
                            2,
                            -2,
                            2,
                          ],
                        }}
                        transition={{
                          duration: 4.8,
                          repeat: Infinity,
                        }}
                        className="absolute bottom-4 right-2 rounded-lg border border-violet-300/25 bg-[#151026]/90 px-3 py-2"
                      >

                        <div className="flex items-center gap-2">

                          <UserRound
                            size={12}
                            className="text-violet-200"
                          />

                          <span className="text-[7px] text-slate-200">
                            Your Control
                          </span>

                        </div>

                      </motion.div>

                    </div>

                  </div>

                </section>

                {/* ===============================================
                    REAL KPI CARDS
                ================================================ */}

                <section className="mt-3 grid gap-3 md:grid-cols-3">

                  <KpiCard
                    title="7-Day Income"
                    value={
                      dashboardLoading
                        ? "—"
                        : money(
                            totalIncome
                          )
                    }
                    detail={
                      dashboardLoading
                        ? "Syncing income data..."
                        : `Across ${paymentCount} freelance payment${
                            paymentCount === 1
                              ? ""
                              : "s"
                          }`
                    }
                    icon={
                      <WalletCards
                        size={17}
                      />
                    }
                    variant="cyan"
                  />

                  <KpiCard
                    title="Available for Conversion"
                    value={
                      dashboardLoading
                        ? "—"
                        : money(
                            availableIncome
                          )
                    }
                    detail={
                      dashboardLoading
                        ? "Checking available funds..."
                        : availableIncome > 0
                          ? `${availablePaymentCount} payment${
                              availablePaymentCount ===
                              1
                                ? ""
                                : "s"
                            } ready for FX conversion`
                          : "No unprocessed USD is currently available"
                    }
                    icon={
                      <CircleDollarSign
                        size={17}
                      />
                    }
                    variant="purple"
                  />

                  <KpiCard
                    title="Processed Safely"
                    value={
                      dashboardLoading
                        ? "—"
                        : money(
                            processedIncome
                          )
                    }
                    detail={
                      dashboardLoading
                        ? "Checking processed funds..."
                        : "Already recorded with full audit"
                    }
                    icon={
                      <ShieldCheck
                        size={17}
                      />
                    }
                    variant="green"
                  />

                </section>

                {/* ===============================================
                    JOURNEY
                ================================================ */}

                <section className="relative mt-4 overflow-hidden rounded-[20px] border border-cyan-100/[0.09] bg-[#061522]/75 p-5">

                  <div className="pointer-events-none absolute bottom-0 right-0 h-[130px] w-[250px] bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.07),transparent_60%)]" />

                  <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-white">
                    Your Financial Journey, Powered by AI Agents
                  </h3>

                  <p className="mt-1 text-[9px] text-slate-500">
                    From income to execution — with you in control at every step.
                  </p>

                  <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

                    <div className="absolute left-[7%] right-[7%] top-[31px] hidden h-px bg-gradient-to-r from-cyan-400/10 via-cyan-300/50 to-violet-400/10 xl:block" />

                    <motion.div
                      className="absolute top-[29px] hidden h-[4px] w-8 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(34,211,238,1)] xl:block"
                      animate={{
                        left: [
                          "7%",
                          "89%",
                        ],
                        opacity: [
                          0,
                          1,
                          1,
                          0,
                        ],
                      }}
                      transition={{
                        duration: 3.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {journey.map(
                      (item) => {

                        const Icon =
                          item.icon;

                        const ring =
                          item.tone ===
                          "purple"
                            ? "border-violet-400/60 bg-violet-500/10 text-violet-300 shadow-[0_0_25px_rgba(139,92,246,0.25)]"
                            : item.tone ===
                                "green"
                              ? "border-emerald-300/60 bg-emerald-400/10 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.22)]"
                              : item.tone ===
                                  "amber"
                                ? "border-amber-300/70 bg-amber-300/10 text-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.28)]"
                                : "border-cyan-300/60 bg-cyan-400/10 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.22)]";

                        return (
                          <div
                            key={
                              item.title
                            }
                            className="relative z-10 flex flex-col items-center text-center"
                          >

                            <motion.div
                              whileHover={{
                                scale: 1.08,
                              }}
                              className={`grid h-[62px] w-[62px] place-items-center rounded-full border ${ring}`}
                            >

                              <Icon
                                size={23}
                                strokeWidth={
                                  1.6
                                }
                              />

                            </motion.div>

                            <p className="mt-3 text-[9px] font-semibold text-white">
                              {
                                item.title
                              }
                            </p>

                            <p className="mt-1 max-w-[120px] text-[7px] leading-[1.55] text-slate-500">
                              {
                                item.description
                              }
                            </p>

                          </div>
                        );
                      }
                    )}

                  </div>

                </section>

                {/* ===============================================
                    CHAT
                ================================================ */}

                <section className="mt-4 overflow-hidden rounded-[20px] border border-cyan-200/[0.12] bg-[#061522]/80">

                  {/* CHAT HEADER */}

                  <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-3.5">

                    <div className="flex items-center gap-3">

                      <div className="grid h-10 w-10 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10">

                        <UserRound
                          size={18}
                          className="text-white"
                        />

                      </div>

                      <div>

                        <h3 className="text-[11px] font-semibold text-white">
                          Chat with Saathi
                        </h3>

                        <p className="mt-0.5 text-[7px] text-slate-500">
                          Your AI financial assistant
                        </p>

                      </div>

                    </div>

                    <div>

                      <div className="flex items-center justify-end gap-2">

                        <span className="relative flex h-1.5 w-1.5">

                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />

                          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-300" />

                        </span>

                        <span className="text-[7px] text-emerald-300">
                          Saathi is online
                        </span>

                      </div>

                      <p className="mt-1 text-right text-[6px] text-slate-600">
                        Financial context synced
                      </p>

                    </div>

                  </div>

                  {/* CHAT BODY */}

                  <div className="p-5">

                    <div className="flex max-w-[650px] items-start gap-3">

                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-300/30 bg-[#082634]">

                        <SaathiLogo
                          size={24}
                          animated={
                            false
                          }
                          showGlow={
                            false
                          }
                        />

                      </div>

                      <div className="rounded-2xl rounded-tl-sm border border-cyan-100/[0.11] bg-[#10263a]/80 px-4 py-3">

                        <div className="flex items-center gap-2">

                          <p className="text-[8px] font-semibold text-cyan-300">
                            Freelancer Saathi
                          </p>

                          <span className="text-[6px] text-slate-600">
                            now
                          </span>

                        </div>

                        {/* REAL VERIFIED SUMMARY */}

                        <p className="mt-2 text-[10px] leading-[1.65] text-slate-300">

                          {dashboardLoading ? (
                            "Main aapka verified financial data sync kar raha hoon..."
                          ) : dashboardError ? (
                            "Backend data sync nahi ho saka. Backend connection check karein."
                          ) : (
                            <>

                              Last 7 days mein{" "}

                              <strong className="text-white">
                                {money(
                                  totalIncome
                                )}
                              </strong>{" "}

                              receive huay hain.

                              <br />

                              Conversion ke liye{" "}

                              <strong className="text-white">
                                {money(
                                  availableIncome
                                )}
                              </strong>{" "}

                              available hain aur{" "}

                              <strong className="text-white">
                                {money(
                                  processedIncome
                                )}
                              </strong>{" "}

                              safely processed hain.

                              <br />

                              {actionableApproval
                                ? `Approval request #${actionableApproval.id} pending hai. Main aapki permission ke baghair koi financial action execute nahi karunga.`
                                : "Filhaal koi actionable conversion approval nahi hai. Main aapki permission ke baghair koi financial action execute nahi karunga."}

                            </>
                          )}

                        </p>

                      </div>

                    </div>

                    {/* QUICK ACTIONS */}

                    <div className="ml-11 mt-3 flex flex-wrap gap-2">

                      {quickActions.map(
                        (action) => (
                          <button
                            key={
                              action
                            }
                            onClick={() =>
                              setMessage(
                                action
                              )
                            }
                            className="rounded-lg border border-cyan-100/[0.14] bg-[#091c2a] px-3 py-2 text-[7px] text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.05] hover:text-white"
                          >
                            {
                              action
                            }
                          </button>
                        )
                      )}

                    </div>

                  </div>

                  {/* CHAT INPUT */}

                  <div className="border-t border-white/[0.055] p-3">

                    <div className="flex items-center gap-2 rounded-xl border border-cyan-200/[0.18] bg-[#071725] p-1.5">

                      <button className="grid h-9 w-9 place-items-center text-slate-500 hover:text-white">

                        <Paperclip
                          size={15}
                        />

                      </button>

                      <input
                        value={message}
                        onChange={(
                          event
                        ) =>
                          setMessage(
                            event.target
                              .value
                          )
                        }
                        placeholder="Ask Saathi about your finances..."
                        className="min-w-0 flex-1 bg-transparent text-[9px] text-white outline-none placeholder:text-slate-600"
                      />

                      <button className="grid h-9 w-9 place-items-center text-slate-500 hover:text-white">

                        <Mic size={15} />

                      </button>

                      <button
                        type="button"
                        onClick={() => void handleSendMessage()}
                        disabled={
                          !message.trim() || chatLoading
                        }
                        className="grid h-9 w-[58px] place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-emerald-400 text-[#03110f] shadow-[0_0_20px_rgba(45,212,191,0.18)] disabled:opacity-30"
                      >

                        <Send
                          size={16}
                        />

                      </button>

                    </div>

                  </div>

                </section>

              </div>

              {/* =================================================
                  RIGHT COLUMN
              ================================================== */}

              <div className="space-y-4">

                {/* ===============================================
                    GUARDIAN — REAL BACKEND DATA
                ================================================ */}

                <section className="relative overflow-hidden rounded-[20px] border border-amber-300/40 bg-gradient-to-br from-[#15150e] via-[#091923] to-[#062126] p-4 shadow-[0_0_45px_rgba(245,158,11,0.07)]">

                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/[0.08] blur-3xl" />

                  {/* GUARDIAN HEADER */}

                  <div className="relative flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-300/30 bg-amber-300/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]">

                        <ShieldCheck
                          size={19}
                          className="text-amber-200"
                        />

                      </div>

                      <div>

                        <p className="text-[10px] font-semibold text-white">
                          Guardian Agent
                        </p>

                        <p className="mt-0.5 text-[6px] uppercase tracking-[0.12em] text-slate-500">
                          Human Authorization Gate
                        </p>

                      </div>

                    </div>

                    <span
                      className={`rounded-full border px-2 py-1 text-[6px] font-bold ${
                        actionableApproval
                          ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                          : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      }`}
                    >

                      {dashboardLoading
                        ? "● SYNCING"
                        : actionableApproval
                          ? "★ PENDING"
                          : "✓ PROTECTED"}

                    </span>

                  </div>

                  {/* TITLE */}

                  <h3 className="relative mt-4 text-[18px] font-semibold text-white">

                    {dashboardLoading
                      ? "Checking Authorization"
                      : actionableApproval
                        ? "Approval Required"
                        : "No Action Required"}

                  </h3>

                  <p className="relative mt-1 text-[8px] text-slate-400">

                    {dashboardLoading
                      ? "Synchronizing verified approval data"
                      : actionableApproval
                        ? "Review the verified conversion request"
                        : availableIncome >
                            0
                          ? "Available funds have no matching pending approval yet"
                          : "No unprocessed USD is currently available for conversion"}

                  </p>

                  {/* VERIFIED CONVERSION BOX */}

                  <div className="relative mt-3 overflow-hidden rounded-xl border border-cyan-100/[0.14] bg-[#0a1b25]/90">

                    <p className="px-3 pt-2 text-[7px] text-slate-500">

                      {actionableApproval
                        ? "Convert"
                        : "Verified availability"}

                    </p>

                    <div className="flex items-center gap-2 px-3 pb-3 pt-1">

                      <div>

                        <p className="text-[17px] font-semibold text-white">

                          {dashboardLoading
                            ? "—"
                            : money(
                                actionableApproval?.amount ??
                                  availableIncome
                              )}{" "}

                          <span className="text-[10px] text-slate-300">
                            USD
                          </span>

                        </p>

                      </div>

                      <ArrowRight
                        size={15}
                        className="ml-auto text-slate-500"
                      />

                      <div className="text-right">

                        <p className="text-[17px] font-semibold text-white">

                          {actionableApproval
                            ? "Awaiting FX"
                            : "No execution"}

                          {actionableApproval && (
                            <>

                              {" "}

                              <span className="text-[10px] text-slate-300">
                                PKR
                              </span>

                            </>
                          )}

                        </p>

                      </div>

                    </div>

                    {/* META */}

                    <div className="grid grid-cols-2 border-t border-cyan-100/[0.1]">

                      <div className="border-r border-cyan-100/[0.1] px-3 py-2">

                        <p className="text-[6px] text-slate-500">
                          Available payments
                        </p>

                        <p className="mt-1 text-[8px] font-semibold text-white">

                          {dashboardLoading
                            ? "—"
                            : availablePaymentCount}

                        </p>

                      </div>

                      <div className="px-3 py-2">

                        <p className="text-[6px] text-slate-500">
                          Request ID
                        </p>

                        <p className="mt-1 text-[8px] font-semibold text-white">

                          {actionableApproval
                            ? `#${actionableApproval.id}`
                            : "—"}

                        </p>

                      </div>

                    </div>

                  </div>

                  {/* GUARDIAN MESSAGE */}

                  <div
                    className={`relative mt-3 flex items-center gap-3 rounded-xl border p-3 ${
                      actionableApproval
                        ? "border-amber-300/20 bg-amber-300/[0.07]"
                        : "border-emerald-300/20 bg-emerald-400/[0.08]"
                    }`}
                  >

                    <div
                      className={`grid h-8 w-8 place-items-center rounded-full ${
                        actionableApproval
                          ? "bg-amber-300/10"
                          : "bg-emerald-300/10"
                      }`}
                    >

                      {actionableApproval ? (
                        <ShieldCheck
                          size={15}
                          className="text-amber-200"
                        />
                      ) : (
                        <BadgeCheck
                          size={15}
                          className="text-emerald-300"
                        />
                      )}

                    </div>

                    <div>

                      <p
                        className={`text-[8px] font-semibold ${
                          actionableApproval
                            ? "text-amber-200"
                            : "text-emerald-300"
                        }`}
                      >

                        {actionableApproval
                          ? `Approval #${actionableApproval.id} is waiting for you`
                          : "Guardian protection is active"}

                      </p>

                      <p className="mt-1 text-[7px] text-slate-400">

                        {actionableApproval
                          ? "Execution remains locked until you explicitly decide."
                          : "No financial action can execute without your authorization."}

                      </p>

                    </div>

                  </div>

                  {/* BUTTONS
                      Next step: connect these to real decision API.
                  */}

                  <div className="relative mt-4 grid grid-cols-2 gap-2">

                    <button
                      onClick={() => handleApprovalDecision("REJECTED")}
                      disabled={!actionableApproval || decisionLoading}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-400/70 bg-red-500/10 py-3 text-[8px] font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                    >

                      <X size={14} />

                      {decisionLoading ? "Processing..." : "Reject"}

                    </button>

                    <button
                      onClick={() => handleApprovalDecision("APPROVED")}
                      disabled={!actionableApproval || decisionLoading}
                      className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-[8px] font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                    >

                      <Check size={14} />

                      {decisionLoading ? "Processing..." : "Approve Conversion"}

                    </button>

                  </div>

                  {guardianNotice && (
                    <div
                      className={`relative mt-3 rounded-xl border px-3 py-2.5 text-[7px] leading-4 ${
                        guardianNoticeType === "error"
                          ? "border-red-400/20 bg-red-500/[0.08] text-red-200"
                          : "border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-200"
                      }`}
                    >
                      {guardianNotice}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[6px] text-slate-600">

                    <LockKeyhole
                      size={9}
                    />

                    Nothing executes without your authorization

                  </div>

                </section>

                {/* ===============================================
                    RECENT ACTIVITY
                ================================================ */}

                <section className="rounded-[20px] border border-cyan-100/[0.09] bg-[#061522]/75 p-4">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <Activity
                        size={17}
                        className="text-violet-300"
                      />

                      <div>

                        <h3 className="text-[12px] font-semibold text-white">
                          Recent Activity
                        </h3>

                        <p className="mt-0.5 text-[7px] text-slate-500">
                          Live feed of your financial journey
                        </p>

                      </div>

                    </div>

                    <button className="rounded-full border border-cyan-100/[0.12] bg-[#091c2a] px-3 py-1.5 text-[7px] text-slate-400">
                      View all
                    </button>

                  </div>

                  <div className="mt-4 space-y-1">

                    {recentActivity.map(
                      (item) => {

                        const Icon =
                          item.icon;

                        const iconStyle =
                          item.tone ===
                          "amber"
                            ? "border-amber-300/15 bg-amber-300/10 text-amber-200"
                            : item.tone ===
                                "purple"
                              ? "border-violet-300/15 bg-violet-300/10 text-violet-300"
                              : "border-emerald-300/15 bg-emerald-300/10 text-emerald-300";

                        return (
                          <div
                            key={
                              item.title
                            }
                            className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-white/[0.05] hover:bg-white/[0.018]"
                          >

                            <div
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${iconStyle}`}
                            >

                              <Icon
                                size={14}
                              />

                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-[8px] font-medium text-slate-200">
                                {
                                  item.title
                                }
                              </p>

                              <p className="mt-1 truncate text-[7px] text-slate-600">
                                {
                                  item.detail
                                }
                              </p>

                            </div>

                            <p className="shrink-0 text-right text-[7px] text-slate-500">
                              {
                                item.amount
                              }
                            </p>

                          </div>
                        );
                      }
                    )}

                  </div>

                </section>

                {/* ===============================================
                    CORE STATUS
                ================================================ */}

                <section className="rounded-[18px] border border-cyan-100/[0.07] bg-[#061522]/55 p-4">

                  <div className="flex items-center gap-3">

                    <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05]">

                      <Radio
                        size={15}
                        className="text-cyan-300"
                      />

                    </div>

                    <div className="flex-1">

                      <p className="text-[8px] font-medium text-slate-300">
                        Saathi Core
                      </p>

                      <p className="mt-0.5 text-[7px] text-slate-600">

                        {dashboardError
                          ? "Backend synchronization needs attention"
                          : dashboardLoading
                            ? "Synchronizing AI agents and Guardian"
                            : "AI agents and Guardian are operational"}

                      </p>

                    </div>

                    <BadgeCheck
                      size={15}
                      className={
                        dashboardError
                          ? "text-red-400"
                          : "text-emerald-300"
                      }
                    />

                  </div>

                </section>

              </div>

            </div>
            ) : activeSection === "Analytics" ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
              >
                <section className="relative overflow-hidden rounded-[22px] border border-cyan-100/[0.09] bg-[#061522]/75 p-6">
                  <div className="pointer-events-none absolute right-[-80px] top-[-100px] h-[280px] w-[280px] rounded-full bg-violet-500/[0.09] blur-[90px]" />
                  <div className="relative flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-2 text-[7px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        <BarChart3 size={13} /> Financial Intelligence
                      </div>
                      <h2 className="mt-3 text-[30px] font-bold tracking-[-0.045em] text-white">Financial Analytics</h2>
                      <p className="mt-2 max-w-[620px] text-[10px] leading-5 text-slate-400">
                        Live intelligence across your freelance income, processed funds and conversion-ready balance.
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.055] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                          <span className="relative h-2 w-2 rounded-full bg-emerald-300" />
                        </span>
                        <span className="text-[8px] font-semibold text-emerald-200">LIVE DATA</span>
                      </div>
                      <p className="mt-1 text-[7px] text-slate-500">Synced with Saathi Core</p>
                    </div>
                  </div>
                </section>

                <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <KpiCard title="Total Income" value={dashboardLoading ? "—" : money(totalIncome)} detail={`${paymentCount} verified payments`} icon={<WalletCards size={17} />} variant="cyan" />
                  <KpiCard title="Processed" value={dashboardLoading ? "—" : money(processedIncome)} detail={`${processedPercentage}% of total income`} icon={<ShieldCheck size={17} />} variant="green" />
                  <KpiCard title="Available" value={dashboardLoading ? "—" : money(availableIncome)} detail={`${availablePercentage}% awaiting processing`} icon={<CircleDollarSign size={17} />} variant="purple" />
                  <KpiCard title="Average Payment" value={dashboardLoading ? "—" : money(averagePayment)} detail="Average value per payment" icon={<TrendingUp size={17} />} variant="cyan" />
                </section>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
                  <section className="rounded-[20px] border border-cyan-100/[0.09] bg-[#061522]/75 p-5">
                    <div className="flex items-center justify-between">
                      <div><h3 className="text-[13px] font-semibold text-white">Income Distribution</h3><p className="mt-1 text-[8px] text-slate-500">How your freelance income is currently allocated</p></div>
                      <Activity size={17} className="text-cyan-300" />
                    </div>
                    <AnalyticsBar label="Processed safely" amount={money(processedIncome)} percentage={processedPercentage} tone="green" />
                    <AnalyticsBar label="Available for conversion" amount={money(availableIncome)} percentage={availablePercentage} tone="purple" />
                  </section>

                  <section className="relative overflow-hidden rounded-[20px] border border-emerald-300/[0.12] bg-[#061522]/75 p-5">
                    <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-emerald-400/[0.06] blur-3xl" />
                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/10"><ShieldCheck size={18} className="text-emerald-300" /></div>
                        <div><h3 className="text-[12px] font-semibold text-white">Financial Health</h3><p className="mt-1 text-[7px] text-slate-500">Saathi safety overview</p></div>
                      </div>
                      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto mt-7 grid h-[125px] w-[125px] place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/[0.05] shadow-[0_0_45px_rgba(52,211,153,0.08)]">
                        <div className="text-center"><p className="text-[30px] font-bold text-emerald-200">{processedPercentage}%</p><p className="mt-1 text-[7px] uppercase tracking-[0.12em] text-slate-500">Protected</p></div>
                      </motion.div>
                      <div className="mt-7 space-y-3">
                        <AnalyticsStatus label="Guardian Agent" value="Active" />
                        <AnalyticsStatus label="Human Authorization" value="Enabled" />
                        <AnalyticsStatus label="Pending Approvals" value={String(pendingApprovalCount)} />
                        <AnalyticsStatus label="Available Payments" value={String(availablePaymentCount)} />
                      </div>
                    </div>
                  </section>
                </div>

                <section className="mt-4 rounded-[20px] border border-violet-300/[0.12] bg-gradient-to-br from-violet-500/[0.055] via-[#061522] to-cyan-400/[0.035] p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10"><BrainCircuit size={19} className="text-violet-300" /></div>
                    <div>
                      <p className="text-[7px] font-semibold uppercase tracking-[0.17em] text-violet-300">Saathi Intelligence</p>
                      <h3 className="mt-2 text-[13px] font-semibold text-white">Financial Snapshot</h3>
                      <p className="mt-2 max-w-[850px] text-[9px] leading-5 text-slate-400">
                        You have received <strong className="text-white">{money(totalIncome)}</strong> across <strong className="text-white">{paymentCount}</strong> verified freelance payments. <strong className="text-emerald-300">{money(processedIncome)}</strong> has been processed safely and <strong className="text-violet-300">{money(availableIncome)}</strong> is currently available for conversion. {pendingApprovalCount > 0 ? `${pendingApprovalCount} Guardian approval request${pendingApprovalCount === 1 ? " is" : "s are"} waiting for your decision.` : "There are currently no pending Guardian approvals."}
                      </p>
                    </div>
                  </div>
                </section>
              </motion.div>
            ) : (
              <WorkspaceView
                section={activeSection}
                income={income}
                payments={payments}
                approvals={approvals}
                transactions={transactions}
                loading={workspaceLoading || dashboardLoading}
                error={workspaceError}
                chatMessages={chatMessages}
                message={message}
                setMessage={setMessage}
                chatLoading={chatLoading}
                chatError={chatError}
                onSend={handleSendMessage}
                actionableApproval={actionableApproval}
                decisionLoading={decisionLoading}
                onDecision={handleApprovalDecision}
                onGenerateReceipt={generateReceipt}
                documentNotice={documentNotice}
                onAddPayment={() => setPaymentModalOpen(true)}
                paymentNotice={paymentNotice}
                paymentNoticeType={paymentNoticeType}
              />
            )}

          </div>

        </section>

        {paymentModalOpen && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => !paymentSaving && setPaymentModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-[460px] rounded-[22px] border border-cyan-200/[0.16] bg-[#071725] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Live Backend</p><h3 className="mt-2 text-[20px] font-semibold text-white">Record Payment</h3><p className="mt-1 text-[8px] text-slate-500">Add verified freelance income to your production ledger.</p></div>
                <button type="button" onClick={() => setPaymentModalOpen(false)} disabled={paymentSaving} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-slate-400 hover:text-white"><X size={15} /></button>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block"><span className="text-[8px] text-slate-400">Amount (USD)</span><input autoFocus inputMode="decimal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="500.00" className="mt-2 w-full rounded-xl border border-cyan-100/[0.12] bg-[#03101a] px-4 py-3 text-[11px] text-white outline-none focus:border-cyan-300/35" /></label>
                <label className="block"><span className="text-[8px] text-slate-400">Platform / Client Source</span><input value={paymentPlatform} onChange={(e) => setPaymentPlatform(e.target.value)} placeholder="Upwork" className="mt-2 w-full rounded-xl border border-cyan-100/[0.12] bg-[#03101a] px-4 py-3 text-[11px] text-white outline-none focus:border-cyan-300/35" /></label>
                <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.04] px-3 py-2 text-[7px] leading-4 text-slate-400">Sandbox financial record only. Guardian approval is still required before any mock conversion can execute.</div>
                <button type="button" onClick={() => void handleAddPayment()} disabled={paymentSaving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 py-3 text-[9px] font-bold text-[#03110f] disabled:opacity-40"><Plus size={14} />{paymentSaving ? "Recording..." : "Record Payment"}</button>
              </div>
            </motion.div>
          </div>
        )}

      </div>

    </main>
  );
}

function WorkspaceView({
  section,
  income,
  payments,
  approvals,
  transactions,
  loading,
  error,
  chatMessages,
  message,
  setMessage,
  chatLoading,
  chatError,
  onSend,
  actionableApproval,
  decisionLoading,
  onDecision,
  onGenerateReceipt,
  documentNotice,
  onAddPayment,
  paymentNotice,
  paymentNoticeType,
}: {
  section: SectionName;
  income: IncomeSummary | null;
  payments: Payment[];
  approvals: Approval[];
  transactions: BankTransaction[];
  loading: boolean;
  error: string;
  chatMessages: ChatMessage[];
  message: string;
  setMessage: (value: string) => void;
  chatLoading: boolean;
  chatError: string;
  onSend: (customMessage?: string) => Promise<void>;
  actionableApproval: Approval | null;
  decisionLoading: boolean;
  onDecision: (decision: "APPROVED" | "REJECTED") => Promise<void>;
  onGenerateReceipt: (transactionId: string) => Promise<void>;
  documentNotice: string;
  onAddPayment: () => void;
  paymentNotice: string;
  paymentNoticeType: "success" | "error" | "";
}) {
  const titleMap: Record<SectionName, string> = {
    Dashboard: "Dashboard",
    "AI Saathi": "AI Saathi",
    Income: "Income Intelligence",
    Payments: "Payments",
    Approvals: "Guardian Approvals",
    Transactions: "Transactions",
    Documents: "Documents & Receipts",
    Analytics: "Analytics",
  };
  const subtitleMap: Record<SectionName, string> = {
    Dashboard: "Your financial command center",
    "AI Saathi": "Talk to your context-aware financial assistant",
    Income: "Understand what you earned, processed and can convert",
    Payments: "Verified freelance payment history from your backend",
    Approvals: "Human authorization gate for every financial action",
    Transactions: "Auditable mock-bank conversion history",
    Documents: "Generate and download transaction receipts",
    Analytics: "Live financial intelligence",
  };
  const total = income?.total_income ?? 0;
  const processed = income?.processed_amount ?? 0;
  const available = income?.available_for_conversion ?? 0;

  if (section === "AI Saathi") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <PageHeader icon={<Sparkles size={18} />} title="AI Saathi" subtitle={subtitleMap[section]} badge="AGENTIC AI" />
        <section className="mt-4 overflow-hidden rounded-[22px] border border-cyan-200/[0.12] bg-[#061522]/80">
          <div className="flex items-center gap-3 border-b border-white/[0.055] px-5 py-4">
            <SaathiLogo size={42} animated showGlow />
            <div><p className="text-[12px] font-semibold text-white">Freelancer Saathi</p><p className="mt-1 text-[7px] text-emerald-300">● Financial context connected</p></div>
          </div>
          <div className="max-h-[520px] min-h-[360px] space-y-3 overflow-y-auto p-5">
            {chatMessages.map((chat, index) => (
              <div key={`${chat.role}-${index}`} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-[10px] leading-5 ${chat.role === "user" ? "rounded-tr-sm border border-violet-300/20 bg-violet-500/[0.12] text-slate-100" : "rounded-tl-sm border border-cyan-100/[0.11] bg-[#10263a]/80 text-slate-200"}`}>
                  <p className={`mb-1 text-[7px] font-semibold ${chat.role === "user" ? "text-violet-300" : "text-cyan-300"}`}>{chat.role === "user" ? "You" : "Freelancer Saathi"}</p>
                  {chat.content}
                </div>
              </div>
            ))}
            {chatLoading && <div className="text-[8px] text-cyan-300">Saathi is thinking...</div>}
            {chatError && <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2 text-[7px] text-amber-200">AI is temporarily rate-limited; deterministic financial features remain available.</div>}
          </div>
          <div className="border-t border-white/[0.055] p-3">
            <div className="flex gap-2 rounded-xl border border-cyan-200/[0.18] bg-[#071725] p-1.5">
              <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void onSend(); } }} placeholder="Ask Saathi about your finances..." className="min-w-0 flex-1 bg-transparent px-3 text-[9px] text-white outline-none placeholder:text-slate-600" />
              <button type="button" onClick={() => void onSend()} disabled={!message.trim() || chatLoading} className="grid h-9 w-14 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-emerald-400 text-[#03110f] disabled:opacity-30"><Send size={15} /></button>
            </div>
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <PageHeader
        icon={section === "Income" ? <WalletCards size={18} /> : section === "Payments" ? <CircleDollarSign size={18} /> : section === "Approvals" ? <ShieldCheck size={18} /> : section === "Transactions" ? <ArrowLeftRight size={18} /> : <FileText size={18} />}
        title={titleMap[section]}
        subtitle={subtitleMap[section]}
        badge="LIVE BACKEND"
      />
      {error && <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-[8px] text-amber-200">{error}</div>}

      {section === "Income" && (
        <>
          <section className="mt-4 grid gap-3 md:grid-cols-3">
            <KpiCard title="7-Day Income" value={loading ? "—" : money(total)} detail={`${income?.payment_count ?? 0} verified payments`} icon={<WalletCards size={17} />} variant="cyan" />
            <KpiCard title="Available" value={loading ? "—" : money(available)} detail={`${income?.available_payment_count ?? 0} payment(s) ready`} icon={<CircleDollarSign size={17} />} variant="purple" />
            <KpiCard title="Processed Safely" value={loading ? "—" : money(processed)} detail="Protected by Guardian + audit" icon={<ShieldCheck size={17} />} variant="green" />
          </section>
          <DataPanel title="Income Timeline" subtitle="Latest verified freelance payments">
            <PaymentRows payments={payments} />
          </DataPanel>
        </>
      )}

      {section === "Payments" && (
        <>
          {paymentNotice && <div className={`mt-4 rounded-xl border px-4 py-3 text-[8px] ${paymentNoticeType === "error" ? "border-red-400/20 bg-red-500/[0.07] text-red-200" : "border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-200"}`}>{paymentNotice}</div>}
          <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-cyan-300/[0.12] bg-gradient-to-r from-cyan-400/[0.05] to-violet-500/[0.04] p-4">
            <div><p className="text-[10px] font-semibold text-white">Record freelance income</p><p className="mt-1 text-[7px] text-slate-500">Add a USD payment and immediately sync Income, Analytics and Guardian.</p></div>
            <button type="button" onClick={onAddPayment} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2.5 text-[8px] font-bold text-[#03110f] shadow-[0_0_22px_rgba(34,211,238,0.12)]"><Plus size={14} /> Add Payment</button>
          </section>
          <DataPanel title="Payment Ledger" subtitle={`${payments.length} payment record(s) loaded`}><PaymentRows payments={payments} /></DataPanel>
        </>
      )}

      {section === "Approvals" && (
        <DataPanel title="Guardian Authorization Queue" subtitle="No financial action executes without explicit approval">
          <div className="space-y-2">
            {approvals.length === 0 ? <EmptyState text="No approval records found." /> : [...approvals].sort((a,b)=>b.id-a.id).map((approval) => {
              const isActionable = actionableApproval?.id === approval.id;
              return <div key={approval.id} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold text-white">Approval #{approval.id}</p><StatusPill status={approval.status} /></div><p className="mt-2 text-[9px] text-slate-300">{money(Number(approval.amount))} {approval.currency} • {approval.action_type}</p><p className="mt-1 max-w-3xl text-[7px] leading-4 text-slate-500">{approval.reason}</p></div>
                {isActionable ? <div className="flex gap-2"><button disabled={decisionLoading} onClick={() => void onDecision("REJECTED")} className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-[8px] text-red-300 disabled:opacity-30">Reject</button><button disabled={decisionLoading} onClick={() => void onDecision("APPROVED")} className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-[8px] font-bold text-white disabled:opacity-30">Approve & Execute</button></div> : <span className="text-[7px] text-slate-600">{approval.status?.toUpperCase() === "PENDING" ? "Not matched to current available funds" : "Decision recorded"}</span>}
              </div>;
            })}
          </div>
        </DataPanel>
      )}

      {section === "Transactions" && (
        <DataPanel title="Transaction Ledger" subtitle={`${transactions.length} mock-bank transaction(s) recorded`}>
          <TransactionRows transactions={transactions} />
        </DataPanel>
      )}

      {section === "Documents" && (
        <DataPanel title="Receipt Center" subtitle="Generate auditable PDF receipts for completed transactions">
          {documentNotice && <div className="mb-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-2 text-[8px] text-cyan-100">{documentNotice}</div>}
          <div className="space-y-2">
            {transactions.length === 0 ? <EmptyState text="No completed transactions are available for receipts." /> : transactions.map((tx) => <div key={tx.transaction_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-4"><div><p className="text-[9px] font-semibold text-white">{tx.transaction_id}</p><p className="mt-1 text-[7px] text-slate-500">{money(Number(tx.source_amount), tx.source_currency || "USD")} → {Number(tx.target_amount || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} {tx.target_currency || "PKR"}</p></div><button onClick={() => void onGenerateReceipt(tx.transaction_id)} className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-[8px] font-semibold text-cyan-200 hover:bg-cyan-300/[0.12]"><FileText size={13} /> Generate / Download PDF</button></div>)}
          </div>
        </DataPanel>
      )}
    </motion.div>
  );
}

function NotificationItem({ title, detail, tone }: { title: string; detail: string; tone: "cyan" | "green" | "amber" | "red" }) {
  const dot = tone === "amber" ? "bg-amber-300" : tone === "red" ? "bg-red-400" : tone === "green" ? "bg-emerald-300" : "bg-cyan-300";
  return <div className="flex gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.035]"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} /><div><p className="text-[8px] font-semibold text-white">{title}</p><p className="mt-1 text-[7px] leading-4 text-slate-500">{detail}</p></div></div>;
}

function PageHeader({ icon, title, subtitle, badge }: { icon: ReactNode; title: string; subtitle: string; badge: string }) {
  return <section className="relative overflow-hidden rounded-[22px] border border-cyan-100/[0.09] bg-[#061522]/75 p-6"><div className="pointer-events-none absolute right-[-70px] top-[-90px] h-64 w-64 rounded-full bg-cyan-400/[0.055] blur-[90px]" /><div className="relative flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[7px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{icon} Freelancer Saathi</div><h2 className="mt-3 text-[30px] font-bold tracking-[-0.045em] text-white">{title}</h2><p className="mt-2 text-[9px] text-slate-400">{subtitle}</p></div><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.055] px-3 py-2 text-[7px] font-bold text-emerald-200">● {badge}</span></div></section>;
}

function DataPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="mt-4 rounded-[20px] border border-cyan-100/[0.09] bg-[#061522]/75 p-5"><div className="mb-4"><h3 className="text-[13px] font-semibold text-white">{title}</h3><p className="mt-1 text-[8px] text-slate-500">{subtitle}</p></div>{children}</section>;
}

function PaymentRows({ payments }: { payments: Payment[] }) {
  if (!payments.length) return <EmptyState text="No payments found." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b border-white/[0.06] text-[7px] uppercase tracking-[0.12em] text-slate-600"><th className="px-3 py-3">ID</th><th className="px-3 py-3">Platform</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">State</th><th className="px-3 py-3">Received</th></tr></thead><tbody>{[...payments].sort((a,b)=>b.id-a.id).map((payment)=><tr key={payment.id} className="border-b border-white/[0.04] text-[9px] text-slate-300"><td className="px-3 py-3">#{payment.id}</td><td className="px-3 py-3 font-medium text-white">{payment.platform}</td><td className="px-3 py-3 text-cyan-200">{money(Number(payment.amount), payment.currency || "USD")}</td><td className="px-3 py-3"><StatusPill status={payment.is_processed ? "PROCESSED" : payment.status || "RECEIVED"} /></td><td className="px-3 py-3 text-[7px] text-slate-500">{formatDate(payment.received_at)}</td></tr>)}</tbody></table></div>;
}

function TransactionRows({ transactions }: { transactions: BankTransaction[] }) {
  if (!transactions.length) return <EmptyState text="No transactions found." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-white/[0.06] text-[7px] uppercase tracking-[0.12em] text-slate-600"><th className="px-3 py-3">Transaction</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Rate</th><th className="px-3 py-3">Target</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{transactions.map((tx)=><tr key={tx.transaction_id} className="border-b border-white/[0.04] text-[9px] text-slate-300"><td className="px-3 py-3 font-medium text-white">{tx.transaction_id}</td><td className="px-3 py-3">{money(Number(tx.source_amount), tx.source_currency || "USD")}</td><td className="px-3 py-3 text-cyan-200">{Number(tx.exchange_rate || 0).toFixed(2)}</td><td className="px-3 py-3">{Number(tx.target_amount || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} {tx.target_currency || "PKR"}</td><td className="px-3 py-3"><StatusPill status={tx.status} /></td></tr>)}</tbody></table></div>;
}

function StatusPill({ status }: { status: string }) {
  const normalized = (status || "UNKNOWN").toUpperCase();
  const cls = normalized === "COMPLETED" || normalized === "APPROVED" || normalized === "PROCESSED" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : normalized === "REJECTED" || normalized === "FAILED" ? "border-red-300/20 bg-red-400/10 text-red-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[6px] font-bold ${cls}`}>{normalized}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] px-4 py-8 text-center text-[8px] text-slate-500">{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

/* =========================================================
   KPI CARD
========================================================= */

function AnalyticsStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.055] bg-white/[0.018] px-3 py-2.5">
      <span className="text-[7px] text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        <span className="text-[8px] font-semibold text-slate-200">{value}</span>
      </div>
    </div>
  );
}

function AnalyticsBar({ label, amount, percentage, tone }: { label: string; amount: string; percentage: number; tone: "green" | "purple" }) {
  const barClass = tone === "green"
    ? "bg-gradient-to-r from-emerald-500 to-cyan-300 shadow-[0_0_18px_rgba(52,211,153,0.3)]"
    : "bg-gradient-to-r from-violet-500 to-cyan-300 shadow-[0_0_18px_rgba(139,92,246,0.3)]";
  const valueClass = tone === "green" ? "text-emerald-200" : "text-violet-200";
  return (
    <div className="mt-7">
      <div className="flex items-end justify-between gap-3">
        <div><p className="text-[7px] uppercase tracking-[0.15em] text-slate-500">{label}</p><p className={`mt-2 text-[25px] font-bold ${valueClass}`}>{percentage}%</p></div>
        <p className="text-[7px] text-slate-500">{amount}</p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.045]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percentage, 100)}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${barClass}`} />
      </div>
    </div>
  );
}

type KpiCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
  variant:
    | "cyan"
    | "purple"
    | "green";
};

function KpiCard({
  title,
  value,
  detail,
  icon,
  variant,
}: KpiCardProps) {

  const styles = {
    cyan: {
      card:
        "border-cyan-300/25 bg-gradient-to-br from-cyan-400/[0.07] via-[#071823] to-[#071525]",
      icon:
        "border-cyan-300/20 bg-cyan-300/10 text-cyan-300",
      value:
        "text-cyan-100",
      glow:
        "bg-cyan-300/[0.08]",
    },

    purple: {
      card:
        "border-violet-400/30 bg-gradient-to-br from-violet-500/[0.1] via-[#101426] to-[#15102a]",
      icon:
        "border-violet-300/20 bg-violet-400/10 text-violet-300",
      value:
        "text-violet-100",
      glow:
        "bg-violet-400/[0.1]",
    },

    green: {
      card:
        "border-emerald-300/25 bg-gradient-to-br from-emerald-400/[0.08] via-[#071a1c] to-[#062424]",
      icon:
        "border-emerald-300/20 bg-emerald-300/10 text-emerald-300",
      value:
        "text-emerald-100",
      glow:
        "bg-emerald-300/[0.08]",
    },
  }[variant];

  return (
    <motion.article
      whileHover={{
        y: -3,
      }}
      className={`relative overflow-hidden rounded-[18px] border p-4 ${styles.card}`}
    >

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex items-center gap-3">

        <div
          className={`grid h-9 w-9 place-items-center rounded-xl border ${styles.icon}`}
        >
          {icon}
        </div>

        <p className="text-[9px] font-medium text-slate-300">
          {title}
        </p>

        <TrendingUp
          size={12}
          className="ml-auto text-emerald-300"
        />

      </div>

      <p
        className={`relative mt-3 text-[26px] font-semibold tracking-[-0.04em] ${styles.value}`}
      >
        {value}
      </p>

      <p className="relative mt-1 text-[7px] text-slate-500">
        {detail}
      </p>

    </motion.article>
  );
}
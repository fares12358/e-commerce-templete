"use client";
import { useEffect, useState, useMemo } from "react";
import { getDashboardStats } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import {
  FaBoxOpen, FaChartLine, FaUser, FaHourglassStart,
  FaSync, FaUndo, FaMoneyBillWave, FaExclamationTriangle,
} from "react-icons/fa";
import OrderCard from "@/components/orders/OrderCard";
import { Line, Bar } from "react-chartjs-2";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, LineController,
  BarElement, BarController,
  Tooltip, Legend, Filler,
} from "chart.js";
import { toast } from "react-toastify";

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement, LineController,
  BarElement, BarController,
  Tooltip, Legend, Filler,
);

/* ── chart options ── */
const LINE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
    y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
  },
};

const BAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
    y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
  },
};

/* ── helpers ── */
const trendColor = (data) => {
  if (!data || data.length < 2) return "#6366f1";
  return data[data.length - 1] > data[0] ? "#22c55e"
       : data[data.length - 1] < data[0] ? "#ef4444"
       : "#f59e0b";
};

const makeLineChart = (labels, data, color) => ({
  labels,
  datasets: [{
    data,
    borderColor: color,
    backgroundColor: (ctx) => {
      const { chart } = ctx;
      const { ctx: c, chartArea } = chart;
      if (!chartArea) return null;
      const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, `${color}30`);
      g.addColorStop(1, `${color}05`);
      return g;
    },
    tension: 0.4,
    borderWidth: 2,
    fill: "origin",
    pointRadius: 3,
    pointBackgroundColor: color,
  }],
});

const makeBarChart = (labels, data, color) => ({
  labels,
  datasets: [{
    data,
    backgroundColor: `${color}99`,
    borderColor: color,
    borderWidth: 1,
    borderRadius: 4,
  }],
});

/* ── tiny row component ── */
function RefundRow({ label, val, cls }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className={`status-badge ${cls}`}>{label}</span>
      <span className="text-[15px] font-bold text-slate-900">{val ?? 0}</span>
    </div>
  );
}

/* ── page ── */
export default function DashboardPage() {
  const { dashboardStats, setDashboardStats } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [range,   setRange]   = useState("week");
  const stats = dashboardStats[range];

  const fetchStats = async (force = false) => {
    try {
      if (!force && dashboardStats[range]) return;
      setLoading(true);
      const res = await getDashboardStats(range);
      if (res.success) {
        setDashboardStats(prev => ({ ...prev, [range]: res.data }));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [range]);

  /* derived totals for the range period */
  const counter = useMemo(() => {
    if (!stats) return { orders: 0, revenue: 0, refundAmt: 0, refundCount: 0 };
    return {
      orders:      (stats?.chart?.orders?.orders  || []).reduce((s, n) => s + n, 0),
      revenue:     (stats?.chart?.income?.income  || []).reduce((s, n) => s + n, 0).toFixed(2),
      refundAmt:   (stats?.chart?.refundAmount?.amounts || []).reduce((s, n) => s + n, 0).toFixed(2),
      refundCount: (stats?.chart?.refundCount?.counts  || []).reduce((s, n) => s + n, 0),
    };
  }, [stats]);

  const ordersColor    = trendColor(stats?.chart?.orders?.orders);
  const incomeColor    = trendColor(stats?.chart?.income?.income);
  const refundColor    = "#f59e0b";
  const refundAmt      = stats?.refundedAmount   || 0;
  const grossRev       = stats?.grossRevenue      || 0;
  const netRev         = stats?.netRevenue        || 0;
  const activeRefunds  = stats?.refunds?.active   || 0;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-full w-full py-20">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} icon={<FaUser size={16} />}
          color="from-blue-800 to-blue-400"
          title="Total Users"
          value={stats?.users || 0}
        />
        <StatCard index={1} icon={<FaBoxOpen size={16} />}
          color="from-fuchsia-800 to-fuchsia-400"
          title="Total Orders"
          value={stats?.orders?.total || 0}
        />
        {/* Net revenue — excludes refunded amounts */}
        <StatCard index={2} icon={<FaChartLine size={16} />}
          color="from-pink-800 to-pink-400"
          title="Net Revenue"
          value={netRev.toFixed?.(2) || 0}
        />
        <StatCard index={3} icon={<FaHourglassStart size={16} />}
          color="from-teal-800 to-teal-400"
          title="Pending Orders"
          value={stats?.orders?.pending || 0}
        />
      </div>

      {/* ── Revenue breakdown row (gross / refunded / net) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Gross */}
        <div className="d-card text-center py-4">
          <p className="section-label mb-1">Gross Revenue</p>
          <p className="text-[22px] font-bold text-slate-900">{grossRev.toFixed(2)}</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-subtle)" }}>All delivered orders</p>
        </div>
        {/* Refunded */}
        <div className="d-card text-center py-4" style={{ borderColor: "#fbbf24" }}>
          <p className="section-label mb-1 flex items-center justify-center gap-1">
            <FaUndo size={10} style={{ color: "#b45309" }} /> Refunded Amount
          </p>
          <p className="text-[22px] font-bold" style={{ color: "#b45309" }}>
            {refundAmt > 0 ? `– ${refundAmt.toFixed(2)}` : "0.00"}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-subtle)" }}>
            {stats?.refunds?.moneyRefunded || 0} completed refund{(stats?.refunds?.moneyRefunded || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Net */}
        <div className="d-card text-center py-4" style={{ borderColor: "#4ade80" }}>
          <p className="section-label mb-1 flex items-center justify-center gap-1">
            <FaMoneyBillWave size={10} style={{ color: "#15803d" }} /> Net Revenue
          </p>
          <p className="text-[22px] font-bold" style={{ color: "#15803d" }}>{netRev.toFixed(2)}</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-subtle)" }}>After refund deductions</p>
        </div>
      </div>

      {/* ── Range selector + refresh ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <CustomSelect
          value={range}
          placeholder="Select range"
          onChange={setRange}
          options={[
            { label: "This Week",     value: "week" },
            { label: "This Month",    value: "month" },
            { label: "Last Month",    value: "lastMonth" },
            { label: "Last 3 Months", value: "threeMonths" },
          ]}
        />
        <button
          onClick={() => { if (!loading) fetchStats(true).then(() => toast.success("Refreshed")); }}
          disabled={loading}
          className="d-btn d-btn-outline gap-2"
        >
          <FaSync size={11} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Charts row 1: Orders + Revenue ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="d-card flex flex-col" style={{ height: 260 }}>
          <div className="flex items-baseline justify-between mb-4 shrink-0">
            <div>
              <p className="section-label">Orders trend</p>
              <p className="text-[22px] font-bold text-slate-900 leading-none">{counter.orders}</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Line
              data={makeLineChart(
                stats?.chart?.orders?.labels || [],
                stats?.chart?.orders?.orders || [],
                ordersColor
              )}
              options={LINE_OPTS}
            />
          </div>
        </div>

        <div className="d-card flex flex-col" style={{ height: 260 }}>
          <div className="flex items-baseline justify-between mb-4 shrink-0">
            <div>
              <p className="section-label">Revenue trend (gross, delivered orders)</p>
              <p className="text-[22px] font-bold text-slate-900 leading-none">{counter.revenue}</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Line
              data={makeLineChart(
                stats?.chart?.income?.labels || [],
                stats?.chart?.income?.income || [],
                incomeColor
              )}
              options={LINE_OPTS}
            />
          </div>
        </div>
      </div>

      {/* ── Charts row 2: Refund amount + Refund count ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Refund amount deducted per day */}
        <div className="d-card flex flex-col" style={{ height: 220 }}>
          <div className="flex items-baseline justify-between mb-3 shrink-0">
            <div>
              <p className="section-label flex items-center gap-1.5">
                <FaMoneyBillWave size={10} style={{ color: "#b45309" }} />
                Refund deductions (money sent back)
              </p>
              <p className="text-[20px] font-bold leading-none" style={{ color: "#b45309" }}>
                {counter.refundAmt > 0 ? `– ${counter.refundAmt}` : "0.00"}
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Bar
              data={makeBarChart(
                stats?.chart?.refundAmount?.labels  || [],
                stats?.chart?.refundAmount?.amounts || [],
                "#f59e0b"
              )}
              options={BAR_OPTS}
            />
          </div>
        </div>

        {/* Refund requests per day */}
        <div className="d-card flex flex-col" style={{ height: 220 }}>
          <div className="flex items-baseline justify-between mb-3 shrink-0">
            <div>
              <p className="section-label flex items-center gap-1.5">
                <FaUndo size={10} style={{ color: "#6d28d9" }} />
                Refund requests
              </p>
              <p className="text-[20px] font-bold leading-none" style={{ color: "#6d28d9" }}>
                {counter.refundCount}
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Bar
              data={makeBarChart(
                stats?.chart?.refundCount?.labels || [],
                stats?.chart?.refundCount?.counts || [],
                "#8b5cf6"
              )}
              options={BAR_OPTS}
            />
          </div>
        </div>
      </div>

      {/* ── Order status quick overview ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[
          { label: "Confirmed", val: stats?.orders?.confirmed, cls: "status-confirmed" },
          { label: "Shipped",   val: stats?.orders?.shipped,   cls: "status-shipped" },
          { label: "Delivered", val: stats?.orders?.delivered, cls: "status-delivered" },
          { label: "Cancelled", val: stats?.orders?.cancelled, cls: "status-cancelled" },
          { label: "Pending",   val: stats?.orders?.pending,   cls: "status-pending" },
        ].map(s => (
          <div key={s.label} className="d-card text-center py-3">
            <span className={`status-badge ${s.cls} mx-auto`}>{s.label}</span>
            <p className="text-[20px] font-bold text-slate-900 mt-2">{s.val ?? 0}</p>
          </div>
        ))}
      </div>

      {/* ── Refund lifecycle overview ── */}
      <div className="d-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#fef3c7" }}>
              <FaUndo size={13} style={{ color: "#b45309" }} />
            </div>
            <div>
              <p className="section-label">Refund Overview</p>
              <p className="text-[13px] font-semibold text-slate-800">All-time refund lifecycle counts</p>
            </div>
          </div>
          {/* Active refunds badge — needs admin attention */}
          {activeRefunds > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer"
              style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fbbf24" }}
              onClick={() => router.push("/orders")}
              title="View orders needing refund action"
            >
              <FaExclamationTriangle size={10} />
              {activeRefunds} need action →
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          <RefundRow label="Requested"        val={stats?.refunds?.requested}       cls="status-pending"   />
          <RefundRow label="Approved"         val={stats?.refunds?.approved}        cls="status-confirmed" />
          <RefundRow label="Product Received" val={stats?.refunds?.productReceived} cls="status-shipped"   />
          <RefundRow label="Money Refunded"   val={stats?.refunds?.moneyRefunded}   cls="status-delivered" />
          <RefundRow label="Rejected"         val={stats?.refunds?.rejected}        cls="status-cancelled" />
        </div>

        {/* Total refunded amount summary */}
        {refundAmt > 0 && (
          <div
            className="mt-4 rounded-xl p-3 flex items-center justify-between"
            style={{ background: "#fef3c7", border: "1px solid #fbbf24" }}
          >
            <p className="text-[13px] font-medium" style={{ color: "#92400e" }}>
              Total deducted from revenue
            </p>
            <p className="text-[16px] font-bold" style={{ color: "#b45309" }}>
              – {refundAmt.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* ── Latest orders (pending + active refunds) ── */}
      <div className="d-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-label">Latest Orders Needing Attention</p>
            <h3 className="text-[15px] font-semibold text-slate-900">
              Pending orders + active refund requests
            </h3>
          </div>
          <span className="status-badge status-pending">
            {stats?.latestOrders?.length ?? 0} orders
          </span>
        </div>

        {!stats?.latestOrders?.length ? (
          <div className="d-empty">No orders need attention</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {stats.latestOrders.map((order, i) => (
              <OrderCard key={order._id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

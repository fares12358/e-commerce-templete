"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { getDashboardStats } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import { FaBoxOpen, FaChartLine, FaUser, FaHourglassStart } from "react-icons/fa";
import OrderCard from "@/components/orders/OrderCard";
import { Line } from "react-chartjs-2";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAuth } from "@/context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { toast } from "react-toastify";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {

  const { dashboardStats, setDashboardStats } = useAuth();

  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("week");

  const stats = dashboardStats[range];

  /* ================= FETCH ================= */

  const fetchStats = async () => {
    try {

      if (dashboardStats[range]) return;

      setLoading(true);

      const res = await getDashboardStats(range);

      if (res.success) {
        setDashboardStats(prev => ({
          ...prev,
          [range]: res.data
        }));
      }

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  /* ================= COUNTER (Derived State) ================= */

  const counter = useMemo(() => {
    if (!stats) return { orders: 0, revenue: 0 };

    const ordersArray = stats?.chart?.orders?.orders || [];
    const incomeArray = stats?.chart?.income?.income || [];

    return {
      orders: ordersArray.reduce((sum, num) => sum + num, 0),
      revenue: incomeArray.reduce((sum, num) => sum + num, 0).toFixed(2)
    };
  }, [stats]);

  /* ================= TREND COLORS ================= */

  const getTrendColor = (data) => {
    if (!data || data.length < 2) return "#6366f1";

    const first = data[0];
    const last = data[data.length - 1];

    if (last > first) return "#22c55e";
    if (last < first) return "#ef4444";
    return "#facc15";
  };

  const trendColor = getTrendColor(stats?.chart?.orders?.orders);
  const incomeTrendColor = getTrendColor(stats?.chart?.income?.income);

  /* ================= LOADING ================= */

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} icon={<FaUser className="drop-shadow-md" size={30} />} color={'from-blue-800 to-blue-400'} title="Users" value={stats?.users || 0} />
        <StatCard index={1} icon={<FaBoxOpen className="drop-shadow-md" size={30} />} color={'from-fuchsia-800 to-fuchsia-400'} title="Total Orders" value={stats?.orders?.total || 0} />
        <StatCard index={2} icon={<FaChartLine className="drop-shadow-md" size={30} />} color={'from-pink-800 to-pink-400'} title="Revenue" value={`${stats?.revenue?.toFixed?.(2) || 0}`} />
        <StatCard index={3} icon={<FaHourglassStart className="drop-shadow-md" size={30} />} color={'from-teal-800 to-teal-400'} title="Pending Orders" value={stats?.orders?.pending || 0} />
      </div>

      <CustomSelect
        className={'ml-auto mr-0'}
        value={range}
        placeholder="Select range"
        onChange={setRange}
        options={[
          { label: "This Week", value: "week" },
          { label: "This Month", value: "month" },
          { label: "Last Month", value: "lastMonth" },
          { label: "Last 3 Months", value: "threeMonths" }
        ]}
      />

      {/* Orders Chart */}
      <div className="bg-white shadow-sm rounded-md p-4 h-[40vh] flex flex-col">
        <div className="flex items-start justify-start mb-4">
          <div className="font-medium text-md md:text-2xl">
            {counter.orders} Orders
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Line
            className="max-w-screen w-full"
            data={{
              labels: stats?.chart?.orders?.labels || [],
              datasets: [
                {
                  label: "Orders",
                  data: stats?.chart?.orders?.orders || [],
                  borderColor: trendColor,
                  backgroundColor: (ctx) => {
                    const chart = ctx.chart;
                    const { ctx: canvas, chartArea } = chart;
                    if (!chartArea) return null;

                    const g = canvas.createLinearGradient(
                      0,
                      chartArea.top,
                      0,
                      chartArea.bottom
                    );
                    g.addColorStop(0, `${trendColor}90`);
                    g.addColorStop(1, `${trendColor}25`);

                    return g;
                  },
                  tension: 0.4,
                  borderWidth: 2,
                  fill: "origin",
                  pointRadius: 4,
                  pointBackgroundColor: trendColor
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }}
          />
        </div>
      </div>

      {/* Income Chart */}
      <div className="bg-white shadow-sm rounded-md p-4 h-[40vh] flex flex-col">

        <div className="font-medium text-lg md:text-2xl mb-4">
          Revenue {counter.revenue}
        </div>

        <div className="flex-1 overflow-hidden">
          <Line
            className="max-w-screen w-full"
            data={{
              labels: stats?.chart?.income?.labels || [],
              datasets: [
                {
                  label: "Income",
                  data: stats?.chart?.income?.income || [],
                  borderColor: incomeTrendColor,
                  backgroundColor: (ctx) => {
                    const chart = ctx.chart;
                    const { ctx: canvas, chartArea } = chart;

                    if (!chartArea) return null;

                    const gradient = canvas.createLinearGradient(
                      0,
                      chartArea.top,
                      0,
                      chartArea.bottom
                    );

                    gradient.addColorStop(0, `${incomeTrendColor}90`);
                    gradient.addColorStop(1, `${incomeTrendColor}10`);

                    return gradient;
                  },
                  fill: true,
                  tension: 0.4,
                  borderWidth: 2,
                  fill: "origin",
                  pointRadius: 4,
                  pointBackgroundColor: incomeTrendColor
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }}
          />
        </div>
      </div>

      {/* Latest Orders */}
      <div className="bg-white shadow-sm rounded-md p-4">
        <div className='bg-gradient-to-br from-teal-800 to-teal-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5'>
          <span className="-rotate-12">
            <FaHourglassStart size={25} className="drop-shadow-md" />
          </span>
        </div>

        <div className="font-medium text-lg md:text-2xl mb-4">
          Latest <strong className="text-xl md:text-3xl font-bold">20</strong> Pending Orders
        </div>

        {stats?.latestOrders?.length <= 0 ? (
          <div className="text-center text-gray-500 font-semibold text-sm py-6">
            No orders yet
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stats?.latestOrders?.map((order, i) => (
              <OrderCard key={order._id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
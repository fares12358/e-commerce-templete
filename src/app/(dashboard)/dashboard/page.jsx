"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import { FaBoxOpen, FaChartLine, FaUser, FaHourglassStart } from "react-icons/fa";
import OrderCard from "@/components/orders/OrderCard";
import { Line } from "react-chartjs-2";
import CustomSelect from "@/components/ui/CustomSelect";

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const fakeWeekChart = {
  labels: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
  orders: [3, 6, 4, 9, 15, 18, 30]
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("week");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats(range);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (data) => {
    if (!data || data.length < 2) return "#6366f1";

    const first = data[0];
    const last = data[data.length - 1];

    if (last > first) return "#22c55e";   // green
    if (last < first) return "#ef4444";   // red
    return "#facc15";                     // yellow
  };

  const trendColor = getTrendColor(stats?.chart?.orders);

  useEffect(() => {
    fetchStats();
  }, [range]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} icon={<FaUser className="drop-shadow-md" size={30} />} color={'from-blue-800 to-blue-400'} title="Users" value={stats.users} />
        <StatCard index={1} icon={<FaBoxOpen className="drop-shadow-md" size={30} />} color={'from-fuchsia-800 to-fuchsia-400'} title="Orders" value={stats.orders.total} />
        <StatCard index={2} icon={<FaChartLine className="drop-shadow-md" size={30} />} color={'from-pink-800 to-pink-400'} title="Revenue" value={`$${stats.revenue}`} />
        <StatCard index={3} icon={<FaHourglassStart className="drop-shadow-md" size={30} />} color={'from-teal-800 to-teal-400'} title="Pending Orders" value={stats.orders.pending} />
      </div>
      {/* line chart */}
      <div className="bg-white shadow-sm rounded-md p-4 h-[40vh] flex flex-col">

        <div className="flex items-center justify-between mb-4">
          <div className="font-medium text-lg md:text-2xl">
            Orders Overview
          </div>

          <CustomSelect
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
        </div>

        <div className="flex-1 overflow-hidden">
          <Line
            className="max-w-screen w-full"
            data={{
              labels: fakeWeekChart.labels,
              datasets: [
                {
                  label: "Orders",
                  data: stats.chart.orders,
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
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      </div>

      {/* Latest Orders */}
      <div className="bg-white shadow-sm rounded-md p-4">
        <div
          className='bg-gradient-to-br from-teal-800 to-teal-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5'
        >
          <span className="-rotate-12">
            <FaHourglassStart size={25} className="drop-shadow-md" />
          </span>
        </div>
        <div className="font-medium text-lg md:text-2xl mb-4">Latest Pending Orders</div>

        {stats?.latestOrders?.length <= 0 ? (
          <div className="text-center text-gray-500 font-semibold text-sm py-6">
            No orders yet
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stats.latestOrders.map((order, i) => (
              <OrderCard key={order._id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

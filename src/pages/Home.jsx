import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../apis/dashboard";
import { toast } from "react-toastify";
import { 
  MdStorefront, 
  MdOutlineArticle, 
  MdBusiness, 
  MdLayers,
  MdTrendingUp,
  MdTimeline,
  MdCircle,
  MdChevronRight
} from "react-icons/md";
import Loader from "./ui/Loader";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    registrations: 0,
    parents: 0,
    tests: 0,
    categories: 0,
    registrationTrend: [],
    categoryDist: [],
    statusDist: [],
    recentRegistrations: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch {
        toast.error("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Tests & Services", count: stats.tests, icon: MdStorefront, path: "/dashboard/tests-services", color: "#3B82F6" },
    { title: "Registrations", count: stats.registrations, icon: MdOutlineArticle, path: "/dashboard/registrations", color: "#10B981" },
    { title: "Network Parents", count: stats.parents, icon: MdBusiness, path: "/dashboard/parents", color: "#8B5CF6" },
    { title: "Categories", count: stats.categories, icon: MdLayers, path: "/dashboard/tests-services", color: "#F59E0B" },
  ];

  // Simple Chart Options
  const distributionOptions = {
    chart: { type: 'pie', height: 300, backgroundColor: 'transparent' },
    title: { text: null },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: true, format: '{point.name}: {point.y}' },
        showInLegend: true
      }
    },
    series: [{
      name: 'Tests',
      colorByPoint: true,
      data: stats.categoryDist.map(item => ({ name: item.name, y: item.count }))
    }],
    credits: { enabled: false }
  };

  const trendOptions = {
    chart: { type: 'line', height: 300, backgroundColor: 'transparent' },
    title: { text: null },
    xAxis: { categories: stats.registrationTrend.map(t => t._id) },
    yAxis: { title: { text: 'Count' } },
    series: [{ name: 'Registrations', data: stats.registrationTrend.map(t => t.count), color: '#3B82F6' }],
    credits: { enabled: false }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader /></div>;
  }

  return (
    <div className="p-8 space-y-10">
      {/* Refined Header */}
      <div className="border-b pb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Summary of your pathology network</p>
      </div>

      {/* Refined Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-5"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: card.color + "08", color: card.color }}
            >
              <card.icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{card.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">{card.count}</span>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                <MdTrendingUp className="text-slate-300" size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section - Simple and Best */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 border-b pb-4">Registration Trend</h3>
          <HighchartsReact highcharts={Highcharts} options={trendOptions} />
        </div>
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 border-b pb-4">Test Distribution</h3>
          <HighchartsReact highcharts={Highcharts} options={distributionOptions} />
        </div>
      </div>

      {/* Recent Activity Table - Simplified */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-700">Recent Laboratory Onboarding</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Lab Name</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentRegistrations.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.labName}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.ownerName}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 uppercase">{item.city}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${item.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {item.status ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.recentRegistrations.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-sm font-medium">No recent registrations found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

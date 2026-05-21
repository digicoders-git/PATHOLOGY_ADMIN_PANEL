import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getSettings, updateSetting } from "../apis/dashboard";
import { toast } from "react-toastify";
import { 
  MdStorefront, 
  MdOutlineArticle, 
  MdBusiness, 
  MdLayers,
  MdTrendingUp,
  MdTimeline,
  MdCircle,
  MdCalendarToday,
  MdPeople,
  MdChevronRight,
  MdSettings,
  MdCheck,
  MdEdit,
  MdLock,
  MdClose
} from "react-icons/md";
import Loader from "./ui/Loader";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [defaultFreeBookings, setDefaultFreeBookings] = useState(10);
  const [originalFreeBookings, setOriginalFreeBookings] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const [stats, setStats] = useState({
    registrations: 0,
    parents: 0,
    tests: 0,
    categories: 0,
    bookings: 0,
    patients: 0,
    registrationTrend: [],
    categoryDist: [],
    statusDist: [],
    recentRegistrations: []
  });

  useEffect(() => {
    const fetchStatsAndSettings = async () => {
      try {
        setLoading(true);
        const [statsRes, settingsRes] = await Promise.all([
          getDashboardStats(),
          getSettings().catch(err => {
            console.error("Failed to fetch settings:", err);
            return { success: false };
          })
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (settingsRes.success && settingsRes.data.defaultFreeBookings !== undefined) {
          setDefaultFreeBookings(settingsRes.data.defaultFreeBookings);
          setOriginalFreeBookings(settingsRes.data.defaultFreeBookings);
        }
      } catch {
        toast.error("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await updateSetting("defaultFreeBookings", Number(defaultFreeBookings));
      if (res.success) {
        toast.success("Default free bookings limit updated successfully!");
        setOriginalFreeBookings(Number(defaultFreeBookings));
        setIsEditing(false);
      } else {
        toast.error(res.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const cards = [
    { title: "Total Bookings", count: stats.bookings, icon: MdCalendarToday, path: "/dashboard/bookings", color: "#10B981" },
    { title: "Total Patients", count: stats.patients, icon: MdPeople, path: "/dashboard/patients", color: "#3B82F6" },
    { title: "Registrations", count: stats.registrations, icon: MdOutlineArticle, path: "/dashboard/registrations", color: "#6366F1" },
    { title: "Network Parents", count: stats.parents, icon: MdBusiness, path: "/dashboard/parents", color: "#8B5CF6" },
    { title: "Tests & Services", count: stats.tests, icon: MdStorefront, path: "/dashboard/tests-services", color: "#F59E0B" },
    { title: "Categories", count: stats.categories, icon: MdLayers, path: "/dashboard/categories", color: "#EC4899" },
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

      {/* Dynamic Global Booking Settings Panel */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 hover:shadow-md">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600/10 text-indigo-700 rounded-lg flex items-center justify-center">
              <MdSettings size={18} />
            </span>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Global Laboratory Booking Settings</h2>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed max-w-2xl font-medium">
            Set the default free booking limit allocated to labs upon onboarding. Once a lab reaches this threshold of confirmed bookings, they must subscribe to a package to accept further appointments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto self-stretch md:self-center shrink-0">
          <div className="relative flex-1 md:flex-initial w-full sm:w-auto">
            <input
              ref={inputRef}
              type="number"
              min="0"
              disabled={!isEditing}
              value={defaultFreeBookings}
              onChange={(e) => setDefaultFreeBookings(e.target.value)}
              className={`w-full md:w-36 rounded-xl py-3 text-sm font-black text-center outline-none transition-all duration-200 ${
                isEditing 
                  ? "bg-white border-2 border-indigo-500 text-slate-800 shadow-sm pl-4 pr-12" 
                  : "bg-slate-100/80 border border-slate-200/60 text-slate-500 cursor-not-allowed select-none pl-10 pr-12"
              }`}
              placeholder="e.g. 10"
            />
            <span className="absolute right-3 top-3.5 text-[10px] font-black uppercase text-slate-400 pointer-events-none">Limit</span>
            {!isEditing && (
              <span className="absolute left-4 top-4 text-slate-400 pointer-events-none flex items-center justify-center">
                <MdLock size={14} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className={`flex-1 sm:flex-initial cursor-pointer px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MdCheck size={16} />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setDefaultFreeBookings(originalFreeBookings);
                    setIsEditing(false);
                  }}
                  disabled={saving}
                  className="flex-1 sm:flex-initial cursor-pointer px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MdClose size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto cursor-pointer px-6 py-3 bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MdEdit size={16} />
                Edit Limit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Refined Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

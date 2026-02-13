import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../apis/dashboard";
import { toast } from "react-toastify";
import { MdStorefront, MdOutlineArticle, MdBusiness } from "react-icons/md";
import Loader from "./ui/Loader";

const Home = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    registrations: 0,
    parents: 0,
    tests: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        toast.error("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Tests & Services",
      count: stats.tests,
      icon: MdStorefront,
      path: "/dashboard/tests-services",
      color: "#3B82F6", // Blue
    },
    {
      title: "Registrations",
      count: stats.registrations,
      icon: MdOutlineArticle,
      path: "/dashboard/registrations",
      color: "#10B981", // Emerald
    },
    {
      title: "Parents",
      count: stats.parents,
      icon: MdBusiness,
      path: "/dashboard/parents",
      color: "#8B5CF6", // Violet
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-10">
        <h1
          className="text-3xl font-black uppercase tracking-tight"
          style={{ color: colors.text }}
        >
          Overview
        </h1>
        <p className="text-sm opacity-60" style={{ color: colors.text }}>
          Summary of your pathology network
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className="bg-white p-6 rounded-sm border shadow-sm hover:shadow-md transition-all cursor-pointer group"
            style={{ borderColor: colors.accent + "20" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                style={{
                  backgroundColor: card.color + "15",
                  color: card.color,
                }}
              >
                <card.icon size={24} />
              </div>
              <span
                className="text-4xl font-black"
                style={{ color: colors.text }}
              >
                {card.count}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">
                Total
              </h3>
              <h2 className="text-lg font-bold" style={{ color: colors.text }}>
                {card.title}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;

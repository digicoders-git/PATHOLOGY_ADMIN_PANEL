import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  MdMenu,
  MdSettings,
  MdNotifications,
  MdClose,
  MdDashboard,
  MdLogout,
  MdPeople,
  MdStorefront,
  MdPerson,
  MdLocalHospital,
  MdOutlineArticle,
  MdOutlineCollections,
  MdOutlineVideoLibrary,
  MdChatBubble,
  MdQuestionAnswer,
  MdOutlineFormatListNumberedRtl,
  MdBusiness,
  MdHistory,
  MdAlarm,
  MdCalendarToday,
} from "react-icons/md";

import { Clock } from "./Clock";
import logoo from "../assets/logo.png";
import landLogoo from "../assets/landLogoo.png";
import { Settings, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";

const Dashboard = () => {
  const { colors, isDarkMode, toggleTheme, currentTheme, themes, setTheme } =
    useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of the dashboard!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-id");
        navigate("/");
        Swal.fire(
          "Logged Out!",
          "You have been logged out successfully.",
          "success",
        );
      }
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsOpen && !event.target.closest(".settings-modal")) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  const navLinks = [
    { name: "Dashboard", icon: MdDashboard, path: "/dashboard" },
    {
      name: "Tests & Services",
      icon: MdStorefront,
      path: "/dashboard/tests-services",
    },
    {
      name: "Registrations",
      icon: MdOutlineArticle,
      path: "/dashboard/registrations",
    },
    {
      name: "Parents",
      icon: MdBusiness,
      path: "/dashboard/parents",
    },
    { name: "Profile", icon: MdPerson, path: "/dashboard/profile" },
  ];

  const themeOptions = [
    { name: "Mono", key: "mono", color: "#000000" },
    { name: "Cyan", key: "cyan", color: "#0EA5E9" },
    { name: "Neon", key: "neon", color: "#22C55E" },
    { name: "Warm", key: "warm", color: "#C2410C" },
  ];

  return (
    <div
      className="flex h-screen relative overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-700 ease-out border-r md:relative md:z-auto flex flex-col ${
          sidebarOpen
            ? "translate-x-0 w-64 "
            : "-translate-x-full w-64 md:translate-x-0 md:w-18"
        }`}
        style={{
          backgroundColor: colors.sidebar || colors.background,
          borderColor: colors.accent + "30",
        }}
      >
        <div
          className="flex items-center justify-center border-b h-[61px] px-4"
          style={{ borderColor: colors.accent + "30" }}
        >
          {sidebarOpen ? (
            <div className="transition-all duration-500 ease-out flex items-center justify-center w-full">
              {/* <img
                src={landLogoo}
                className="max-w-[180px] h-11 object-contain"
                alt="Healing Escape"
              /> */}
              <h1 className="text-2xl font-bold">Easy Test Lab</h1>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center transition-all duration-500 overflow-hidden">
              {/* <img src={logoo} className="w-10 h-10 object-contain" alt="HE" /> */}
              <h1 className="text-2xl font-bold">Easy</h1>
            </div>
          )}
        </div>
        <nav className="mt-5 pt-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navLinks.map((link, index) => {
            if (link.submenu) {
              const isOpen = openSubmenu === link.name;
              const isAnySubmenuActive = link.submenu.some((sub) => {
                return location.pathname === sub.path;
              });

              return (
                <div key={index}>
                  <button
                    onClick={() => setOpenSubmenu(isOpen ? null : link.name)}
                    className={`flex items-center justify-between w-[93%] px-4 py-2 mx-2 rounded mb-1 transition-all duration-200 cursor-pointer ${
                      isAnySubmenuActive ? "ring-1" : ""
                    } ${!sidebarOpen ? "justify-center! w-auto!" : ""}`}
                    style={{
                      color: isAnySubmenuActive ? colors.primary : colors.text,
                      backgroundColor: isAnySubmenuActive
                        ? colors.primary + "20"
                        : "transparent",
                      ringColor: isAnySubmenuActive
                        ? colors.primary
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isAnySubmenuActive) {
                        e.target.style.backgroundColor = colors.primary + "20";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isAnySubmenuActive) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                    title={!sidebarOpen ? link.name : ""}
                  >
                    <div
                      className={`flex items-center ${
                        !sidebarOpen ? "justify-center" : ""
                      }`}
                    >
                      <link.icon className="w-5 h-5 shrink-0" />
                      <span
                        className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                          sidebarOpen
                            ? "opacity-100 w-auto"
                            : "opacity-0 w-0 overflow-hidden"
                        }`}
                      >
                        {link.name}
                      </span>
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen && sidebarOpen
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-8 mr-2 mb-2 space-y-1 pt-1">
                      {link.submenu.map((sublink, subIndex) => {
                        let isSubActive = location.pathname === sublink.path;

                        return (
                          <NavLink
                            key={subIndex}
                            to={sublink.path}
                            onClick={() => {
                              if (window.innerWidth < 768) {
                                setSidebarOpen(false);
                              }
                            }}
                            className="flex items-center px-4 py-2 rounded transition-all duration-200 cursor-pointer"
                            style={{
                              color: isSubActive ? colors.primary : colors.text,
                              backgroundColor: isSubActive
                                ? colors.primary + "10"
                                : "transparent",
                              fontSize: "13px",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) {
                                e.target.style.backgroundColor =
                                  colors.primary + "10";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) {
                                e.target.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            {sublink.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const isActive =
              location.pathname === link.path ||
              (link.path === "/dashboard" &&
                (location.pathname === "/dashboard" ||
                  location.pathname === "/dashboard/home")) ||
              (link.path === "/dashboard/registrations" &&
                (location.pathname.startsWith("/dashboard/registrations") ||
                  location.pathname.startsWith(
                    "/dashboard/registration-details",
                  ) ||
                  location.pathname.startsWith(
                    "/dashboard/create-registration",
                  ))) ||
              (link.path !== "/dashboard" &&
                location.pathname.startsWith(link.path));

            return (
              <NavLink
                key={index}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`flex items-center px-4 py-2 mx-2 rounded mb-2 transition-all duration-200 cursor-pointer ${
                  isActive ? "ring-1 shadow-sm" : ""
                } ${!sidebarOpen ? "justify-center" : ""}`}
                style={{
                  color: isActive ? colors.primary : colors.text,
                  backgroundColor: isActive
                    ? colors.primary + "20"
                    : "transparent",
                  ringColor: isActive ? colors.primary : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      colors.primary + "15";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                title={!sidebarOpen ? link.name : ""}
              >
                <link.icon className="w-5 h-5 shrink-0" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                    sidebarOpen
                      ? "opacity-100 w-auto"
                      : "opacity-0 w-0 overflow-hidden"
                  }`}
                >
                  {link.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div
          className="p-4 border-t"
          style={{ borderColor: colors.accent + "30" }}
        >
          <button
            onClick={handleLogout}
            className={`flex cursor-pointer items-center px-4 py-3 w-full rounded transition-all duration-200 font-semibold ${
              !sidebarOpen ? "justify-center" : ""
            }`}
            style={{ color: "#DC2626" }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#DC262620";
              e.target.style.color = "#B91C1C";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#DC2626";
            }}
            title={!sidebarOpen ? "Logout" : ""}
          >
            <MdLogout className="w-5 h-5 shrink-0" />
            <span
              className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                sidebarOpen
                  ? "opacity-100 w-auto"
                  : "opacity-0 w-0 overflow-hidden"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-17 border-b flex items-center px-4 md:px-6 relative"
          style={{
            backgroundColor: colors.sidebar,
            borderColor: colors.accent + "30",
          }}
        >
          <div className="flex items-center space-x-2 md:space-x-4 flex-1">
            <button
              onClick={(e) => {
                setSidebarOpen((prev) => !prev);
              }}
              className="p-2 rounded hover:bg-opacity-20 transition-colors cursor-pointer md:hidden"
              style={{
                color: colors.primary,
                zIndex: 10,
                position: "relative",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = colors.primary + "20")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              <MdMenu className="w-6 h-6" style={{ pointerEvents: "none" }} />
            </button>
            <button
              onClick={(e) => {
                setSidebarOpen((prev) => !prev);
              }}
              className="p-2 rounded hover:bg-opacity-20 transition-colors cursor-pointer hidden md:block"
              style={{
                color: colors.primary,
                zIndex: 10,
                position: "relative",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = colors.primary + "20")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              <MdMenu className="w-6 h-6" style={{ pointerEvents: "none" }} />
            </button>
            {/* <div className='flex flex-col'>
              <h1 className='text-sm md:text-xl font-semibold' style={{ color: colors.text }}>Welcome Back</h1>
              <span className='text-xs md:text-sm' style={{ color: colors.textSecondary }}>Admin</span>
            </div> */}
            <div
              className="text-sm md:text-base font-bold"
              style={{ color: colors.primary }}
            >
              <Clock />
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 flex-1 justify-end">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2  cursor-pointer rounded-lg transition-colors"
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = colors.primary + "20")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
              style={{ color: colors.primary }}
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            {/* <div className='w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center'
                 style={{ backgroundColor: colors.accent }}>
              <span className='text-white font-semibold text-sm'><img src={logoo} alt="logo" className='rounded-full' /></span>
            </div> */}
          </div>
        </header>

        <div
          className="h-full w-full p-2 md:p-0 overflow-auto scrollbar-hide"
          style={{ backgroundColor: colors.background }}
        >
          <div className="max-w-full h-full flex flex-col">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <div
        className={`settings-modal fixed top-0 right-0 w-full sm:w-80 min-h-screen z-50 transform transition-all duration-700 ease-out ${
          settingsOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        } shadow-2xl overflow-y-auto`}
        style={{ backgroundColor: colors.sidebar || colors.background }}
      >
        <div
          className="p-6 h-full min-h-screen border-l"
          style={{ borderColor: colors.accent + "30" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: colors.text }}>
              Settings
            </h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-2 rounded-lg hover:bg-opacity-20 transition-colors cursor-pointer"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = colors.accent + "20")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              <MdClose className="w-6 h-6 cursor-pointer" />
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="mb-8">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.text }}
            >
              Appearance
            </h3>
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: colors.accent + "10" }}
            >
              <span style={{ color: colors.text }}>Dark Mode</span>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 cursor-pointer rounded-full transition-all duration-300 relative ${
                  isDarkMode ? "bg-opacity-100" : "bg-opacity-30"
                }`}
                style={{ backgroundColor: colors.primary }}
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300 ${
                    isDarkMode ? "translate-x-6" : "translate-x-0.5"
                  }`}
                  style={{
                    backgroundColor:
                      currentTheme === "mono"
                        ? isDarkMode
                          ? "#000000"
                          : "#ffffff"
                        : isDarkMode
                          ? "#ffffff"
                          : "#000000",
                  }}
                ></div>
              </button>
            </div>
          </div>

          {/* Color Themes */}
          <div>
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.text }}
            >
              Color Theme
            </h3>
            <div className="space-y-3">
              {themeOptions.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => setTheme(theme.key)}
                  className={`w-full cursor-pointer flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-opacity-20 ${
                    currentTheme === theme.key ? "ring-2" : ""
                  }`}
                  style={{
                    backgroundColor: colors.accent + "10",
                    ringColor:
                      currentTheme === theme.key
                        ? colors.primary
                        : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== theme.key) {
                      e.target.style.backgroundColor = colors.accent + "20";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.accent + "10";
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: theme.color }}
                    ></div>
                    <span style={{ color: colors.text }}>{theme.name}</span>
                  </div>
                  {currentTheme === theme.key && (
                    <svg
                      className="w-5 h-5"
                      style={{ color: colors.primary }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

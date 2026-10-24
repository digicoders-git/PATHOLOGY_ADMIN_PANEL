import { Route, Routes, useLocation } from "react-router-dom";
import React, { Suspense, useEffect, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./dashboard/Dashboard";
import Login from "./Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppRoute } from "./routes/AppRoute";
import ScrollToTop from "./ScrollToTop";
import Loader from "./pages/ui/Loader";
import { useNotifications } from "./hooks/useNotifications";

class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const msg = error?.message || "";
    if (
      msg.includes("dynamically imported module") ||
      msg.includes("Failed to fetch") ||
      msg.includes("Loading chunk")
    ) {
      const key = "chunk_err_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <p className="text-sm font-bold text-slate-800 mb-2">
            A new version of the admin panel is available.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem("chunk_err_reload");
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Home = React.lazy(() => import("./pages/Home"));

const AppContent = () => {
  const location = useLocation();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("admin-token"));

  // Re-read token whenever route changes (e.g. after login redirect)
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    setAuthToken((prev) => (prev !== token ? token : prev));
  }, [location.pathname]);

  useNotifications(authToken);

  return (
    <ChunkErrorBoundary>
      <Suspense
        fallback={
          <div className="h-screen w-full flex items-center justify-center">
            <Loader />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            {AppRoute.map((l, i) => {
              const Com = l.component;
              return <Route key={i} path={l.path} element={<Com />} />;
            })}
          </Route>
        </Routes>
      </Suspense>
    </ChunkErrorBoundary>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <AppContent />
      <ToastContainer
        position="top-center"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ThemeProvider>
  );
};

export default App;

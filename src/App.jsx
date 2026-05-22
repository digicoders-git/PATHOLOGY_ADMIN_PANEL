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

const Home = React.lazy(() => import("./pages/Home"));

const AppContent = () => {
  const location = useLocation();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("admin-token"));

  // Re-read token whenever route changes (e.g. after login redirect)
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    setAuthToken(token);
  }, [location.pathname]);

  useNotifications(authToken);

  return (
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

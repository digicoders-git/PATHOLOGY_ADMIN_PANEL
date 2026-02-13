import { Route, Routes } from "react-router-dom";
import React, { Suspense } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./dashboard/Dashboard";
import Login from "./Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppRoute } from "./routes/AppRoute";
import ScrollToTop from "./ScrollToTop";
import Loader from "./pages/ui/Loader";

const Home = React.lazy(() => import("./pages/Home"));

const App = () => {
  return (
    <ThemeProvider>
      <ScrollToTop />
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
      <ToastContainer
        position="top-center"
        autoClose={1000}
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

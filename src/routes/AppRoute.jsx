import React from "react";
import Registrations from "../pages/Registrations";
import RegistrationDetails from "../pages/RegistrationDetails";
import CreateRegistration from "../pages/CreateRegistration";
import EditRegistration from "../pages/EditRegistration";

// Robust chunk retry wrapper: if an old chunk 404s after new deployment, auto-reload to get latest chunks
const lazyRetry = (fn) =>
  React.lazy(async () => {
    try {
      return await fn();
    } catch (err) {
      console.warn("Chunk mismatch detected, refreshing to fetch latest deployment:", err);
      const key = "chunk_retry_" + window.location.pathname;
      const isRetried = sessionStorage.getItem(key);
      if (!isRetried) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    }
  });

const Profile = lazyRetry(() => import("../pages/Profile"));
const TestsServices = lazyRetry(() => import("../pages/TestsServices"));
const Parents = lazyRetry(() => import("../pages/Parents"));
const Categories = lazyRetry(() => import("../pages/Categories"));
const Plans = lazyRetry(() => import("../pages/Plans"));
const Patients = lazyRetry(() => import("../pages/Patients"));
const Bookings = lazyRetry(() => import("../pages/Bookings"));
const Slots = lazyRetry(() => import("../pages/Slots"));
const LabTestPricing = lazyRetry(() => import("../pages/LabTestPricing"));
const Notifications = lazyRetry(() => import("../pages/Notifications"));
const Offers = lazyRetry(() => import("../pages/Offers"));
const SupportQueries = lazyRetry(() => import("../pages/SupportQueries"));

export const AppRoute = [
  { path: "profile", component: Profile },
  { path: "tests-services", component: TestsServices },
  { path: "categories", component: Categories },
  { path: "registrations", component: Registrations },
  { path: "create-registration", component: CreateRegistration },
  { path: "edit-registration/:id", component: EditRegistration },
  { path: "registration-details/:id", component: RegistrationDetails },
  { path: "parents", component: Parents },
  { path: "patients", component: Patients },
  { path: "plans", component: Plans },
  { path: "bookings", component: Bookings },
  { path: "slots", component: Slots },
  { path: "lab-test-pricing", component: LabTestPricing },
  { path: "notifications", component: Notifications },
  { path: "offers", component: Offers },
  { path: "support-queries", component: SupportQueries },
];

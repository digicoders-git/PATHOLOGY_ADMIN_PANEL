import React from "react";

const Profile = React.lazy(() => import("../pages/Profile"));
const TestsServices = React.lazy(() => import("../pages/TestsServices"));
const Registrations = React.lazy(() => import("../pages/Registrations"));
const RegistrationDetails = React.lazy(() => import("../pages/RegistrationDetails"));
const Parents = React.lazy(() => import("../pages/Parents"));
const CreateRegistration = React.lazy(() => import("../pages/CreateRegistration"));
const Categories = React.lazy(() => import("../pages/Categories"));
const EditRegistration = React.lazy(() => import("../pages/EditRegistration"));
const Plans = React.lazy(() => import("../pages/Plans"));
const Patients = React.lazy(() => import("../pages/Patients"));
const Bookings = React.lazy(() => import("../pages/Bookings"));
const Slots = React.lazy(() => import("../pages/Slots"));
const LabTestPricing = React.lazy(() => import("../pages/LabTestPricing"));
const ManagePackages = React.lazy(() => import("../pages/ManagePackages"));
const Notifications = React.lazy(() => import("../pages/Notifications"));
const Offers = React.lazy(() => import("../pages/Offers"));

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
  { path: "manage-packages", component: ManagePackages },
  { path: "notifications", component: Notifications },
  { path: "offers", component: Offers },
];

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
export const AppRoute = [
  { path: "profile", component: Profile },
  { path: "tests-services", component: TestsServices },
  { path: "categories", component: Categories },
  { path: "registrations", component: Registrations },
  { path: "create-registration", component: CreateRegistration },
  { path: "edit-registration/:id", component: EditRegistration },
  { path: "registration-details/:id", component: RegistrationDetails },
  { path: "parents", component: Parents },
  { path: "plans", component: Plans },
];

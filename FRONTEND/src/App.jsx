import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import SignIn from "./pages/Admin/SignIn";
import SignUp from "./pages/Admin/SignUp";
import Dashboard from "./pages/Admin/Dashboard";
import ClientSignIn from "./pages/Client/ClientSignIn";
import EmployeeSignIn from "./pages/Employee/EmployeeSignIn";
import RetailerSignIn from "./pages/Retailer/RetailerSignIn";
import Home from "./pages/Website/HomePage";
import About from "./pages/Website/AboutPage";
import ClientPage from "./pages/Website/ClientPage";
import Careers from "./pages/Website/CareerPage";
import Services from "./pages/Website/ServicesPage";
import Network from "./pages/Website/NetworkPage";
import ContactForm from "./pages/Website/ContactFormPage";
import RetailerDashboard from "./pages/Retailer/RetailerDashboard"
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard"
import ClientDashboard from "./pages/Client/ClientDashboard"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="dark"
      />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/clients" element={<ClientPage />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/services" element={<Services />} />
          <Route path="/network" element={<Network />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute redirectTo="/signin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/clientsignin" element={<ClientSignIn />} />
          <Route path="/employeesignin" element={<EmployeeSignIn />} />
          <Route path="/retailersignin" element={<RetailerSignIn />} />
          <Route
            path="/retailer-dashboard"
            element={
              <ProtectedRoute redirectTo="/retailersignin" tokenKey="retailer_token">
                <RetailerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-dashboard"
            element={
              <ProtectedRoute redirectTo="/employeesignin" tokenKey="token">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute redirectTo="/clientsignin" tokenKey="client_token">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  );
};

export default App;

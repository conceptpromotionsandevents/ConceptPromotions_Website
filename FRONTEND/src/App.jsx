import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from './components/ScrollToTop';
import SignIn from "./components/Admin/SignIn";
import SignUp from "./components/Admin/SignUp";
import Dashboard from "./components/Admin/Dashboard";
import ClientSignUp from "./components/Client/SignUp";
import EmployeeSignUp from "./components/Employee/SignUp";
import CampaignSignUp from "./components/Campaign/SignUp";
import RetailerSignUp from "./components/Retailer/SignUp";
import BulkUpload from "./components/Admin/BulkUpload";

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientsignup" element={<ClientSignUp />} />
        <Route path="/employeesignup" element={<EmployeeSignUp />} />
        <Route path="/campaignsignup" element={<CampaignSignUp />} />
        <Route path="/retailersignup" element={<RetailerSignUp />} />
        <Route path="/bulkupload" element={<BulkUpload />} />
      </Routes>
    </Router>
  );
};

export default App;

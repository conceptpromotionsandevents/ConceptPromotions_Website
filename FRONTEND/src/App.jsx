import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Dashboard from "./pages/Admin/Dashboard";
import SignIn from "./pages/Admin/SignIn";
import SignUp from "./pages/Admin/SignUp";
import ClientDashboard from "./pages/Client/ClientDashboard";
import ClientSignIn from "./pages/Client/ClientSignIn";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import EmployeeSignIn from "./pages/Employee/EmployeeSignIn";
import ForgotPassword from "./pages/Retailer/ForgotPassword";
import RetailerDashboard from "./pages/Retailer/RetailerDashboard";
import RetailerSignIn from "./pages/Retailer/RetailerSignIn";
import About from "./pages/Website/AboutPage";
import Careers from "./pages/Website/CareerPage";
import ClientPage from "./pages/Website/ClientPage";
import ContactForm from "./pages/Website/ContactFormPage";
import Home from "./pages/Website/HomePage";
import Network from "./pages/Website/NetworkPage";
import NotFound from "./pages/Website/NotFoundPage";
import PrivacyPolicy from "./pages/Website/PrivacyPolicyPage";
import Services from "./pages/Website/ServicesPage";

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
                    <Route path="/privacy" element={<PrivacyPolicy />} />
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
                    <Route
                        path="/employeesignin"
                        element={<EmployeeSignIn />}
                    />
                    <Route
                        path="/retailersignin"
                        element={<RetailerSignIn />}
                    />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />
                    <Route
                        path="/retailer-dashboard"
                        element={
                            <ProtectedRoute
                                redirectTo="/retailersignin"
                                tokenKey="retailer_token"
                            >
                                <RetailerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employee-dashboard"
                        element={
                            <ProtectedRoute
                                redirectTo="/employeesignin"
                                tokenKey="token"
                            >
                                <EmployeeDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/client-dashboard"
                        element={
                            <ProtectedRoute
                                redirectTo="/clientsignin"
                                tokenKey="client_token"
                            >
                                <ClientDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </>
    );
};

export default App;

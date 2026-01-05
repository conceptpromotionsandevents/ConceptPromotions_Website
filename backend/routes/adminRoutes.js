import express from "express";
import multer from "multer";

import {
    addAdmin,
    bulkAssignEmployeeRetailerToCampaign,
    bulkAssignEmployeeToRetailer,
} from "../controllers/admin/admin.controller.js";
import {
    forgotPassword,
    loginAdmin,
    resetPassword,
} from "../controllers/admin/auth.controller.js";
import {
    addCampaign,
    adminGetRetailerReportsInCampaign,
    assignCampaign,
    getAllCampaigns,
    getCampaignById,
    getCampaignRetailersWithEmployees,
    getCampaignVisitSchedules,
    updateCampaign,
    updateCampaignPayment,
} from "../controllers/admin/campaign.controller.js";
import {
    createJobPosting,
    getAdminJobs,
    getCandidateResume,
    getJobApplications,
    getSingleAdminJob,
    updateApplicationStatus,
    updateJobPosting,
} from "../controllers/admin/career.controller.js";
import { addClientAdmin } from "../controllers/admin/clientAdmin.controller.js";
import { addClientUser } from "../controllers/admin/clientUser.controller.js";
import {
    addEmployee,
    bulkAddEmployees,
    changeEmployeeStatus,
    getAllEmployees,
    updateEmployeeDates,
} from "../controllers/admin/employee.controller.js";
import {
    createAdminReport,
    downloadEmployeeRetailerMappingReport,
} from "../controllers/admin/report.controller.js";
import {
    assignEmployeeToRetailer,
    bulkRegisterRetailers,
    getAllRetailers,
    getAssignedEmployeeForRetailer,
    getEmployeeRetailerMapping,
    updateRetailerDates,
} from "../controllers/admin/retailer.controller.js";
import {
    assignVisitSchedule,
    deleteVisitSchedule,
    updateVisitScheduleDetails,
    updateVisitScheduleStatus,
} from "../controllers/admin/visitSchedule.controller.js";
import {
    adminGetReportsByRetailer,
    adminSetPaymentPlan,
    adminUpdatePaymentPlan,
    deleteEmployeeReport,
    getAllEmployeeReports,
    updateEmployeeReport,
} from "../controllers/adminController.js";
import { loginClientAdmin } from "../controllers/clientController.js";
import { getEmployeeVisitProgress } from "../controllers/employeeController.js";
import { deleteCampaign } from "../controllers/payment.controller.js";
import {
    registerRetailer,
    updateCampaignStatus,
} from "../controllers/retailerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
// router.get("/campaign/:campaignId/payments", protect, getCampaignPayments);

const upload = multer({ storage: multer.memoryStorage() });
router.get(
    "/campaign/:campaignId/employee-retailer-mapping/download",
    protect,
    downloadEmployeeRetailerMappingReport
);

router.put("/campaigns/:id", protect, updateCampaign);
router.get("/campaigns/:id", protect, getCampaignById);
router.post("/login", loginAdmin);
router.post("/add-admin", addAdmin);
router.post("/add-client-admin", protect, addClientAdmin);
router.post("/add-client-user", protect, addClientUser);
router.post("/client-admin-login", loginClientAdmin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post(
    "/admin/reports",
    protect,
    upload.fields([
        { name: "images", maxCount: 10 }, // multiple images
        { name: "billCopy", maxCount: 10 }, // single bill copy
    ]),
    createAdminReport
);
router.post("/campaigns/payment", protect, updateCampaignPayment);
router.put(
    "/reports/:reportId",
    protect,
    upload.fields([
        { name: "images", maxCount: 20 },
        { name: "billCopy", maxCount: 20 }, // <-- MULTIPLE BILL COPIES ALLOWED
    ]),
    updateEmployeeReport
);

router.post("/employees", protect, addEmployee);
router.post(
    "/employees/bulk",
    protect,
    upload.single("file"), // file key MUST be "file"
    bulkAddEmployees
);
router.get(
    "/campaign/:campaignId/retailer/:retailerId/employee",
    protect,
    getAssignedEmployeeForRetailer
);

router.post(
    "/retailers/bulk",
    protect,
    upload.single("file"),
    bulkRegisterRetailers
);
router.get(
    "/campaign/:campaignId/employee-retailer-mapping",
    protect,
    getEmployeeRetailerMapping
);

router.get("/employees", protect, getAllEmployees);

router.get("/retailers", protect, getAllRetailers);
router.post(
    "/retailers",
    protect,
    upload.fields([
        { name: "govtIdPhoto", maxCount: 1 },
        { name: "personPhoto", maxCount: 1 },
        { name: "signature", maxCount: 1 },
        { name: "outletPhoto", maxCount: 1 },
    ]),
    registerRetailer
);
router.put("/employee/status", protect, changeEmployeeStatus);
router.post(
    "/campaign/assign-employee-to-retailer",
    protect, // admin required
    assignEmployeeToRetailer
);
router.get(
    "/campaign/:campaignId/retailers-with-employees",
    protect, // admin required
    getCampaignRetailersWithEmployees
);

router.post("/campaigns", protect, addCampaign);
router.get("/campaigns", protect, getAllCampaigns);
router.delete("/campaigns/:id", protect, deleteCampaign);
router.post("/campaigns/assign", protect, assignCampaign);
router.post("/campaigns/payment", protect, updateCampaignPayment);
router.get("/admin/career/jobs/:id", protect, getSingleAdminJob);
router.patch("/campaigns/:id/status", protect, updateCampaignStatus);

router.post("/jobs", protect, createJobPosting);
router.get("/jobs", protect, getAdminJobs);
router.get("/applications", protect, getJobApplications);
router.put("/applications/:id/status", protect, updateApplicationStatus);
router.get("/applications/:id/resume", protect, getCandidateResume);
router.get("/career/jobs/:id", protect, getSingleAdminJob);
router.put("/jobs/:id", protect, updateJobPosting);

// ===========================================
//  NEW ROUTES TO UPDATE DATES (NO OTHER CHANGE)
// ===========================================
router.patch(
    "/campaigns/:campaignId/retailer/:retailerId/dates",
    protect,
    updateRetailerDates
);

router.patch(
    "/campaigns/:campaignId/employee/:employeeId/dates",
    protect,
    updateEmployeeDates
);
// ===============================
// VISIT SCHEDULE ROUTES
// ===============================
router.post("/visit-schedule/assign", protect, assignVisitSchedule);

router.patch(
    "/visit-schedule/:scheduleId/status",
    protect,
    updateVisitScheduleStatus
);

router.get("/employee/visit-progress", protect, getEmployeeVisitProgress);

router.get(
    "/campaign/:campaignId/visit-schedules",
    protect,
    getCampaignVisitSchedules
);

// ===========================================
router.get("/employee/reports", protect, getAllEmployeeReports);
router.put(
    "/visit-schedule/update/:scheduleId",
    protect, // if employee or admin protected route
    updateVisitScheduleDetails
);
router.delete(
    "/visit-schedule/delete/:scheduleId",
    protect, // optional: admin-only middleware
    deleteVisitSchedule
);

router.delete("/reports/:reportId", protect, deleteEmployeeReport);
// ===============================
// ADMIN REPORT ROUTES
// ===============================

// 1️⃣ All retailer reports in a selected campaign
router.get(
    "/reports/campaign-retailers",
    protect,
    adminGetRetailerReportsInCampaign
);

// 2️⃣ All reports submitted by one retailer
router.get("/reports/retailer/:retailerId", protect, adminGetReportsByRetailer);
router.post("/payments/set-plan", protect, adminSetPaymentPlan);
router.put("/payments/update", protect, adminUpdatePaymentPlan);

// BULK ASSIGN
router.post(
    "/campaigns/bulk-assign-employee-retailer",
    protect,
    upload.fields([{ name: "file", maxCount: 1 }]),
    bulkAssignEmployeeToRetailer
);

router.post(
    "/campaigns/bulk-assign",
    protect,
    upload.fields([
        { name: "file", maxCount: 1 }, // Excel / CSV file
    ]),
    bulkAssignEmployeeRetailerToCampaign
);

export default router;

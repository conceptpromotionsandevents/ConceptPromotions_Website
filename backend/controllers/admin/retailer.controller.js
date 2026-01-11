// admin/retailer.controller.js
import bcrypt from "bcryptjs";
import XLSX from "xlsx";
import { Retailer } from "../../models/retailer.model.js";
import { Employee, Campaign} from "../../models/user.js";

// Utility to generate unique IDs (same implementation as original)
function generateUniqueId() {
    const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const numbers = Math.floor(1000 + Math.random() * 9000);
    return `${letters}${numbers}`;
}

// ====== UPDATE RETAILER DATES (in campaign) ======
export const updateRetailerDates = async (req, res) => {
    try {
        const { campaignId, retailerId } = req.params;
        const { startDate, endDate } = req.body;

        // admin check
        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admin can update dates" });

        const campaign = await Campaign.findById(campaignId);
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        const retailerEntry = campaign.assignedRetailers.find(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!retailerEntry)
            return res
                .status(404)
                .json({ message: "Retailer not assigned to this campaign" });

        // Update only if values are provided
        if (startDate) retailerEntry.startDate = new Date(startDate);
        if (endDate) retailerEntry.endDate = new Date(endDate);
        retailerEntry.updatedAt = new Date();

        await campaign.save();

        res.status(200).json({
            message: "Retailer dates updated successfully",
            retailer: retailerEntry,
        });
    } catch (err) {
        console.error("Retailer date update error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ====== GET ALL RETAILERS ======
export const getAllRetailers = async (req, res) => {
    try {
        // Fetch ALL retailers with ALL fields
        const retailers = await Retailer.find().lean(); // full fields

        res.status(200).json({ retailers });
    } catch (err) {
        console.error("Get retailers error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== ASSIGN EMPLOYEE TO RETAILER ======
export const assignEmployeeToRetailer = async (req, res) => {
    try {
        const { campaignId, retailerId, employeeId } = req.body;

        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can assign" });
        }

        if (!campaignId || !retailerId || !employeeId) {
            return res.status(400).json({
                message: "campaignId, retailerId and employeeId are required",
            });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // -------------------------------
        // 1️⃣ Check retailer is part of campaign
        // -------------------------------
        const retailerExists = campaign.assignedRetailers.some(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!retailerExists) {
            return res.status(400).json({
                message: "Retailer is not assigned to this campaign",
            });
        }

        // -------------------------------
        // 2️⃣ Check employee is part of campaign
        // -------------------------------
        const employeeExists = campaign.assignedEmployees.some(
            (e) => e.employeeId.toString() === employeeId.toString()
        );

        if (!employeeExists) {
            return res.status(400).json({
                message: "Employee is not assigned to this campaign",
            });
        }

        // -------------------------------
        // 3️⃣ Prevent duplicate mapping
        // -------------------------------
        const alreadyMapped = campaign.assignedEmployeeRetailers.some(
            (entry) =>
                entry.employeeId.toString() === employeeId.toString() &&
                entry.retailerId.toString() === retailerId.toString()
        );

        if (alreadyMapped) {
            return res.status(400).json({
                message: "Employee is already assigned to this retailer",
            });
        }

        // -------------------------------
        // 4️⃣ Save mapping
        // -------------------------------
        campaign.assignedEmployeeRetailers.push({
            employeeId,
            retailerId,
            assignedAt: new Date(),
        });

        await campaign.save();

        res.status(200).json({
            message: "Employee assigned to retailer successfully",
            mapping: campaign.assignedEmployeeRetailers,
        });
    } catch (err) {
        console.error("Assign employee to retailer error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET EMPLOYEE–RETAILER MAPPING ======
export const getEmployeeRetailerMapping = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId)
            .select("assignedEmployeeRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // 🔒 SAFETY: ensure array always exists
        const mappings = Array.isArray(campaign.assignedEmployeeRetailers)
            ? campaign.assignedEmployeeRetailers
            : [];

        // ✅ If no mappings, return empty but VALID response
        if (mappings.length === 0) {
            return res.status(200).json({
                campaignId,
                totalEmployees: 0,
                employees: [],
            });
        }

        // Fetch employees
        const employeeIds = [...new Set(mappings.map((m) => m.employeeId))];

        const employees = await Employee.find({
            _id: { $in: employeeIds },
        }).lean();

        const employeeMap = {};
        employees.forEach((emp) => {
            employeeMap[emp._id.toString()] = {
                ...emp,
                retailers: [],
            };
        });

        // Fetch retailers
        const retailerIds = [...new Set(mappings.map((m) => m.retailerId))];

        const retailers = await Retailer.find({
            _id: { $in: retailerIds },
        }).lean();

        const retailerMap = {};
        retailers.forEach((ret) => {
            retailerMap[ret._id.toString()] = ret;
        });

        // Build employee → retailers mapping
        mappings.forEach((m) => {
            const eId = m.employeeId.toString();
            const rId = m.retailerId.toString();

            if (employeeMap[eId] && retailerMap[rId]) {
                employeeMap[eId].retailers.push({
                    ...retailerMap[rId],
                    assignedAt: m.assignedAt,
                });
            }
        });

        // Final response
        res.status(200).json({
            campaignId,
            totalEmployees: Object.keys(employeeMap).length,
            employees: Object.values(employeeMap),
        });
    } catch (err) {
        console.error("Employee→Retailer mapping fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET ASSIGNED EMPLOYEE FOR RETAILER ======
export const getAssignedEmployeeForRetailer = async (req, res) => {
    try {
        const { campaignId, retailerId } = req.params;

        // Get the campaign with employee-retailer mapping
        const campaign = await Campaign.findById(campaignId)
            .select("assignedEmployeeRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Find the employee mapped to this retailer
        const mapping = campaign.assignedEmployeeRetailers.find(
            (m) => m.retailerId.toString() === retailerId.toString()
        );

        // Retailer not assigned to any employee
        if (!mapping) {
            return res.status(200).json({
                campaignId,
                retailerId,
                isAssigned: false,
                employee: null,
                message:
                    "No employee assigned to this retailer in this campaign",
            });
        }

        // Fetch employee details now
        const employee = await Employee.findById(mapping.employeeId)
            .select("name email phone position")
            .lean();

        res.status(200).json({
            campaignId,
            retailerId,
            isAssigned: true,
            employee,
            assignedAt: mapping.assignedAt,
            message: "Employee assigned to this retailer",
        });
    } catch (err) {
        console.error("Error checking assigned employee:", err);
        res.status(500).json({ message: "Server error" });
    }
};

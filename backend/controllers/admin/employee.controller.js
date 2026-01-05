// admin/employee.controller.js
import bcrypt from "bcryptjs";
import XLSX from "xlsx";
import {
    Employee,
    Campaign,
    VisitSchedule,
    EmployeeReport,
} from "../../models/user.js";

// ====== ADD EMPLOYEE ======
export const addEmployee = async (req, res) => {
    try {
        const { name, email, contactNo, employeeType, position } = req.body;

        // Check if user is admin
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can add employees" });
        }

        // Required fields
        if (!name || !email || !contactNo || !employeeType) {
            return res.status(400).json({
                message: "Name, email, phone & employee type are required",
            });
        }

        // Validate employee type
        if (!["Permanent", "Contractual"].includes(employeeType)) {
            return res.status(400).json({ message: "Invalid employee type" });
        }

        // Check existing employee
        const existing = await Employee.findOne({
            $or: [{ email }, { phone: contactNo }],
        });

        if (existing) {
            return res.status(409).json({ message: "Employee already exists" });
        }

        // Create employee
        const newEmployee = new Employee({
            name,
            email,
            phone: contactNo,
            password: contactNo, // default password
            employeeType,
            position,
            createdByAdmin: req.user.id,
            isActive: true, // <-- automatically active
        });

        await newEmployee.save();

        res.status(201).json({
            message: "Employee added successfully",
            employee: {
                id: newEmployee._id,
                name: newEmployee.name,
                email: newEmployee.email,
                phone: newEmployee.phone,
                employeeType: newEmployee.employeeType,
                position: newEmployee.position,
                isActive: newEmployee.isActive,
            },
        });
    } catch (error) {
        console.error("Add employee error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ====== CHANGE EMPLOYEE STATUS ======
export const changeEmployeeStatus = async (req, res) => {
    try {
        const { employeeId, isActive } = req.body;

        // Validate admin
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can update employee status" });
        }

        // Validate input
        if (!employeeId || typeof isActive !== "boolean") {
            return res.status(400).json({
                message: "employeeId and isActive (true/false) are required",
            });
        }

        // Find employee by custom employeeId
        const employee = await Employee.findOne({ employeeId });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Update the status
        employee.isActive = isActive;
        await employee.save();

        res.status(200).json({
            message: `Employee has been ${
                isActive ? "activated" : "deactivated"
            } successfully`,
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                isActive: employee.isActive,
            },
        });
    } catch (error) {
        console.error("Employee status update error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ====== BULK ADD EMPLOYEES ======
export const bulkAddEmployees = async (req, res) => {
    try {
        // Only admin can bulk add
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can add employees" });
        }

        // File check
        if (!req.file) {
            return res
                .status(400)
                .json({ message: "Excel/CSV file is required" });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const employeesToInsert = [];
        const failedRows = []; // ✅ Track failed rows

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const {
                sno, // ✅ Serial number from Excel
                name,
                email,
                contactNo,
                employeeType,
                position,
                gender,
                organization, // Optional: organizationName for linking
            } = row;

            // ✅ VALIDATION - Check required fields
            const missingFields = [];
            if (!name) missingFields.push("name");
            if (!email) missingFields.push("email");
            if (!contactNo) missingFields.push("contactNo");
            if (!employeeType) missingFields.push("employeeType");

            if (missingFields.length > 0) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Missing required fields: ${missingFields.join(
                        ", "
                    )}`,
                    data: row,
                });
                continue;
            }

            // ✅ VALIDATE EMPLOYEE TYPE
            if (!["Permanent", "Contractual"].includes(employeeType)) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Invalid employeeType: '${employeeType}'. Must be 'Permanent' or 'Contractual'`,
                    data: row,
                });
                continue;
            }

            // ✅ VALIDATE EMAIL FORMAT
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Invalid email format: ${email}`,
                    data: row,
                });
                continue;
            }

            // ✅ VALIDATE CONTACT NUMBER
            const contactRegex = /^[6-9]\d{9}$/;
            if (!contactRegex.test(String(contactNo))) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Invalid contact number: ${contactNo}. Must be 10 digits starting with 6-9`,
                    data: row,
                });
                continue;
            }

            // ✅ CHECK DUPLICATES
            const exists = await Employee.findOne({
                $or: [{ email }, { phone: contactNo }],
            });

            if (exists) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Duplicate entry: Email '${email}' or Contact '${contactNo}' already exists`,
                    data: row,
                    existingEmployee: {
                        id: exists._id,
                        name: exists.name,
                        email: exists.email,
                        phone: exists.phone,
                        employeeId: exists.employeeId,
                    },
                });
                continue;
            }

            // ✅ HASH PASSWORD
            try {
                const hashedPassword = await bcrypt.hash(
                    contactNo.toString(),
                    10
                );

                // ✅ BUILD EMPLOYEE OBJECT
                employeesToInsert.push({
                    name,
                    email,
                    phone: contactNo,
                    password: hashedPassword,
                    employeeType,
                    position: position || "",
                    gender: gender || "",
                    isActive: true,
                    createdByAdmin: req.user.id,
                    isFirstLogin: true,
                });
            } catch (err) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Error processing row: ${err.message}`,
                    data: row,
                });
            }
        }

        // ✅ INSERT SUCCESSFUL ROWS
        let insertedEmployees = [];
        if (employeesToInsert.length > 0) {
            try {
                insertedEmployees = await Employee.insertMany(
                    employeesToInsert
                );
            } catch (err) {
                return res.status(500).json({
                    message: "Database insertion failed",
                    error: err.message,
                    failedRows: failedRows,
                });
            }
        }

        // ✅ COMPREHENSIVE RESPONSE
        const response = {
            success: true,
            summary: {
                totalRows: rows.length,
                successful: insertedEmployees.length,
                failed: failedRows.length,
                successRate: `${(
                    (insertedEmployees.length / rows.length) *
                    100
                ).toFixed(2)}%`,
            },
            insertedEmployees: insertedEmployees.map((emp, index) => ({
                sno: index + 1,
                id: emp._id,
                name: emp.name,
                email: emp.email,
                phone: emp.phone,
                employeeId: emp.employeeId,
                employeeType: emp.employeeType,
                position: emp.position,
                isActive: emp.isActive,
            })),
            failedRows: failedRows, // ✅ Complete failed row data with S.No
        };

        // ✅ DETERMINE STATUS CODE
        if (insertedEmployees.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No employees were added. All rows failed validation.",
                ...response,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                // 207 = Multi-Status
                success: true,
                message: `${insertedEmployees.length} employees added, ${failedRows.length} rows failed`,
                ...response,
            });
        }

        return res.status(201).json({
            success: true,
            message: `All ${insertedEmployees.length} employees added successfully`,
            ...response,
        });
    } catch (error) {
        console.error("Bulk add employees error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ====== UPDATE EMPLOYEE DATES (in campaign) ======
export const updateEmployeeDates = async (req, res) => {
    try {
        const { campaignId, employeeId } = req.params;
        const { startDate, endDate } = req.body;

        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admin can update dates" });

        const campaign = await Campaign.findById(campaignId);
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        const employeeEntry = campaign.assignedEmployees.find(
            (e) => e.employeeId.toString() === employeeId.toString()
        );

        if (!employeeEntry)
            return res
                .status(404)
                .json({ message: "Employee not assigned to this campaign" });

        // Update only provided fields
        if (startDate) employeeEntry.startDate = new Date(startDate);
        if (endDate) employeeEntry.endDate = new Date(endDate);
        employeeEntry.updatedAt = new Date();

        await campaign.save();

        res.status(200).json({
            message: "Employee dates updated successfully",
            employee: employeeEntry,
        });
    } catch (err) {
        console.error("Employee date update error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ====== GET ALL EMPLOYEES ======
export const getAllEmployees = async (req, res) => {
    try {
        // Fetch ALL employees with ALL fields
        const employees = await Employee.find().lean(); // full fields

        res.status(200).json({ employees });
    } catch (err) {
        console.error("Get employees error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET EMPLOYEE VISIT SCHEDULE ======
export const getEmployeeVisitSchedule = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const visits = await VisitSchedule.find({ employeeId })
            .populate("campaignId", "name type")
            .populate("retailerId", "name contactNo")
            .sort({ visitDate: 1 })
            .lean();

        res.status(200).json({
            employeeId,
            totalVisits: visits.length,
            visits,
        });
    } catch (err) {
        console.error("Fetch employee visits error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET EMPLOYEE VISIT PROGRESS ======
export const getEmployeeVisitProgress = async (req, res) => {
    try {
        const employeeId = req.user.id;

        const { VisitSchedule } = await import("../models/VisitSchedule.js");

        const { campaignId } = req.query;

        const filter = { employeeId };
        if (campaignId) filter.campaignId = campaignId;

        const visits = await VisitSchedule.find(filter).lean();

        const total = visits.length;
        const completed = visits.filter((v) => v.status === "Completed").length;
        const missed = visits.filter((v) => v.status === "Missed").length;
        const cancelled = visits.filter((v) => v.status === "Cancelled").length;
        const pending = visits.filter((v) => v.status === "Scheduled").length;

        const progressPercent =
            total === 0 ? 0 : Math.round((completed / total) * 100);

        res.status(200).json({
            message: "Visit progress fetched successfully",
            progress: {
                total,
                completed,
                missed,
                cancelled,
                pending,
                progressPercent,
            },
            visits,
        });
    } catch (error) {
        console.error("getEmployeeVisitProgress Error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

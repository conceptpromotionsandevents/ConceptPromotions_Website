import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import XLSX from "xlsx";
import { Retailer } from "../models/retailer.model.js";
import {
    Campaign,
    Employee,
  
    VisitSchedule,
} from "../models/user.js";
// import { Retailer } from "../models/user.js";
import {
    deleteFromCloudinary,
    uploadToCloudinary,
} from "../utils/cloudinary.config.js";
import { getResourceType } from "../utils/cloudinary.helper.js";
//   GET LOGGED-IN EMPLOYEE PROFILE
export const getEmployeeProfile = async (req, res) => {
    try {
        const employeeId = req.user.id;

        const employee = await Employee.findById(employeeId)
            .select("-password")
            .lean();

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        return res.status(200).json({
            message: "Employee profile fetched successfully",
            employee,
        });
    } catch (error) {
        console.error("❌ Get employee profile error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

// CHECK WHICH EMPLOYEE DOCUMENTS EXIST - UPDATED FOR CLOUDINARY
export const getEmployeeDocumentStatus = async (req, res) => {
    try {
        const employeeId = req.user.id;

        const employee = await Employee.findById(employeeId).select("files");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({
            hasPersonPhoto: !!employee.files?.personPhoto?.url,
            hasAadhaarFront: !!employee.files?.aadhaarFront?.url,
            hasAadhaarBack: !!employee.files?.aadhaarBack?.url,
            hasPanCard: !!employee.files?.panCard?.url,
            hasFamilyPhoto: !!employee.files?.familyPhoto?.url,
            hasBankProof: !!employee.files?.bankProof?.url,
            hasEsiForm: !!employee.files?.esiForm?.url,
            hasPfForm: !!employee.files?.pfForm?.url,
            hasEmploymentForm: !!employee.files?.employmentForm?.url,
            hasCv: !!employee.files?.cv?.url,
        });
    } catch (error) {
        console.error("❌ Get employee document status error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

// GET EMPLOYEE DOCUMENT/IMAGE - UPDATED FOR CLOUDINARY
export const getEmployeeDocument = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { documentType } = req.params;

        const validDocumentTypes = [
            "personPhoto",
            "aadhaarFront",
            "aadhaarBack",
            "panCard",
            "familyPhoto",
            "bankProof",
            "esiForm",
            "pfForm",
            "employmentForm",
            "cv",
        ];

        if (!validDocumentTypes.includes(documentType)) {
            return res.status(400).json({ message: "Invalid document type" });
        }

        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const document = employee.files?.[documentType];

        if (!document || !document.url) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Return Cloudinary URL instead of buffer
        res.status(200).json({
            url: document.url,
            publicId: document.publicId,
        });
    } catch (error) {
        console.error("❌ Get employee document error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

//  GET EMPLOYEE SINGLE CAMPAIGN STATUS
export const getEmployeeCampaignStatus = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId)
            .populate("createdBy", "name email")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const employeeEntry = campaign.assignedEmployees.find(
            (e) => e.employeeId?.toString() === employeeId.toString()
        );

        if (!employeeEntry) {
            return res.status(403).json({
                message: "You are not assigned to this campaign",
            });
        }

        res.status(200).json({
            campaignId: campaign._id,
            name: campaign.name,
            client: campaign.client,
            type: campaign.type,
            regions: campaign.regions,
            states: campaign.states,
            campaignStartDate: campaign.campaignStartDate,
            campaignEndDate: campaign.campaignEndDate,
            isActive: campaign.isActive,
            createdBy: campaign.createdBy,
            employeeStatus: {
                status: employeeEntry.status,
                assignedAt: employeeEntry.assignedAt,
                updatedAt: employeeEntry.updatedAt,
                startDate:
                    employeeEntry.startDate || campaign.campaignStartDate,
                endDate: employeeEntry.endDate || campaign.campaignEndDate,
            },
        });
    } catch (error) {
        console.error("Get employee campaign status error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// UPDATE EMPLOYEE PROFILE - UPDATED FOR CLOUDINARY
export const updateEmployeeProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const employee = await Employee.findById(id);
        if (!employee)
            return res.status(404).json({ message: "Employee not found" });

        /* --------------------------------------------------
       🔥 Step 1: Apply Contractual vs Permanent Rules
    -------------------------------------------------- */
        const isContractual = employee.employeeType === "Contractual";

        if (isContractual) {
            const blocked = [
                "highestQualification",
                "maritalStatus",
                "fathersName",
                "fatherDob",
                "motherName",
                "motherDob",
                "spouseName",
                "spouseDob",
                "child1Name",
                "child1Dob",
                "child2Name",
                "child2Dob",
                "uanNumber",
                "esiNumber",
                "pfNumber",
                "esiDispensary",
                "experiences",
            ];

            blocked.forEach((f) => delete req.body[f]);

            const blockedFiles = [
                "familyPhoto",
                "esiForm",
                "pfForm",
                "employmentForm",
                "cv",
            ];

            blockedFiles.forEach((f) => delete req.files?.[f]);
        }

        /* --------------------------------------------------
       🔥 Step 2: Simple fields (direct assignment)
    -------------------------------------------------- */
        const simpleFields = [
            "gender",
            "dob",
            "highestQualification",
            "maritalStatus",
            "fathersName",
            "fatherDob",
            "motherName",
            "motherDob",
            "spouseName",
            "spouseDob",
            "child1Name",
            "child1Dob",
            "child2Name",
            "child2Dob",
            "alternatePhone",
            "aadhaarNumber",
            "panNumber",
            "uanNumber",
            "esiNumber",
            "pfNumber",
            "esiDispensary",
            "contractLength",
        ];

        simpleFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                employee[field] = req.body[field];
            }
        });

        /* --------------------------------------------------
       🔥 Step 3: Parse nested JSON OR accept direct object
    -------------------------------------------------- */
        const parseField = (value) => {
            if (!value) return null;
            if (typeof value === "string") {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return null;
                }
            }
            if (typeof value === "object") return value;
            return null;
        };

        const corrAddr = parseField(req.body.correspondenceAddress);
        if (corrAddr) employee.correspondenceAddress = corrAddr;

        const permAddr = parseField(req.body.permanentAddress);
        if (permAddr) employee.permanentAddress = permAddr;

        const bank = parseField(req.body.bankDetails);
        if (bank) employee.bankDetails = bank;

        if (!isContractual) {
            const exp = parseField(req.body.experiences);
            if (exp) employee.experiences = exp;
        }

        /* --------------------------------------------------
       🔥 Step 4: Handle dot-notation fields (React forms)
    -------------------------------------------------- */
        const nestedFields = Object.keys(req.body).filter((key) =>
            key.includes(".")
        );

        nestedFields.forEach((key) => {
            const [parent, child] = key.split(".");
            if (!employee[parent]) employee[parent] = {};
            employee[parent][child] = req.body[key];
        });

        /* --------------------------------------------------
       🔥 Step 5: Handle File Uploads - UPDATED FOR CLOUDINARY
    -------------------------------------------------- */
        const files = req.files || {};

        if (!employee.files) employee.files = {};

        // ✅ Handle T&C
        if (req.body.tnc === "true" || req.body.tnc === true) {
            employee.tnc = true;
        }

        // ✅ Handle penny check
        if (req.body.pennyCheck === "true" || req.body.pennyCheck === true) {
            employee.pennyCheck = true;
        }

        // ✅ All file fields - CLOUDINARY UPLOAD
        const fileFields = [
            { key: "aadhaarFront", folder: "employees/aadhaar" },
            { key: "aadhaarBack", folder: "employees/aadhaar" },
            { key: "panCard", folder: "employees/pan_card" },
            { key: "personPhoto", folder: "employees/person_photos" },
            { key: "familyPhoto", folder: "employees/family_photos" },
            { key: "bankProof", folder: "employees/bank_proof" },
            { key: "esiForm", folder: "employees/forms" },
            { key: "pfForm", folder: "employees/forms" },
            { key: "employmentForm", folder: "employees/forms" },
            { key: "cv", folder: "employees/cv" },
        ];

        for (const { key, folder } of fileFields) {
            if (files[key]) {
                // Delete old file from Cloudinary if exists
                if (employee.files[key]?.publicId) {
                    await deleteFromCloudinary(
                        employee.files[key].publicId,
                        getResourceType(files[key][0].mimetype)
                    );
                }

                // Upload new file to Cloudinary
                const result = await uploadToCloudinary(
                    files[key][0].buffer,
                    folder,
                    getResourceType(files[key][0].mimetype)
                );

                employee.files[key] = {
                    url: result.secure_url,
                    publicId: result.public_id,
                };
            }
        }

        /* --------------------------------------------------
       🔥 Step 6: Password Change
    -------------------------------------------------- */
        if (req.body.newPassword && req.body.newPassword.trim().length >= 6) {
            employee.password = await bcrypt.hash(req.body.newPassword, 10);
        }

        employee.isFirstLogin = false;

        /* --------------------------------------------------
       🔥 Step 7: Save Employee
    -------------------------------------------------- */
        await employee.save();

        res.status(200).json({
            message: "Profile updated successfully",
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                employeeType: employee.employeeType,
                isFirstLogin: employee.isFirstLogin,
                tnc: employee.tnc,
                pennyCheck: employee.pennyCheck,
                bankDetails: employee.bankDetails
                    ? {
                          bankName: employee.bankDetails.bankName,
                          accountNumber: employee.bankDetails.accountNumber,
                          ifsc: employee.bankDetails.ifsc,
                          branchName: employee.bankDetails.branchName,
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error("❌ Error updating employee profile:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

// LOGIN EMPLOYEE
export const loginEmployee = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!email && !phone) {
            return res
                .status(400)
                .json({ message: "Email or phone is required" });
        }

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const employee = await Employee.findOne({
            $or: [{ email }, { phone }],
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: employee._id, role: "employee" },
            process.env.JWT_SECRET || "supremeSecretKey",
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                isFirstLogin: employee.isFirstLogin,
            },
        });
    } catch (error) {
        console.error("Employee login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//GET EMPLOYEE CAMPAIGNS
export const getEmployeeCampaigns = async (req, res) => {
    try {
        /* =========================
           AUTH CHECK (EMPLOYEE)
        ========================== */
        if (!req.user || req.user.role !== "employee") {
            return res.status(403).json({
                success: false,
                message: "Only employees can access campaigns",
            });
        }

        const employeeId = req.user.id;

        /* =========================
           VALIDATE EMPLOYEE
        ========================== */
        const employee = await Employee.findById(employeeId).select("name email");
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        /* =========================
           FETCH CAMPAIGNS
        ========================== */
        const campaigns = await Campaign.find({
            "assignedEmployees.employeeId": employeeId,
        })
            .populate("createdBy", "name email")
            .populate("assignedEmployees.employeeId", "name email")
            .populate("assignedRetailers.retailerId", "name contactNo")
            .sort({ createdAt: -1 });

        /* =========================
           MAP EMPLOYEE-SPECIFIC VIEW
        ========================== */
        const campaignsWithStatus = campaigns.map((c) => {
            const campaign = c.toObject();

            /* ---- Ensure sub-documents ---- */
            campaign.info ??= { description: "", tnc: "", banners: [] };
            campaign.info.banners ??= [];

            campaign.gratification ??= {
                type: "",
                description: "",
                images: [],
            };
            campaign.gratification.images ??= [];

            /* ---- Remove orphan refs ---- */
            campaign.assignedEmployees =
                campaign.assignedEmployees?.filter(
                    (e) => e.employeeId !== null
                ) || [];

            campaign.assignedRetailers =
                campaign.assignedRetailers?.filter(
                    (r) => r.retailerId !== null
                ) || [];

            /* ---- Employee-specific status ---- */
            const employeeEntry = campaign.assignedEmployees.find(
                (emp) =>
                    emp.employeeId &&
                    emp.employeeId._id.toString() === employeeId.toString()
            );

            return {
                ...campaign,

                employeeStatus: {
                    status: employeeEntry?.status ?? "pending",
                    startDate:
                        employeeEntry?.startDate ??
                        campaign.campaignStartDate,
                    endDate:
                        employeeEntry?.endDate ??
                        campaign.campaignEndDate,
                    assignedAt: employeeEntry?.assignedAt ?? null,
                    updatedAt: employeeEntry?.updatedAt ?? null,
                },
            };
        });

        /* =========================
           RESPONSE
        ========================== */
        res.status(200).json({
            success: true,
            message: "Campaigns fetched successfully",
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
            },
            campaigns: campaignsWithStatus,
        });
    } catch (error) {
        console.error("Get employee campaigns error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

export const updateCampaignStatus = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { campaignId } = req.params;
        const { status } = req.body;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const campaign = await Campaign.findOne({
            _id: campaignId,
            "assignedEmployees.employeeId": employeeId,
        });

        if (!campaign) {
            return res.status(404).json({
                message: "Campaign not found or not assigned to this employee",
            });
        }

        const employeeEntry = campaign.assignedEmployees.find(
            (e) => e.employeeId.toString() === employeeId
        );

        if (!employeeEntry) {
            return res
                .status(404)
                .json({ message: "Employee not assigned to this campaign" });
        }

        employeeEntry.status = status;
        employeeEntry.updatedAt = new Date();

        await campaign.save();

        res.status(200).json({
            message: `Campaign ${status} successfully`,
            campaignId,
            employeeStatus: employeeEntry.status,
        });
    } catch (error) {
        console.error("Update campaign status error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




export const getEmployeeVisitProgress = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { campaignId } = req.query;

        const filter = { employeeId };

        if (campaignId) filter.campaignId = campaignId;

        const visits = await VisitSchedule.find(filter).lean();

        if (!visits.length) {
            return res.status(200).json({
                message: "No visit schedules found",
                progress: {
                    total: 0,
                    completed: 0,
                    missed: 0,
                    cancelled: 0,
                    pending: 0,
                    progressPercent: 0,
                },
                visits: [],
            });
        }

        const total = visits.length;
        const completed = visits.filter((v) => v.status === "Completed").length;
        const missed = visits.filter((v) => v.status === "Missed").length;
        const cancelled = visits.filter((v) => v.status === "Cancelled").length;
        const pending = visits.filter((v) => v.status === "Scheduled").length;

        const progressPercent =
            total > 0 ? Math.round((completed / total) * 100) : 0;

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
        console.error("Visit progress error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

export const getAssignedRetailersForEmployee = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { campaignId } = req.query;

        const query = {
            "assignedEmployeeRetailers.employeeId": employeeId,
        };

        if (campaignId) {
            query._id = campaignId;
        }

        const campaigns = await Campaign.find(query)
            .populate(
                "assignedEmployeeRetailers.retailerId",
                "name contactNo shopDetails"
            )
            .populate("assignedEmployees.employeeId", "name email phone")
            .select("name type assignedEmployeeRetailers");

        if (!campaigns.length) {
            return res.status(200).json({
                message: "No assigned retailers found for this employee",
                campaigns: [],
            });
        }

        const result = campaigns.map((camp) => {
            const retailers = camp.assignedEmployeeRetailers
                .filter((r) => r.employeeId.toString() === employeeId)
                .map((r) => ({
                    retailerId: r.retailerId?._id,
                    name: r.retailerId?.name,
                    contactNo: r.retailerId?.contactNo,
                    shopDetails: r.retailerId?.shopDetails,
                    assignedAt: r.assignedAt,
                }));

            return {
                campaignId: camp._id,
                campaignName: camp.name,
                campaignType: camp.type,
                retailers,
            };
        });

        return res.status(200).json({
            message: "Assigned retailers fetched successfully",
            employeeId,
            campaigns: result,
        });
    } catch (error) {
        console.error("Get assigned retailers error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

export const getAllVisitSchedulesForEmployee = async (req, res) => {
    try {
        const employeeId = req.user.id;

        const schedules = await VisitSchedule.find({ employeeId })
            .populate("retailerId", "name shopDetails contactNo")
            .populate("campaignId", "name type")
            .sort({ visitDate: 1 })
            .lean();

        return res.status(200).json({
            message: "All visit schedules fetched successfully",
            schedules,
        });
    } catch (error) {
        console.error("Get all visit schedules error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};



export const getLastVisitDetails = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { retailerId, campaignId } = req.query;

        if (!retailerId || !campaignId) {
            return res.status(400).json({
                message: "retailerId and campaignId are required",
            });
        }

        const lastVisit = await VisitSchedule.findOne({
            employeeId,
            retailerId,
            campaignId,
            status: "Completed",
        })
            .sort({ visitDate: -1 })
            .populate("retailerId", "name contactNo shopDetails")
            .lean();

        const upcomingVisit = await VisitSchedule.findOne({
            employeeId,
            retailerId,
            campaignId,
            status: "Scheduled",
            visitDate: { $gte: new Date() },
        })
            .sort({ visitDate: 1 })
            .lean();

        const lastReport = await EmployeeReport.findOne({
            employeeId,
            retailerId,
            campaignId,
        })
            .sort({ createdAt: -1 })
            .lean();

        const response = {
            retailerName: lastVisit?.retailerId?.name || "N/A",
            lastVisit: lastVisit
                ? new Date(lastVisit.visitDate).toLocaleDateString()
                : "NA",
            upcomingVisit: upcomingVisit
                ? new Date(upcomingVisit.visitDate).toLocaleDateString()
                : "No upcoming visit scheduled",
            typeOfVisit: lastReport?.visitType || "N/A",
            attended: lastReport?.attended === "Yes",
            reason: lastReport?.notVisitedReason || null,
            summary: lastReport?.extraField || null,
        };

        return res.status(200).json({
            message: "Last visit details fetched successfully",
            data: response,
        });
    } catch (error) {
        console.error("Get last visit details error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

export const getScheduleReportMapping = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { campaignId } = req.query;

        if (!campaignId) {
            return res.status(400).json({
                message: "campaignId is required",
            });
        }

        const schedules = await VisitSchedule.find({
            employeeId,
            campaignId,
        })
            .populate("retailerId", "name shopDetails")
            .lean();

        const reports = await EmployeeReport.find({
            employeeId,
            campaignId,
        })
            .populate("retailerId", "name")
            .lean();

        const reportMap = {};
        reports.forEach((rep) => {
            const rid = rep.retailerId?._id?.toString();
            if (rid) reportMap[rid] = rep;
        });

        const mapping = schedules.map((schedule) => {
            const rid = schedule.retailerId?._id?.toString();

            return {
                schedule,
                report: reportMap[rid] || null,
            };
        });

        return res.status(200).json({
            message: "Schedule-report mapping fetched successfully",
            mapping,
        });
    } catch (error) {
        console.error("Mapping error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

// admin/retailer.controller.js
import XLSX from "xlsx";
import { Retailer } from "../../models/retailer.model.js";
import { Campaign, Employee } from "../../models/user.js";

// Utility to generate unique IDs (same implementation as original)
function generateUniqueId() {
    const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26)),
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
            (r) => r.retailerId.toString() === retailerId.toString(),
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
            (r) => r.retailerId.toString() === retailerId.toString(),
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
            (e) => e.employeeId.toString() === employeeId.toString(),
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
                entry.retailerId.toString() === retailerId.toString(),
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
            (m) => m.retailerId.toString() === retailerId.toString(),
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

export const bulkRegisterRetailers = async (req, res) => {
    try {
        // Only admins can bulk upload retailers
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can upload retailers" });
        }

        if (!req.file) {
            return res
                .status(400)
                .json({ message: "Excel/CSV file is required" });
        }

        // Read Excel
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
            defval: "",
        });

        const retailersToInsert = [];
        const failedRows = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Sanitize numeric fields
            const contactNo = String(row.contactNo || "")
                .replace(/[^0-9]/g, "")
                .slice(0, 10);
            const shopPincode = String(row.shopPincode || "")
                .replace(/[^0-9]/g, "")
                .slice(0, 6);
            const accountNumber = String(row.accountNumber || "").replace(
                /[^0-9]/g,
                "",
            );

            // Extract required fields from Excel
            const {
                shopName,
                shopAddress,
                shopCity,
                shopState,
                businessType,
                name,
                PANCard,
                bankName,
                IFSC,
                branchName,
            } = row;

            /* ---------------- VALIDATION ---------------- */

            const missingFields = [];

            // Required fields validation
            if (!name) missingFields.push("name");
            if (!contactNo) missingFields.push("contactNo");
            if (!shopName) missingFields.push("shopName");
            if (!shopAddress) missingFields.push("shopAddress");
            if (!shopCity) missingFields.push("shopCity");
            if (!shopState) missingFields.push("shopState");
            if (!shopPincode) missingFields.push("shopPincode");
            if (!businessType) missingFields.push("businessType");
            if (!PANCard) missingFields.push("PANCard");
            if (!bankName) missingFields.push("bankName");
            if (!accountNumber) missingFields.push("accountNumber");
            if (!IFSC) missingFields.push("IFSC");
            if (!branchName) missingFields.push("branchName");

            if (missingFields.length > 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Missing required fields: ${missingFields.join(
                        ", ",
                    )}`,
                    data: row,
                });
                continue;
            }

            // Contact validation
            const contactRegex = /^[6-9]\d{9}$/;
            if (!contactRegex.test(contactNo)) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Invalid contact number: ${contactNo}. Must be 10 digits starting with 6-9`,
                    data: row,
                });
                continue;
            }

            // Pincode validation
            if (shopPincode.length !== 6) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Invalid pincode: ${shopPincode}. Must be 6 digits`,
                    data: row,
                });
                continue;
            }

            // Duplicate check
            const exists = await Retailer.findOne({ contactNo });

            if (exists) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Duplicate: Contact number '${contactNo}' already exists`,
                    data: row,
                    existingRetailer: {
                        id: exists._id,
                        name: exists.name,
                        contactNo: exists.contactNo,
                        uniqueId: exists.uniqueId,
                        retailerCode: exists.retailerCode,
                    },
                });
                continue;
            }

            /* ---------------- BUILD RETAILER OBJECT ---------------- */
            retailersToInsert.push({
                // Personal Details
                name,
                contactNo,
                password: contactNo, // Will be hashed by pre-save hook

                // Shop Details
                shopDetails: {
                    shopName,
                    businessType,
                    PANCard,
                    shopAddress: {
                        address: shopAddress,
                        city: shopCity,
                        state: shopState,
                        pincode: shopPincode,
                    },
                },

                // Bank Details
                bankDetails: {
                    bankName,
                    accountNumber,
                    IFSC,
                    branchName,
                },

                // System Fields
                phoneVerified: false,
                tnc: false,
                pennyCheck: false,
            });
        }

        // hash passwords before saving
        for (let retailer of retailersToInsert) {
            if (retailer.password) {
                retailer.password = await bcrypt.hash(retailer.password, 10);
            }
        }

        /* ---------------- INSERT INTO DATABASE ---------------- */

        let insertedRetailers = [];
        if (retailersToInsert.length > 0) {
            try {
                console.log(
                    `📝 Attempting to insert ${retailersToInsert.length} retailers...`,
                );

                insertedRetailers = await Retailer.insertMany(
                    retailersToInsert,
                    { ordered: false },
                );

                console.log(
                    `✅ Successfully inserted ${insertedRetailers.length} retailers`,
                );
            } catch (insertError) {
                console.error("❌ Insert error:", insertError);

                // Capture successfully inserted documents
                if (insertError.insertedDocs) {
                    insertedRetailers = insertError.insertedDocs;
                    console.log(
                        `✅ Partially successful: ${insertedRetailers.length} inserted`,
                    );
                }

                // Capture failed inserts from MongoDB
                if (insertError.writeErrors) {
                    console.log(
                        `❌ Write errors found: ${insertError.writeErrors.length}`,
                    );
                    insertError.writeErrors.forEach((err) => {
                        const failedIndex = err.index;
                        const failedDoc = retailersToInsert[failedIndex];

                        let errorMsg = "Unknown database error";
                        if (err.errmsg) {
                            errorMsg = err.errmsg;
                        } else if (err.err && err.err.errmsg) {
                            errorMsg = err.err.errmsg;
                        } else if (err.message) {
                            errorMsg = err.message;
                        }

                        failedRows.push({
                            rowNumber: failedIndex + 2,
                            reason: `Database error: ${errorMsg}`,
                            data: {
                                name: failedDoc.name,
                                contactNo: failedDoc.contactNo,
                                shopName: failedDoc.shopDetails?.shopName,
                            },
                        });
                    });
                } else {
                    console.error("General MongoDB error:", {
                        name: insertError.name,
                        message: insertError.message,
                        code: insertError.code,
                    });

                    if (insertError.name === "ValidationError") {
                        const validationErrors = Object.keys(
                            insertError.errors || {},
                        )
                            .map((key) => {
                                return `${key}: ${insertError.errors[key].message}`;
                            })
                            .join(", ");

                        return res.status(400).json({
                            success: false,
                            message: "Validation error during bulk insert",
                            error: validationErrors || insertError.message,
                            failedRows: failedRows,
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        message: "Database insertion failed",
                        error: insertError.message,
                        errorDetails: {
                            name: insertError.name,
                            code: insertError.code,
                        },
                        failedRows: failedRows,
                    });
                }
            }
        }

        /* ---------------- PREPARE RESPONSE ---------------- */

        const response = {
            success: true,
            summary: {
                totalRows: rows.length,
                successful: insertedRetailers.length,
                failed: failedRows.length,
                successRate:
                    rows.length > 0
                        ? `${(
                              (insertedRetailers.length / rows.length) *
                              100
                          ).toFixed(2)}%`
                        : "0%",
            },
            insertedRetailers: insertedRetailers.map((r) => ({
                id: r._id,
                name: r.name,
                contactNo: r.contactNo,
                uniqueId: r.uniqueId,
                retailerCode: r.retailerCode,
                shopName: r.shopDetails?.shopName,
            })),
            failedRows,
        };

        /* ---------------- RETURN APPROPRIATE STATUS ---------------- */

        if (insertedRetailers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No retailers were added. All rows failed validation.",
                ...response,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                success: true,
                message: `${insertedRetailers.length} retailers added, ${failedRows.length} rows failed`,
                ...response,
            });
        }

        return res.status(201).json({
            success: true,
            message: `All ${insertedRetailers.length} retailers added successfully`,
            ...response,
        });
    } catch (error) {
        console.error("❌ Bulk retailer upload error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            stack:
                process.env.NODE_ENV === "development"
                    ? error.stack
                    : undefined,
        });
    }
};

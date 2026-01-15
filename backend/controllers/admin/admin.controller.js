// admin/admin.controller.js
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { Retailer } from "../../models/retailer.model.js";
import {
    Admin,
    Campaign,
    ClientAdmin,
    ClientUser,
    Employee,
} from "../../models/user.js";
// ====== ADD NEW ADMIN ======
export const addAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required",
            });
        }

        const existing =
            (await Admin.findOne({ email })) ||
            (await ClientAdmin.findOne({ email })) ||
            (await ClientUser.findOne({ email })) ||
            (await Retailer.findOne({ email }));

        if (existing) {
            return res.status(409).json({
                message: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
        });

        await newAdmin.save();

        return res.status(201).json({
            message: "Admin created successfully",
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
            },
        });
    } catch (error) {
        console.error("Add admin error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

const normalizeRow = (row) => {
    const clean = {};
    Object.keys(row).forEach((key) => {
        clean[key.trim()] = row[key];
    });
    return clean;
};

// ============================ Bulk Assign Employee OR Retailer to Campaign ============================

export const bulkAssignEmployeeRetailerToCampaign = async (req, res) => {
    try {
        /* --------------------------------
           ADMIN CHECK
        ---------------------------------*/
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can assign campaigns",
            });
        }

        /* --------------------------------
           FILE CHECK
        ---------------------------------*/
        const file = req.files?.file?.[0];
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Excel/CSV file is required",
            });
        }

        /* --------------------------------
           READ EXCEL
        ---------------------------------*/
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
            defval: ""
        });

        const failedRows = [];
        const successfulAssignments = [];
        let assignmentType = null; // Will be set to 'employee' or 'retailer'

        /* --------------------------------
           DETERMINE ASSIGNMENT TYPE FROM FIRST ROW
        ---------------------------------*/
        if (rawRows.length > 0) {
            const firstRow = rawRows[0];

            // Check which columns are present
            const hasEmployeeId = firstRow.hasOwnProperty('employeeId');
            const hasOutletCode = firstRow.hasOwnProperty('outletCode');

            if (hasEmployeeId && !hasOutletCode) {
                assignmentType = 'employee';
            } else if (hasOutletCode && !hasEmployeeId) {
                assignmentType = 'retailer';
            } else if (hasEmployeeId && hasOutletCode) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid template: Cannot assign both employees and retailers in the same file. Please use separate files.",
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid template: Missing required column (employeeId or outletCode)",
                });
            }
        }

        /* --------------------------------
           PROCESS EACH ROW
        ---------------------------------*/
        for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];

            // Extract only required fields (ignore extra fields like name, contactNo, State, etc.)
            const campaignName = String(row.campaignName || "").trim();
            const employeeId = assignmentType === 'employee' ? String(row.employeeId || "").trim() : null;
            const outletCode = assignmentType === 'retailer' ? String(row.outletCode || "").trim() : null;

            /* --------------------------------
               BASIC VALIDATION
            ---------------------------------*/
            const missingFields = [];
            if (!campaignName) missingFields.push("campaignName");

            if (assignmentType === 'employee' && !employeeId) {
                missingFields.push("employeeId");
            }
            if (assignmentType === 'retailer' && !outletCode) {
                missingFields.push("outletCode");
            }

            if (missingFields.length > 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Missing required fields: ${missingFields.join(", ")}`,
                    data: {
                        campaignName,
                        ...(assignmentType === 'employee' ? { employeeId } : { outletCode }),
                    },
                });
                continue;
            }

            /* --------------------------------
               FETCH CAMPAIGN (CASE-INSENSITIVE)
            ---------------------------------*/
            const campaign = await Campaign.findOne({
                name: {
                    $regex: `^${campaignName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                },
            });

            if (!campaign) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: {
                        campaignName,
                        ...(assignmentType === 'employee' ? { employeeId } : { outletCode }),
                    },
                });
                continue;
            }

            /* --------------------------------
               EMPLOYEE ASSIGNMENT LOGIC
            ---------------------------------*/
            if (assignmentType === 'employee') {
                const employee = await Employee.findOne({
                    employeeId: {
                        $regex: `^${employeeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                        $options: "i",
                    }
                });

                if (!employee) {
                    failedRows.push({
                        rowNumber: i + 2,
                        reason: `Employee not found: ${employeeId}`,
                        data: {
                            campaignName,
                            employeeId,
                        },
                    });
                    continue;
                }

                // Check if employee already assigned to this campaign
                const alreadyAssigned = campaign.assignedEmployees.some((e) =>
                    e.employeeId.equals(employee._id)
                );

                if (alreadyAssigned) {
                    failedRows.push({
                        rowNumber: i + 2,
                        reason: `Employee ${employeeId} already assigned to campaign ${campaign.name}`,
                        data: {
                            campaignName,
                            employeeId,
                        },
                    });
                    continue;
                }

                // Assign employee to campaign
                campaign.assignedEmployees.push({
                    employeeId: employee._id,
                    status: "pending",
                    assignedAt: new Date(),
                });

                // Add campaign to employee's assignedCampaigns
                if (!employee.assignedCampaigns.some((c) => c.equals(campaign._id))) {
                    employee.assignedCampaigns.push(campaign._id);
                    await employee.save();
                }

                await campaign.save();

                successfulAssignments.push({
                    campaignName: campaign.name,
                    employeeId: employee.employeeId,
                    employeeName: employee.name,
                });
            }

            /* --------------------------------
   RETAILER ASSIGNMENT LOGIC
---------------------------------*/
            if (assignmentType === 'retailer') {
                const retailer = await Retailer.findOne({
                    uniqueId: {
                        $regex: `^${outletCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                        $options: "i",
                    },
                });

                if (!retailer) {
                    failedRows.push({
                        rowNumber: i + 2,
                        reason: `Retailer not found with outlet code: ${outletCode}`,
                        data: {
                            campaignName,
                            outletCode,
                        },
                    });
                    continue;
                }

                // Check if retailer already assigned to this campaign
                const alreadyAssigned = campaign.assignedRetailers.some((r) =>
                    r.retailerId.equals(retailer._id)
                );

                if (alreadyAssigned) {
                    failedRows.push({
                        rowNumber: i + 2,
                        reason: `Retailer ${outletCode} already assigned to campaign ${campaign.name}`,
                        data: {
                            campaignName,
                            outletCode,
                        },
                    });
                    continue;
                }

                // Assign retailer to campaign
                campaign.assignedRetailers.push({
                    retailerId: retailer._id,
                    status: "pending",
                    assignedAt: new Date(),
                });

                // ✅ FIX: Add campaign to retailer's assignedCampaigns with validateModifiedOnly
                if (!retailer.assignedCampaigns.some((c) => c.equals(campaign._id))) {
                    retailer.assignedCampaigns.push(campaign._id);
                    await retailer.save({ validateModifiedOnly: true }); // ✅ Only validate modified fields
                }

                await campaign.save();

                successfulAssignments.push({
                    campaignName: campaign.name,
                    outletCode: retailer.uniqueId,
                    retailerName: retailer.name,
                    shopName: retailer.shopDetails?.shopName,
                });
            }
        }

        /* --------------------------------
           FINAL RESPONSE
        ---------------------------------*/
        const response = {
            success: true,
            summary: {
                assignmentType: assignmentType === 'employee' ? 'Employee' : 'Retailer',
                totalRows: rawRows.length,
                successful: successfulAssignments.length,
                failed: failedRows.length,
                successRate: rawRows.length > 0
                    ? `${((successfulAssignments.length / rawRows.length) * 100).toFixed(2)}%`
                    : "0%",
            },
            successfulAssignments,
            failedRows,
        };

        if (successfulAssignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No ${assignmentType}s were assigned. All rows failed validation.`,
                ...response,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                success: true,
                message: `${successfulAssignments.length} ${assignmentType}s assigned, ${failedRows.length} rows failed`,
                ...response,
            });
        }

        return res.status(201).json({
            success: true,
            message: `All ${successfulAssignments.length} ${assignmentType}s assigned successfully`,
            ...response,
        });
    } catch (error) {
        console.error("❌ Bulk campaign assignment error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};


// ============================ Bulk Assign Employee to Retailer (Mapping) ============================

export const bulkAssignEmployeeToRetailer = async (req, res) => {
    try {
        /* ---------------- ADMIN CHECK ---------------- */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can assign employees to retailers",
            });
        }

        /* ---------------- FILE CHECK ---------------- */
        const file = req.files?.file?.[0];
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Excel/CSV file is required",
            });
        }

        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
            defval: ""
        });

        const failedRows = [];
        const successfulMappings = [];

        /* ---------------- PROCESS EACH ROW ---------------- */
        for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];

            // Extract ONLY required fields (ignore extra display columns)
            const campaignName = String(row.campaignName || "").trim();
            const employeeId = String(row.employeeID || "").trim(); // Note: Template has "employeeID"
            const outletCode = String(row.outletCode || "").trim();

            /* -------- BASIC VALIDATION -------- */
            const missingFields = [];
            if (!campaignName) missingFields.push("campaignName");
            if (!employeeId) missingFields.push("employeeID");
            if (!outletCode) missingFields.push("outletCode");

            if (missingFields.length > 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Missing required fields: ${missingFields.join(", ")}`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            /* -------- FETCH CAMPAIGN (CASE-INSENSITIVE) -------- */
            const campaign = await Campaign.findOne({
                name: {
                    $regex: `^${campaignName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                },
            });

            if (!campaign) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            /* -------- FETCH EMPLOYEE (CASE-INSENSITIVE) -------- */
            const employee = await Employee.findOne({
                employeeId: {
                    $regex: `^${employeeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                }
            });

            if (!employee) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Employee not found: ${employeeId}`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            /* -------- FETCH RETAILER (CASE-INSENSITIVE using uniqueId) -------- */
            const retailer = await Retailer.findOne({
                uniqueId: {
                    $regex: `^${outletCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                },
            });

            if (!retailer) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Retailer not found with outlet code: ${outletCode}`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            /* =================================================
               🔒 STATE VALIDATIONS (CRITICAL)
            ================================================= */

            // Employee state (correspondence → permanent)
            const employeeState =
                employee.correspondenceAddress?.state ||
                employee.permanentAddress?.state;

            if (!employeeState) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: "Employee state is not filled",
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            // Retailer state
            const retailerState = retailer.shopDetails?.shopAddress?.state;

            if (!retailerState) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: "Retailer state is missing",
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            // Normalize for comparison
            const empState = employeeState.trim().toLowerCase();
            const retState = retailerState.trim().toLowerCase();
            const campaignStates = campaign.states.map((s) =>
                s.trim().toLowerCase()
            );

            // Employee state must be part of campaign
            if (!campaignStates.includes(empState)) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Employee state '${employeeState}' is not allowed for this campaign`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            // Retailer state must be part of campaign
            if (!campaignStates.includes(retState)) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Retailer state '${retailerState}' is not allowed for this campaign`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            // Employee & Retailer must be same state
            if (empState !== retState) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Employee (${employeeState}) and Retailer (${retailerState}) are not in the same state`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            /* =================================================
               🔒 BOTH MUST ALREADY BE ASSIGNED TO CAMPAIGN
            ================================================= */

            const employeeAssignedToCampaign =
                campaign.assignedEmployees.some((e) =>
                    e.employeeId.equals(employee._id)
                );

            if (!employeeAssignedToCampaign) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Employee ${employeeId} is not assigned to campaign '${campaign.name}'`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            const retailerAssignedToCampaign =
                campaign.assignedRetailers.some((r) =>
                    r.retailerId.equals(retailer._id)
                );

            if (!retailerAssignedToCampaign) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Retailer ${outletCode} is not assigned to campaign '${campaign.name}'`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            /* -------- PREVENT DUPLICATE MAPPING -------- */
            const mappingExists = campaign.assignedEmployeeRetailers.some(
                (m) =>
                    m.employeeId.equals(employee._id) &&
                    m.retailerId.equals(retailer._id)
            );

            if (mappingExists) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Mapping already exists: Employee ${employeeId} → Retailer ${outletCode}`,
                    data: {
                        campaignName,
                        employeeId,
                        outletCode,
                    },
                });
                continue;
            }

            /* -------- CREATE MAPPING -------- */
            campaign.assignedEmployeeRetailers.push({
                employeeId: employee._id,
                retailerId: retailer._id,
                assignedAt: new Date(),
            });

            await campaign.save();

            successfulMappings.push({
                campaignName: campaign.name,
                employeeId: employee.employeeId,
                employeeName: employee.name,
                outletCode: retailer.uniqueId,
                retailerName: retailer.name,
                shopName: retailer.shopDetails?.shopName,
            });
        }

        /* ---------------- FINAL RESPONSE ---------------- */
        const response = {
            success: true,
            summary: {
                totalRows: rawRows.length,
                successful: successfulMappings.length,
                failed: failedRows.length,
                successRate: rawRows.length > 0
                    ? `${((successfulMappings.length / rawRows.length) * 100).toFixed(2)}%`
                    : "0%",
            },
            successfulMappings,
            failedRows,
        };

        if (successfulMappings.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No mappings created. All rows failed validation.",
                ...response,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                success: true,
                message: `${successfulMappings.length} mappings created, ${failedRows.length} rows failed`,
                ...response,
            });
        }

        return res.status(201).json({
            success: true,
            message: `All ${successfulMappings.length} employee-retailer mappings created successfully`,
            ...response,
        });
    } catch (error) {
        console.error("❌ Bulk assign employee to retailer error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};

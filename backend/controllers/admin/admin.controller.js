// admin/admin.controller.js
import bcrypt from "bcryptjs";
import { Admin, ClientAdmin, ClientUser } from "../../models/user.js";
import { Retailer } from "../../models/retailer.model.js";

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
       FILE CHECK (upload.fields)
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
        const rawRows = XLSX.utils.sheet_to_json(sheet);

        const failedRows = [];
        let successCount = 0;

        /* --------------------------------
       PROCESS EACH ROW
    ---------------------------------*/
        for (let i = 0; i < rawRows.length; i++) {
            const row = normalizeRow(rawRows[i]);
            const { sno, campaignName, employeeId, outletCode } = row;

            /* --------------------------------
         BASIC VALIDATION
      ---------------------------------*/
            if (!campaignName || (!employeeId && !outletCode)) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "campaignName and at least one of employeeId or outletCode is required",
                    data: row,
                });
                continue;
            }

            /* --------------------------------
         FETCH CAMPAIGN (BY NAME)
      ---------------------------------*/
            const campaign = await Campaign.findOne({ name: campaignName });
            if (!campaign) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: row,
                });
                continue;
            }

            let employee = null;
            let retailer = null;

            /* --------------------------------
         FETCH EMPLOYEE (OPTIONAL)
      ---------------------------------*/
            if (employeeId) {
                employee = await Employee.findOne({ employeeId });
                if (!employee) {
                    failedRows.push({
                        sno: sno || i + 1,
                        rowNumber: i + 2,
                        reason: `Employee not found: ${employeeId}`,
                        data: row,
                    });
                    continue;
                }
            }

            /* --------------------------------
         FETCH RETAILER (OPTIONAL)
      ---------------------------------*/
            if (outletCode) {
                retailer = await Retailer.findOne({ retailerCode: outletCode });
                if (!retailer) {
                    failedRows.push({
                        sno: sno || i + 1,
                        rowNumber: i + 2,
                        reason: `Retailer not found: ${outletCode}`,
                        data: row,
                    });
                    continue;
                }
            }

            /* --------------------------------
         DUPLICATE CHECKS (FAST)
      ---------------------------------*/
            const employeeAlreadyAssigned =
                employee &&
                campaign.assignedEmployees.some((e) =>
                    e.employeeId.equals(employee._id)
                );

            const retailerAlreadyAssigned =
                retailer &&
                campaign.assignedRetailers.some((r) =>
                    r.retailerId.equals(retailer._id)
                );

            const mappingAlreadyExists =
                employee &&
                retailer &&
                campaign.assignedEmployeeRetailers.some(
                    (m) =>
                        m.employeeId.equals(employee._id) &&
                        m.retailerId.equals(retailer._id)
                );

            /* --------------------------------
         BLOCK DUPLICATE CASES
      ---------------------------------*/
            if (
                (employee && !retailer && employeeAlreadyAssigned) ||
                (retailer && !employee && retailerAlreadyAssigned) ||
                (employee && retailer && mappingAlreadyExists)
            ) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason:
                        employee && retailer
                            ? "Employee–Retailer mapping already exists in this campaign"
                            : employee
                            ? "Employee already assigned to this campaign"
                            : "Retailer already assigned to this campaign",
                    data: row,
                });
                continue;
            }

            /* --------------------------------
         ASSIGN EMPLOYEE
      ---------------------------------*/
            if (employee && !employeeAlreadyAssigned) {
                campaign.assignedEmployees.push({
                    employeeId: employee._id,
                    status: "pending",
                    assignedAt: new Date(),
                });

                // Sync employee side
                if (
                    !employee.assignedCampaigns.some((c) =>
                        c.equals(campaign._id)
                    )
                ) {
                    employee.assignedCampaigns.push(campaign._id);
                    await employee.save();
                }
            }

            /* --------------------------------
         ASSIGN RETAILER
      ---------------------------------*/
            if (retailer && !retailerAlreadyAssigned) {
                campaign.assignedRetailers.push({
                    retailerId: retailer._id,
                    status: "pending",
                    assignedAt: new Date(),
                });
            }

            /* --------------------------------
         ASSIGN EMPLOYEE–RETAILER MAPPING
      ---------------------------------*/
            if (employee && retailer && !mappingAlreadyExists) {
                campaign.assignedEmployeeRetailers.push({
                    employeeId: employee._id,
                    retailerId: retailer._id,
                    assignedAt: new Date(),
                });
            }

            await campaign.save();
            successCount++;
        }

        /* --------------------------------
       FINAL RESPONSE
    ---------------------------------*/
        return res.status(failedRows.length ? 207 : 201).json({
            success: true,
            message: failedRows.length
                ? "Campaign assignment completed with partial success"
                : "All campaign assignments completed successfully",
            summary: {
                totalRows: rawRows.length,
                successful: successCount,
                failed: failedRows.length,
            },
            failedRows,
        });
    } catch (error) {
        console.error("Bulk campaign assignment error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

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
        const rawRows = XLSX.utils.sheet_to_json(sheet);

        const failedRows = [];
        let successCount = 0;

        /* ---------------- PROCESS EACH ROW ---------------- */
        for (let i = 0; i < rawRows.length; i++) {
            const row = normalizeRow(rawRows[i]);
            const { sno, campaignName, employeeId, retailerCode } = row;

            /* -------- BASIC VALIDATION -------- */
            if (!campaignName || !employeeId || !retailerCode) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "campaignName, employeeId and retailerCode are required",
                    data: row,
                });
                continue;
            }

            /* -------- FETCH CAMPAIGN -------- */
            const campaign = await Campaign.findOne({ name: campaignName });
            if (!campaign) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: row,
                });
                continue;
            }

            /* -------- FETCH EMPLOYEE -------- */
            const employee = await Employee.findOne({ employeeId });
            if (!employee) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Employee not found: ${employeeId}`,
                    data: row,
                });
                continue;
            }

            /* -------- FETCH RETAILER -------- */
            const retailer = await Retailer.findOne({ retailerCode });
            if (!retailer) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Retailer not found: ${retailerCode}`,
                    data: row,
                });
                continue;
            }

            /* =================================================
         🔒 CRITICAL CHECK:
         BOTH must already be assigned to THIS campaign
      ================================================== */

            const employeeAssignedToCampaign = campaign.assignedEmployees.some(
                (e) => e.employeeId.equals(employee._id)
            );

            if (!employeeAssignedToCampaign) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "Employee is not assigned to this campaign",
                    data: row,
                });
                continue;
            }

            const retailerAssignedToCampaign = campaign.assignedRetailers.some(
                (r) => r.retailerId.equals(retailer._id)
            );

            if (!retailerAssignedToCampaign) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "Retailer is not assigned to this campaign",
                    data: row,
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
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "Employee–Retailer mapping already exists in this campaign",
                    data: row,
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
            successCount++;
        }

        /* ---------------- FINAL RESPONSE ---------------- */
        return res.status(failedRows.length ? 207 : 201).json({
            success: true,
            message: failedRows.length
                ? "Bulk employee–retailer mapping completed with partial success"
                : "Bulk employee–retailer mapping completed successfully",
            summary: {
                totalRows: rawRows.length,
                successful: successCount,
                failed: failedRows.length,
            },
            failedRows,
        });
    } catch (error) {
        console.error("Bulk assign employee to retailer error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// admin/report.controller.js
import XLSX from "xlsx";
import { Retailer } from "../../models/retailer.model.js";
import { Campaign, Employee } from "../../models/user.js";

// ====== CREATE ADMIN REPORT ======
export const createAdminReport = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can submit admin reports" });
        }

        const {
            employeeId,
            campaignId,
            retailerId,
            visitScheduleId,
            reportType,
            notes,
            stockType,
            brand,
            product,
            sku,
            productType,
            quantity,
            location,
            frequency, // ⭐ ADDED HERE
        } = req.body;

        if (!employeeId || !campaignId || !retailerId) {
            return res.status(400).json({
                message: "employeeId, campaignId, and retailerId are required",
            });
        }

        const files = req.files || {};

        const images = [];
        if (files.images?.length > 0) {
            files.images.forEach((file) => {
                images.push({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
                });
            });
        }

        const billCopies = [];
        if (files.billCopy?.length > 0) {
            files.billCopy.forEach((file) => {
                billCopies.push({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
                });
            });
        }

        // ----------------------------------------------------
        //  CREATE REPORT
        // ----------------------------------------------------
        const report = await EmployeeReport.create({
            employeeId,
            campaignId,
            retailerId,
            visitScheduleId,

            reportType,
            otherReasonText: notes,
            frequency, // ⭐ ADDED HERE

            stockType,
            brand,
            product,
            sku,
            productType,
            quantity,

            location: location ? JSON.parse(location) : undefined,

            images,
            billCopies,

            submittedByRole: "Admin",
            submittedByAdmin: req.user.id,
        });

        res.status(201).json({
            message: "Admin report submitted successfully",
            report,
        });
    } catch (err) {
        console.error("Create admin report error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ====== DOWNLOAD EMPLOYEE–RETAILER MAPPING REPORT ======
export const downloadEmployeeRetailerMappingReport = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId)
            .select("assignedEmployeeRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Extract all employees & retailers
        const employeeIds = campaign.assignedEmployeeRetailers.map(
            (m) => m.employeeId
        );
        const retailerIds = campaign.assignedEmployeeRetailers.map(
            (m) => m.retailerId
        );

        const employees = await Employee.find({ _id: { $in: employeeIds } })
            .select("name email phone position")
            .lean();

        const retailers = await Retailer.find({ _id: { $in: retailerIds } })
            .select("name contactNo shopDetails")
            .lean();

        const employeeMap = {};
        employees.forEach((e) => (employeeMap[e._id] = e));

        const retailerMap = {};
        retailers.forEach((r) => (retailerMap[r._id] = r));

        // ---------------------------------------------
        // Build final rows for Excel
        // ---------------------------------------------
        const rows = campaign.assignedEmployeeRetailers.map((m) => {
            const emp = employeeMap[m.employeeId];
            const ret = retailerMap[m.retailerId];

            return {
                EmployeeName: emp?.name || "",
                EmployeeEmail: emp?.email || "",
                EmployeePhone: emp?.phone || "",
                EmployeePosition: emp?.position || "",

                RetailerName: ret?.name || "",
                RetailerContact: ret?.contactNo || "",
                ShopName: ret?.shopDetails?.shopName || "",
                ShopCity: ret?.shopDetails?.shopAddress?.city || "",
                ShopState: ret?.shopDetails?.shopAddress?.state || "",

                AssignedAt: new Date(m.assignedAt).toLocaleString(),
            };
        });

        // Create Excel sheet
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Employee-Retailer-Mapping"
        );

        const excelBuffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });

        // Send file
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=employee_retailer_mapping_${campaignId}.xlsx`
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        return res.end(excelBuffer);
    } catch (err) {
        console.error("Download mapping report error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

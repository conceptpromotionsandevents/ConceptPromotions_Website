// admin/visitSchedule.controller.js
import { Campaign, VisitSchedule } from "../../models/user.js";

// ====== ASSIGN VISIT SCHEDULE ======
export const assignVisitSchedule = async (req, res) => {
    try {
        const {
            campaignId,
            employeeId,
            retailerId,
            visitDate,
            visitType,
            notes,
            isRecurring,
            recurrenceInterval,
            lastVisitDate,
        } = req.body;

        if (!campaignId || !employeeId || !retailerId || !visitDate) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const campaign = await Campaign.findById(campaignId).lean();
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        // Check employee assigned
        const employeeExists = campaign.assignedEmployees.some(
            (e) => e.employeeId.toString() === employeeId
        );
        if (!employeeExists) {
            return res
                .status(400)
                .json({ message: "Employee not assigned to campaign" });
        }

        // Check retailer assigned
        const retailerExists = campaign.assignedRetailers.some(
            (r) => r.retailerId.toString() === retailerId
        );
        if (!retailerExists) {
            return res
                .status(400)
                .json({ message: "Retailer not assigned to campaign" });
        }

        // Check employee-retailer mapping
        const mappingExists = campaign.assignedEmployeeRetailers.some(
            (m) =>
                m.employeeId.toString() === employeeId &&
                m.retailerId.toString() === retailerId
        );

        if (!mappingExists) {
            return res.status(400).json({
                message:
                    "Employee → Retailer mapping does not exist in this campaign",
            });
        }

        // Create schedule
        const visit = await VisitSchedule.create({
            campaignId,
            employeeId,
            retailerId,
            visitDate,
            visitType,
            notes,

            // NEW FIELDS
            isRecurring: isRecurring || "No",
            recurrenceInterval:
                isRecurring === "Yes" ? recurrenceInterval : null,
            lastVisitDate: lastVisitDate || null,
        });

        res.status(201).json({
            message: "Visit assigned successfully",
            visit,
        });
    } catch (err) {
        console.error("Assign visit error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== UPDATE VISIT SCHEDULE STATUS ======
export const updateVisitScheduleStatus = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { scheduleId } = req.params;
        const { status } = req.body;

        const { VisitSchedule } = await import("../models/VisitSchedule.js");

        if (!["Completed", "Missed", "Cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const schedule = await VisitSchedule.findOne({
            _id: scheduleId,
            employeeId,
        });

        if (!schedule) {
            return res
                .status(404)
                .json({ message: "Visit schedule not found" });
        }

        schedule.status = status;
        schedule.updatedAt = new Date();

        // NEW → update lastVisitDate when completed
        if (status === "Completed") {
            schedule.lastVisitDate = new Date();
        }

        await schedule.save();

        res.status(200).json({
            message: "Visit schedule status updated successfully",
            schedule,
        });
    } catch (error) {
        console.error("updateVisitScheduleStatus Error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

// ====== UPDATE VISIT SCHEDULE DETAILS ======
export const updateVisitScheduleDetails = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        const {
            campaignId,
            employeeId,
            retailerId,
            visitDate,
            visitType,
            notes,
            isRecurring,
            recurrenceInterval,
            lastVisitDate,
        } = req.body;

        const schedule = await VisitSchedule.findById(scheduleId);

        if (!schedule) {
            return res
                .status(404)
                .json({ message: "Visit schedule not found" });
        }

        // Update fields only if provided
        if (campaignId) schedule.campaignId = campaignId;
        if (employeeId) schedule.employeeId = employeeId;
        if (retailerId) schedule.retailerId = retailerId;
        if (visitDate) schedule.visitDate = visitDate;
        if (visitType) schedule.visitType = visitType;
        if (notes) schedule.notes = notes;

        // Recurring updates
        if (isRecurring) schedule.isRecurring = isRecurring;

        if (isRecurring === "Yes") {
            if (recurrenceInterval)
                schedule.recurrenceInterval = recurrenceInterval;
        } else {
            schedule.recurrenceInterval = null;
        }

        if (lastVisitDate) {
            schedule.lastVisitDate = lastVisitDate;
        }

        await schedule.save();

        res.status(200).json({
            message: "Visit schedule updated successfully",
            schedule,
        });
    } catch (error) {
        console.error("updateVisitScheduleDetails Error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

// ====== DELETE VISIT SCHEDULE ======
export const deleteVisitSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        if (!scheduleId) {
            return res.status(400).json({ message: "scheduleId is required" });
        }

        const schedule = await VisitSchedule.findById(scheduleId);

        if (!schedule) {
            return res
                .status(404)
                .json({ message: "Visit schedule not found" });
        }

        await VisitSchedule.deleteOne({ _id: scheduleId });

        res.status(200).json({
            message: "Visit schedule deleted successfully",
            deletedScheduleId: scheduleId,
        });
    } catch (error) {
        console.error("Delete visit schedule error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

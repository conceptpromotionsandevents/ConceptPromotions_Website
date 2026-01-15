// admin/campaign.controller.js
import { Retailer } from "../../models/retailer.model.js";
import {
    Campaign,
    ClientAdmin,
    Employee,
    VisitSchedule


} from "../../models/user.js";
import {
    deleteFromCloudinary,
    uploadToCloudinary,
} from "../../utils/cloudinary.config.js";

// ====== GET ALL CAMPAIGNS ======
export const getAllCampaigns = async (req, res) => {
    try {
        /* =========================
           QUERY FILTERS (optional)
        ========================== */
        const { isActive, client, type } = req.query;

        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }
        if (client) {
            filter.client = client;
        }
        if (type) {
            filter.type = type;
        }

        /* =========================
           FETCH CAMPAIGNS
        ========================== */
        const campaigns = await Campaign.find(filter)
            .populate("createdBy", "name email")
            .populate("assignedEmployees.employeeId", "name email")
            .populate("assignedRetailers.retailerId", "name contactNo")
            .sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            count: campaigns.length,
            campaigns,
        });
    } catch (error) {
        console.error("Get campaigns error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ====== ADD CAMPAIGN ======
export const addCampaign = async (req, res) => {
    try {
        /* =========================
           AUTH CHECK
        ========================== */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can create campaigns",
            });
        }

        /* =========================
           SAFE BODY EXTRACT
        ========================== */
        const body = req.body || {};

        let {
            name,
            client,
            type,
            regions,
            states,
            campaignStartDate,
            campaignEndDate,

            // INFO
            description,
            termsAndConditions,

            // GRATIFICATION
            gratificationType,
            gratificationDescription,
        } = body;

        /* =========================
           REQUIRED FIELDS
        ========================== */
        if (
            !name ||
            !client ||
            !type ||
            !regions ||
            !states ||
            !campaignStartDate ||
            !campaignEndDate ||
            !termsAndConditions
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        /* =========================
           PARSE ARRAYS (multipart-safe)
        ========================== */
        try {
            if (typeof regions === "string") regions = JSON.parse(regions);
            if (typeof states === "string") states = JSON.parse(states);
        } catch {
            return res.status(400).json({
                success: false,
                message: "regions and states must be valid JSON arrays",
            });
        }

        if (!Array.isArray(regions) || !regions.length) {
            return res.status(400).json({
                success: false,
                message: "At least one region is required",
            });
        }

        if (!Array.isArray(states) || !states.length) {
            return res.status(400).json({
                success: false,
                message: "At least one state is required",
            });
        }

        /* =========================
           CLIENT VALIDATION
        ========================== */
        const clientOrg = await ClientAdmin.findOne({
            organizationName: client,
        }).select("_id");

        if (!clientOrg) {
            return res.status(404).json({
                success: false,
                message: `Client organization '${client}' does not exist`,
            });
        }

        /* =========================
           DATE VALIDATION
        ========================== */
        const startDate = new Date(campaignStartDate);
        const endDate = new Date(campaignEndDate);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid campaign date format",
            });
        }

        if (startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "Campaign start date cannot be after end date",
            });
        }

        /* =========================
           UPLOAD INFO BANNERS
        ========================== */
        const infoBanners = [];

        if (req.files?.banners?.length) {
            for (const file of req.files.banners) {
                const result = await uploadToCloudinary(
                    file.buffer,
                    "campaigns/banners",
                    "image"
                );

                infoBanners.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        }

        /* =========================
           UPLOAD GRATIFICATION IMAGES
        ========================== */
        const gratificationImages = [];

        if (req.files?.gratificationImages?.length) {
            for (const file of req.files.gratificationImages) {
                const result = await uploadToCloudinary(
                    file.buffer,
                    "campaigns/gratification",
                    "image"
                );

                gratificationImages.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        }

        /* =========================
           CREATE CAMPAIGN (SCHEMA SAFE)
        ========================== */
        const campaign = new Campaign({
            name,
            client,
            type,
            regions,
            states,
            createdBy: req.user.id,
            campaignStartDate: startDate,
            campaignEndDate: endDate,

            info: {
                description: description || "",
                tnc: termsAndConditions,
                banners: infoBanners,
            },

            gratification: {
                type: gratificationType || "",
                description: gratificationDescription || "",
                images: gratificationImages,
            },
        });

        await campaign.save();

        return res.status(201).json({
            success: true,
            message: "Campaign created successfully",
            campaign,
        });
    } catch (error) {
        console.error("Add campaign error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

export const updateCampaignStatus = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can update campaign status" });
        }

        const { id } = req.params;
        let { isActive } = req.body;

        // 🔍 Check if isActive exists
        if (isActive === undefined || isActive === null) {
            return res.status(400).json({
                message: "isActive is required"
            });
        }

        // 🔥 Force boolean conversion
        if (typeof isActive === "string") {
            isActive = isActive === "true";
        }

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                message: "isActive must be boolean"
            });
        }

        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        campaign.isActive = isActive;
        await campaign.save();

        res.status(200).json({
            message: `Campaign ${isActive ? "activated" : "deactivated"} successfully`,
            campaign,
        });
    } catch (error) {
        console.error("Update campaign status error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ====== GET CAMPAIGN BY ID ======
export const getCampaignById = async (req, res) => {
    try {
        /* =========================
           AUTH CHECK
        ========================== */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can view campaign details",
            });
        }

        /* =========================
           FETCH CAMPAIGN
        ========================== */
        const { id } = req.params;

        const campaign = await Campaign.findById(id)
            .populate("createdBy", "name email")
            .populate("assignedEmployees.employeeId", "name email phone")
            .populate("assignedRetailers.retailerId", "name contactNo address");

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        const campaignObj = campaign.toObject();

        /* =========================
           ENSURE SUB-DOCUMENTS
        ========================== */
        campaignObj.info ??= { description: "", tnc: "", banners: [] };
        campaignObj.info.banners ??= [];

        campaignObj.gratification ??= {
            type: "",
            description: "",
            images: [],
        };
        campaignObj.gratification.images ??= [];

        /* =========================
           REMOVE ORPHAN REFERENCES
        ========================== */
        campaignObj.assignedEmployees =
            campaignObj.assignedEmployees?.filter(
                (emp) => emp.employeeId !== null
            ) || [];

        campaignObj.assignedRetailers =
            campaignObj.assignedRetailers?.filter(
                (ret) => ret.retailerId !== null
            ) || [];

        res.status(200).json({
            success: true,
            campaign: campaignObj,
        });
    } catch (error) {
        console.error("Get campaign by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// ====== GET EMPLOYEE CAMPAIGNS ======
export const getEmployeeCampaigns = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user.id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const campaigns = await Campaign.find({
            "assignedEmployees.employeeId": employee._id,
        })
            .populate("createdBy", "name email")
            .populate("assignedEmployees.employeeId", "name email")
            .populate("assignedRetailers.retailerId", "name contactNo")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Campaigns fetched successfully",
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
            },
            campaigns,
        });
    } catch (error) {
        console.error("Get employee campaigns error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// ====== DELETE CAMPAIGN ======
export const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || req.user.role !== "admin")
            return res.status(403).json({
                success: false,
                message: "Only admins can delete campaigns",
            });

        const campaign = await Campaign.findById(id);
        if (!campaign)
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });

        /* =========================
           ✅ DELETE INFO BANNERS FROM CLOUDINARY
        ========================== */
        if (campaign.info?.banners && campaign.info.banners.length > 0) {
            for (const banner of campaign.info.banners) {
                try {
                    await deleteFromCloudinary(banner.publicId, "image");
                } catch (err) {
                    console.error(
                        `Failed to delete banner ${banner.publicId}:`,
                        err
                    );
                    // Continue with deletion even if Cloudinary cleanup fails
                }
            }
        }

        /* =========================
           ✅ DELETE GRATIFICATION IMAGES FROM CLOUDINARY
        ========================== */
        if (campaign.gratification?.images && campaign.gratification.images.length > 0) {
            for (const image of campaign.gratification.images) {
                try {
                    await deleteFromCloudinary(image.publicId, "image");
                } catch (err) {
                    console.error(
                        `Failed to delete gratification image ${image.publicId}:`,
                        err
                    );
                    // Continue with deletion even if Cloudinary cleanup fails
                }
            }
        }

        /* =========================
           DELETE CAMPAIGN FROM DATABASE
        ========================== */
        await Campaign.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Campaign and associated images deleted successfully",
        });
    } catch (error) {
        console.error("Delete campaign error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// ====== ASSIGN CAMPAIGN (employees + retailers) ======
export const assignCampaign = async (req, res) => {
    try {
        const { campaignId, employeeIds = [], retailerIds = [] } = req.body;


        // -------------------------------
        // Admin check
        // -------------------------------
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can assign campaigns" });
        }


        if (!campaignId) {
            return res.status(400).json({ message: "Campaign ID is required" });
        }


        const campaign = await Campaign.findById(campaignId);


        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }


        // -------------------------------
        // FIX: Use campaign.states (correct field)
        // -------------------------------
        const allowedStates = Array.isArray(campaign.states)
            ? campaign.states
            : [campaign.states];


        const startDate = campaign.campaignStartDate;
        const endDate = campaign.campaignEndDate;


        // Ensure arrays exist
        campaign.assignedEmployees ||= [];
        campaign.assignedRetailers ||= [];


        /* =========================================================================
       ASSIGN EMPLOYEES
    ========================================================================= */
        for (const empId of employeeIds) {
            if (!empId) continue;


            const employee = await Employee.findById(empId);
            if (!employee) continue;


            const employeeState = employee?.correspondenceAddress?.state;


            const isAllowed =
                allowedStates.includes("All") ||
                (employeeState && allowedStates.includes(employeeState));


            if (!isAllowed) {
                return res.status(400).json({
                    message: `❌ Employee '${employee.name}' cannot be assigned because their state '${employeeState}' is not allowed in this campaign.`,
                });
            }


            // Check duplication
            const exists = campaign.assignedEmployees.some(
                (e) => e.employeeId.toString() === empId.toString()
            );


            if (!exists) {
                campaign.assignedEmployees.push({
                    employeeId: empId,
                    status: "pending",
                    assignedAt: new Date(),
                    updatedAt: new Date(),
                    startDate,
                    endDate,
                });
            }


            // Update employee's assigned campaigns list
            await Employee.findByIdAndUpdate(empId, {
                $addToSet: { assignedCampaigns: campaign._id },
            });
        }


        /* =========================================================================
       ASSIGN RETAILERS
    ========================================================================= */
        for (const retId of retailerIds) {
            if (!retId) continue;


            const retailer = await Retailer.findById(retId);
            if (!retailer) continue;


            const retailerState = retailer?.shopDetails?.shopAddress?.state;


            const isAllowed =
                allowedStates.includes("All") ||
                (retailerState && allowedStates.includes(retailerState));


            if (!isAllowed) {
                return res.status(400).json({
                    message: `❌ Retailer '${retailer.name}' cannot be assigned because their state '${retailerState}' is not allowed in this campaign.`,
                });
            }


            // Check duplicate assignment
            const exists = campaign.assignedRetailers.some(
                (r) => r.retailerId.toString() === retId.toString()
            );


            if (!exists) {
                campaign.assignedRetailers.push({
                    retailerId: retId,
                    status: "pending",
                    assignedAt: new Date(),
                    updatedAt: new Date(),
                    startDate,
                    endDate,
                });
            }


            // Update retailer's assigned campaigns
            await Retailer.findByIdAndUpdate(retId, {
                $addToSet: { assignedCampaigns: campaign._id },
            });
        }


        // Save updated campaign
        await campaign.save();


        res.status(200).json({
            message: "Campaign assigned successfully",
            campaign,
        });
    } catch (error) {
        console.error("Assign campaign error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// ====== UPDATE CAMPAIGN DETAILS ======
export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        /* =========================
           AUTH CHECK
        ========================== */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can edit campaigns",
            });
        }

        /* =========================
           FIND CAMPAIGN
        ========================== */
        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        /* =========================
           ENSURE SUB-DOCUMENTS EXIST
        ========================== */
        campaign.info ??= { description: "", tnc: "", banners: [] };
        campaign.info.banners ??= [];

        campaign.gratification ??= { type: "", description: "", images: [] };
        campaign.gratification.images ??= [];

        /* =========================
           SAFE BODY EXTRACT
        ========================== */
        const body = req.body || {};

        let {
            name,
            client,
            type,
            regions,
            states,
            campaignStartDate,
            campaignEndDate,
            isActive,

            // INFO
            description,
            termsAndConditions,

            // GRATIFICATION
            gratificationType,
            gratificationDescription,

            removeBanners,
            removeGratificationImages,
        } = body;

        /* =========================
           PARSE ARRAYS
        ========================== */
        try {
            if (typeof regions === "string") regions = JSON.parse(regions);
            if (typeof states === "string") states = JSON.parse(states);
            if (typeof removeBanners === "string")
                removeBanners = JSON.parse(removeBanners);
            if (typeof removeGratificationImages === "string")
                removeGratificationImages = JSON.parse(removeGratificationImages);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid JSON format in request",
            });
        }

        /* =========================
           UPDATE BASIC FIELDS
        ========================== */
        if (name) campaign.name = name;
        if (client) campaign.client = client;
        if (type) campaign.type = type;
        if (regions) campaign.regions = regions;
        if (states) campaign.states = states;
        if (isActive !== undefined) campaign.isActive = isActive;

        if (description !== undefined)
            campaign.info.description = description;
        if (termsAndConditions !== undefined)
            campaign.info.tnc = termsAndConditions;

        /* =========================
           DATE VALIDATION
        ========================== */
        let startDate = campaign.campaignStartDate;
        let endDate = campaign.campaignEndDate;

        if (campaignStartDate) {
            const d = new Date(campaignStartDate);
            if (isNaN(d)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid campaign start date format",
                });
            }
            startDate = d;
        }

        if (campaignEndDate) {
            const d = new Date(campaignEndDate);
            if (isNaN(d)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid campaign end date format",
                });
            }
            endDate = d;
        }

        if (startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "Campaign start date cannot be after end date",
            });
        }

        campaign.campaignStartDate = startDate;
        campaign.campaignEndDate = endDate;

        /* =========================
           UPDATE GRATIFICATION
        ========================== */
        if (gratificationType !== undefined)
            campaign.gratification.type = gratificationType;
        if (gratificationDescription !== undefined)
            campaign.gratification.description = gratificationDescription;

        /* =========================
           REMOVE INFO BANNERS
        ========================== */
        if (Array.isArray(removeBanners)) {
            for (const publicId of removeBanners) {
                await deleteFromCloudinary(publicId, "image");
                campaign.info.banners = campaign.info.banners.filter(
                    (b) => b.publicId !== publicId
                );
            }
        }

        /* =========================
           UPLOAD INFO BANNERS
        ========================== */
        if (req.files?.banners?.length) {
            for (const file of req.files.banners) {
                const uploaded = await uploadToCloudinary(
                    file.buffer,
                    "campaigns/banners",
                    "image"
                );

                campaign.info.banners.push({
                    url: uploaded.secure_url,
                    publicId: uploaded.public_id,
                });
            }
        }

        /* =========================
           REMOVE GRATIFICATION IMAGES
        ========================== */
        if (Array.isArray(removeGratificationImages)) {
            for (const publicId of removeGratificationImages) {
                await deleteFromCloudinary(publicId, "image");
                campaign.gratification.images =
                    campaign.gratification.images.filter(
                        (img) => img.publicId !== publicId
                    );
            }
        }

        /* =========================
           UPLOAD GRATIFICATION IMAGES
        ========================== */
        if (req.files?.gratificationImages?.length) {
            for (const file of req.files.gratificationImages) {
                const uploaded = await uploadToCloudinary(
                    file.buffer,
                    "campaigns/gratification",
                    "image"
                );

                campaign.gratification.images.push({
                    url: uploaded.secure_url,
                    publicId: uploaded.public_id,
                });
            }
        }

        /* =========================
           SAVE
        ========================== */
        await campaign.save();

        return res.status(200).json({
            success: true,
            message: "Campaign updated successfully",
            campaign,
        });
    } catch (error) {
        console.error("Update campaign error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// ====== CAMPAIGN RETAILERS WITH EMPLOYEES ======
export const getCampaignRetailersWithEmployees = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId)
            .select("name client type assignedEmployees assignedRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // -------------------------
        // FULL RETAILER FETCH
        // -------------------------
        const retailerIds = campaign.assignedRetailers.map((r) => r.retailerId);

        const retailers = await Retailer.find({
            _id: { $in: retailerIds },
        }).lean(); // FULL retailer fields

        const retailerMeta = {};
        campaign.assignedRetailers.forEach((r) => {
            retailerMeta[r.retailerId] = {
                status: r.status,
                assignedAt: r.assignedAt,
                startDate: r.startDate,
                endDate: r.endDate,
            };
        });

        const finalRetailers = retailers.map((r) => ({
            ...r,
            ...retailerMeta[r._id],
        }));

        // -------------------------
        // FULL EMPLOYEE FETCH
        // -------------------------
        const employeeIds = campaign.assignedEmployees.map((e) => e.employeeId);

        const employees = await Employee.find({
            _id: { $in: employeeIds },
        }).lean(); // FULL employee fields

        const employeeMeta = {};
        campaign.assignedEmployees.forEach((e) => {
            employeeMeta[e.employeeId] = {
                status: e.status,
                assignedAt: e.assignedAt,
                startDate: e.startDate,
                endDate: e.endDate,
            };
        });

        const finalEmployees = employees.map((e) => ({
            ...e,
            ...employeeMeta[e._id],
        }));

        // -------------------------
        // RESPONSE
        // -------------------------
        res.status(200).json({
            campaignId,
            campaignName: campaign.name,
            client: campaign.client,
            type: campaign.type,

            totalRetailers: finalRetailers.length,
            totalEmployees: finalEmployees.length,

            retailers: finalRetailers,
            employees: finalEmployees,
        });
    } catch (err) {
        console.error("FAST Campaign fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== CAMPAIGN VISIT SCHEDULES ======
export const getCampaignVisitSchedules = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const visits = await VisitSchedule.find({ campaignId })
            .populate("employeeId", "name phone position")
            .populate("retailerId", "name contactNo shopDetails")
            .sort({ visitDate: 1 })
            .lean();

        res.status(200).json({
            campaignId,
            totalVisits: visits.length,
            visits,
        });
    } catch (err) {
        console.error("Fetch campaign visits error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


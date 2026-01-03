import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { Retailer } from "../models/retailer.model.js";
import { Campaign } from "../models/user.js";

dotenv.config();

// ===============================
// Twilio Configuration
// ===============================
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Temporary in-memory store for OTPs with expiry
const otpStore = new Map();

/* ===============================
   SEND OTP (Phone only)
=============================== */
export const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone)
            return res.status(400).json({ message: "Phone number required" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });

        await client.messages.create({
            body: `Your verification code is ${otp}`,
            from: fromNumber,
            to: phone.startsWith("+") ? phone : `+91${phone}`,
        });

        console.log(`✅ OTP sent to ${phone}: ${otp}`);
        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("OTP send error:", error);
        res.status(500).json({
            message: "Failed to send OTP",
            error: error.message,
        });
    }
};

/* ===============================
   VERIFY OTP
=============================== */
export const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp)
            return res
                .status(400)
                .json({ message: "Phone number and OTP required" });

        const record = otpStore.get(phone);
        if (!record)
            return res
                .status(400)
                .json({ message: "No OTP found for this number" });
        if (Date.now() > record.expires) {
            otpStore.delete(phone);
            return res.status(400).json({ message: "OTP expired" });
        }
        if (record.otp !== otp)
            return res.status(400).json({ message: "Invalid OTP" });

        otpStore.delete(phone);
        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("OTP verify error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   REGISTER RETAILER
=============================== */
export const registerRetailer = async (req, res) => {
    try {
        const body = req.body;
        const files = req.files || {};
        const { contactNo, email } = body;

        if (!email || !contactNo)
            return res
                .status(400)
                .json({ message: "Email and contact number are required" });

        // Must verify OTP before registration
        if (otpStore.has(contactNo)) {
            return res.status(400).json({
                message: "Please verify your phone number before registration",
            });
        }

        const personalAddress = {
            address: body.address,
            city: body.city,
            state: body.state,
            geoTags: {
                lat: parseFloat(body.geoTags?.lat) || 0,
                lng: parseFloat(body.geoTags?.lng) || 0,
            },
        };

        const shopAddress = {
            address:
                body["shopDetails.shopAddress.address"] || body.shopAddress,
            city: body["shopDetails.shopAddress.city"] || body.shopCity,
            state: body["shopDetails.shopAddress.state"] || body.shopState,
            pincode:
                body["shopDetails.shopAddress.pincode"] || body.shopPincode,
            geoTags: {
                lat:
                    parseFloat(body["shopDetails.shopAddress.geoTags.lat"]) ||
                    0,
                lng:
                    parseFloat(body["shopDetails.shopAddress.geoTags.lng"]) ||
                    0,
            },
        };

        const shopDetails = {
            shopName: body["shopDetails.shopName"] || body.shopName,
            businessType: body["shopDetails.businessType"] || body.businessType,
            ownershipType:
                body["shopDetails.ownershipType"] || body.ownershipType,
            dateOfEstablishment:
                body["shopDetails.dateOfEstablishment"] ||
                body.dateOfEstablishment,
            GSTNo: body["shopDetails.GSTNo"] || body.GSTNo,
            PANCard: body["shopDetails.PANCard"] || body.PANCard,
            shopAddress,
            outletPhoto: files.outletPhoto
                ? {
                      data: files.outletPhoto[0].buffer,
                      contentType: files.outletPhoto[0].mimetype,
                  }
                : undefined,
        };

        const bankDetails = {
            bankName: body["bankDetails.bankName"] || body.bankName,
            accountNumber:
                body["bankDetails.accountNumber"] || body.accountNumber,
            IFSC: body["bankDetails.IFSC"] || body.IFSC,
            branchName: body["bankDetails.branchName"] || body.branchName,
        };

        const existingRetailer = await Retailer.findOne({
            $or: [{ contactNo }, { email }],
        });
        if (existingRetailer)
            return res
                .status(400)
                .json({ message: "Phone or email already registered" });

        const retailer = new Retailer({
            name: body.name,
            contactNo,
            email,
            dob: body.dob,
            gender: body.gender,
            govtIdType: body.govtIdType,
            govtIdNumber: body.govtIdNumber,
            govtIdPhoto: files.govtIdPhoto
                ? {
                      data: files.govtIdPhoto[0].buffer,
                      contentType: files.govtIdPhoto[0].mimetype,
                  }
                : undefined,
            personPhoto: files.personPhoto
                ? {
                      data: files.personPhoto[0].buffer,
                      contentType: files.personPhoto[0].mimetype,
                  }
                : undefined,
            registrationFormFile: files.registrationFormFile
                ? {
                      data: files.registrationFormFile[0].buffer,
                      contentType: files.registrationFormFile[0].mimetype,
                  }
                : undefined,
            personalAddress,
            shopDetails,
            bankDetails,
            partOfIndia: body.partOfIndia || "N",
            createdBy: body.createdBy || "RetailerSelf",
            phoneVerified: true,
        });

        await retailer.save();

        res.status(201).json({
            message: "Retailer registered successfully",
            uniqueId: retailer.uniqueId,
        });
    } catch (error) {
        console.error("Retailer registration error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   LOGIN RETAILER (Phone only)
=============================== */
export const loginRetailer = async (req, res) => {
    try {
        const { contactNo, email } = req.body;

        if (!contactNo || !email) {
            return res.status(400).json({
                message: "Email and phone number are both required",
            });
        }

        const retailer = await Retailer.findOne({
            email,
            contactNo,
        });

        if (!retailer)
            return res.status(400).json({ message: "Retailer not found" });

        if (!retailer.phoneVerified)
            return res.status(400).json({ message: "Phone not verified" });

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET missing in environment variables");
            return res
                .status(500)
                .json({ message: "Server configuration error" });
        }

        const token = jwt.sign(
            {
                id: retailer._id,
                contactNo: retailer.contactNo,
                email: retailer.email,
                role: "retailer",
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            retailer: {
                id: retailer._id,
                name: retailer.name,
                uniqueId: retailer.uniqueId,
                contactNo: retailer.contactNo,
                email: retailer.email,
            },
        });
    } catch (error) {
        console.error("Retailer login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   GET RETAILER PROFILE
=============================== */
export const getRetailerProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;

        const retailer = await Retailer.findById(retailerId).select(
            "-password -govtIdPhoto -personPhoto -registrationFormFile -outletPhoto"
        );
        if (!retailer)
            return res.status(404).json({ message: "Retailer not found" });

        res.status(200).json(retailer);
    } catch (error) {
        console.error("Get retailer profile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   GET RETAILER IMAGE BY TYPE
=============================== */
export const getRetailerImage = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;
        const { imageType } = req.params;

        // Validate imageType
        const validImageTypes = [
            "govtIdPhoto",
            "personPhoto",
            "registrationFormFile",
            "outletPhoto",
        ];
        if (!validImageTypes.includes(imageType)) {
            return res.status(400).json({ message: "Invalid image type" });
        }

        const retailer = await Retailer.findById(retailerId).select(imageType);
        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        const imageField = retailer[imageType];
        if (!imageField || !imageField.data) {
            return res.status(404).json({ message: "Image not found" });
        }

        res.set(
            "Content-Type",
            imageField.contentType || "application/octet-stream"
        );
        res.send(imageField.data);
    } catch (error) {
        console.error("Get retailer image error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   CHECK WHICH IMAGES EXIST
=============================== */
export const getRetailerImageStatus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;

        const retailer = await Retailer.findById(retailerId).select(
            "govtIdPhoto personPhoto registrationFormFile outletPhoto"
        );

        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        res.status(200).json({
            hasGovtIdPhoto: !!retailer.govtIdPhoto?.data,
            hasPersonPhoto: !!retailer.personPhoto?.data,
            hasRegistrationFormFile: !!retailer.registrationFormFile?.data,
            hasOutletPhoto: !!retailer.outletPhoto?.data,
        });
    } catch (error) {
        console.error("Get image status error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   UPDATE RETAILER PROFILE
=============================== */
export const updateRetailer = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;

        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        const body = req.body;
        const files = req.files || {};

        /* BASIC FIELDS */
        if (body.name) retailer.name = body.name;
        if (body.email) retailer.email = body.email;
        if (body.contactNo) retailer.contactNo = body.contactNo;
        if (body.altContactNo) retailer.altContactNo = body.altContactNo;
        if (body.gender) retailer.gender = body.gender;
        if (body.dob) retailer.dob = body.dob;
        if (body.govtIdType) retailer.govtIdType = body.govtIdType;
        if (body.govtIdNumber) retailer.govtIdNumber = body.govtIdNumber;

        /* SHOP DETAILS - Initialize if not exists */
        if (!retailer.shopDetails) {
            retailer.shopDetails = {};
        }

        if (body.shopName) retailer.shopDetails.shopName = body.shopName;
        if (body.businessType)
            retailer.shopDetails.businessType = body.businessType;
        if (body.ownershipType)
            retailer.shopDetails.ownershipType = body.ownershipType;
        if (body.GSTNo) retailer.shopDetails.GSTNo = body.GSTNo;
        if (body.PANCard) retailer.shopDetails.PANCard = body.PANCard;

        /* SHOP ADDRESS */
        if (!retailer.shopDetails.shopAddress) {
            retailer.shopDetails.shopAddress = {};
        }

        if (body.address)
            retailer.shopDetails.shopAddress.address = body.address;
        if (body.address2)
            retailer.shopDetails.shopAddress.address2 = body.address2;
        if (body.city) retailer.shopDetails.shopAddress.city = body.city;
        if (body.state) retailer.shopDetails.shopAddress.state = body.state;
        if (body.pincode)
            retailer.shopDetails.shopAddress.pincode = body.pincode;

        /* BANK DETAILS - Initialize if not exists */
        if (!retailer.bankDetails) {
            retailer.bankDetails = {};
        }

        // Track if bank details changed
        const bankDetailsChanged =
            (body.bankName &&
                body.bankName !== retailer.bankDetails.bankName) ||
            (body.accountNumber &&
                body.accountNumber !== retailer.bankDetails.accountNumber) ||
            (body.IFSC && body.IFSC !== retailer.bankDetails.IFSC) ||
            (body.branchName &&
                body.branchName !== retailer.bankDetails.branchName);

        if (body.bankName) retailer.bankDetails.bankName = body.bankName;
        if (body.accountNumber)
            retailer.bankDetails.accountNumber = body.accountNumber;
        if (body.IFSC) retailer.bankDetails.IFSC = body.IFSC;
        if (body.branchName) retailer.bankDetails.branchName = body.branchName;

        // If bank details changed, reset penny check
        if (bankDetailsChanged) {
            retailer.pennyCheck = false;
        }

        /* T&C AND PENNY CHECK */
        // Only allow setting to true, never back to false (except bank change)
        if (body.tnc === "true" || body.tnc === true) {
            retailer.tnc = true;
        }

        if (
            !bankDetailsChanged &&
            (body.pennyCheck === "true" || body.pennyCheck === true)
        ) {
            retailer.pennyCheck = true;
        }

        /* FILE UPLOADS - All at root level */
        if (files.govtIdPhoto) {
            retailer.govtIdPhoto = {
                data: files.govtIdPhoto[0].buffer,
                contentType: files.govtIdPhoto[0].mimetype,
            };
        }

        if (files.personPhoto) {
            retailer.personPhoto = {
                data: files.personPhoto[0].buffer,
                contentType: files.personPhoto[0].mimetype,
            };
        }

        if (files.registrationFormFile) {
            retailer.registrationFormFile = {
                data: files.registrationFormFile[0].buffer,
                contentType: files.registrationFormFile[0].mimetype,
            };
        }

        if (files.outletPhoto) {
            retailer.outletPhoto = {
                data: files.outletPhoto[0].buffer,
                contentType: files.outletPhoto[0].mimetype,
            };
        }

        await retailer.save();

        // Return sanitized response without password and large buffers
        const sanitizedRetailer = retailer.toObject();
        delete sanitizedRetailer.password;

        // Optionally remove buffer data from response
        delete sanitizedRetailer.govtIdPhoto;
        delete sanitizedRetailer.personPhoto;
        delete sanitizedRetailer.registrationFormFile;
        delete sanitizedRetailer.outletPhoto;

        res.status(200).json({
            message: "Retailer updated successfully",
            retailer: sanitizedRetailer,
        });
    } catch (error) {
        console.error("Update retailer error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   GET CAMPAIGNS ASSIGNED TO RETAILER
=============================== */
export const getRetailerCampaigns = async (req, res) => {
    try {
        // 🔐 AUTH
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;

        // 🏪 RETAILER INFO
        const retailer = await Retailer.findById(retailerId)
            .select("name uniqueId retailerCode")
            .lean();

        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        // 🔎 FILTERS
        const { status, isActive } = req.query;

        const query = {
            "assignedRetailers.retailerId": retailerId,
        };

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        // 📦 FETCH CAMPAIGNS
        const campaigns = await Campaign.find(query)
            .populate("createdBy", "name email")
            .populate({
                path: "assignedEmployeeRetailers.employeeId",
                select: "name phone email",
                options: { strictPopulate: false }, // safety guard
            })
            .sort({ createdAt: -1 })
            .lean();

        const campaignsWithStatus = campaigns.map((campaign) => {
            const assignedRetailers = Array.isArray(campaign.assignedRetailers)
                ? campaign.assignedRetailers
                : [];

            const retailerEntry = assignedRetailers.find(
                (r) => r.retailerId?.toString() === retailerId.toString()
            );

            const employeeMappings = Array.isArray(
                campaign.assignedEmployeeRetailers
            )
                ? campaign.assignedEmployeeRetailers
                : [];

            const assignedEmployees = employeeMappings
                .filter(
                    (m) => m.retailerId?.toString() === retailerId.toString()
                )
                .map((m) => ({
                    _id: m.employeeId?._id || null,
                    name: m.employeeId?.name || "",
                    phone: m.employeeId?.phone || "",
                    email: m.employeeId?.email || "",
                }));

            return {
                _id: campaign._id,
                name: campaign.name,
                client: campaign.client,
                type: campaign.type,
                regions: campaign.regions,
                states: campaign.states,
                campaignStartDate: campaign.campaignStartDate,
                campaignEndDate: campaign.campaignEndDate,
                isActive: campaign.isActive,
                createdBy: campaign.createdBy,
                createdAt: campaign.createdAt,

                retailerStatus: {
                    status: retailerEntry?.status || "pending",
                    assignedAt: retailerEntry?.assignedAt || null,
                    updatedAt: retailerEntry?.updatedAt || null,
                    startDate:
                        retailerEntry?.startDate || campaign.campaignStartDate,
                    endDate: retailerEntry?.endDate || campaign.campaignEndDate,
                },

                assignedEmployees,
            };
        });

        const finalResult = status
            ? campaignsWithStatus.filter(
                  (c) => c.retailerStatus.status === status.toLowerCase()
              )
            : campaignsWithStatus;

        return res.status(200).json({
            count: finalResult.length,
            retailer: {
                id: retailer._id,
                name: retailer.name,
                uniqueId: retailer.uniqueId,
                retailerCode: retailer.retailerCode,
            },
            campaigns: finalResult,
        });
    } catch (error) {
        console.error("Get retailer campaigns error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/* ===============================
   GET RETAILERS BY CAMPAIGN ID
   (For Client Portal - Used in filters)
=============================== */
export const getRetailersByCampaign = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { campaignId } = req.query;

        // If no campaignId provided, return all retailers (for independent filtering)
        if (!campaignId) {
            const allRetailers = await Retailer.find({})
                .select(
                    "name uniqueId shopDetails contactNo email personalAddress"
                )
                .lean();

            return res.status(200).json({
                count: allRetailers.length,
                retailers: allRetailers,
            });
        }

        // Find campaign and get assigned retailers
        const campaign = await Campaign.findById(campaignId)
            .select("assignedRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Extract retailer IDs from assignedRetailers
        const assignedRetailerIds = campaign.assignedRetailers.map(
            (ar) => ar.retailerId
        );

        if (assignedRetailerIds.length === 0) {
            return res.status(200).json({
                message: "No retailers assigned to this campaign",
                count: 0,
                retailers: [],
            });
        }

        // Fetch full retailer details
        const retailers = await Retailer.find({
            _id: { $in: assignedRetailerIds },
        })
            .select("name uniqueId shopDetails contactNo email personalAddress")
            .lean();

        res.status(200).json({
            count: retailers.length,
            retailers: retailers,
        });
    } catch (error) {
        console.error("Get retailers by campaign error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/* ===============================
   GET CAMPAIGNS ASSIGNED STATUS
=============================== */

export const getRetailerCampaignStatus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "Unauthorized: No token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId)
            .populate("createdBy", "name email")
            .lean();

        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        // Find the retailer entry in assignedRetailers
        const retailerEntry = campaign.assignedRetailers.find(
            (r) => r.retailerId?.toString() === retailerId.toString()
        );

        if (!retailerEntry)
            return res.status(403).json({
                message: "You are not assigned to this campaign",
            });

        // Return campaign with retailer-specific status
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
            retailerStatus: {
                status: retailerEntry.status,
                assignedAt: retailerEntry.assignedAt,
                updatedAt: retailerEntry.updatedAt,
                startDate:
                    retailerEntry.startDate || campaign.campaignStartDate,
                endDate: retailerEntry.endDate || campaign.campaignEndDate,
            },
        });
    } catch (error) {
        console.error("Get retailer campaign status error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   ACCEPT OR REJECT A CAMPAIGN
=============================== */
export const updateCampaignStatus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "Unauthorized: No token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;
        const { campaignId } = req.params;
        let { status } = req.body;

        if (!status)
            return res.status(400).json({ message: "Status is required" });

        status = status.toString().trim().toLowerCase();
        if (!["accepted", "rejected"].includes(status))
            return res.status(400).json({ message: "Invalid status value" });

        const campaign = await Campaign.findById(campaignId);
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        if (
            !Array.isArray(campaign.assignedRetailers) ||
            campaign.assignedRetailers.length === 0
        )
            return res
                .status(400)
                .json({ message: "No retailers assigned to this campaign" });

        // Find the retailer entry
        const retailerEntry = campaign.assignedRetailers.find(
            (r) => r.retailerId?.toString() === retailerId.toString()
        );

        if (!retailerEntry)
            return res
                .status(403)
                .json({ message: "You are not assigned to this campaign" });

        // Update status and timestamp
        retailerEntry.status = status;
        retailerEntry.updatedAt = new Date();

        await campaign.save();

        res.status(200).json({
            message: `Campaign ${status} successfully`,
            campaignId,
            retailerStatus: status,
        });
    } catch (error) {
        console.error("Update campaign status error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   RETAILER: VIEW PAYMENT STATUS
=============================== */
export const getRetailerCampaignPayments = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "Unauthorized: No token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const retailerId = decoded.id;

        const payments = await Payment.find({ retailer: retailerId }).populate(
            "campaign",
            "name _id"
        );

        if (!payments || payments.length === 0)
            return res.status(404).json({ message: "No payments found" });

        const formatted = payments.map((p) => ({
            campaignId: p.campaign._id,
            campaignName: p.campaign.name,
            totalAmount: p.totalAmount,
            amountPaid: p.amountPaid,
            remainingAmount: Math.max(p.totalAmount - p.amountPaid, 0),
            dueDate: p.dueDate,
            utrNumber: p.utrNumber || "Pending",
            paymentStatus: p.paymentStatus,
            lastUpdated: p.updatedAt,
        }));

        res.status(200).json({ payments: formatted });
    } catch (error) {
        console.error("Error fetching retailer payments:", error);
        res.status(500).json({
            message: "Error fetching retailer payments",
            error,
        });
    }
};
export const submitRetailerReport = async (req, res) => {
    try {
        const retailerId = req.user.id; // retailer from JWT

        const {
            campaignId,
            visitType,
            reportType,
            stockType,
            brand,
            product,
            sku,
            quantity,
            latitude,
            longitude,
            otherReasonText,
        } = req.body;

        if (!campaignId) {
            return res.status(400).json({ message: "campaignId is required" });
        }

        // Retailer → Campaign validation
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const isAssigned = campaign.assignedRetailers.some(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!isAssigned) {
            return res
                .status(403)
                .json({ message: "Retailer not assigned to this campaign" });
        }

        // Create report
        const report = new EmployeeReport({
            employeeId: null, // retailer report
            retailerId,
            campaignId,
            visitType,
            reportType,
            stockType,
            brand,
            product,
            sku,
            quantity,
            otherReasonText,
            location: {
                latitude: Number(latitude) || null,
                longitude: Number(longitude) || null,
            },

            submittedByRole: "Retailer",
            submittedByRetailer: retailerId,
        });

        // Images upload
        if (req.files?.images) {
            report.images = req.files.images.map((file) => ({
                data: file.buffer,
                contentType: file.mimetype,
                fileName: file.originalname,
            }));
        }

        await report.save();

        res.status(201).json({
            message: "Retailer report submitted successfully",
            report,
        });
    } catch (error) {
        console.error("Retailer submit report error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const viewReportImage = async (req, res) => {
    try {
        const { reportId, imageIndex } = req.params;

        const report = await EmployeeReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        const img = report.images[imageIndex];
        if (!img || !img.data) {
            return res.status(404).json({ message: "Image not found" });
        }

        res.setHeader("Content-Type", img.contentType);
        return res.end(img.data);
    } catch (err) {
        console.error("View report image error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
export const viewBillCopy = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await EmployeeReport.findById(reportId);
        if (!report || !report.billCopy?.data) {
            return res.status(404).json({ message: "Bill copy not found" });
        }

        res.setHeader("Content-Type", report.billCopy.contentType);
        return res.end(report.billCopy.data);
    } catch (err) {
        console.error("View bill copy error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
export const getRetailerReports = async (req, res) => {
    try {
        const retailerId = req.user.id; // retailer extracted from JWT

        const { campaignId, fromDate, toDate } = req.query;

        // --------------------------
        // Build Filter
        // --------------------------
        const filter = { retailerId };

        if (campaignId) filter.campaignId = campaignId;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        // --------------------------
        // Fetch Reports (NO lean())
        // --------------------------
        const reports = await EmployeeReport.find(filter)
            .populate("employeeId", "name phone email position")
            .populate("campaignId", "name type client")
            .populate(
                "retailerId",
                "name uniqueId retailerCode shopDetails contactNo"
            )
            .populate("visitScheduleId", "visitDate status visitType")
            .sort({ createdAt: -1 });

        if (!reports.length) {
            return res.status(200).json({
                message: "No reports found for this retailer",
                totalReports: 0,
                reports: [],
            });
        }

        // --------------------------
        // Convert images → base64
        // --------------------------
        const finalReports = reports.map((r) => ({
            ...r.toObject(),

            // Campaign Info
            campaignName: r.campaignId?.name || "",
            campaignType: r.campaignId?.type || "",
            clientName: r.campaignId?.client || "",

            // Employee Info (if employee filled)
            employeeName: r.employeeId?.name || "",
            employeePhone: r.employeeId?.phone || "",
            employeeEmail: r.employeeId?.email || "",
            employeePosition: r.employeeId?.position || "",

            // Retailer Info
            retailerName: r.retailerId?.name || "",
            retailerUniqueId: r.retailerId?.uniqueId || "",
            retailerCode: r.retailerId?.retailerCode || "",
            shopName: r.retailerId?.shopDetails?.shopName || "",

            // Visit Info
            visitDate: r.visitScheduleId?.visitDate || "",
            visitStatus: r.visitScheduleId?.status || "",
            visitType: r.visitScheduleId?.visitType || "",

            // Images in Base64
            images:
                r.images?.map((img) => ({
                    fileName: img.fileName,
                    contentType: img.contentType,
                    base64: img.data?.toString("base64") || null,
                })) || [],

            // Bill Copy in Base64
            billCopy: r.billCopy?.data
                ? {
                      fileName: r.billCopy.fileName,
                      contentType: r.billCopy.contentType,
                      base64: r.billCopy.data.toString("base64"),
                  }
                : null,
        }));

        return res.status(200).json({
            message: "Retailer reports fetched successfully",
            totalReports: finalReports.length,
            reports: finalReports,
        });
    } catch (error) {
        console.error("Error fetching retailer reports:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

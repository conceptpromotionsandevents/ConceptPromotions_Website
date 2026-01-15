import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { Retailer } from "../models/retailer.model.js";
import { Campaign } from "../models/user.js";
import {
    deleteFromCloudinary,
    uploadToCloudinary,
} from "../utils/cloudinary.config.js";
import { getResourceType } from "../utils/cloudinary.helper.js";

import XLSX from "xlsx";
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
   REGISTER RETAILER - UPDATED FOR CLOUDINARY
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

        // ========================================
        // CLOUDINARY UPLOAD - Outlet Photo
        // ========================================
        let outletPhotoData;
        if (files.outletPhoto) {
            const result = await uploadToCloudinary(
                files.outletPhoto[0].buffer,
                "retailers/outlet_photos",
                getResourceType(files.outletPhoto[0].mimetype)
            );
            outletPhotoData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

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
            outletPhoto: outletPhotoData,
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

        // ========================================
        // CLOUDINARY UPLOAD - All Photos
        // ========================================
        let govtIdPhotoData, personPhotoData, registrationFormFileData;

        if (files.govtIdPhoto) {
            const result = await uploadToCloudinary(
                files.govtIdPhoto[0].buffer,
                "retailers/govt_id",
                getResourceType(files.govtIdPhoto[0].mimetype)
            );
            govtIdPhotoData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        if (files.personPhoto) {
            const result = await uploadToCloudinary(
                files.personPhoto[0].buffer,
                "retailers/person_photos",
                getResourceType(files.personPhoto[0].mimetype)
            );
            personPhotoData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        if (files.registrationFormFile) {
            const result = await uploadToCloudinary(
                files.registrationFormFile[0].buffer,
                "retailers/registration_forms",
                getResourceType(files.registrationFormFile[0].mimetype)
            );
            registrationFormFileData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        const retailer = new Retailer({
            name: body.name,
            contactNo,
            email,
            dob: body.dob,
            gender: body.gender,
            govtIdType: body.govtIdType,
            govtIdNumber: body.govtIdNumber,
            govtIdPhoto: govtIdPhotoData,
            personPhoto: personPhotoData,
            registrationFormFile: registrationFormFileData,
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
   GET RETAILER PROFILE - UPDATED FOR CLOUDINARY
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
            "-password"
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
   GET RETAILER IMAGE BY TYPE - NO LONGER NEEDED
   (Images are now accessible via Cloudinary URLs)
   KEEPING FOR BACKWARD COMPATIBILITY
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
        if (!imageField || !imageField.url) {
            return res.status(404).json({ message: "Image not found" });
        }

        // Return Cloudinary URL instead of buffer
        res.status(200).json({
            url: imageField.url,
            publicId: imageField.publicId,
        });
    } catch (error) {
        console.error("Get retailer image error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   CHECK WHICH IMAGES EXIST - UPDATED FOR CLOUDINARY
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
            hasGovtIdPhoto: !!retailer.govtIdPhoto?.url,
            hasPersonPhoto: !!retailer.personPhoto?.url,
            hasRegistrationFormFile: !!retailer.registrationFormFile?.url,
            hasOutletPhoto: !!retailer.outletPhoto?.url,
        });
    } catch (error) {
        console.error("Get image status error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/* ===============================
   UPDATE RETAILER PROFILE - UPDATED FOR CLOUDINARY
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

        if (bankDetailsChanged) {
            retailer.pennyCheck = false;
        }

        /* T&C AND PENNY CHECK */
        if (body.tnc === "true" || body.tnc === true) {
            retailer.tnc = true;
        }

        if (
            !bankDetailsChanged &&
            (body.pennyCheck === "true" || body.pennyCheck === true)
        ) {
            retailer.pennyCheck = true;
        }

        /* ========================================
           FILE UPLOADS - UPDATED FOR CLOUDINARY
           Delete old files before uploading new ones
        ======================================== */

        // govtIdPhoto
        if (files.govtIdPhoto) {
            // Delete old image from Cloudinary if exists
            if (retailer.govtIdPhoto?.publicId) {
                await deleteFromCloudinary(
                    retailer.govtIdPhoto.publicId,
                    getResourceType(files.govtIdPhoto[0].mimetype)
                );
            }

            const result = await uploadToCloudinary(
                files.govtIdPhoto[0].buffer,
                "retailers/govt_id",
                getResourceType(files.govtIdPhoto[0].mimetype)
            );
            retailer.govtIdPhoto = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        // personPhoto
        if (files.personPhoto) {
            if (retailer.personPhoto?.publicId) {
                await deleteFromCloudinary(
                    retailer.personPhoto.publicId,
                    getResourceType(files.personPhoto[0].mimetype)
                );
            }

            const result = await uploadToCloudinary(
                files.personPhoto[0].buffer,
                "retailers/person_photos",
                getResourceType(files.personPhoto[0].mimetype)
            );
            retailer.personPhoto = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        // registrationFormFile
        if (files.registrationFormFile) {
            if (retailer.registrationFormFile?.publicId) {
                await deleteFromCloudinary(
                    retailer.registrationFormFile.publicId,
                    getResourceType(files.registrationFormFile[0].mimetype)
                );
            }

            const result = await uploadToCloudinary(
                files.registrationFormFile[0].buffer,
                "retailers/registration_forms",
                getResourceType(files.registrationFormFile[0].mimetype)
            );
            retailer.registrationFormFile = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        // outletPhoto
        if (files.outletPhoto) {
            if (retailer.outletPhoto?.publicId) {
                await deleteFromCloudinary(
                    retailer.outletPhoto.publicId,
                    getResourceType(files.outletPhoto[0].mimetype)
                );
            }

            const result = await uploadToCloudinary(
                files.outletPhoto[0].buffer,
                "retailers/outlet_photos",
                getResourceType(files.outletPhoto[0].mimetype)
            );
            retailer.outletPhoto = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        await retailer.save();

        // Return sanitized response
        const sanitizedRetailer = retailer.toObject();
        delete sanitizedRetailer.password;

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
/* ===============================
   GET CAMPAIGNS ASSIGNED TO RETAILER
=============================== */
export const getRetailerCampaigns = async (req, res) => {
    try {
        /* =========================
           AUTH CHECK (RETAILER)
        ========================== */
        if (!req.user || req.user.role !== "retailer") {
            return res.status(403).json({
                success: false,
                message: "Only retailers can access campaigns",
            });
        }

        const retailerId = req.user.id;

        /* =========================
           VALIDATE RETAILER
        ========================== */
        const retailer = await Retailer.findById(retailerId)
            .select("name uniqueId retailerCode")
            .lean();

        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        /* =========================
           QUERY FILTERS
        ========================== */
        const { status, isActive } = req.query;

        const query = {
            "assignedRetailers.retailerId": retailerId,
        };

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        /* =========================
           FETCH CAMPAIGNS
        ========================== */
        const campaigns = await Campaign.find(query)
            .populate("createdBy", "name email")
            .populate("assignedRetailers.retailerId", "name contactNo")
            .populate({
                path: "assignedEmployeeRetailers.employeeId",
                select: "name phone email",
            })
            .sort({ createdAt: -1 })
            .lean();

        /* =========================
           MAP RETAILER VIEW
        ========================== */
        const mapped = campaigns.map((campaign) => {
            /* ---- normalize sub-documents ---- */
            campaign.info ??= { description: "", tnc: "", banners: [] };
            campaign.info.banners ??= [];

            campaign.gratification ??= {
                type: "",
                description: "",
                images: [],
            };
            campaign.gratification.images ??= [];

            /* ---- retailer entry ---- */
            const retailerEntry =
                campaign.assignedRetailers?.find(
                    (r) =>
                        r.retailerId &&
                        r.retailerId._id.toString() === retailerId.toString()
                ) || null;

            /* ---- employee mappings ---- */
            const assignedEmployees =
                campaign.assignedEmployeeRetailers
                    ?.filter(
                        (m) =>
                            m.retailerId &&
                            m.employeeId &&
                            m.retailerId.toString() === retailerId.toString()
                    )
                    .map((m) => ({
                        _id: m.employeeId._id,
                        name: m.employeeId.name,
                        phone: m.employeeId.phone,
                        email: m.employeeId.email,
                    })) || [];

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

                info: campaign.info,
                gratification: campaign.gratification,

                retailerStatus: {
                    status: retailerEntry?.status ?? "pending",
                    assignedAt: retailerEntry?.assignedAt ?? null,
                    updatedAt: retailerEntry?.updatedAt ?? null,
                    startDate:
                        retailerEntry?.startDate ?? campaign.campaignStartDate,
                    endDate: retailerEntry?.endDate ?? campaign.campaignEndDate,
                },

                assignedEmployees,
            };
        });

        /* =========================
           STATUS FILTER
        ========================== */
        const finalResult = status
            ? mapped.filter(
                  (c) => c.retailerStatus.status === status.toLowerCase()
              )
            : mapped;

        /* =========================
           RESPONSE
        ========================== */
        return res.status(200).json({
            success: true,
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
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ====== BULK REGISTER RETAILERS ======

// ====== BULK REGISTER RETAILERS ======
// export const bulkRegisterRetailers = async (req, res) => {
//     try {
//         // Only admins can bulk upload retailers
//         if (!req.user || req.user.role !== "admin") {
//             return res
//                 .status(403)
//                 .json({ message: "Only admins can upload retailers" });
//         }

//         if (!req.file) {
//             return res
//                 .status(400)
//                 .json({ message: "Excel/CSV file is required" });
//         }

//         // Read Excel
//         const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];

//         const rows = XLSX.utils.sheet_to_json(sheet, {
//             raw: false,  // Convert to strings to prevent scientific notation
//             defval: ""   // Default empty value
//         });

//         const retailersToInsert = [];
//         const failedRows = [];

//         for (let i = 0; i < rows.length; i++) {
//             const row = rows[i];

//             // ✅ SANITIZE NUMERIC FIELDS
//             const contactNo = String(row.contactNo || "").replace(/[^0-9]/g, "").slice(0, 10);
//             const shopPincode = String(row.shopPincode || "").replace(/[^0-9]/g, "").slice(0, 6);
//             const accountNumber = String(row.accountNumber || "").replace(/[^0-9]/g, "");

//             // ✅ EXTRACT 18 FIELDS FROM EXCEL (NO GENDER)
//             const {
//                 shopName,
//                 shopAddress,
//                 shopCity,
//                 shopState,
//                 GSTNo,
//                 businessType,
//                 ownershipType,
//                 name,
//                 PANCard,
//                 email,
//                 govtIdType,
//                 govtIdNumber,
//                 bankName,
//                 IFSC,
//                 branchName,
//             } = row;

//             /* ---------------- VALIDATION ---------------- */

//             const missingFields = [];

//             // Required shop fields
//             if (!shopName) missingFields.push("shopName");
//             if (!shopAddress) missingFields.push("shopAddress");
//             if (!shopCity) missingFields.push("shopCity");
//             if (!shopState) missingFields.push("shopState");
//             if (!shopPincode) missingFields.push("shopPincode");
//             if (!businessType) missingFields.push("businessType");
//             if (!PANCard) missingFields.push("PANCard");

//             // Required retailer fields
//             if (!name) missingFields.push("name");
//             if (!contactNo) missingFields.push("contactNo");

//             // Required bank fields
//             if (!bankName) missingFields.push("bankName");
//             if (!accountNumber) missingFields.push("accountNumber");
//             if (!IFSC) missingFields.push("IFSC");
//             if (!branchName) missingFields.push("branchName");

//             if (missingFields.length > 0) {
//                 failedRows.push({
//                     rowNumber: i + 2,
//                     reason: `Missing required fields: ${missingFields.join(", ")}`,
//                     data: row,
//                 });
//                 continue;
//             }

//             // ✅ Contact validation
//             const contactRegex = /^[6-9]\d{9}$/;
//             if (!contactRegex.test(contactNo)) {
//                 failedRows.push({
//                     rowNumber: i + 2,
//                     reason: `Invalid contact number: ${contactNo}. Must be 10 digits starting with 6-9`,
//                     data: row,
//                 });
//                 continue;
//             }

//             // ✅ Pincode validation
//             if (shopPincode.length !== 6) {
//                 failedRows.push({
//                     rowNumber: i + 2,
//                     reason: `Invalid pincode: ${shopPincode}. Must be 6 digits`,
//                     data: row,
//                 });
//                 continue;
//             }

//             // ✅ Email validation (optional field)
//             if (email) {
//                 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//                 if (!emailRegex.test(email)) {
//                     failedRows.push({
//                         rowNumber: i + 2,
//                         reason: `Invalid email format: ${email}`,
//                         data: row,
//                     });
//                     continue;
//                 }
//             }

//             // ✅ Duplicate check
//             const exists = await Retailer.findOne({
//                 $or: [{ contactNo }],
//             });

//             if (exists) {
//                 failedRows.push({
//                     rowNumber: i + 2,
//                     reason: `Duplicate: Contact number '${contactNo}' already exists`,
//                     data: row,
//                     existingRetailer: {
//                         id: exists._id,
//                         name: exists.name,
//                         contactNo: exists.contactNo,
//                         uniqueId: exists.uniqueId,
//                         retailerCode: exists.retailerCode,
//                     },
//                 });
//                 continue;
//             }

//             /* ---------------- BUILD RETAILER OBJECT ---------------- */
//             try {
//                 retailersToInsert.push({
//                     // Personal Details (NO GENDER)
//                     name,
//                     contactNo,
//                     email: email || undefined,
//                     password: contactNo, // ✅ Will be hashed by schema pre-save hook
//                     govtIdType: govtIdType || undefined,
//                     govtIdNumber: govtIdNumber || undefined,

//                     // Shop Details
//                     shopDetails: {
//                         shopName,
//                         businessType,
//                         PANCard,
//                         ownershipType: ownershipType || undefined,
//                         GSTNo: GSTNo || undefined,
//                         shopAddress: {
//                             address: shopAddress,
//                             city: shopCity,
//                             state: shopState,
//                             pincode: shopPincode,
//                         },
//                     },

//                     // Bank Details
//                     bankDetails: {
//                         bankName,
//                         accountNumber,
//                         IFSC,
//                         branchName,
//                     },

//                     // System Fields
//                     phoneVerified: true,
//                     tnc: false,
//                     pennyCheck: false,
//                 });
//             } catch (err) {
//                 failedRows.push({
//                     rowNumber: i + 2,
//                     reason: `Error building retailer object: ${err.message}`,
//                     data: row,
//                 });
//             }
//         }

//         /* ---------------- INSERT INTO DATABASE ---------------- */

//         let insertedRetailers = [];
//         if (retailersToInsert.length > 0) {
//             try {
//                 console.log(`📝 Attempting to insert ${retailersToInsert.length} retailers...`);

//                 insertedRetailers = await Retailer.insertMany(
//                     retailersToInsert,
//                     { ordered: false }
//                 );

//                 console.log(`✅ Successfully inserted ${insertedRetailers.length} retailers`);
//             } catch (insertError) {
//                 console.error("❌ Insert error:", insertError);

//                 // Capture successfully inserted documents
//                 if (insertError.insertedDocs) {
//                     insertedRetailers = insertError.insertedDocs;
//                     console.log(`✅ Partially successful: ${insertedRetailers.length} inserted`);
//                 }

//                 // Capture failed inserts from MongoDB
//                 if (insertError.writeErrors) {
//                     console.log(`❌ Write errors found: ${insertError.writeErrors.length}`);
//                     insertError.writeErrors.forEach((err, idx) => {
//                         const failedIndex = err.index;
//                         const failedDoc = retailersToInsert[failedIndex];

//                         let errorMsg = "Unknown database error";
//                         if (err.errmsg) {
//                             errorMsg = err.errmsg;
//                         } else if (err.err && err.err.errmsg) {
//                             errorMsg = err.err.errmsg;
//                         } else if (err.message) {
//                             errorMsg = err.message;
//                         }

//                         console.log(`  ${idx + 1}. Row ${failedIndex + 2}: ${errorMsg}`);

//                         failedRows.push({
//                             rowNumber: failedIndex + 2,
//                             reason: `Database error: ${errorMsg}`,
//                             data: {
//                                 name: failedDoc.name,
//                                 contactNo: failedDoc.contactNo,
//                                 email: failedDoc.email,
//                                 shopName: failedDoc.shopDetails?.shopName,
//                             },
//                         });
//                     });
//                 } else {
//                     console.error("General MongoDB error:", {
//                         name: insertError.name,
//                         message: insertError.message,
//                         code: insertError.code
//                     });

//                     if (insertError.name === 'ValidationError') {
//                         const validationErrors = Object.keys(insertError.errors || {}).map(key => {
//                             return `${key}: ${insertError.errors[key].message}`;
//                         }).join(', ');

//                         return res.status(400).json({
//                             success: false,
//                             message: "Validation error during bulk insert",
//                             error: validationErrors || insertError.message,
//                             failedRows: failedRows,
//                         });
//                     }

//                     return res.status(500).json({
//                         success: false,
//                         message: "Database insertion failed",
//                         error: insertError.message,
//                         errorDetails: {
//                             name: insertError.name,
//                             code: insertError.code,
//                         },
//                         failedRows: failedRows,
//                     });
//                 }
//             }
//         }

//         /* ---------------- PREPARE RESPONSE ---------------- */

//         const response = {
//             success: true,
//             summary: {
//                 totalRows: rows.length,
//                 successful: insertedRetailers.length,
//                 failed: failedRows.length,
//                 successRate: rows.length > 0
//                     ? `${((insertedRetailers.length / rows.length) * 100).toFixed(2)}%`
//                     : "0%",
//             },
//             insertedRetailers: insertedRetailers.map((r) => ({
//                 id: r._id,
//                 name: r.name,
//                 email: r.email,
//                 contactNo: r.contactNo,
//                 uniqueId: r.uniqueId,
//                 retailerCode: r.retailerCode,
//                 shopName: r.shopDetails?.shopName,
//             })),
//             failedRows,
//         };

//         /* ---------------- RETURN APPROPRIATE STATUS ---------------- */

//         if (insertedRetailers.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No retailers were added. All rows failed validation.",
//                 ...response,
//             });
//         }

//         if (failedRows.length > 0) {
//             return res.status(207).json({
//                 success: true,
//                 message: `${insertedRetailers.length} retailers added, ${failedRows.length} rows failed`,
//                 ...response,
//             });
//         }

//         return res.status(201).json({
//             success: true,
//             message: `All ${insertedRetailers.length} retailers added successfully`,
//             ...response,
//         });
//     } catch (error) {
//         console.error("❌ Bulk retailer upload error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Server error",
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//         });
//     }
// };

/* ===============================
   GET RETAILERS BY CAMPAIGN ID
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

        const campaign = await Campaign.findById(campaignId)
            .select("assignedRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

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

        const retailerEntry = campaign.assignedRetailers.find(
            (r) => r.retailerId?.toString() === retailerId.toString()
        );

        if (!retailerEntry)
            return res.status(403).json({
                message: "You are not assigned to this campaign",
            });

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

        const retailerEntry = campaign.assignedRetailers.find(
            (r) => r.retailerId?.toString() === retailerId.toString()
        );

        if (!retailerEntry)
            return res
                .status(403)
                .json({ message: "You are not assigned to this campaign" });

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

/* ===============================
   SUBMIT RETAILER REPORT - UPDATED FOR CLOUDINARY
=============================== */
export const submitRetailerReport = async (req, res) => {
    try {
        const retailerId = req.user.id;

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

        // ========================================
        // CLOUDINARY UPLOAD - Multiple Images
        // ========================================
        const uploadedImages = [];
        if (req.files?.images) {
            for (const file of req.files.images) {
                const result = await uploadToCloudinary(
                    file.buffer,
                    "reports/retailer_images",
                    getResourceType(file.mimetype)
                );
                uploadedImages.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    fileName: file.originalname,
                });
            }
        }

        const report = new EmployeeReport({
            employeeId: null,
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
            images: uploadedImages,
            submittedByRole: "Retailer",
            submittedByRetailer: retailerId,
        });

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

/* ===============================
   VIEW REPORT IMAGE - NO LONGER NEEDED
   (Images accessible via Cloudinary URLs)
=============================== */
export const viewReportImage = async (req, res) => {
    try {
        const { reportId, imageIndex } = req.params;

        const report = await EmployeeReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        const img = report.images[imageIndex];
        if (!img || !img.url) {
            return res.status(404).json({ message: "Image not found" });
        }

        // Return Cloudinary URL
        res.status(200).json({
            url: img.url,
            publicId: img.publicId,
            fileName: img.fileName,
        });
    } catch (err) {
        console.error("View report image error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/* ===============================
   VIEW BILL COPY - NO LONGER NEEDED
   (Bill copies accessible via Cloudinary URLs)
=============================== */
export const viewBillCopy = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await EmployeeReport.findById(reportId);
        if (!report || !report.billCopy?.url) {
            return res.status(404).json({ message: "Bill copy not found" });
        }

        // Return Cloudinary URL
        res.status(200).json({
            url: report.billCopy.url,
            publicId: report.billCopy.publicId,
            fileName: report.billCopy.fileName,
        });
    } catch (err) {
        console.error("View bill copy error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/* ===============================
   GET RETAILER REPORTS - UPDATED FOR CLOUDINARY
=============================== */
export const getRetailerReports = async (req, res) => {
    try {
        const retailerId = req.user.id;

        const { campaignId, fromDate, toDate } = req.query;

        const filter = { retailerId };

        if (campaignId) filter.campaignId = campaignId;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

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

        // ========================================
        // NO MORE BASE64 CONVERSION - Return URLs
        // ========================================
        const finalReports = reports.map((r) => ({
            ...r.toObject(),

            campaignName: r.campaignId?.name || "",
            campaignType: r.campaignId?.type || "",
            clientName: r.campaignId?.client || "",

            employeeName: r.employeeId?.name || "",
            employeePhone: r.employeeId?.phone || "",
            employeeEmail: r.employeeId?.email || "",
            employeePosition: r.employeeId?.position || "",

            retailerName: r.retailerId?.name || "",
            retailerUniqueId: r.retailerId?.uniqueId || "",
            retailerCode: r.retailerId?.retailerCode || "",
            shopName: r.retailerId?.shopDetails?.shopName || "",

            visitDate: r.visitScheduleId?.visitDate || "",
            visitStatus: r.visitScheduleId?.status || "",
            visitType: r.visitScheduleId?.visitType || "",

            // Images are now just URLs - no base64 needed
            images:
                r.images?.map((img) => ({
                    url: img.url,
                    publicId: img.publicId,
                    fileName: img.fileName,
                })) || [],

            billCopy: r.billCopy?.url
                ? {
                      url: r.billCopy.url,
                      publicId: r.billCopy.publicId,
                      fileName: r.billCopy.fileName,
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

/* ===========================
   DELETE RETAILER PROFILE PICTURE
=========================== */
export const deleteRetailerProfilePicture = async (req, res) => {
    try {
        const retailerId = req.user.id;
        console.log("🗑️ Delete Profile Picture - Retailer ID:", retailerId);

        // Find the retailer
        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        // Check if profile picture exists
        if (!retailer.personPhoto?.publicId) {
            return res.status(400).json({
                success: false,
                message: "No profile picture to delete"
            });
        }

        // Delete from Cloudinary
        console.log("🗑️ Deleting from Cloudinary:", retailer.personPhoto.publicId);
        const deleteResult = await deleteFromCloudinary(
            retailer.personPhoto.publicId,
            "image"
        );

        console.log("✅ Cloudinary delete result:", deleteResult);

        // Remove from database
        retailer.personPhoto = {
            url: null,
            publicId: null
        };

        await retailer.save();

        res.status(200).json({
            success: true,
            message: "Profile picture deleted successfully",
            retailer: {
                ...retailer.toObject(),
                password: undefined // Don't send password
            }
        });

    } catch (error) {
        console.error("❌ Delete profile picture error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete profile picture",
            error: error.message
        });
    }
};


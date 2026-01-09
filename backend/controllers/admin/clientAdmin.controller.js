// admin/clientAdmin.controller.js
import bcrypt from "bcryptjs";
import { ClientAdmin } from "../../models/user.js";

// ====== ADD CLIENT ADMIN ======
export const addClientAdmin = async (req, res) => {
    try {
        const {
            name,
            email,
            contactNo,
            organizationName,
            role,
            regions,
            states,
        } = req.body;

        // Only admin can create client admins
        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admins can add client admins" });

        // Required fields
        if (!name || !email || !organizationName || !contactNo || !role)
            return res.status(400).json({ message: "Missing required fields" });

        // States validation
        if (!states || !Array.isArray(states) || states.length === 0)
            return res
                .status(400)
                .json({ message: "At least one state must be provided" });

        // Regions validation
        if (!regions || !Array.isArray(regions) || regions.length === 0)
            return res
                .status(400)
                .json({ message: "At least one region must be provided" });

        // Check existing
        const existing = await ClientAdmin.findOne({ email });
        if (existing)
            return res
                .status(409)
                .json({ message: "Client admin already exists" });

        // 🔥 DEFAULT PASSWORD = contactNo
        const hashedPassword = await bcrypt.hash(contactNo.toString(), 10);

        const newClientAdmin = new ClientAdmin({
            name,
            email,
            contactNo,
            organizationName,

            // 🔥 frontend aligned
            role,
            regions,
            states,

            password: hashedPassword,

            registrationDetails: {
                username: email,
                password: hashedPassword, // stored hashed
            },
        });

        await newClientAdmin.save();

        res.status(201).json({
            message: "Client admin created successfully",
            clientAdmin: newClientAdmin,
        });
    } catch (error) {
        console.error("Add client admin error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
// ====== GET ALL CLIENT ADMINS ======
export const getAllClientAdmins = async (req, res) => {
    try {
        /* =========================
           AUTH CHECK - Only admins can view all clients
        ========================== */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can view all client admins",
            });
        }

        /* =========================
           QUERY FILTERS (optional)
        ========================== */
        const { organizationName, state, region } = req.query;

        const filter = {};
        
        // Filter by organization name (case-insensitive partial match)
        if (organizationName) {
            filter.organizationName = { 
                $regex: organizationName, 
                $options: "i" 
            };
        }

        // Filter by state
        if (state) {
            filter.states = state;
        }

        // Filter by region
        if (region) {
            filter.regions = region;
        }

        /* =========================
           FETCH CLIENT ADMINS
        ========================== */
        const clientAdmins = await ClientAdmin.find(filter)
            .select("-password -registrationDetails.password") // Exclude sensitive data
            .sort({ createdAt: -1 }); // Most recent first

        /* =========================
           RESPONSE
        ========================== */
        return res.status(200).json({
            success: true,
            count: clientAdmins.length,
            clientAdmins,
        });
    } catch (error) {
        console.error("Get all client admins error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ====== GET CLIENT ADMIN BY ID ======
export const getClientAdminById = async (req, res) => {
    try {
        /* =========================
           AUTH CHECK
        ========================== */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can view client admin details",
            });
        }

        /* =========================
           FETCH CLIENT ADMIN
        ========================== */
        const { id } = req.params;

        const clientAdmin = await ClientAdmin.findById(id)
            .select("-password -registrationDetails.password");

        if (!clientAdmin) {
            return res.status(404).json({
                success: false,
                message: "Client admin not found",
            });
        }

        return res.status(200).json({
            success: true,
            clientAdmin,
        });
    } catch (error) {
        console.error("Get client admin by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

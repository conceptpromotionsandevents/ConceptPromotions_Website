// admin/clientUser.controller.js
import bcrypt from "bcryptjs";
import { ClientUser } from "../../models/user.js";

// ====== ADD CLIENT USER ======
export const addClientUser = async (req, res) => {
    try {
        const {
            name,
            email,
            contactNo,
            roleProfile,
            parentClientAdminId,
            password,
        } = req.body;

        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admins can add client users" });

        if (!name || !email || !parentClientAdminId || !password)
            return res.status(400).json({ message: "Missing required fields" });

        const existing = await ClientUser.findOne({ email });
        if (existing)
            return res
                .status(409)
                .json({ message: "Client user already exists" });

        const hashedPass = await bcrypt.hash(password, 10);

        const newClientUser = new ClientUser({
            name,
            email,
            contactNo,
            roleProfile,
            parentClientAdmin: parentClientAdminId,
            password: hashedPass,
        });

        await newClientUser.save();
        res.status(201).json({
            message: "Client user created successfully",
            clientUser: newClientUser,
        });
    } catch (error) {
        console.error("Add client user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

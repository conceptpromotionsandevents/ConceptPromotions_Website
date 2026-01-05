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

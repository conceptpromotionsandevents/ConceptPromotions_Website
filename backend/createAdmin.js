import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { User } from "./models/user.js";
import bcrypt from "bcryptjs";

dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    const existing = await User.findOne({ email: "admin@example.com" });
    if (!existing) {
      const hashed = await bcrypt.hash("Admin@123", 10);
      await User.create({
        name: "Super Admin",
        email: "admin@example.com",
        password: hashed,
        role: "admin"
      });
      console.log("Initial admin created!");
    } else {
      console.log("Admin already exists.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

createAdmin();

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

// Register new user
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Basic validation
        if (!username || !email || !password)
            return res.status(400).json({ error: "All fields required" });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: role || "user", // default is user
        });

        await user.save();
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1d" }
        );

        res.json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users — admin only
// router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
router.get("/all", async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
});
module.exports = router;

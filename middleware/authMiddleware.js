const jwt = require("jsonwebtoken");

// Auth middleware: verifies token
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ error: "Invalid token format" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        req.user = decoded; // attach user info to request
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token is not valid" });
    }
};

// Admin-only middleware: checks role
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };

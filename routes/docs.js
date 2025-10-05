const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const Doc = require("../models/Doc");

// Setup multer for file uploads
const upload = multer({ dest: "uploads/" });

// POST /api/docs — upload document
router.post("/", upload.single("file"), async (req, res) => {
	try {
		const { title, owner } = req.body;
		const file = req.file;

		if (!file) return res.status(400).json({ error: "File is required" });

        let content = "";

        if (file.mimetype === "application/pdf") {
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            content = data.text;
        } else if (
            file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const result = await mammoth.extractRawText({ path: file.path });
            content = result.value;
        } else if (file.mimetype.startsWith("text/")) {
            content = fs.readFileSync(file.path, "utf-8");
        } else {
            return res.status(400).json({ error: "Unsupported file type" });
        }
		// content = fs.readFileSync(file.path, "utf-8"); // read text file
		const doc = new Doc({ title, content, owner, filename: file.originalname });
		await doc.save();

		res.json({ message: "Document uploaded successfully", doc });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// GET /api/docs — list documents
router.get("/", async (req, res) => {
	try {
		const { limit = 10, offset = 0 } = req.query;
		const docs = await Doc.find().skip(parseInt(offset)).limit(parseInt(limit));
		res.json(docs);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// GET /api/docs/:id — fetch single document by ID
router.get("/:id", async (req, res) => {
	try {
		const doc = await Doc.findById(req.params.id);
		if (!doc) return res.status(404).json({ error: "Document not found" });
		// Admin can see all
        if (req.user.role === "admin") return res.json(doc);

        // Owner can see their own
        if (doc.owner === req.user.id) return res.json(doc);

        // If doc is private and not owner/admin → deny
        if (doc.private) return res.status(403).json({ error: "Private document" });

        // If shareToken matches query → allow
        const { token } = req.query;
        if (token && token === doc.shareToken) return res.json(doc);

        return res.status(403).json({ error: "Access denied" });
        // res.json(doc);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// PUT /api/docs/:id/private
router.put("/:id/private", authMiddleware, async (req, res) => {
    try {
        const doc = await Doc.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Document not found" });

        // Only owner or admin can change privacy
        if (req.user.role !== "admin" && doc.owner !== req.user.id)
            return res.status(403).json({ error: "Access denied" });

        const { private } = req.body; // boolean
        doc.private = !!private; // ensure boolean
        await doc.save();

        res.json({ message: `Document privacy set to ${doc.private}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/docs/:id/share
router.post("/:id/share", authMiddleware, async (req, res) => {
    try {
        const doc = await Doc.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Document not found" });

        if (req.user.role !== "admin" && doc.owner !== req.user.id)
            return res.status(403).json({ error: "Access denied" });

        const token = crypto.randomBytes(16).toString("hex");
        doc.shareToken = token;
        await doc.save();

        res.json({ message: "Share token generated", token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

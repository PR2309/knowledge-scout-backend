const express = require("express");
const router = express.Router();
const Doc = require("../models/Doc");
const Index = require("../models/Index");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

// Dummy embedding function (replace with AI API call)
const getEmbedding = async (text) => {
  // Call your embedding API here
  return Array(768).fill(Math.random()); // dummy 768-dim vector
};

router.post("/rebuild", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // 1. Fetch all docs
        const docs = await Doc.find();

        // 2. Clear existing index
        await Index.deleteMany({});

        // 3. Process each doc
        for (const doc of docs) {
        const embedding = await getEmbedding(doc.content);
        await Index.create({
            docId: doc._id,
            embedding,
            pageNumber: currentPage,    // PDF / Word
            lineNumber: lineInPage,
            contentSnippet: doc.content.slice(0, 200) // first 200 chars
        });
        }

        res.json({ message: "Index rebuilt successfully", totalDocs: docs.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/stats", authMiddleware, async (req, res) => {
	try {
		const totalDocs = await Index.countDocuments();
		const lastRebuildDoc = await Index.findOne().sort({ createdAt: -1 });

		res.json({
			totalDocs,
			lastRebuild: lastRebuildDoc ? lastRebuildDoc.createdAt : null,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;

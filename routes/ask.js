const express = require("express");
const router = express.Router();
const { getEmbedding } = require("./index");
const Index = require("../models/Index");
const Doc = require("../models/Doc");
const { authMiddleware } = require("../middleware/authMiddleware");
router.post("/ask", authMiddleware, async (req, res) => {
	try {
		const { query, k = 5 } = req.body;

		if (!query) return res.status(400).json({ error: "Query required" });

		// Generate query embedding
		const queryEmbedding = await getEmbedding(query);

		// Fetch all accessible index docs
		const docs = await Doc.find({
			$or: [
				{ private: false },
				{ owner: req.user.id },
				{ sharedTokens: { $in: [req.body.shareToken] } },
			],
		});

		const indexDocs = await Index.find({
			docId: { $in: docs.map((d) => d._id) },
		});

		// Dummy similarity calculation: use cosine similarity in real use
		const results = indexDocs
			.map((d) => ({ ...d._doc, score: Math.random() })) // replace with real similarity
			.sort((a, b) => b.score - a.score)
			.slice(0, k)
			.map((d) => ({
				page: 1,
				snippet: d.contentSnippet,
				source: d.docId,
			}));

		res.json({ query, cached: false, results });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
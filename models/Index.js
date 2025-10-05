const mongoose = require("mongoose");

const IndexSchema = new mongoose.Schema({
	docId: { type: mongoose.Schema.Types.ObjectId, ref: "Doc", required: true },
	embedding: { type: Array, required: true }, // Array of floats from embedding model
	contentSnippet: { type: String }, // Optional snippet for quick display
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Index", IndexSchema);

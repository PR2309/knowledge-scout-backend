const dotenv = require("dotenv");
const path = require("path");

// dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
const docsRoutes = require("./routes/docs");
const indexRoutes = require("./routes/index");
const askRoutes = require("./routes/ask");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI).then(() =>{
    console.log("MongoDB connected")
}).catch(err => console.log("MongoDB error:", err));


app.use("/api/user", userRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/index", indexRoutes);
app.use("/api", askRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "Backend is running" });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)}
);

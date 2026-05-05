require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./db");
const videoRoutes = require("./routes/videos");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure directories exist
const fs = require("fs");
const videosDir = path.join(__dirname, "../videos");
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Static file serving for streams and thumbnails
app.use(
  "/stream",
  (req, res, next) => {
    // Basic CORS for streaming to allow players to fetch manifests and segments
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  },
  express.static(path.join(__dirname, "../videos"))
);

// Routes
app.use("/api/videos", videoRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Video streaming backend is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something broke!", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

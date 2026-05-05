const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  uploadVideo,
  getVideos,
  getVideoById,
  getVideoStatus,
  deleteVideo,
} = require("../controllers/videoController");

const router = express.Router();

// Multer setup for temporary upload storage
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept video files only
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Not a video file! Please upload only videos."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
});

// Routes
router.post("/upload", upload.single("video"), uploadVideo);
router.get("/", getVideos);
router.get("/:id", getVideoById);
router.get("/:id/status", getVideoStatus);
router.delete("/:id", deleteVideo);

module.exports = router;

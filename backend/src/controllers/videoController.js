const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Video = require("../models/Video");
const { transcodeVideo } = require("../services/transcoder");

const VIDEOS_DIR = path.join(__dirname, "../../videos");

// POST /api/videos/upload
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file provided" });
    }

    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    // Save to MongoDB first to get a valid ObjectId
    const video = new Video({
      title: title.trim(),
      description: description?.trim() || "",
      originalFilename: req.file.originalname,
      storagePath: "temp", // Temporary, updated below
      size: req.file.size,
      mimeType: req.file.mimetype,
      status: "processing",
    });

    const videoId = video._id.toString();
    const videoDir = path.join(VIDEOS_DIR, videoId);
    fs.mkdirSync(videoDir, { recursive: true });

    // Move uploaded file to video directory
    // Use copy + unlink instead of renameSync to avoid Windows EBUSY lock errors
    const originalExt = path.extname(req.file.originalname);
    const originalPath = path.join(videoDir, `original${originalExt}`);
    fs.copyFileSync(req.file.path, originalPath);
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkErr) {
      console.warn("Could not delete temp file, it may be locked by another process:", unlinkErr.message);
    }

    // Update the storagePath and save
    video.storagePath = videoDir;
    await video.save();

    // Start transcoding in background (non-blocking)
    transcodeVideo(videoId, originalPath, videoDir).catch((err) => {
      console.error("Background transcoding error:", err);
    });

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully. Processing started.",
      data: {
        id: videoId,
        title: video.title,
        description: video.description,
        status: video.status,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
};

// GET /api/videos
const getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id title description status duration thumbnailPath processingProgress createdAt resolutions"),
      Video.countDocuments(),
    ]);

    res.json({
      success: true,
      data: videos.map((v) => formatVideoResponse(v, req)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch videos", error: error.message });
  }
};

// GET /api/videos/:id
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const response = {
      ...formatVideoResponse(video, req),
      streamUrls: {},
    };

    if (video.status === "ready") {
      response.streamUrls = {
        hls: `${baseUrl}/stream/${video._id}/hls/master.m3u8`,
        dash: `${baseUrl}/stream/${video._id}/dash/manifest.mpd`,
        thumbnail: video.thumbnailPath
          ? `${baseUrl}/stream/${video._id}/thumbnail.jpg`
          : null,
      };
    }

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch video", error: error.message });
  }
};

// GET /api/videos/:id/status
const getVideoStatus = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).select(
      "_id status processingProgress errorMessage resolutions duration"
    );

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    res.json({
      success: true,
      data: {
        id: video._id,
        status: video.status,
        progress: video.processingProgress,
        errorMessage: video.errorMessage,
        resolutions: video.resolutions?.map((r) => r.quality) || [],
        duration: video.duration,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch status", error: error.message });
  }
};

// DELETE /api/videos/:id
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Delete stored files
    if (video.storagePath && fs.existsSync(video.storagePath)) {
      fs.rmSync(video.storagePath, { recursive: true, force: true });
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete video", error: error.message });
  }
};

// Helper: format video response with thumbnail URL
const formatVideoResponse = (video, req) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return {
    id: video._id,
    title: video.title,
    description: video.description,
    status: video.status,
    duration: video.duration,
    processingProgress: video.processingProgress,
    resolutions: video.resolutions?.map((r) => r.quality) || [],
    thumbnailUrl: video.thumbnailPath
      ? `${baseUrl}/stream/${video._id}/thumbnail.jpg`
      : null,
    createdAt: video.createdAt,
  };
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideoById,
  getVideoStatus,
  deleteVideo,
};

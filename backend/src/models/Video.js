const mongoose = require("mongoose");

const resolutionSchema = new mongoose.Schema({
  quality: { type: String, enum: ["240p", "480p", "720p", "1080p"] },
  width: Number,
  height: Number,
  bitrate: String,
  hlsPath: String,
  dashPath: String,
});

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    thumbnailPath: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
    },
    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "error"],
      default: "uploading",
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    resolutions: [resolutionSchema],
    hlsMasterPath: {
      type: String,
      default: null,
    },
    dashManifestPath: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", videoSchema);

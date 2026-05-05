const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
const path = require("path");
const fs = require("fs");
const Video = require("../models/Video");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const RESOLUTIONS = [
  { quality: "240p", width: 426, height: 240, videoBitrate: "400k", audioBitrate: "64k" },
  { quality: "480p", width: 854, height: 480, videoBitrate: "1000k", audioBitrate: "128k" },
  { quality: "720p", width: 1280, height: 720, videoBitrate: "2500k", audioBitrate: "128k" },
  { quality: "1080p", width: 1920, height: 1080, videoBitrate: "5000k", audioBitrate: "192k" },
];

const getVideoMetadata = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const generateThumbnail = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    const thumbPath = path.join(outputDir, "thumbnail.jpg");
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ["5%"],
        filename: "thumbnail.jpg",
        folder: outputDir,
        size: "640x360",
      })
      .on("end", () => resolve(thumbPath))
      .on("error", (err) => {
        console.warn("⚠️ Thumbnail generation failed:", err.message);
        resolve(null);
      });
  });
};

const transcodeToHLS = (inputPath, outputDir, resolution) => {
  return new Promise((resolve, reject) => {
    const hlsDir = path.join(outputDir, "hls", resolution.quality);
    ensureDir(hlsDir);

    const playlistPath = path.join(hlsDir, "stream.m3u8");

    ffmpeg(inputPath)
      .outputOptions([
        `-vf scale=${resolution.width}:${resolution.height}`,
        `-c:v libx264`,
        `-b:v ${resolution.videoBitrate}`,
        `-c:a aac`,
        `-b:a ${resolution.audioBitrate}`,
        `-hls_time 6`,
        `-hls_playlist_type vod`,
        `-hls_segment_filename ${path.join(hlsDir, "segment%03d.ts")}`,
        `-f hls`,
      ])
      .output(playlistPath)
      .on("end", () => {
        console.log(`✅ HLS ${resolution.quality} done`);
        resolve(playlistPath);
      })
      .on("error", (err) => {
        console.error(`❌ HLS ${resolution.quality} error:`, err.message);
        reject(err);
      })
      .run();
  });
};

const generateHLSMaster = (videoId, outputDir, completedResolutions) => {
  const masterPath = path.join(outputDir, "hls", "master.m3u8");
  const bandwidthMap = {
    "240p":  400000,
    "480p":  1000000,
    "720p":  2500000,
    "1080p": 5000000,
  };
  const resolutionMap = {
    "240p":  "426x240",
    "480p":  "854x480",
    "720p":  "1280x720",
    "1080p": "1920x1080",
  };

  let content = "#EXTM3U\n#EXT-X-VERSION:3\n\n";

  completedResolutions.forEach((res) => {
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidthMap[res.quality]},RESOLUTION=${resolutionMap[res.quality]},NAME="${res.quality}"\n`;
    content += `${res.quality}/stream.m3u8\n\n`;
  });

  fs.writeFileSync(masterPath, content);
  return masterPath;
};

const transcodeToMPEGDASH = (inputPath, outputDir, resolution) => {
  return new Promise((resolve, reject) => {
    const dashDir = path.join(outputDir, "dash", resolution.quality);
    ensureDir(dashDir);

    const segmentPath = path.join(dashDir, "segment$Number$.m4s");
    const initPath = path.join(dashDir, "init.mp4");

    ffmpeg(inputPath)
      .outputOptions([
        `-vf scale=${resolution.width}:${resolution.height}`,
        `-c:v libx264`,
        `-b:v ${resolution.videoBitrate}`,
        `-c:a aac`,
        `-b:a ${resolution.audioBitrate}`,
        `-f dash`,
        `-seg_duration 6`,
        `-init_seg_name init.mp4`,
        `-media_seg_name segment$Number$.m4s`,
        `-use_template 1`,
        `-use_timeline 1`,
      ])
      .output(path.join(dashDir, "stream.mpd"))
      .on("end", () => {
        console.log(`✅ DASH ${resolution.quality} done`);
        resolve(path.join(dashDir, "stream.mpd"));
      })
      .on("error", (err) => {
        console.error(`❌ DASH ${resolution.quality} error:`, err.message);
        reject(err);
      })
      .run();
  });
};

const generateDASHManifest = (videoId, outputDir, completedResolutions) => {
  return new Promise((resolve, reject) => {
    const manifestPath = path.join(outputDir, "dash", "manifest.mpd");

    // Build a combined DASH manifest pointing to per-resolution streams
    let adaptationSets = "";

    completedResolutions.forEach((res, index) => {
      adaptationSets += `
    <AdaptationSet id="${index}" mimeType="video/mp4" segmentAlignment="true" startWithSAP="1">
      <Representation id="${res.quality}" bandwidth="${getBandwidth(res.quality)}" width="${res.width}" height="${res.height}" codecs="avc1.42E01E">
        <BaseURL>${res.quality}/</BaseURL>
        <SegmentTemplate timescale="90000" initialization="init.mp4" media="segment$Number$.m4s" startNumber="1">
          <SegmentTimeline>
          </SegmentTimeline>
        </SegmentTemplate>
      </Representation>
    </AdaptationSet>`;
    });

    // Use per-resolution MPD files as the DASH manifest approach
    // Link to individual resolution MPD files via a redirect manifest
    const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" type="static" minBufferTime="PT2S">
  <Period>
${adaptationSets}
  </Period>
</MPD>`;

    fs.writeFileSync(manifestPath, manifest);
    resolve(manifestPath);
  });
};

const getBandwidth = (quality) => {
  const map = { "240p": 400000, "480p": 1000000, "720p": 2500000, "1080p": 5000000 };
  return map[quality] || 1000000;
};

const getResolutionDimensions = (quality) => {
  const map = {
    "240p":  { width: 426,  height: 240 },
    "480p":  { width: 854,  height: 480 },
    "720p":  { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 },
  };
  return map[quality];
};

/**
 * Main transcoding pipeline — runs HLS for all resolutions,
 * generates HLS master playlist, and per-resolution DASH streams.
 */
const transcodeVideo = async (videoId, inputPath, outputDir) => {
  const completedResolutions = [];

  try {
    // Get source video metadata
    const metadata = await getVideoMetadata(inputPath);
    const videoStream = metadata.streams.find((s) => s.codec_type === "video");
    const sourceWidth = videoStream?.width || 1920;
    const sourceHeight = videoStream?.height || 1080;
    const duration = metadata.format?.duration || 0;

    // Filter resolutions to only those <= source resolution
    const targetResolutions = RESOLUTIONS.filter(
      (r) => r.height <= sourceHeight || completedResolutions.length === 0
    );

    // Ensure at least one resolution
    const resolutionsToProcess = targetResolutions.length > 0
      ? targetResolutions
      : [RESOLUTIONS[0]];

    // Update duration in DB
    await Video.findByIdAndUpdate(videoId, { duration, status: "processing", processingProgress: 5 });

    // Generate thumbnail
    const thumbPath = await generateThumbnail(inputPath, outputDir);
    if (thumbPath) {
      await Video.findByIdAndUpdate(videoId, { thumbnailPath: thumbPath });
    }

    await Video.findByIdAndUpdate(videoId, { processingProgress: 10 });

    // Transcode HLS for each resolution
    for (let i = 0; i < resolutionsToProcess.length; i++) {
      const res = resolutionsToProcess[i];
      const hlsDir = path.join(outputDir, "hls", res.quality);
      ensureDir(hlsDir);

      try {
        await transcodeToHLS(inputPath, outputDir, res);
        completedResolutions.push({
          quality: res.quality,
          width: res.width,
          height: res.height,
          bitrate: res.videoBitrate,
          hlsPath: path.join(outputDir, "hls", res.quality, "stream.m3u8"),
        });
      } catch (err) {
        console.error(`Skipping ${res.quality} due to error:`, err.message);
      }

      const progress = 10 + Math.round(((i + 1) / resolutionsToProcess.length) * 60);
      await Video.findByIdAndUpdate(videoId, { processingProgress: progress });
    }

    // Generate HLS master playlist
    const masterPath = generateHLSMaster(videoId, outputDir, completedResolutions);
    await Video.findByIdAndUpdate(videoId, {
      hlsMasterPath: masterPath,
      processingProgress: 75,
    });

    // Transcode DASH for each resolution
    const dashResolutions = [];
    for (let i = 0; i < resolutionsToProcess.length; i++) {
      const res = resolutionsToProcess[i];
      try {
        const dashPath = await transcodeToMPEGDASH(inputPath, outputDir, res);
        dashResolutions.push({ ...res, dashPath });
      } catch (err) {
        console.error(`DASH ${res.quality} failed:`, err.message);
      }

      const progress = 75 + Math.round(((i + 1) / resolutionsToProcess.length) * 20);
      await Video.findByIdAndUpdate(videoId, { processingProgress: progress });
    }

    // Generate DASH manifest
    const dashResolutionsFull = completedResolutions.map((r) => ({
      ...r,
      ...getResolutionDimensions(r.quality),
    }));
    await generateDASHManifest(videoId, outputDir, dashResolutionsFull);
    const manifestPath = path.join(outputDir, "dash", "manifest.mpd");

    // Final update
    await Video.findByIdAndUpdate(videoId, {
      status: "ready",
      processingProgress: 100,
      resolutions: completedResolutions,
      dashManifestPath: manifestPath,
    });

    console.log(`🎉 Video ${videoId} transcoding complete!`);
  } catch (error) {
    console.error(`💥 Transcoding failed for ${videoId}:`, error.message);
    await Video.findByIdAndUpdate(videoId, {
      status: "error",
      errorMessage: error.message,
    });
  }
};

module.exports = { transcodeVideo, getVideoMetadata };

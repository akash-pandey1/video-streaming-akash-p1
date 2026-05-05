"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios, { AxiosProgressEvent } from "axios";
import { Upload as UploadIcon, X, FileVideo, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      if (!title) {
        setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mkv", ".avi", ".mov", ".webm"],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 1024, // 1GB
  });

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setStatus("idle");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setStatus("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);

    try {
      await axios.post("http://localhost:5000/api/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      setStatus("success");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      console.error("Upload failed", err);
      setStatus("error");
      setErrorMessage(err.response?.data?.message || "An error occurred during upload.");
    }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 border border-border shadow-2xl max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Video</h2>
        <p className="text-gray-400">Add a new video to your streaming library</p>
      </div>

      {status === "success" ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500 text-green-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-medium text-white">Upload Complete!</h3>
          <p className="text-gray-400 text-center">
            Your video is now processing. We'll redirect you to the home page...
          </p>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-6">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : isDragReject
                  ? "border-error bg-error/10"
                  : "border-gray-600 hover:border-primary hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-secondary rounded-full">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    Drag & drop your video here
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse from your computer
                  </p>
                </div>
                <div className="text-xs text-gray-500 flex space-x-2">
                  <span>MP4</span>•<span>MKV</span>•<span>AVI</span>•<span>Max 1GB</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-4 flex items-center justify-between border border-border">
              <div className="flex items-center space-x-4 overflow-hidden">
                <div className="p-3 bg-primary/20 text-primary rounded-lg">
                  <FileVideo className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              {status !== "uploading" && (
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                Title <span className="text-error">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={status === "uploading"}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description..."
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                disabled={status === "uploading"}
              />
            </div>
          </div>

          {status === "error" && (
            <div className="bg-error/20 border border-error/50 text-error p-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {status === "uploading" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Uploading...</span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary animate-progress transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || !title.trim() || status === "uploading"}
            className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5" />
                <span>Upload Video</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

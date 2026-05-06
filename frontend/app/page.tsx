"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { PlaySquare, Loader2 } from "lucide-react";
import VideoCard, { Video } from "@/components/VideoCard";

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/videos");
      setVideos(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
      setError("Failed to load videos. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/videos/${id}`);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      console.error("Failed to delete video:", err);
      alert(err.response?.data?.message || "Failed to delete video");
    }
  };

  useEffect(() => {
    fetchVideos();
    
    // Poll for updates to reflect processing progress
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center text-center mb-16 space-y-4">
        <div className="inline-block p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <PlaySquare className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500 pb-2">
          Experience Premium Streaming
        </h1>
        <p className="text-gray-400 max-w-2xl text-lg md:text-xl">
          Upload and enjoy adaptive bitrate video streaming with multi-resolution support. Powered by HLS & DASH.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
          <span>Recent Uploads</span>
          {videos.some(v => v.status === "processing") && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="glass p-8 rounded-2xl text-center border-error/20 bg-error/5">
            <p className="text-error">{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="glass p-16 rounded-2xl text-center border-dashed border-2 border-border flex flex-col items-center">
            <PlaySquare className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No videos yet</h3>
            <p className="text-gray-500 mb-6">Upload your first video to start streaming</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

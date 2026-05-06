"use client";

import { useEffect, useState, use } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { Loader2, AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { Video } from "@/components/VideoCard";

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default function WatchPage({ params }: WatchPageProps) {
  const { id } = use(params);
  const [video, setVideo] = useState<Video & { streamUrls?: { hls: string; dash: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/videos/${id}`);
        setVideo(response.data.data);
      } catch (err: any) {
        console.error("Failed to fetch video:", err);
        setError(err.response?.data?.message || "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:5000/api/videos/${id}`);
      router.push("/");
    } catch (err: any) {
      console.error("Failed to delete video:", err);
      alert(err.response?.data?.message || "Failed to delete video");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="glass p-8 rounded-2xl border-error/20 bg-error/5 text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-error mb-6">{error || "Video not found"}</p>
          <Link href="/" className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (video.status !== "ready" || !video.streamUrls?.hls) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="glass p-12 rounded-2xl border-border">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Video is Processing</h2>
          <p className="text-gray-400 mb-6">
            Please wait while we prepare this video for adaptive streaming. 
            Progress: {video.processingProgress}%
          </p>
          <Link href="/" className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer 
            hlsUrl={video.streamUrls.hls} 
            posterUrl={video.thumbnailUrl || undefined} 
          />

          <div className="glass p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{video.title}</h1>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-error hover:bg-error/10 rounded-full transition-colors flex-shrink-0"
                title="Delete video"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center text-sm text-gray-400 mb-6 space-x-4">
              <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
              <span>•</span>
              <span className="flex space-x-1">
                {video.resolutions?.map((res: string) => (
                  <span key={res} className="bg-secondary px-2 py-0.5 rounded text-xs">
                    {res}
                  </span>
                ))}
              </span>
            </div>
            
            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {video.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-border sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">Up Next</h3>
            <div className="text-sm text-gray-400 text-center py-8">
              More videos feature coming soon!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

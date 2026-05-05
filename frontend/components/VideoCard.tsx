import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Play, Clock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export interface Video {
  id: string;
  title: string;
  description: string;
  status: "uploading" | "processing" | "ready" | "error";
  duration: number;
  processingProgress: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

export default function VideoCard({ video }: { video: Video }) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = () => {
    switch (video.status) {
      case "ready":
        return (
          <div className="flex items-center space-x-1 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready</span>
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{video.processingProgress}%</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-1 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const content = (
    <div className="group glass rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-border hover:border-primary/50">
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            {video.status === "processing" ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <Play className="w-10 h-10 text-gray-600" />
            )}
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {video.status === "ready" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
            <div className="bg-primary/90 rounded-full p-4 shadow-lg shadow-primary/50 backdrop-blur-sm">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom Bar Info */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-2">
          {video.duration > 0 && (
            <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center space-x-1 font-mono">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(video.duration)}</span>
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-3 h-10">
            {video.description}
          </p>
        )}
        <div className="text-xs text-gray-500 flex items-center">
          <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Progress bar for processing videos */}
      {video.status === "processing" && (
        <div className="h-1 w-full bg-secondary">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${video.processingProgress}%` }}
          />
        </div>
      )}
    </div>
  );

  if (video.status === "ready") {
    return <Link href={`/watch/${video.id}`}>{content}</Link>;
  }

  // If not ready, just show the card without link
  return <div className="cursor-not-allowed">{content}</div>;
}

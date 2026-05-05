"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Settings, Volume2, VolumeX, Maximize, Play, Pause, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  hlsUrl: string;
  posterUrl?: string;
  onReady?: () => void;
}

export default function VideoPlayer({ hlsUrl, posterUrl, onReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<{ height: number; bitrate: number; name: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 is auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  let controlsTimeout: NodeJS.Timeout;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    const initHls = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true, // Auto-adjust based on player size
          autoStartLoad: true,
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          const availableQualities = data.levels.map((level) => ({
            height: level.height,
            bitrate: level.bitrate,
            name: level.name || `${level.height}p`,
          }));
          setQualities(availableQualities);
          setIsLoading(false);
          if (onReady) onReady();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          if (hls.autoLevelEnabled) {
            setCurrentQuality(-1);
          } else {
            setCurrentQuality(data.level);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("fatal network error encountered, try to recover");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("fatal media error encountered, try to recover");
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Fallback for native HLS (Safari)
        video.src = hlsUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          if (onReady) onReady();
        });
      }
    };

    initHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [hlsUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle Time Update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progressPercent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progressPercent);
  };

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTo = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = seekTo;
    setProgress(parseFloat(e.target.value));
  };

  // Handle Volume
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Handle Quality Change
  const changeQuality = (levelIndex: number) => {
    if (!hlsRef.current) return;
    if (levelIndex === -1) {
      hlsRef.current.currentLevel = -1; // Auto
      setCurrentQuality(-1);
    } else {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
    }
    setShowQualityMenu(false);
  };

  // Hide controls on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    if (isPlaying) {
      controlsTimeout = setTimeout(() => setShowControls(false), 3000);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer object-contain bg-black"
        poster={posterUrl}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {/* Overlay Controls */}
      <div 
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-10 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Central Play/Pause Button (optional, shown when paused) */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-primary/90 rounded-full p-6 backdrop-blur-sm pointer-events-auto cursor-pointer shadow-[0_0_30px_rgba(99,102,241,0.5)] transform transition hover:scale-110" onClick={togglePlay}>
              <Play className="w-10 h-10 text-white ml-2" />
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="px-6 pb-6 pt-10">
          {/* Progress Bar */}
          <div className="group/progress relative h-2 cursor-pointer mb-6" onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const pos = (e.clientX - rect.left) / rect.width;
             if (videoRef.current) {
               videoRef.current.currentTime = pos * videoRef.current.duration;
             }
          }}>
            <div className="absolute inset-0 bg-white/20 rounded-full"></div>
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform scale-0 group-hover/progress:scale-100 transition-transform"></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-6">
              <button onClick={togglePlay} className="hover:text-primary transition">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center space-x-3 group/volume">
                <button onClick={toggleMute} className="hover:text-primary transition">
                  {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolume}
                  className="w-0 group-hover/volume:w-24 transition-all duration-300 origin-left cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6 relative">
              {/* Quality Selector */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="flex items-center space-x-1 hover:text-primary transition text-sm font-medium"
                  >
                    <Settings className="w-5 h-5" />
                    <span>
                      {currentQuality === -1 
                        ? "Auto" 
                        : qualities[currentQuality]?.name}
                    </span>
                  </button>

                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-secondary border border-border rounded-xl overflow-hidden shadow-2xl min-w-[120px]">
                      <button
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition ${
                          currentQuality === -1 ? "text-primary font-medium bg-primary/10" : ""
                        }`}
                        onClick={() => changeQuality(-1)}
                      >
                        Auto
                      </button>
                      {qualities.map((quality, index) => (
                        <button
                          key={index}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition ${
                            currentQuality === index ? "text-primary font-medium bg-primary/10" : ""
                          }`}
                          onClick={() => changeQuality(index)}
                        >
                          {quality.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={toggleFullscreen} className="hover:text-primary transition">
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

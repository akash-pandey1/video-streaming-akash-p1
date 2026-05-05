import Link from "next/link";
import { PlaySquare, Upload } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-primary/20 p-2 rounded-xl group-hover:bg-primary/30 transition-colors">
              <PlaySquare className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              StreamX
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              href="/upload"
              className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

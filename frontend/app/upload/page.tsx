import UploadForm from "@/components/UploadForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Video | StreamX",
  description: "Upload a new video to your streaming library.",
};

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <UploadForm />
    </div>
  );
}

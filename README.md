# StreamX | Premium Adaptive Video Streaming

A full-stack, end-to-end adaptive video streaming platform. Users can upload videos which are processed asynchronously into multiple resolutions (240p, 480p, 720p, 1080p) using FFmpeg. The processed video files are served to a Next.js frontend using HLS (HTTP Live Streaming) and DASH formats for seamless, network-adaptive playback.

## Features

- **Upload & Transcode**: Drag-and-drop video upload with real-time progress.
- **Adaptive Bitrate Streaming**: Multi-resolution support using `hls.js` so playback quality adjusts automatically based on the user's internet speed.
- **Background Processing**: FFmpeg processes videos asynchronously and updates progress sequentially in MongoDB.
- **Premium UI**: Built with Next.js 16 and Tailwind CSS v4, featuring dark mode, glassmorphism, and a highly responsive design.
- **Custom Player**: An elegant video player complete with quality selection menu and custom controls.

## Tech Stack

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Video Player**: Custom wrapper around `hls.js`

### Backend
- **Framework**: Node.js & Express.js
- **Database**: MongoDB (via Mongoose)
- **File Uploads**: Multer
- **Transcoding**: `fluent-ffmpeg` & `ffmpeg-static`

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `localhost:27017`

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend will run on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`.

## Author

- **Akash Panday**
- **Email**: akashdeep9226@gmail.com

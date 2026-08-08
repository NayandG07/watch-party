export type AppView =
  | "splash"
  | "login"
  | "register"
  | "forgot-password"
  | "accept-invitation"
  | "home"
  | "library"
  | "collections"
  | "movie-details"
  | "watch-room"
  | "friends"
  | "invitations"
  | "uploads"
  | "storage"
  | "settings"
  | "admin";

export interface User {
  name: string;
  avatar: string;
  role: "Owner" | "Level 2" | "Level 1";
  defaultQuality: string;
  defaultSubtitles: string;
  subtitlesEnabled: boolean;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string[];
  duration: string;
  durationSeconds: number;
  resolution: "4K UHD" | "1080p" | "720p";
  poster: string;
  backdrop: string;
  overview: string;
  audioTracks: string[];
  subtitleTracks: string[];
  owner: string;
  visibility: "Private" | "Shared Collection" | "Selected Friends";
  sizeGb: number;
  rating?: string;
  director?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  owner: string;
  sharedFriends: string[];
  movieIds: string[];
  backdrop: string;
}

export interface RoomMember {
  name: string;
  avatar: string;
  role: string;
  status: "playing" | "buffering" | "synced";
  progress: number; // e.g., 94% cached
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string; // e.g., "01:12:05" or "Now"
  isSystem?: boolean;
}

export interface UploadTask {
  id: string;
  name: string;
  progress: number;
  stage: "queue" | "encoding" | "thumbnails" | "uploading" | "complete" | "failed";
  sizeGb: number;
  logs: string[];
}

export interface Invitation {
  id: string;
  inviter: string;
  avatar: string;
  movieTitle: string;
  scheduledTime: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface AdminLog {
  timestamp: string;
  service: string;
  message: string;
  status: "ok" | "warn" | "error";
}

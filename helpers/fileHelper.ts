import { ALLOWED_MIMES, type AllowedMime } from "../constants/file";
import {
  AudioMime,
  DocumentMime,
  FileType,
  ImageMime,
  VideoMime,
} from "../types/file";

export const FILE_EXTENSIONS: Record<string, string[]> = {
  [FileType.IMAGE]: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  [FileType.VIDEO]: [".mp4", ".mpeg", ".mov", ".avi", ".mkv"],
  [FileType.AUDIO]: [".mp3", ".wav", ".ogg", ".m4a"],
  [FileType.DOCUMENT]: [".pdf", ".doc", ".docx"],
};

export const MIME_TO_FILE_TYPE: Record<string, FileType> = {
  ...Object.fromEntries(
    Object.values(ImageMime).map((mime) => [mime, FileType.IMAGE]),
  ),
  ...Object.fromEntries(
    Object.values(VideoMime).map((mime) => [mime, FileType.VIDEO]),
  ),
  ...Object.fromEntries(
    Object.values(AudioMime).map((mime) => [mime, FileType.AUDIO]),
  ),
  ...Object.fromEntries(
    Object.values(DocumentMime).map((mime) => [mime, FileType.DOCUMENT]),
  ),
};

export const getFileType = (mimeType: string): FileType | null => {
  return MIME_TO_FILE_TYPE[mimeType] || null;
};

export const isImage = (mimeType: string): boolean => {
  return Object.values(ImageMime).includes(mimeType as ImageMime);
};

export const isVideo = (mimeType: string): boolean => {
  return Object.values(VideoMime).includes(mimeType as VideoMime);
};

export const isAudio = (mimeType: string): boolean => {
  return Object.values(AudioMime).includes(mimeType as AudioMime);
};

export const isDocument = (mimeType: string): boolean => {
  return Object.values(DocumentMime).includes(mimeType as DocumentMime);
};

export const isAllowedMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIMES.includes(mimeType as AllowedMime);
};

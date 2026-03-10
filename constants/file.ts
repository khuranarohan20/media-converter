import { AudioMime, DocumentMime, ImageMime, VideoMime } from "../types/file";

export const ALLOWED_MIMES = [
  ImageMime.JPEG,
  ImageMime.JPG,
  ImageMime.PNG,
  ImageMime.GIF,
  ImageMime.WEBP,
  ImageMime.SVG,

  VideoMime.MP4,
  VideoMime.MPEG,
  VideoMime.QUICKTIME,
  VideoMime.AVI,
  VideoMime.MKV,

  AudioMime.MPEG,
  AudioMime.WAV,
  AudioMime.OGG,
  AudioMime.MP4,

  DocumentMime.PDF,
  DocumentMime.DOC,
  DocumentMime.DOCX,
] as const;

export type AllowedMime = (typeof ALLOWED_MIMES)[number];

export const allowedMimes = ALLOWED_MIMES;

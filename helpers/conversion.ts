import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import type { AllowedMime } from "../constants/file";
import { ImageMime } from "../types/file";
import { isImage } from "./fileHelper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "../outputs");

const ensureOutputDir = async () => {
  try {
    const fs = await import("fs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to create outputs directory:", error);
  }
};

interface IConvertFile {
  baseMimeType: AllowedMime;
  convertedMimeType: AllowedMime;
  filePath: string;
}

interface IConvertResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

const getSharpFormat = (
  mimeType: AllowedMime,
): sharp.AvailableFormatInfo | string => {
  const mimeToFormat: Record<string, sharp.AvailableFormatInfo | string> = {
    [ImageMime.JPEG]: "jpeg",
    [ImageMime.JPG]: "jpeg",
    [ImageMime.PNG]: "png",
    [ImageMime.GIF]: "gif",
    [ImageMime.WEBP]: "webp",
    [ImageMime.SVG]: "svg",
  };

  return mimeToFormat[mimeType] || "jpeg";
};

const getExtensionFromMime = (mimeType: AllowedMime): string => {
  const mimeToExt: Record<string, string> = {
    [ImageMime.JPEG]: ".jpg",
    [ImageMime.JPG]: ".jpg",
    [ImageMime.PNG]: ".png",
    [ImageMime.GIF]: ".gif",
    [ImageMime.WEBP]: ".webp",
    [ImageMime.SVG]: ".svg",
  };

  return mimeToExt[mimeType] || ".jpg";
};

export const convertFile = async ({
  baseMimeType,
  convertedMimeType,
  filePath,
}: IConvertFile): Promise<IConvertResult> => {
  try {
    if (!isImage(baseMimeType) || !isImage(convertedMimeType)) {
      return {
        success: false,
        error: "Conversion is currently supported for images only",
      };
    }

    const fs = await import("fs");
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: "Source file not found",
      };
    }

    // Ensure outputs directory exists
    await ensureOutputDir();

    const parsedPath = path.parse(filePath);
    const outputExtension = getExtensionFromMime(convertedMimeType);
    const outputPath = path.join(
      outputDir,
      `${parsedPath.name}-converted${outputExtension}`,
    );

    const outputFormat = getSharpFormat(convertedMimeType);

    let image = sharp(filePath);

    const formatOptions:
      | sharp.JpegOptions
      | sharp.PngOptions
      | sharp.WebpOptions
      | sharp.GifOptions = {};

    if (outputFormat === "jpeg") {
      Object.assign(formatOptions, {
        quality: 85,
        progressive: true,
      });
    } else if (outputFormat === "png") {
      Object.assign(formatOptions, {
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
    } else if (outputFormat === "webp") {
      Object.assign(formatOptions, {
        quality: 85,
        effort: 6,
      });
    } else if (outputFormat === "gif") {
      Object.assign(formatOptions, {
        colors: 256,
      });
    }

    await image.toFormat(outputFormat as any, formatOptions).toFile(outputPath);

    return {
      success: true,
      outputPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const convertMultipleFiles = async (
  conversions: Array<{
    baseMimeType: AllowedMime;
    convertedMimeType: AllowedMime;
    filePath: string;
  }>,
): Promise<IConvertResult[]> => {
  return Promise.all(conversions.map(convertFile));
};

export const convertFileWithOptions = async ({
  baseMimeType,
  convertedMimeType,
  filePath,
  options,
}: IConvertFile & {
  options?: sharp.OutputOptions;
}): Promise<IConvertResult> => {
  try {
    if (!isImage(baseMimeType) || !isImage(convertedMimeType)) {
      return {
        success: false,
        error: "Conversion is currently supported for images only",
      };
    }

    const fs = await import("fs");
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: "Source file not found",
      };
    }

    // Ensure outputs directory exists
    await ensureOutputDir();

    const parsedPath = path.parse(filePath);
    const outputExtension = getExtensionFromMime(convertedMimeType);
    const outputPath = path.join(
      outputDir,
      `${parsedPath.name}-converted${outputExtension}`,
    );

    const outputFormat = getSharpFormat(convertedMimeType);

    await sharp(filePath)
      .toFormat(outputFormat as any, options)
      .toFile(outputPath);

    return {
      success: true,
      outputPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const getImageMetadata = async (
  filePath: string,
): Promise<sharp.Metadata | null> => {
  try {
    const metadata = await sharp(filePath).metadata();
    return metadata;
  } catch {
    return null;
  }
};

export const resizeAndConvert = async ({
  filePath,
  convertedMimeType,
  width,
  height,
  fit = "inside",
}: {
  filePath: string;
  convertedMimeType: AllowedMime;
  width?: number;
  height?: number;
  fit?: keyof sharp.FitEnum;
}): Promise<IConvertResult> => {
  try {
    const fs = await import("fs");
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: "Source file not found",
      };
    }

    // Ensure outputs directory exists
    await ensureOutputDir();

    const parsedPath = path.parse(filePath);
    const outputExtension = getExtensionFromMime(convertedMimeType);
    const outputPath = path.join(
      outputDir,
      `${parsedPath.name}-resized${outputExtension}`,
    );

    const outputFormat = getSharpFormat(convertedMimeType);

    let image = sharp(filePath);

    if (width || height) {
      image = image.resize(width, height, { fit });
    }

    await image.toFormat(outputFormat as any).toFile(outputPath);

    return {
      success: true,
      outputPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

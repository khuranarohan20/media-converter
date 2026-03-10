import { Router } from "express";
import { fileTypeFromFile } from "file-type";
import type { AllowedMime } from "../constants/file";
import { error, isAllowedMimeType, success } from "../helpers";
import { convertFile } from "../helpers/conversion";
import { uploadSingle } from "../middlewares/upload.middleware";
import { ImageMime } from "../types/file";

export const FileRouter = Router();

FileRouter.post("/upload", uploadSingle("file"), async (req, res) => {
  debugger;
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json(error.forbidden("File not uploaded"));
    }

    const fileDetection = await fileTypeFromFile(file.path);

    if (!fileDetection) {
      return res
        .status(400)
        .json(error.forbidden("Could not detect file type"));
    }

    const detectedMimeType = fileDetection.mime;
    if (!isAllowedMimeType(detectedMimeType)) {
      return res
        .status(400)
        .json(error.forbidden(`File type ${detectedMimeType} is not allowed`));
    }

    const baseMimeType = detectedMimeType as AllowedMime;

    const result = await convertFile({
      baseMimeType,
      convertedMimeType: ImageMime.WEBP,
      filePath: file.path,
    });

    if (result.success) {
      res.status(201).json(
        success.created({
          output: result.outputPath,
        }),
      );
    } else {
      res.status(400).json(error.forbidden(result.error));
    }
  } catch (err: any) {
    console.log("Error in upload route", err);
    res.status(500).json(error.serverError(err));
  }
});

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { allowedMimes, type AllowedMime } from "../constants/file";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");

const ensureUploadDir = async () => {
  try {
    (await Bun.file(uploadDir).exists()) || (await Bun.write(uploadDir, ""));
  } catch (error) {
    const fs = await import("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }
};

ensureUploadDir();

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedMimes.includes(file.mimetype as AllowedMime)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(", ")}`,
      ),
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 10,
  },
});

export const uploadSingle = (fieldName: string = "file") => {
  return upload.single(fieldName);
};

export const uploadMultiple = (
  fieldName: string = "files",
  maxCount: number = 10,
) => {
  return upload.array(fieldName, maxCount);
};

export const uploadFields = (fields: multer.Field[]) => {
  return upload.fields(fields);
};

export const uploadAny = () => {
  return upload.any();
};

export { upload };

export default upload;

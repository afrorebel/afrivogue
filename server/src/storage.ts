// Image uploads, stored on the Hostinger disk under UPLOAD_DIR and served at /uploads.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { config } from "./config";
import { HttpError, handle } from "./http";

/** Who may upload to each bucket. Members add moodboard images and story pitches; the rest is admin-only. */
const BUCKETS: Record<string, "user" | "admin"> = {
  "trend-images": "user",
  "product-images": "admin",
  "email-assets": "admin",
};

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const MAX_BYTES = 8 * 1024 * 1024;

export const uploadRoot = () => path.resolve(config.uploadDir);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } });

/** Safe relative path: letters, digits, dot, dash, underscore and slashes; no traversal. */
function cleanPath(raw: string): string {
  const p = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!p || p.length > 200 || !/^[\w./-]+$/.test(p) || p.split("/").some((seg) => !seg || seg === "." || seg === "..")) {
    throw new HttpError(400, "Invalid file name.");
  }
  return p;
}

export const storageRouter = Router();

storageRouter.post(
  "/:bucket",
  upload.single("file"),
  handle(async (req, res) => {
    const bucket = String(req.params.bucket);
    const access = BUCKETS[bucket];
    if (!access) throw new HttpError(404, "Unknown bucket.");
    if (!req.user) throw new HttpError(401, "Please sign in to upload.");
    if (access === "admin" && !req.principal.isAdmin) throw new HttpError(403, "Only admins can upload here.");

    const file = req.file;
    if (!file) throw new HttpError(400, "No file received.");
    const ext = IMAGE_TYPES[file.mimetype];
    if (!ext) throw new HttpError(400, "Please upload a JPG, PNG, WebP, GIF or AVIF image.");

    let rel = cleanPath(String(req.body?.path || file.originalname));
    // Only image extensions are served from here (so nothing uploaded can run as a page).
    if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(rel)) rel += ext;

    const dest = path.join(uploadRoot(), bucket, rel);
    if (!dest.startsWith(path.join(uploadRoot(), bucket) + path.sep)) throw new HttpError(400, "Invalid file name.");
    if (existsSync(dest)) throw new HttpError(409, "A file with this name already exists.");
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, file.buffer);

    res.status(201).json({ path: rel, publicUrl: `${config.appUrl}/uploads/${bucket}/${rel}` });
  }),
);

import multer from "multer";
import os from "os";
import path from "path";

// In-memory upload for small files (images, docs < 100 MB)
const memStorage = multer.memoryStorage();
export const upload = multer({ storage: memStorage, limits: { fileSize: 100 * 1024 * 1024 } });

// Disk-based upload for large PDF operations — avoids Node.js heap exhaustion
// Files land in OS temp dir; controllers are responsible for deleting them.
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
export const uploadDisk = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});


import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const BASE_STORAGE_DIR = path.resolve(
  process.cwd(),
  process.env.STORAGE_DIR || 'storage'
);

export const COVERS_DIR = path.join(BASE_STORAGE_DIR, 'covers');
export const SAMPLE_PDFS_DIR = path.join(BASE_STORAGE_DIR, 'sample_pdfs');
export const PRIVATE_PDFS_DIR = path.join(BASE_STORAGE_DIR, 'private_pdfs');

export function ensureStorageDirectories(): void {
  for (const dir of [COVERS_DIR, SAMPLE_PDFS_DIR, PRIVATE_PDFS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

const IMAGE_MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    ensureStorageDirectories();
    if (file.fieldname === 'cover') {
      cb(null, COVERS_DIR);
    } else if (file.fieldname === 'sample_pdf') {
      cb(null, SAMPLE_PDFS_DIR);
    } else if (file.fieldname === 'private_pdf') {
      cb(null, PRIVATE_PDFS_DIR);
    } else {
      cb(new Error(`Unexpected upload field: ${file.fieldname}`), '');
    }
  },
  filename: (_req, file, cb) => {
    const id = crypto.randomUUID();
    if (file.fieldname === 'cover') {
      const ext = IMAGE_MIME_EXT[file.mimetype] || '.jpg';
      cb(null, `cover_${id}${ext}`);
    } else {
      cb(null, `${file.fieldname}_${id}.pdf`);
    }
  },
});

export const bookUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 3,
  },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'cover') {
      if (IMAGE_MIME_EXT[file.mimetype]) {
        cb(null, true);
      } else {
        cb(new Error('Cover image must be JPG, PNG, or WEBP'));
      }
      return;
    }

    if (file.fieldname === 'sample_pdf' || file.fieldname === 'private_pdf') {
      if (
        file.mimetype === 'application/pdf' ||
        file.originalname.toLowerCase().endsWith('.pdf')
      ) {
        cb(null, true);
      } else {
        cb(new Error('Uploaded document must be a valid PDF file'));
      }
      return;
    }

    cb(new Error('Unsupported file upload field'));
  },
});

export function resolveSafeFilePath(directory: string, storedName: string): string | null {
  if (!storedName) return null;
  const safeBase = path.basename(storedName);
  const fullPath = path.resolve(directory, safeBase);
  if (!fullPath.startsWith(directory + path.sep)) {
    return null;
  }
  return fullPath;
}

export function deleteStoredFile(directory: string, storedName: string | null | undefined): void {
  if (!storedName) return;
  const safePath = resolveSafeFilePath(directory, storedName);
  if (safePath && fs.existsSync(safePath)) {
    try {
      fs.unlinkSync(safePath);
    } catch {
      // ignore cleanup failure
    }
  }
}

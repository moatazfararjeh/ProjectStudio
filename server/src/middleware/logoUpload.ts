import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure disk storage for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // projectId and layoutType come from URL params (available before body is parsed)
    const projectId = (req as any).params?.projectId || 'unknown';
    const logoType = (req as any).params?.layoutType || req.body.logoType || 'logo';
    const ext = path.extname(file.originalname);
    cb(null, `${projectId}_${logoType}${ext}`);
  }
});

// Accept only image files
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single('logo');

// ── .docx template upload ───────────────────────────────────────────────────
const docxStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const dir = path.join(__dirname, '../../public/mom-templates');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (_req, file, cb) {
    // Temporary name; the controller renames it to a stable project-scoped name
    cb(null, `tmp_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const docxFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.docx') cb(null, true);
  else cb(new Error('Only .docx files are allowed'), false);
};

export const uploadDocxTemplate = multer({
  storage: docxStorage,
  fileFilter: docxFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single('template');

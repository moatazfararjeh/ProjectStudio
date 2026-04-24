import multer from 'multer';
import { AppError } from './errorHandler';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only XML files
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Accept XML files (MS Project exports to XML)
  if (file.mimetype === 'text/xml' || 
      file.mimetype === 'application/xml' ||
      file.originalname.endsWith('.xml') ||
      file.originalname.endsWith('.mpp')) {
    cb(null, true);
  } else {
    cb(new AppError('Only XML or MPP files are allowed', 400), false);
  }
};

// Create multer upload middleware
export const uploadMPP = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
}).single('file');

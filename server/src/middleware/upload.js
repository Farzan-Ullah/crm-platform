import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();

  if (
    allowedExtensions.includes(ext) ||
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Only CSV (.csv) and Excel (.xlsx, .xls) files are supported for import', 400), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

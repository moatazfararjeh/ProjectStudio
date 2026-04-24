import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadLogo } from '../middleware/logoUpload';
import {
  getReports,
  getReport,
  generateWeeklyReport,
  generateMonthlyReport,
  exportWeeklyReportPPT,
  downloadReport,
  getReportTemplate,
  updateReportTemplate,
  updateLogoUrl,
  updateHeaderFooterImage,
  updateSlideImage,
} from '../controllers/report.controller';

const router = Router();

router.use(authenticate);

router.get('/', getReports);
router.get('/template/:projectId', getReportTemplate);
router.put('/template/:projectId', updateReportTemplate);
router.get('/:id', getReport);
router.post('/weekly', generateWeeklyReport);
router.post('/monthly', generateMonthlyReport);
router.get('/export/weekly-ppt/:projectId', exportWeeklyReportPPT);
router.get('/download/:id', downloadReport);
router.post('/upload-logo/:projectId', uploadLogo, updateLogoUrl);
router.post('/upload-header-footer/:projectId/:layoutType', uploadLogo, updateHeaderFooterImage);
router.post('/upload-slide-image/:projectId/:slideKey', uploadLogo, updateSlideImage);

export default router;

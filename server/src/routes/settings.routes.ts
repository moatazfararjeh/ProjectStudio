import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSettings,
  getSettingsByCategory,
  createSetting,
  updateSetting,
  deleteSetting,
  seedDefaultSettings,
} from '../controllers/settings.controller';

const router = Router();

router.use(authenticate);

// Public routes (all authenticated users)
router.get('/', getSettings);
router.get('/category/:category', getSettingsByCategory);

// Admin only routes
router.post('/', authorize('ADMIN'), createSetting);
router.post('/seed', authorize('ADMIN'), seedDefaultSettings);
router.put('/:id', authorize('ADMIN'), updateSetting);
router.delete('/:id', authorize('ADMIN'), deleteSetting);

export default router;

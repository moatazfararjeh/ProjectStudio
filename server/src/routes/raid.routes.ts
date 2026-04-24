import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getRAIDItems,
  getRAIDItem,
  createRAIDItem,
  updateRAIDItem,
  deleteRAIDItem,
} from '../controllers/raid.controller';

const router = Router();

router.use(authenticate);

router.get('/', getRAIDItems);
router.post('/', createRAIDItem);
router.get('/:id', getRAIDItem);
router.put('/:id', updateRAIDItem);
router.delete('/:id', deleteRAIDItem);

export default router;

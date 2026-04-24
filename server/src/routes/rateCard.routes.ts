import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getRateCards,
  createRateCard,
  updateRateCard,
  deleteRateCard,
} from '../controllers/rateCard.controller';

const router = Router();

router.use(authenticate);

router.get('/', getRateCards);
router.post('/', authorize('ADMIN', 'PM'), createRateCard);
router.put('/:id', authorize('ADMIN', 'PM'), updateRateCard);
router.delete('/:id', authorize('ADMIN', 'PM'), deleteRateCard);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWorklogs,
  createWorklog,
  updateWorklog,
  deleteWorklog,
} from '../controllers/worklog.controller';

const router = Router();

router.use(authenticate);

router.get('/', getWorklogs);
router.post('/', createWorklog);
router.put('/:id', updateWorklog);
router.delete('/:id', deleteWorklog);

export default router;

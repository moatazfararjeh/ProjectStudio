import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMPP } from '../middleware/upload';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  createDependency,
  deleteDependency,
  importMPP,
  recalculateProgress,
} from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.post('/import-mpp', uploadMPP, importMPP);
router.post('/recalculate-progress', recalculateProgress);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Dependencies
router.post('/:id/dependencies', createDependency);
router.delete('/:id/dependencies/:depId', deleteDependency);

export default router;

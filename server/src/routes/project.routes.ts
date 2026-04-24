import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMember,
  getMyProjects,
} from '../controllers/project.controller';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/my-projects', getMyProjects);
router.post('/', createProject);
router.get('/:id', getProject);

// Stub: Project Phases endpoint (returns empty array)
import { getProjectPhases } from '../controllers/project.controller';
router.get('/:id/phases', getProjectPhases);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Members
router.post('/:id/members', addMember);
router.put('/:id/members/:memberId', updateMember);
router.delete('/:id/members/:memberId', removeMember);

export default router;

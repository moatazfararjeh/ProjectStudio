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
import {
  getWeeklyHighlights,
  getWeeklyHighlightWeeks,
  createWeeklyHighlight,
  updateWeeklyHighlight,
  deleteWeeklyHighlight,
} from '../controllers/weeklyHighlight.controller';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/my-projects', getMyProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Members
router.post('/:id/members', addMember);
router.put('/:id/members/:memberId', updateMember);
router.delete('/:id/members/:memberId', removeMember);

// Weekly Highlights
router.get('/:id/weekly-highlights/weeks', getWeeklyHighlightWeeks);
router.get('/:id/weekly-highlights', getWeeklyHighlights);
router.post('/:id/weekly-highlights', createWeeklyHighlight);
router.put('/:id/weekly-highlights/:hid', updateWeeklyHighlight);
router.delete('/:id/weekly-highlights/:hid', deleteWeeklyHighlight);

export default router;

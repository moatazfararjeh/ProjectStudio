import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadDocxTemplate } from '../middleware/logoUpload';
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
import {
  getMeetingMinutes,
  getMeetingMinute,
  createMeetingMinutes,
  updateMeetingMinutes,
  deleteMeetingMinutes,
  exportMeetingMinutes,
  uploadMoMTemplate,
  deleteMoMTemplate,
} from '../controllers/meetingMinutes.controller';

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

// Meeting Minutes
router.get('/:id/meeting-minutes', getMeetingMinutes);
router.post('/:id/meeting-minutes', createMeetingMinutes);

// MOM template routes MUST be declared before /:mid to avoid "template" matching as :mid
router.post('/:id/meeting-minutes/template', uploadDocxTemplate, uploadMoMTemplate);
router.delete('/:id/meeting-minutes/template', deleteMoMTemplate);

router.get('/:id/meeting-minutes/:mid', getMeetingMinute);
router.get('/:id/meeting-minutes/:mid/export', exportMeetingMinutes);
router.put('/:id/meeting-minutes/:mid', updateMeetingMinutes);
router.delete('/:id/meeting-minutes/:mid', deleteMeetingMinutes);

export default router;

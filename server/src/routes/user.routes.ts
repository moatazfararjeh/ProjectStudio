import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', authorize('ADMIN', 'PM'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;

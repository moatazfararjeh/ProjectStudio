import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/account.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAccounts);
router.get('/:id', getAccount);
router.post('/', createAccount);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;

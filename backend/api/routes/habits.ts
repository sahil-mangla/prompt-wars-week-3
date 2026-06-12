import { Router } from 'express';
import {
  getHabits,
  getLanguages,
  updateProfile,
  getProfile,
  selectHabit,
  logHabit,
  getCoaching
} from '../controllers/habitsController';

const router = Router();

router.get('/habits', getHabits);
router.get('/languages', getLanguages);
router.post('/user/profile', updateProfile);
router.get('/user/profile/:userId', getProfile);
router.post('/habits/select', selectHabit);
router.post('/habits/log', logHabit);
router.post('/habits/coach', getCoaching);

export default router;

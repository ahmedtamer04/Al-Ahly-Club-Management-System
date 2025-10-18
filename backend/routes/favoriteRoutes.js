import express from 'express';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
} from '../controllers/favoriteController.js';
import { auth, requireStudentOrAbove } from '../middleware/auth.js';

const router = express.Router();

// Get all user's favorites
router.get('/', auth, requireStudentOrAbove, getUserFavorites);

// Add to favorites
router.post('/', auth, requireStudentOrAbove, addFavorite);

// Remove from favorites
router.delete('/:event_id', auth, requireStudentOrAbove, removeFavorite);

// Check if event is favorited
router.get('/check/:event_id', auth, requireStudentOrAbove, checkFavorite);

export default router;
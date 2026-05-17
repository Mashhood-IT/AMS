import express from 'express';
import { createUser, updateUser, getAllUsers, deleteUser, getDashboardStats } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all user management routes
router.use(authMiddleware);

// Routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;

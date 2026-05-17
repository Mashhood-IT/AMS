import express from 'express';
import {
  markAttendance,
  bulkMarkAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceByCourse,
  getAttendanceByStudent,
  getAttendanceSummary,
  getQRToken,
  markAttendanceQR,
} from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// ── QR Attendance Endpoints ───────────────────────────────────────────────────
router.get('/qr-token/:courseId', getQRToken);
router.post('/mark-qr', markAttendanceQR);

// ── Summary & Aggregations ────────────────────────────────────────────────────
// Must be defined BEFORE /:id to avoid "summary" being treated as an id param
router.get('/summary', getAttendanceSummary);

// ── Scoped Access ─────────────────────────────────────────────────────────────
router.get('/course/:courseId',   getAttendanceByCourse);
router.get('/student/:studentId', getAttendanceByStudent);

// ── Bulk Mark ─────────────────────────────────────────────────────────────────
router.post('/bulk', bulkMarkAttendance);

// ── Standard CRUD ─────────────────────────────────────────────────────────────
router.get('/',    getAllAttendance);
router.post('/',   markAttendance);
router.get('/:id',    getAttendanceById);
router.put('/:id',    updateAttendance);
router.delete('/:id', deleteAttendance);

export default router;

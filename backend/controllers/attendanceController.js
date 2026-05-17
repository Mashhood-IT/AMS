import { prisma } from '../db.js';
import crypto from 'crypto';

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Normalise a date to midnight UTC so that one record exists per student/course/day.
 * Accepts a Date object, ISO string, or YYYY-MM-DD string.
 */
const toDateKey = (rawDate) => {
  const d = rawDate ? new Date(rawDate) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// ─── Mark / Upsert Attendance ─────────────────────────────────────────────────

/**
 * POST /api/attendance
 * Body: { studentId, courseId, status, date?, location?, notes? }
 * Creates or updates attendance for the given student/course/day.
 */
export const markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status, date, location, notes } = req.body;

    if (!studentId || !courseId || !status) {
      return res.status(400).json({
        success: false,
        message: 'studentId, courseId, and status are required.',
      });
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Verify student exists
    const student = await prisma.user.findUnique({ where: { id: parseInt(studentId) } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const dateKey = toDateKey(date);

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId),
          date: dateKey,
        },
      },
      update: {
        status,
        location: location ?? undefined,
        notes: notes ?? undefined,
      },
      create: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        date: dateKey,
        status,
        location: location ?? null,
        notes: notes ?? null,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully.',
      attendance,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Get All Attendance (with filters) ───────────────────────────────────────

/**
 * GET /api/attendance
 * Optional query params: studentId, courseId, status, date, startDate, endDate, page, limit
 */
export const getAllAttendance = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      status,
      className,
      date,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};

    if (studentId) where.studentId = parseInt(studentId);
    if (courseId)  where.courseId  = parseInt(courseId);
    if (status)    where.status    = status;
    if (className) where.student = { className };

    // Date filtering
    if (date) {
      where.date = toDateKey(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toDateKey(startDate);
      if (endDate)   where.date.lte = toDateKey(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, role: true } },
          course:  { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ date: 'desc' }, { student: { name: 'asc' } }],
        skip,
        take: parseInt(limit),
      }),
      prisma.attendance.count({ where }),
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      attendance: records,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Get Single Attendance Record ─────────────────────────────────────────────

/**
 * GET /api/attendance/:id
 */
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.json({ success: true, attendance: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Update Attendance Record ─────────────────────────────────────────────────

/**
 * PUT /api/attendance/:id
 * Body: { status?, location?, notes? }
 */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, notes } = req.body;

    const existing = await prisma.attendance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    if (status) {
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    const updated = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        status:   status   ?? existing.status,
        location: location !== undefined ? location : existing.location,
        notes:    notes    !== undefined ? notes    : existing.notes,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    return res.json({ success: true, message: 'Attendance updated.', attendance: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Delete Attendance Record ─────────────────────────────────────────────────

/**
 * DELETE /api/attendance/:id
 */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.attendance.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    await prisma.attendance.delete({ where: { id: parseInt(id) } });
    return res.json({ success: true, message: 'Attendance record deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Attendance by Course ──────────────────────────────────────────────────────

/**
 * GET /api/attendance/course/:courseId
 * Optional query: date, startDate, endDate
 * Returns all attendance entries for a specific course grouped by date.
 */
export const getAttendanceByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, startDate, endDate } = req.query;
    console.log(`[getAttendanceByCourse] courseId=${courseId} date=${date} startDate=${startDate} endDate=${endDate}`);

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const dateFilter = {};
    if (date) {
      dateFilter.date = toDateKey(date);
    } else if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = toDateKey(startDate);
      if (endDate)   dateFilter.date.lte = toDateKey(endDate);
    }

    const records = await prisma.attendance.findMany({
      where: { courseId: parseInt(courseId), ...dateFilter },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ date: 'desc' }, { student: { name: 'asc' } }],
    });

    return res.json({ success: true, course, attendance: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Attendance by Student ─────────────────────────────────────────────────────

/**
 * GET /api/attendance/student/:studentId
 * Optional query: courseId, startDate, endDate
 * Returns all attendance entries for a specific student.
 */
export const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    const student = await prisma.user.findUnique({ where: { id: parseInt(studentId) } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const where = { studentId: parseInt(studentId) };
    if (courseId) where.courseId = parseInt(courseId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toDateKey(startDate);
      if (endDate)   where.date.lte = toDateKey(endDate);
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ date: 'desc' }, { course: { name: 'asc' } }],
    });

    return res.json({ success: true, student: { id: student.id, name: student.name, email: student.email }, attendance: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Attendance Summary ────────────────────────────────────────────────────────

/**
 * GET /api/attendance/summary
 * Optional query: courseId, studentId, startDate, endDate
 * Returns per-student-per-course counts for PRESENT / ABSENT / LATE and a percentage.
 */
export const getAttendanceSummary = async (req, res) => {
  try {
    const { courseId, studentId, startDate, endDate } = req.query;

    const where = {};
    if (courseId)  where.courseId  = parseInt(courseId);
    if (studentId) where.studentId = parseInt(studentId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = toDateKey(startDate);
      if (endDate)   where.date.lte = toDateKey(endDate);
    }

    // Raw group-by via Prisma groupBy
    const grouped = await prisma.attendance.groupBy({
      by: ['studentId', 'courseId', 'status'],
      where,
      _count: { status: true },
    });

    // Pivot grouped rows into a summary map keyed by "studentId-courseId"
    const summaryMap = {};

    for (const row of grouped) {
      const key = `${row.studentId}-${row.courseId}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          studentId: row.studentId,
          courseId:  row.courseId,
          PRESENT: 0,
          ABSENT:  0,
          LATE:    0,
        };
      }
      summaryMap[key][row.status] = row._count.status;
    }

    // Enrich each summary entry with student and course details
    const summaries = await Promise.all(
      Object.values(summaryMap).map(async (entry) => {
        const [student, course] = await Promise.all([
          prisma.user.findUnique({
            where: { id: entry.studentId },
            select: { id: true, name: true, email: true },
          }),
          prisma.course.findUnique({
            where: { id: entry.courseId },
            select: { id: true, name: true, code: true },
          }),
        ]);

        const total      = entry.PRESENT + entry.ABSENT + entry.LATE;
        const percentage = total > 0 ? Math.round(((entry.PRESENT + entry.LATE) / total) * 100) : 0;

        return {
          student,
          course,
          present:    entry.PRESENT,
          absent:     entry.ABSENT,
          late:       entry.LATE,
          total,
          attendancePercentage: percentage,
        };
      })
    );

    return res.json({ success: true, summary: summaries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── Bulk Mark Attendance ──────────────────────────────────────────────────────

/**
 * POST /api/attendance/bulk
 * Body: { courseId, date?, records: [{ studentId, status, location?, notes? }] }
 * Marks attendance for multiple students in one course in a single request.
 */
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;

    if (!courseId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'courseId and a non-empty records array are required.',
      });
    }

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    const dateKey       = toDateKey(date);
    const results       = [];
    const errors        = [];

    for (const record of records) {
      const { studentId, status, location, notes } = record;

      if (!studentId || !status) {
        errors.push({ studentId, reason: 'studentId and status are required.' });
        continue;
      }

      if (!validStatuses.includes(status)) {
        errors.push({ studentId, reason: `Invalid status "${status}".` });
        continue;
      }

      try {
        const upserted = await prisma.attendance.upsert({
          where: {
            studentId_courseId_date: {
              studentId: parseInt(studentId),
              courseId:  parseInt(courseId),
              date:      dateKey,
            },
          },
          update: {
            status,
            location: location ?? undefined,
            notes:    notes    ?? undefined,
          },
          create: {
            studentId: parseInt(studentId),
            courseId:  parseInt(courseId),
            date:      dateKey,
            status,
            location:  location ?? null,
            notes:     notes    ?? null,
          },
        });
        results.push(upserted);
      } catch (err) {
        errors.push({ studentId, reason: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.length} record(s) saved. ${errors.length} error(s).`,
      saved:  results.length,
      errors,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ─── QR Attendance Helpers & Endpoints ──────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const generateQRToken = (courseId, dateStr) => {
  const timeBucket = Math.floor(Date.now() / (1000 * 60 * 15)); // Valid for 15-minute intervals
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${courseId}-${dateStr}-${timeBucket}`)
    .digest('hex');
};

export const verifyQRToken = (courseId, dateStr, token) => {
  const timeBucketCurrent = Math.floor(Date.now() / (1000 * 60 * 15));
  const timeBucketPrev = timeBucketCurrent - 1;

  const hashCurrent = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${courseId}-${dateStr}-${timeBucketCurrent}`)
    .digest('hex');
  const hashPrev = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${courseId}-${dateStr}-${timeBucketPrev}`)
    .digest('hex');

  return token === hashCurrent || token === hashPrev;
};

/**
 * GET /api/attendance/qr-token/:courseId
 * Generates the secure, time-sensitive QR token for the teacher dashboard.
 */
export const getQRToken = async (req, res) => {
  try {
    const { courseId } = req.params;
    const dateStr = new Date().toISOString().split('T')[0];
    const token = generateQRToken(courseId, dateStr);

    return res.status(200).json({
      success: true,
      token,
      courseId: parseInt(courseId),
      date: dateStr
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate token.', error: error.message });
  }
};

/**
 * POST /api/attendance/mark-qr
 * Body: { courseId, token }
 * Marks student attendance using the scanned QR token.
 */
export const markAttendanceQR = async (req, res) => {
  try {
    const { courseId, token } = req.body;
    const studentId = req.userId;

    if (!courseId || !token) {
      return res.status(400).json({
        success: false,
        message: 'courseId and token are required.',
      });
    }

    const dateStr = new Date().toISOString().split('T')[0];

    // Verify dynamic token
    const isTokenValid = verifyQRToken(courseId, dateStr, token);
    if (!isTokenValid) {
      return res.status(400).json({
        success: false,
        message: 'The scanned QR code is invalid or has expired. Please ask the instructor for a fresh QR code.',
      });
    }

    // Verify student exists and is active
    const student = await prisma.user.findUnique({ where: { id: parseInt(studentId) } });
    if (!student || student.status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        message: 'Student account is not active or could not be found.',
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Verify that the student is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId),
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course.',
      });
    }

    const dateKey = toDateKey(dateStr);

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId),
          date: dateKey,
        },
      },
      update: {
        status: 'PRESENT',
        notes: 'Marked automatically via QR Code scan',
      },
      create: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        date: dateKey,
        status: 'PRESENT',
        notes: 'Marked automatically via QR Code scan',
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, name: true, code: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Attendance for ${course.name} marked successfully!`,
      attendance,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record QR attendance.', error: error.message });
  }
};


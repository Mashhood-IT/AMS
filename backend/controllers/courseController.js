import { prisma } from '../db.js';

// Get all courses (with teacher info)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const { name, code, teacherId, className, instituteId, days, time } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Please provide name and code' });
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        ...(teacherId && !isNaN(parseInt(teacherId)) ? { teacher: { connect: { id: parseInt(teacherId) } } } : {}),
        className,
        ...(instituteId ? { institute: { connect: { id: instituteId } } } : {}),
        days: Array.isArray(days) ? days : (days ? days.split(',') : []),
        time,
      },
      include: {
        teacher: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({ success: true, message: 'Course created successfully', course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, teacherId, className, days, time } = req.body;

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existingCourse) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if new code conflicts with another course
    if (code && code !== existingCourse.code) {
      const codeConflict = await prisma.course.findUnique({
        where: { code }
      });
      if (codeConflict) {
        return res.status(400).json({ success: false, message: 'Course code already exists' });
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        name: name || existingCourse.name,
        code: code || existingCourse.code,
        ...(teacherId && !isNaN(parseInt(teacherId)) ? { teacher: { connect: { id: parseInt(teacherId) } } } : {}),
        className: className !== undefined ? className : existingCourse.className,
        days: days !== undefined ? (Array.isArray(days) ? days : (days ? days.split(',') : [])) : existingCourse.days,
        time: time !== undefined ? time : existingCourse.time,
      },
      include: {
        teacher: {
          select: { name: true }
        }
      }
    });

    res.json({ success: true, message: 'Course updated successfully', course: updatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    // Check if course has enrollments or attendance (prevent deletion if so)
    const enrollmentsCount = await prisma.enrollment.count({
      where: { courseId }
    });

    if (enrollmentsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete course with active enrollments. Remove students first.' 
      });
    }

    await prisma.course.delete({
      where: { id: courseId }
    });

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

// Create User (Admin/Principal creates student/teacher)
export const createUser = async (req, res) => {
  const { email, password, name, role, phone, status, courseIds, instituteId, permissions, className } = req.body;

  try {
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Role validation
    const validRoles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const creator = await prisma.user.findUnique({ where: { id: req.userId } });

    let targetInstituteId = instituteId || null;
    if (creator.role === 'PRINCIPAL') {
      targetInstituteId = creator.instituteId;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        status: status || 'ACTIVE',
        role: (role || 'STUDENT').toUpperCase(),
        ...(targetInstituteId ? { institute: { connect: { id: targetInstituteId } } } : {}),
        createdBy: req.userId,
        taughtCourses: (role === 'TEACHER' || role === 'PRINCIPAL') && courseIds ? {
          connect: courseIds.map(id => ({ id: parseInt(id) }))
        } : undefined,
        permissions: permissions && permissions.length > 0 
          ? Array.from(new Set([...permissions, 'dashboard', 'edit-profile']))
          : ['dashboard', 'edit-profile'],
        className: role === 'STUDENT' ? className : null
      },
      include: { taughtCourses: true }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, instituteId: user.instituteId, permissions: user.permissions, className: user.className }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Edit User
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, name, role, phone, status, courseIds, instituteId, permissions, className } = req.body;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validRoles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const updateData = {
      email: email || targetUser.email,
      name: name || targetUser.name,
      phone: phone !== undefined ? phone : targetUser.phone,
      status: status || targetUser.status,
      role: role ? role.toUpperCase() : targetUser.role,
      ...(instituteId ? { institute: { connect: { id: instituteId } } } : {}),
      permissions: permissions !== undefined 
        ? { set: Array.from(new Set([...permissions, 'dashboard', 'edit-profile'])) } 
        : undefined,
      className: className !== undefined ? className : targetUser.className,
    };

    if ((updateData.role === 'TEACHER' || updateData.role === 'PRINCIPAL') && courseIds) {
      updateData.taughtCourses = {
        set: courseIds.map(id => ({ id: parseInt(id) }))
      };
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role, instituteId: updatedUser.instituteId, permissions: updatedUser.permissions }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, courseId, status, instituteId: filterInstituteId, className: filterClassName } = req.query;

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });

    const where = {};
    if (role) where.role = role.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (filterClassName) where.className = filterClassName;

    if (requester.role === 'PRINCIPAL') {
      where.instituteId = requester.instituteId;
    } else if (requester.role === 'STUDENT') {
      if (requester.className) {
        where.className = requester.className;
      } else {
        where.id = requester.id;
      }
    } else if (filterInstituteId) {
      where.instituteId = filterInstituteId;
    }

    let courseClassName = null;
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) },
        select: { className: true }
      });
      courseClassName = course?.className;
      console.log(`[getAllUsers] courseId=${courseId} courseClassName=${courseClassName}`);

      const enrollmentFilter = {
        enrollments: {
          some: {
            courseId: parseInt(courseId)
          }
        }
      };

      const courseFilter = courseClassName ? { OR: [enrollmentFilter, { className: courseClassName }] } : enrollmentFilter;
      if (requester.role === 'STUDENT') {
        where.AND = [...(where.AND || []), courseFilter];
      } else {
        Object.assign(where, courseFilter);
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        instituteId: true,
        taughtCourses: {
          select: { id: true, name: true, code: true }
        },
        permissions: true,
        className: true,
        instituteId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get role-based real-time dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const role = user.role;
    const stats = {};

    if (role === 'ADMIN') {
      stats.totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
      stats.activeCourses = await prisma.course.count();
      stats.totalTeachers = await prisma.user.count({ where: { role: 'TEACHER' } });
      stats.totalPrincipals = await prisma.user.count({ where: { role: 'PRINCIPAL' } });
      stats.totalInstitutes = await prisma.institute.count();
    } else if (role === 'PRINCIPAL') {
      const instituteId = user.instituteId || '';
      stats.totalStudents = await prisma.user.count({
        where: { role: 'STUDENT', instituteId: instituteId }
      });
      stats.activeCourses = await prisma.course.count({
        where: { instituteId: instituteId }
      });
      stats.totalTeachers = await prisma.user.count({
        where: { role: 'TEACHER', instituteId: instituteId }
      });
    } else if (role === 'TEACHER') {
      stats.activeCourses = await prisma.course.count({
        where: { teacherId: user.id }
      });
      stats.totalStudents = await prisma.user.count({
        where: {
          role: 'STUDENT',
          enrollments: {
            some: {
              course: {
                teacherId: user.id
              }
            }
          }
        }
      });
    } else if (role === 'STUDENT') {
      const instituteId = user.instituteId || '';
      const className = user.className || '';
      stats.activeCourses = await prisma.course.count({
        where: {
          instituteId: instituteId,
          className: className
        }
      });
    }

    res.json({ success: true, role, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
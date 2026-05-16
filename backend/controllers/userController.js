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
        permissions: permissions || [],
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
      permissions: permissions !== undefined ? { set: permissions } : undefined,
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
    const { role, courseId, status, instituteId: filterInstituteId } = req.query;

    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    console.log(`[getAllUsers] requester=${requester?.id} role=${requester?.role} roleFilter=${role} courseId=${courseId} status=${status} instituteId=${filterInstituteId}`);

    const where = {};
    if (role) where.role = role.toUpperCase();
    if (status) where.status = status.toUpperCase();

    if (requester.role === 'PRINCIPAL') {
      where.instituteId = requester.instituteId;
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

      if (courseClassName) {
        where.OR = [enrollmentFilter, { className: courseClassName }];
      } else {
        Object.assign(where, enrollmentFilter);
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
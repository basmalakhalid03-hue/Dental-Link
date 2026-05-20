const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// ── GET /admin/users ── list all users with workload count ────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    // Count active (non-completed) cases per user for workload display
    const activeCounts = await prisma.case.groupBy({
      by: ['technicianId'],
      where: { technicianId: { not: null }, status: { notIn: ['COMPLETED'] } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(activeCounts.map(r => [r.technicianId, r._count.id]));

    const result = users.map(u => ({
      ...u,
      activeCases: countMap[u.id] ?? 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /admin/users ── admin creates a user with any role ───────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const validRoles = ['ADMIN', 'TECHNICIAN', 'DELIVERY_AGENT', 'DOCTOR'];

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, password required' });
    if (!validRoles.includes(role))
      return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}` });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, phone: phone?.trim() || null },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /admin/users/:id ── update name, role, or password (admin only) ──────
const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, role, password, phone } = req.body;
    const validRoles = ['ADMIN', 'TECHNICIAN', 'DELIVERY_AGENT', 'DOCTOR'];

    if (role && !validRoles.includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const hashed = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name   !== undefined && { name }),
        ...(role   !== undefined && { role }),
        ...(phone  !== undefined && { phone: phone?.trim() || null }),
        ...(hashed !== undefined && { password: hashed }),
      },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE /admin/users/:id ───────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Prevent deleting yourself
    if (id === req.user.id)
      return res.status(400).json({ message: 'Cannot delete your own account' });

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /admin/suggest-technician ── smart assignment: least workload ─────────
const suggestTechnician = async (req, res) => {
  try {
    // All technicians
    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: { id: true, name: true, email: true },
    });

    if (!technicians.length)
      return res.status(404).json({ message: 'No technicians found' });

    // Count active cases per technician
    const activeCounts = await prisma.case.groupBy({
      by: ['technicianId'],
      where: { technicianId: { not: null }, status: { notIn: ['COMPLETED'] } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(activeCounts.map(r => [r.technicianId, r._count.id]));

    // Attach workload and sort ascending
    const withLoad = technicians
      .map(t => ({ ...t, activeCases: countMap[t.id] ?? 0 }))
      .sort((a, b) => a.activeCases - b.activeCases);

    res.json({
      suggested: withLoad[0],   // technician with fewest active cases
      all:       withLoad,       // full list for admin to override
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /admin/workload ── technician workload overview ───────────────────────
const getWorkload = async (req, res) => {
  try {
    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: { id: true, name: true },
    });

    const statuses = ['PENDING', 'IN_PROGRESS', 'DELAYED', 'COMPLETED'];
    const result = await Promise.all(
      technicians.map(async (t) => {
        const counts = await prisma.case.groupBy({
          by: ['status'],
          where: { technicianId: t.id },
          _count: { id: true },
        });
        const statusMap = Object.fromEntries(counts.map(c => [c.status, c._count.id]));
        return {
          id:          t.id,
          name:        t.name,
          PENDING:     statusMap.PENDING     ?? 0,
          IN_PROGRESS: statusMap.IN_PROGRESS ?? 0,
          DELAYED:     statusMap.DELAYED     ?? 0,
          COMPLETED:   statusMap.COMPLETED   ?? 0,
          total:       counts.reduce((s, c) => s + c._count.id, 0),
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, suggestTechnician, getWorkload };

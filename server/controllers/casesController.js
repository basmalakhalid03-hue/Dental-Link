const prisma = require('../lib/prisma');

// Priority sort order: lower index = higher urgency
const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

// Sort cases by priority then by due date (soonest first)
function sortByPriorityAndDue(cases) {
  return cases.sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

// Auto-mark overdue cases as DELAYED (fire-and-forget, non-blocking)
async function detectAndMarkDelayed(caseIds) {
  const now = new Date();
  await prisma.case.updateMany({
    where: {
      id:      { in: caseIds },
      dueDate: { lt: now },
      status:  { in: ['PENDING', 'IN_PROGRESS'] }, // don't touch COMPLETED
    },
    data: { status: 'DELAYED' },
  }).catch(() => {}); // silent — don't fail the main request
}

// Build role-specific WHERE clause
function buildRoleWhere(reqUser, extraWhere = {}) {
  const where = { ...extraWhere };

  if (reqUser.role === 'TECHNICIAN') {
    // Technicians only see their assigned cases
    where.technicianId = reqUser.id;
  } else if (reqUser.role === 'DOCTOR') {
    // Doctors see cases by their name (matched on doctorName field)
    where.doctorName = { contains: reqUser.name };
  } else if (reqUser.role === 'DELIVERY_AGENT') {
    // Delivery agents see only completed cases (ready for / in delivery)
    where.status = 'COMPLETED';
  }
  // ADMIN sees everything (no additional filter)

  return where;
}

// ── GET /cases ────────────────────────────────────────────────────────────────
const getCases = async (req, res) => {
  try {
    const { status, caseType, search } = req.query;
    let extraWhere = {};

    if (status)   extraWhere.status   = status;
    if (caseType) extraWhere.caseType = caseType;
    if (search) {
      extraWhere.OR = [
        { patientName: { contains: search } },
        { doctorName:  { contains: search } },
      ];
    }

    const where = buildRoleWhere(req.user, extraWhere);

    const cases = await prisma.case.findMany({
      where,
      include: {
        technician: { select: { id: true, name: true, email: true, role: true } },
        caseSteps: {
          include: { step: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Auto-detect and mark delayed cases in background
    const activeIds = cases
      .filter(c => c.dueDate && c.status !== 'COMPLETED')
      .map(c => c.id);
    if (activeIds.length) detectAndMarkDelayed(activeIds);

    // Return sorted by priority + due date
    res.json(sortByPriorityAndDue(cases));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /cases/:id ────────────────────────────────────────────────────────────
const getCaseById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const caseRecord = await prisma.case.findUnique({
      where: { id },
      include: {
        technician: { select: { id: true, name: true, email: true, role: true } },
        caseSteps: {
          include: {
            step: true,
            notes: {
              include: { author: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        files: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseRecord) return res.status(404).json({ message: 'Case not found' });

    // Doctors can only view cases with their name
    if (req.user.role === 'DOCTOR' && !caseRecord.doctorName.includes(req.user.name))
      return res.status(403).json({ message: 'Access denied' });

    // Technicians can only view their assigned cases
    if (req.user.role === 'TECHNICIAN' && caseRecord.technicianId !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });

    res.json(caseRecord);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /cases ────────────────────────────────────────────────────────────────
const createCase = async (req, res) => {
  try {
    const { patientName, caseType, crownType, technicianId, priority, dueDate, toothNumbers } = req.body;

    // Doctors always use their own name; other roles supply doctorName in the body
    const doctorName = req.user.role === 'DOCTOR' ? req.user.name : req.body.doctorName;

    if (!patientName || !doctorName || !caseType || !crownType)
      return res.status(400).json({ message: 'Required fields missing' });

    const teeth = Array.isArray(toothNumbers) ? toothNumbers.map(Number).filter(Boolean) : [];

    if (!['DIGITAL', 'TRADITIONAL'].includes(caseType))
      return res.status(400).json({ message: 'Invalid case type' });

    // Fetch active steps for this type, ordered by their lookup order
    const allSteps = await prisma.workflowStep.findMany({
      where: { type: caseType, isActive: true },
      orderBy: { order: 'asc' },
    });

    if (!allSteps.length)
      return res.status(500).json({ message: 'No workflow steps configured' });

    // Filter to the caller's selection (if provided); otherwise use all
    const { selectedStepIds } = req.body;
    let chosenSteps = allSteps;
    if (Array.isArray(selectedStepIds) && selectedStepIds.length > 0) {
      const idSet = new Set(selectedStepIds.map(Number));
      chosenSteps = allSteps.filter((s) => idSet.has(s.id));
    }

    if (!chosenSteps.length)
      return res.status(400).json({ message: 'No valid steps selected' });

    const newCase = await prisma.$transaction(async (tx) => {
      const created = await tx.case.create({
        data: {
          patientName,
          doctorName,
          caseType,
          crownType,
          status:       'PENDING',
          priority:     priority || 'NORMAL',
          technicianId: technicianId ? parseInt(technicianId) : null,
          toothNumber:  teeth.length > 0 ? teeth[0] : null,
          toothNumbers: teeth.length > 0 ? JSON.stringify(teeth) : null,
          dueDate:      dueDate ? new Date(dueDate) : null,
        },
      });

      for (let i = 0; i < chosenSteps.length; i++) {
        await tx.caseStep.create({
          data: {
            caseId: created.id,
            stepId: chosenSteps[i].id,
            order:  i + 1,
            status: i === 0 ? 'CURRENT' : 'PENDING',
          },
        });
      }

      return tx.case.update({
        where: { id: created.id },
        data: { status: 'IN_PROGRESS' },
        include: {
          technician: { select: { id: true, name: true, email: true } },
          caseSteps:  { include: { step: true }, orderBy: { order: 'asc' } },
        },
      });
    });

    res.status(201).json(newCase);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /cases/:id ─────────────────────────────────────────────────────────────
const updateCase = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { patientName, doctorName, crownType, technicianId, priority, dueDate, status, toothNumbers } = req.body;

    // Technicians can only update status on their own cases
    // Doctors can only update cases where their name appears in doctorName
    if (req.user.role === 'TECHNICIAN' || req.user.role === 'DOCTOR') {
      const existing = await prisma.case.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Case not found' });

      if (req.user.role === 'TECHNICIAN' && existing.technicianId !== req.user.id)
        return res.status(403).json({ message: 'Access denied' });

      if (req.user.role === 'DOCTOR' && !existing.doctorName.includes(req.user.name))
        return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(patientName !== undefined && { patientName }),
        ...(doctorName  !== undefined && { doctorName }),
        ...(crownType   !== undefined && { crownType }),
        ...(priority    !== undefined && { priority }),
        ...(status      !== undefined && { status }),
        ...(dueDate     !== undefined && { dueDate:     dueDate     ? new Date(dueDate) : null }),
        ...(toothNumbers !== undefined && (() => {
          const teeth = Array.isArray(toothNumbers) ? toothNumbers.map(Number).filter(Boolean) : [];
          return {
            toothNumber:  teeth.length > 0 ? teeth[0] : null,
            toothNumbers: teeth.length > 0 ? JSON.stringify(teeth) : null,
          };
        })()),
        ...(technicianId !== undefined && {
          technicianId: technicianId ? parseInt(technicianId) : null,
        }),
      },
      include: { technician: { select: { id: true, name: true, email: true } } },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE /cases/:id ─────────────────────────────────────────────────────────
const deleteCase = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Doctors can only delete cases that belong to them
    if (req.user.role === 'DOCTOR') {
      const existing = await prisma.case.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Case not found' });
      if (!existing.doctorName.includes(req.user.name))
        return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.case.delete({ where: { id } });
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /cases/dashboard ──────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const where = buildRoleWhere(req.user); // scoped to role
    const now   = new Date();

    const [total, completed, inProgress, delayed, pending, overdue, byTech, completedCases, recentCases] =
      await Promise.all([
        prisma.case.count({ where }),
        prisma.case.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.case.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma.case.count({ where: { ...where, status: 'DELAYED' } }),
        prisma.case.count({ where: { ...where, status: 'PENDING' } }),
        prisma.case.count({ where: { ...where, dueDate: { lt: now }, status: { notIn: ['COMPLETED'] } } }),
        // Delivery agents don't need technician breakdown
        req.user.role !== 'DELIVERY_AGENT'
          ? prisma.case.groupBy({
              by: ['technicianId'],
              where: { ...where, technicianId: { not: null } },
              _count: { id: true },
            })
          : Promise.resolve([]),
        prisma.case.findMany({
          where: { ...where, status: 'COMPLETED', technicianId: { not: null } },
          select: { technicianId: true, createdAt: true, updatedAt: true },
        }),
        prisma.case.findMany({
          where,
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { technician: { select: { id: true, name: true } } },
        }),
      ]);

    // Build technician performance map
    const techIds = byTech.map(t => t.technicianId).filter(Boolean);
    const techs   = techIds.length
      ? await prisma.user.findMany({ where: { id: { in: techIds } }, select: { id: true, name: true } })
      : [];
    const techMap = Object.fromEntries(techs.map(t => [t.id, t.name]));

    const techPerf = {};
    completedCases.forEach(({ technicianId, createdAt, updatedAt }) => {
      if (!technicianId) return;
      if (!techPerf[technicianId]) techPerf[technicianId] = { completedCount: 0, totalDays: 0 };
      techPerf[technicianId].completedCount++;
      techPerf[technicianId].totalDays += (new Date(updatedAt) - new Date(createdAt)) / 86400000;
    });

    const casesByTechnician = byTech.map(t => ({
      technicianId:   t.technicianId,
      technicianName: techMap[t.technicianId] || 'Unknown',
      count:          t._count.id,
      completedCount: techPerf[t.technicianId]?.completedCount ?? 0,
      avgDays:        techPerf[t.technicianId]?.completedCount
        ? Math.round(techPerf[t.technicianId].totalDays / techPerf[t.technicianId].completedCount)
        : null,
    }));

    res.json({
      total, completed, inProgress, delayed, pending, overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      casesByTechnician,
      recentCases,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getCases, getCaseById, createCase, updateCase, deleteCase, getDashboardStats };

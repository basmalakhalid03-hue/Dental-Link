const prisma = require('../lib/prisma');

// GET /api/workflow/steps?type=DIGITAL|TRADITIONAL&includeInactive=true
const listSteps = async (req, res) => {
  try {
    const { type, includeInactive } = req.query;
    const where = {};
    if (type) where.type = type;
    if (includeInactive !== 'true') where.isActive = true;

    const steps = await prisma.workflowStep.findMany({
      where,
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
      include: {
        _count: { select: { caseSteps: true } },
      },
    });

    res.json(steps);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/workflow/steps  (admin only)
const createStep = async (req, res) => {
  try {
    const { name, nameAr, type, description } = req.body;

    if (!name?.trim() || !type)
      return res.status(400).json({ message: 'name and type are required' });

    if (!['DIGITAL', 'TRADITIONAL'].includes(type))
      return res.status(400).json({ message: 'type must be DIGITAL or TRADITIONAL' });

    // Append at the end: find current max order for this type
    const maxRow = await prisma.workflowStep.aggregate({
      where: { type },
      _max: { order: true },
    });
    const nextOrder = (maxRow._max.order ?? 0) + 1;

    const step = await prisma.workflowStep.create({
      data: {
        name: name.trim(),
        nameAr: nameAr?.trim() || null,
        type,
        order: nextOrder,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    res.status(201).json(step);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/workflow/steps/reorder  (admin only)
// body: { steps: [{id, order}, ...] }
const reorderSteps = async (req, res) => {
  try {
    const { steps } = req.body;

    if (!Array.isArray(steps) || steps.length === 0)
      return res.status(400).json({ message: 'steps array is required' });

    await prisma.$transaction(
      steps.map(({ id, order }) =>
        prisma.workflowStep.update({ where: { id }, data: { order } })
      )
    );

    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/workflow/steps/:id  (admin only)
const updateStep = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, nameAr, description, isActive } = req.body;

    const existing = await prisma.workflowStep.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Step not found' });

    const updated = await prisma.workflowStep.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name: name.trim() }),
        ...(nameAr      !== undefined && { nameAr: nameAr?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive    !== undefined && { isActive }),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/workflow/steps/:id  (admin only)
const deleteStep = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.workflowStep.findUnique({
      where: { id },
      include: { _count: { select: { caseSteps: true } } },
    });
    if (!existing) return res.status(404).json({ message: 'Step not found' });

    if (existing._count.caseSteps > 0) {
      return res.status(409).json({
        message: `Cannot delete: this step is used in ${existing._count.caseSteps} case(s). Deactivate it instead.`,
        usedInCases: existing._count.caseSteps,
      });
    }

    await prisma.workflowStep.delete({ where: { id } });
    res.json({ message: 'Step deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { listSteps, createStep, reorderSteps, updateStep, deleteStep };

const prisma = require('../lib/prisma');

// GET /api/crown-types?includeInactive=true
const listCrownTypes = async (req, res) => {
  try {
    const where = req.query.includeInactive === 'true' ? {} : { isActive: true };
    const types = await prisma.crownType.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    // Attach usage count to each type
    const names = types.map((t) => t.name);
    const usageCounts = await prisma.case.groupBy({
      by: ['crownType'],
      where: { crownType: { in: names } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(usageCounts.map((r) => [r.crownType, r._count.id]));

    res.json(types.map((t) => ({ ...t, usedInCases: countMap[t.name] ?? 0 })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/crown-types  (admin only)
const createCrownType = async (req, res) => {
  try {
    const { name, nameAr } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'name is required' });

    const maxRow = await prisma.crownType.aggregate({ _max: { order: true } });
    const nextOrder = (maxRow._max.order ?? 0) + 1;

    const type = await prisma.crownType.create({
      data: { name: name.trim(), nameAr: nameAr?.trim() || null, order: nextOrder, isActive: true },
    });
    res.status(201).json(type);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Crown type name already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/crown-types/reorder  (admin only)
const reorderCrownTypes = async (req, res) => {
  try {
    const { types } = req.body;
    if (!Array.isArray(types) || !types.length)
      return res.status(400).json({ message: 'types array required' });

    await prisma.$transaction(
      types.map(({ id, order }) => prisma.crownType.update({ where: { id }, data: { order } }))
    );
    res.json({ message: 'Reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/crown-types/:id  (admin only)
const updateCrownType = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, nameAr, isActive } = req.body;

    const existing = await prisma.crownType.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Crown type not found' });

    const updated = await prisma.crownType.update({
      where: { id },
      data: {
        ...(name     !== undefined && { name: name.trim() }),
        ...(nameAr   !== undefined && { nameAr: nameAr?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Crown type name already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/crown-types/:id  (admin only)
const deleteCrownType = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.crownType.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Crown type not found' });

    await prisma.crownType.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { listCrownTypes, createCrownType, reorderCrownTypes, updateCrownType, deleteCrownType };

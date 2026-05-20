const prisma = require('../lib/prisma');

const VALID_DELIVERY_STATUSES = ['READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED'];

// ── GET /delivery/cases ── cases visible to delivery agent ───────────────────
const getDeliveryCases = async (req, res) => {
  try {
    const [cases, doctors] = await Promise.all([
      prisma.case.findMany({
        where: { status: 'COMPLETED' },
        include: {
          technician: { select: { id: true, name: true } },
        },
        orderBy: [
          { deliveryStatus: 'asc' },  // nulls (not yet ready) first, then in sequence
          { updatedAt: 'desc' },
        ],
      }),
      prisma.user.findMany({
        where: { role: 'DOCTOR' },
        select: { name: true, phone: true },
      }),
    ]);

    const doctorPhoneMap = Object.fromEntries(doctors.map(d => [d.name, d.phone]));
    const enriched = cases.map(c => ({ ...c, doctorPhone: doctorPhoneMap[c.doctorName] ?? null }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /delivery/cases/:id/status ── advance delivery status ────────────────
const updateDeliveryStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { deliveryStatus } = req.body;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Case not found' });

    // Only completed cases can have delivery tracked
    if (existing.status !== 'COMPLETED')
      return res.status(400).json({ message: 'Case must be COMPLETED before delivery tracking' });

    if (!VALID_DELIVERY_STATUSES.includes(deliveryStatus))
      return res.status(400).json({ message: 'Invalid delivery status' });

    const updated = await prisma.case.update({
      where: { id },
      data:  { deliveryStatus },
      include: { technician: { select: { id: true, name: true } } },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /delivery/stats ── delivery summary stats ─────────────────────────────
const getDeliveryStats = async (req, res) => {
  try {
    const [readyCount, pickedCount, deliveredCount, totalCompleted] = await Promise.all([
      prisma.case.count({ where: { status: 'COMPLETED', deliveryStatus: 'READY_FOR_PICKUP' } }),
      prisma.case.count({ where: { status: 'COMPLETED', deliveryStatus: 'PICKED_UP' } }),
      prisma.case.count({ where: { status: 'COMPLETED', deliveryStatus: 'DELIVERED' } }),
      prisma.case.count({ where: { status: 'COMPLETED' } }),
    ]);

    res.json({
      readyForPickup: readyCount,
      pickedUp:       pickedCount,
      delivered:      deliveredCount,
      awaitingReady:  totalCompleted - readyCount - pickedCount - deliveredCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getDeliveryCases, updateDeliveryStatus, getDeliveryStats };

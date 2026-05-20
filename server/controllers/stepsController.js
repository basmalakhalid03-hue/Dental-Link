const prisma = require('../lib/prisma');

const getCaseSteps = async (req, res) => {
  try {
    const { id } = req.params;
    const steps = await prisma.caseStep.findMany({
      where: { caseId: parseInt(id) },
      include: {
        step: true,
        notes: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    res.json(steps);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const completeStep = async (req, res) => {
  try {
    const { id } = req.params;

    const caseStep = await prisma.caseStep.findUnique({
      where: { id: parseInt(id) },
      include: { case: true, step: true },
    });

    if (!caseStep) return res.status(404).json({ message: 'Step not found' });
    if (caseStep.status === 'COMPLETED')
      return res.status(400).json({ message: 'Step already completed' });

    const result = await prisma.$transaction(async (tx) => {
      // Mark current step as completed
      await tx.caseStep.update({
        where: { id: parseInt(id) },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Find next step
      const nextStep = await tx.caseStep.findFirst({
        where: { caseId: caseStep.caseId, status: 'PENDING' },
        include: { step: true },
        orderBy: { order: 'asc' },
      });

      if (nextStep) {
        await tx.caseStep.update({
          where: { id: nextStep.id },
          data: { status: 'CURRENT' },
        });
        return { done: false, nextStep };
      } else {
        // All steps done - complete the case
        await tx.case.update({
          where: { id: caseStep.caseId },
          data: { status: 'COMPLETED' },
        });
        return { done: true };
      }
    });

    // Return updated case
    const updatedCase = await prisma.case.findUnique({
      where: { id: caseStep.caseId },
      include: {
        technician: { select: { id: true, name: true } },
        caseSteps: {
          include: { step: true, notes: { include: { author: { select: { id: true, name: true } } } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({ ...result, case: updatedCase });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim())
      return res.status(400).json({ message: 'Note content is required' });

    const note = await prisma.note.create({
      data: {
        caseStepId: parseInt(id),
        content: content.trim(),
        authorId: req.user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getWorkflowSteps = async (req, res) => {
  try {
    const { type } = req.query;
    const steps = await prisma.workflowStep.findMany({
      where: type ? { type } : {},
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });
    res.json(steps);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getCaseSteps, completeStep, addNote, getWorkflowSteps };

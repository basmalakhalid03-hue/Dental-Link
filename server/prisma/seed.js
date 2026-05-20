const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DIGITAL_STEPS = [
  { name: 'Desktop Scan',             nameAr: 'مسح الإمبرشن',            order: 1,  description: 'Initial scan of the dental impression using desktop scanner' },
  { name: 'Digital Impression Check', nameAr: 'فحص الإمبرشن الرقمي',     order: 2,  description: 'Verify scan quality and accuracy of the digital impression' },
  { name: 'CAD Design',               nameAr: 'تصميم CAD',                order: 3,  description: 'Computer-aided design of the crown restoration' },
  { name: 'Margin Marking',           nameAr: 'تحديد الحواف',             order: 4,  description: 'Define and mark the crown margins precisely' },
  { name: 'Occlusion Design',         nameAr: 'تصميم الإطباق',            order: 5,  description: 'Design occlusal surface and check bite alignment' },
  { name: 'Milling',                  nameAr: 'الطحن',                    order: 6,  description: 'CNC milling of the ceramic block' },
  { name: 'Sintering',                nameAr: 'التلبيد',                  order: 7,  description: 'High-temperature sintering to achieve final density' },
  { name: 'Try-in',                   nameAr: 'التجريب',                  order: 8,  description: 'Initial fitting check on the model' },
  { name: 'Finishing',                nameAr: 'التشطيب',                  order: 9,  description: 'Surface finishing and polishing' },
  { name: 'Staining & Glazing',       nameAr: 'التلوين والتزجيج',         order: 10, description: 'Apply characterization stains and glaze firing' },
  { name: 'Final Ready',              nameAr: 'التسليم النهائي',          order: 11, description: 'Final quality check and packaging' },
];

const TRADITIONAL_STEPS = [
  { name: 'Impression',        nameAr: 'البصمة',                      order: 1,  description: 'Take physical impression of the prepared tooth' },
  { name: 'Stone Cast',        nameAr: 'صب الجبس',                    order: 2,  description: 'Pour dental stone to create working model' },
  { name: 'Die Prep',          nameAr: 'تحضير القالب',                 order: 3,  description: 'Prepare the die for crown fabrication' },
  { name: 'Die Trimming',      nameAr: 'تشكيل القالب',                 order: 4,  description: 'Trim and shape the die accurately' },
  { name: 'Die Spacer',        nameAr: 'مسافة الأسمنت',               order: 5,  description: 'Apply die spacer for cement space' },
  { name: 'Wax Pattern',       nameAr: 'نموذج الشمع',                  order: 6,  description: 'Build wax pattern of the crown' },
  { name: 'Spruing',           nameAr: 'قنوات الصب',                   order: 7,  description: 'Attach sprues for casting' },
  { name: 'Investing',         nameAr: 'الاستثمار بالمادة الحرارية',   order: 8,  description: 'Invest the wax pattern in investment material' },
  { name: 'Burnout',           nameAr: 'حرق الشمع',                    order: 9,  description: 'Burn out the wax in furnace' },
  { name: 'Casting',           nameAr: 'الصب',                        order: 10, description: 'Cast metal alloy into the mold' },
  { name: 'Divesting',         nameAr: 'إزالة المادة الحرارية',        order: 11, description: 'Remove casting from investment' },
  { name: 'Metal Finishing',   nameAr: 'تشطيب المعدن',                 order: 12, description: 'Finish and clean metal coping' },
  { name: 'Try Coping',        nameAr: 'تجريب الهيكل المعدني',         order: 13, description: 'Check metal coping fit on model' },
  { name: 'Opaque',            nameAr: 'طبقة الأوباك',                 order: 14, description: 'Apply opaque layer to mask metal' },
  { name: 'Porcelain Build-up',nameAr: 'بناء البورسلين',               order: 15, description: 'Layer porcelain to achieve shape' },
  { name: 'First Firing',      nameAr: 'الحرق الأول',                  order: 16, description: 'Initial porcelain firing cycle' },
  { name: 'Contouring',        nameAr: 'التشكيل',                      order: 17, description: 'Adjust contours and shape' },
  { name: 'Glazing',           nameAr: 'التلميع',                      order: 18, description: 'Final glaze firing for surface finish' },
  { name: 'Final Ready',       nameAr: 'التسليم النهائي',              order: 19, description: 'Final inspection and delivery preparation' },
];

const CROWN_TYPES = [
  { name: 'Zirconia',                    nameAr: 'زركونيا',               order: 1 },
  { name: 'E-max (Lithium Disilicate)',   nameAr: 'إيماكس (ليثيوم ديسيليكيت)', order: 2 },
  { name: 'PFM (Porcelain Fused to Metal)', nameAr: 'بورسلين على معدن',     order: 3 },
  { name: 'All Ceramic',                 nameAr: 'سيراميك بالكامل',         order: 4 },
  { name: 'All Metal',                   nameAr: 'معدن بالكامل',            order: 5 },
  { name: 'Composite',                   nameAr: 'كومبوزيت',               order: 6 },
];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.note.deleteMany();
  await prisma.caseStep.deleteMany();
  await prisma.case.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.crownType.deleteMany();

  for (const ct of CROWN_TYPES) {
    await prisma.crownType.create({ data: { ...ct, isActive: true } });
  }
  console.log('✅ Crown types created');

  for (const step of DIGITAL_STEPS) {
    await prisma.workflowStep.create({ data: { ...step, type: 'DIGITAL', isActive: true } });
  }
  for (const step of TRADITIONAL_STEPS) {
    await prisma.workflowStep.create({ data: { ...step, type: 'TRADITIONAL', isActive: true } });
  }
  console.log('✅ Workflow steps created');

  await prisma.user.deleteMany();

  const adminPass    = await bcrypt.hash('admin123', 10);
  const techPass     = await bcrypt.hash('tech123', 10);
  const deliveryPass = await bcrypt.hash('delivery123', 10);
  const doctorPass   = await bcrypt.hash('doctor123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Dr. Admin', email: 'admin@dentallink.com', password: adminPass, role: 'ADMIN' },
  });

  const tech1 = await prisma.user.create({
    data: { name: 'Ahmed Hassan', email: 'ahmed@dentallink.com', password: techPass, role: 'TECHNICIAN' },
  });
  const tech2 = await prisma.user.create({
    data: { name: 'Sara Mohamed', email: 'sara@dentallink.com', password: techPass, role: 'TECHNICIAN' },
  });
  const tech3 = await prisma.user.create({
    data: { name: 'Karim Ali', email: 'karim@dentallink.com', password: techPass, role: 'TECHNICIAN' },
  });

  await prisma.user.create({
    data: { name: 'Omar Delivery', email: 'delivery@dentallink.com', password: deliveryPass, role: 'DELIVERY_AGENT' },
  });
  await prisma.user.create({
    data: { name: 'Dr. Fatima Nour', email: 'doctor@dentallink.com', password: doctorPass, role: 'DOCTOR' },
  });

  console.log('✅ Users created');

  // Create a case using a selected subset of workflow step IDs
  async function createCase(data, selectedStepIds, completedCount = 0) {
    const allSteps = await prisma.workflowStep.findMany({
      where: { type: data.caseType, isActive: true },
      orderBy: { order: 'asc' },
    });

    // If no selection provided use all steps
    const chosenSteps = selectedStepIds
      ? allSteps.filter((s) => selectedStepIds.includes(s.id))
      : allSteps;

    const caseRecord = await prisma.case.create({ data });

    for (let i = 0; i < chosenSteps.length; i++) {
      const step = chosenSteps[i];
      let status = 'PENDING';
      let completedAt = null;

      if (i < completedCount) {
        status = 'COMPLETED';
        completedAt = new Date(Date.now() - (completedCount - i) * 24 * 60 * 60 * 1000);
      } else if (i === completedCount && completedCount < chosenSteps.length) {
        status = 'CURRENT';
      }

      await prisma.caseStep.create({
        data: { caseId: caseRecord.id, stepId: step.id, order: i + 1, status, completedAt },
      });
    }

    return caseRecord;
  }

  const case1 = await createCase({
    patientName: 'Mohammed Al-Rashid',
    doctorName: 'Dr. Fatima Nour',
    caseType: 'DIGITAL',
    crownType: 'Zirconia',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    toothNumber: 16,
    technicianId: tech1.id,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  }, null, 5);

  const case2 = await createCase({
    patientName: 'Layla Ibrahim',
    doctorName: 'Dr. Omar Khalid',
    caseType: 'TRADITIONAL',
    crownType: 'PFM (Porcelain Fused to Metal)',
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
    toothNumber: 26,
    technicianId: tech2.id,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  }, null, 8);

  await createCase({
    patientName: 'Youssef Tamer',
    doctorName: 'Dr. Aisha Salem',
    caseType: 'DIGITAL',
    crownType: 'E-max (Lithium Disilicate)',
    status: 'COMPLETED',
    priority: 'NORMAL',
    toothNumber: 36,
    technicianId: tech1.id,
  }, null, 11);

  await createCase({
    patientName: 'Nadia Sameh',
    doctorName: 'Dr. Fatima Nour',
    caseType: 'TRADITIONAL',
    crownType: 'All Metal',
    status: 'PENDING',
    priority: 'LOW',
    toothNumber: 46,
    technicianId: tech3.id,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  }, null, 0);

  await createCase({
    patientName: 'Hassan Mahmoud',
    doctorName: 'Dr. Karim Saad',
    caseType: 'DIGITAL',
    crownType: 'Zirconia',
    status: 'DELAYED',
    priority: 'URGENT',
    toothNumber: 14,
    technicianId: tech2.id,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }, null, 3);

  await createCase({
    patientName: 'Amira Fouad',
    doctorName: 'Dr. Omar Khalid',
    caseType: 'TRADITIONAL',
    crownType: 'PFM (Porcelain Fused to Metal)',
    status: 'COMPLETED',
    priority: 'NORMAL',
    toothNumber: 24,
    technicianId: tech3.id,
  }, null, 19);

  // Add sample notes
  const step1 = await prisma.caseStep.findFirst({ where: { caseId: case1.id, status: 'CURRENT' } });
  if (step1) {
    await prisma.note.create({
      data: { caseStepId: step1.id, content: 'Patient has slight tooth sensitivity, handle with care during milling.', authorId: tech1.id },
    });
  }

  const step2 = await prisma.caseStep.findFirst({ where: { caseId: case2.id, status: 'CURRENT' } });
  if (step2) {
    await prisma.note.create({
      data: { caseStepId: step2.id, content: 'Doctor requested slight shade adjustment - A2 instead of A1.', authorId: tech2.id },
    });
  }

  console.log('✅ Sample cases created');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:      admin@dentallink.com  /  admin123');
  console.log('  Technician: ahmed@dentallink.com  /  tech123');
  console.log('  Delivery:   delivery@dentallink.com / delivery123');
  console.log('  Doctor:     doctor@dentallink.com   / doctor123');
  console.log('\n🚀 Database seeded successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

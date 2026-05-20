const prisma = require('../lib/prisma');
const multer = require('multer');
const path = require('path');
const { getUploadsDir } = require('../lib/runtime');

const UPLOADS_DIR = getUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/tiff'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('file');

const uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    if (err) return res.status(400).json({ message: 'File type not allowed' });
    if (!req.file)  return res.status(400).json({ message: 'No file provided' });

    try {
      const { id } = req.params;
      const caseRecord = await prisma.case.findUnique({ where: { id: parseInt(id) } });
      if (!caseRecord) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Case not found' });
      }

      const file = await prisma.caseFile.create({
        data: {
          caseId:       parseInt(id),
          filename:     req.file.filename,
          originalName: req.file.originalname,
          mimetype:     req.file.mimetype,
          size:         req.file.size,
          uploadedById: req.user?.id ?? null,
        },
        include: { uploadedBy: { select: { id: true, name: true } } },
      });

      res.status(201).json(file);
    } catch (dbErr) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ message: 'Database error', error: dbErr.message });
    }
  });
};

const getCaseFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const files = await prisma.caseFile.findMany({
      where: { caseId: parseInt(id) },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.caseFile.findUnique({ where: { id: parseInt(fileId) } });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.caseFile.delete({ where: { id: parseInt(fileId) } });
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { uploadFile, getCaseFiles, deleteFile };

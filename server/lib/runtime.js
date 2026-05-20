const fs = require('fs');
const path = require('path');

function setupRuntime() {
  const isVercel = Boolean(process.env.VERCEL);
  const serverRoot = path.join(__dirname, '..');

  if (isVercel) {
    const tmpDb = '/tmp/dev.db';
    const sourceDb = path.join(serverRoot, 'prisma', 'dev.db');
    if (!fs.existsSync(tmpDb) && fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, tmpDb);
    }
    process.env.DATABASE_URL = `file:${tmpDb}`;
    process.env.UPLOADS_DIR = '/tmp/uploads';
  } else {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'file:./prisma/dev.db';
    }
    process.env.UPLOADS_DIR = path.join(serverRoot, 'uploads');
  }

  const uploadsDir = process.env.UPLOADS_DIR;
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function getUploadsDir() {
  return process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
}

module.exports = { setupRuntime, getUploadsDir };

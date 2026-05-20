const express = require('express');
const router = express.Router();
const { uploadFile, getCaseFiles, deleteFile } = require('../controllers/filesController');
const { authenticate } = require('../middleware/auth');

router.post('/cases/:id/upload', authenticate, uploadFile);
router.get('/cases/:id',         authenticate, getCaseFiles);
router.delete('/:fileId',        authenticate, deleteFile);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const datasetController = require('../controllers/dataset.controller');
const authMiddleware = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
router.post('/dataset/upload', authMiddleware, upload.array('files'), datasetController.uploadDataset);
router.get('/dataset/:id', authMiddleware, datasetController.getDataset);
router.get('/datasets', authMiddleware, datasetController.getAllDatasets);

router.post('/metadata/generate', authMiddleware, datasetController.generateMetadata);
router.post('/metadata/update', authMiddleware, datasetController.updateMetadata);

router.post('/compliance/check', authMiddleware, datasetController.checkCompliance);
router.get('/compliance/:dataset_id', authMiddleware, datasetController.getComplianceReport);

router.post('/export', authMiddleware, datasetController.exportDataset);
router.get('/download/:dataset_id', authMiddleware, datasetController.downloadDataset);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const datasetController = require('../controllers/dataset.controller');

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
router.post('/dataset/upload', upload.array('files'), datasetController.uploadDataset);
router.get('/dataset/:id', datasetController.getDataset);
router.get('/datasets', datasetController.getAllDatasets);

router.post('/metadata/generate', datasetController.generateMetadata);
router.post('/metadata/update', datasetController.updateMetadata);

router.post('/compliance/check', datasetController.checkCompliance);
router.get('/compliance/:dataset_id', datasetController.getComplianceReport);

router.post('/export', datasetController.exportDataset);
router.get('/download/:dataset_id', datasetController.downloadDataset);

module.exports = router;

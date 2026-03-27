const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ingestionService = require('../services/ingestion.service');
const metadataService = require('../services/metadata.ai.service');
const complianceEngine = require('../services/compliance.engine');
const exportService = require('../services/export.service');

function sendSuccess(res, statusCode, data) {
    return res.status(statusCode).json({
        status: 'success',
        data,
        error: null
    });
}

function sendError(res, statusCode, message, details = null) {
    return res.status(statusCode).json({
        status: 'error',
        data: null,
        error: {
            message,
            details
        }
    });
}

exports.uploadDataset = async (req, res) => {
    try {
        const { name } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return sendError(res, 400, 'No files uploaded');
        }

        const datasetStrName = name || 'Untitled Dataset ' + Date.now();
        const dataset = await ingestionService.processUpload(datasetStrName, files);
        
        // Trigger background processing asynchronously without awaiting
        processDatasetAsync(dataset.id).catch(console.error);

        return sendSuccess(res, 201, {
            message: 'Upload started successfully',
            dataset
        });
    } catch (error) {
        require('fs').writeFileSync('C:\\Users\\Subhr\\OneDrive\\Desktop\\Projects\\DatasetCuration\\Backend\\real_error.log', "Error: " + error.message + "\nStack: " + error.stack);
        return sendError(res, 500, error.message, { location: 'dataset.controller.js' });
    }
};

async function processDatasetAsync(datasetId) {
    try {
        // 1. Generate Metadata
        await metadataService.generateForDataset(datasetId);
        // 2. Run Compliance Check
        await complianceEngine.analyzeDataset(datasetId);
        // 3. Update Status
        await prisma.dataset.update({
            where: { id: datasetId },
            data: { status: 'Ready' }
        });
    } catch (error) {
        console.error('Error processing dataset:', error);
        await prisma.dataset.update({
            where: { id: datasetId },
            data: { status: 'Failed' }
        });
    }
}

exports.getDataset = async (req, res) => {
    try {
        const dataset = await prisma.dataset.findUnique({
            where: { id: req.params.id },
            include: {
                files: {
                    include: { metadata: true }
                },
                complianceReports: true
            }
        });
        if (!dataset) return sendError(res, 404, 'Dataset not found');
        
        // parse json fields for frontend
        const parsedFiles = dataset.files.map(f => ({
            ...f,
            metadata: f.metadata.map(m => ({
                ...m,
                tags: JSON.parse(m.tags || '[]'),
                sensitiveFlags: JSON.parse(m.sensitiveFlags || '[]'),
                confidenceScores: JSON.parse(m.confidenceScores || '{}')
            }))
        }));

        return sendSuccess(res, 200, { ...dataset, files: parsedFiles });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.getAllDatasets = async (req, res) => {
    try {
        const datasets = await prisma.dataset.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                complianceReports: { take: 1, orderBy: { createdAt: 'desc' } }
            }
        });
        return sendSuccess(res, 200, datasets);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.generateMetadata = async (req, res) => {
    try {
        const { datasetId } = req.body;
        await metadataService.generateForDataset(datasetId);
        return sendSuccess(res, 200, { message: 'Metadata generation triggered', datasetId });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.updateMetadata = async (req, res) => {
    try {
        const { metadataId, tags } = req.body;
        const updated = await prisma.metadata.update({
            where: { id: metadataId },
            data: { tags: JSON.stringify(tags) }
        });
        return sendSuccess(res, 200, updated);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.checkCompliance = async (req, res) => {
    try {
        const { datasetId } = req.body;
        const report = await complianceEngine.analyzeDataset(datasetId);
        return sendSuccess(res, 200, report);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.getComplianceReport = async (req, res) => {
    try {
        const report = await prisma.complianceReport.findFirst({
            where: { datasetId: req.params.dataset_id },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!report) return sendError(res, 404, 'Report not found');
        
        return sendSuccess(res, 200, {
            ...report,
            violations: JSON.parse(report.violations || '[]'),
            warnings: JSON.parse(report.warnings || '[]'),
            autoFixSuggestions: JSON.parse(report.autoFixSuggestions || '[]')
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.exportDataset = async (req, res) => {
    try {
        const { datasetId, format } = req.body; // format 'json' or 'csv'
        const fileName = await exportService.createExport(datasetId, format);
        return sendSuccess(res, 200, {
            fileName,
            format,
            downloadUrl: `/api/download/${datasetId}?file=${encodeURIComponent(fileName)}`
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.downloadDataset = async (req, res) => {
    try {
        const exportedFile = await exportService.getExportFile(req.params.dataset_id, req.query.file);
        if (!exportedFile) {
            return sendError(res, 404, 'Export file not found. Please export first.');
        }
        return res.download(exportedFile);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

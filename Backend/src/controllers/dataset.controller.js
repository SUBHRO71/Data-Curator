const ingestionService = require('../services/ingestion.service');
const metadataService = require('../services/metadata.ai.service');
const complianceEngine = require('../services/compliance.engine');
const exportService = require('../services/export.service');
const path = require('path');
const Dataset = require('../models/dataset.model');
const File = require('../models/file.model');
const Metadata = require('../models/metadata.model');
const ComplianceReport = require('../models/compliance-report.model');

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
        await Dataset.findByIdAndUpdate(datasetId, { status: 'Ready' });
    } catch (error) {
        console.error('Error processing dataset:', error);
        await Dataset.findByIdAndUpdate(datasetId, { status: 'Failed' });
    }
}

exports.getDataset = async (req, res) => {
    try {
        const dataset = await Dataset.findById(req.params.id).lean();
        if (!dataset) return sendError(res, 404, 'Dataset not found');

        const files = await File.find({ datasetId: req.params.id }).lean();
        const metadataRecords = await Metadata.find({
            fileId: { $in: files.map((file) => file._id) }
        }).lean();
        const complianceReports = await ComplianceReport.find({
            datasetId: req.params.id
        }).sort({ createdAt: -1 }).lean();
        const metadataByFileId = new Map();

        for (const meta of metadataRecords) {
            const key = meta.fileId.toString();
            const current = metadataByFileId.get(key) || [];
            current.push(meta);
            metadataByFileId.set(key, current);
        }
        
        // parse json fields for frontend
        const parsedFiles = files.map(f => ({
            id: f._id.toString(),
            datasetId: f.datasetId.toString(),
            originalName: f.originalName,
            storedPath: f.storedPath,
            mediaUrl: `/uploads/${path.basename(f.storedPath)}`,
            format: f.format,
            sizeBytes: f.sizeBytes,
            status: f.status,
            metadata: (metadataByFileId.get(f._id.toString()) || []).map(m => {
                const parsedConfidenceScores = JSON.parse(m.confidenceScores || '{}');
                const aiPayload = parsedConfidenceScores.ai || {};

                return {
                    id: m._id.toString(),
                    fileId: m.fileId.toString(),
                    type: aiPayload.type || f.format.toLowerCase(),
                    tags: JSON.parse(m.tags || '[]'),
                    language: m.language,
                    entities: aiPayload.entities || [],
                    caption: aiPayload.caption || '',
                    objects: aiPayload.objects || [],
                    piiDetected: Boolean(aiPayload.pii_detected),
                    processorSource: aiPayload.source || 'unknown',
                    sensitiveFlags: JSON.parse(m.sensitiveFlags || '[]'),
                    confidenceScores: parsedConfidenceScores
                };
            })
        }));

        return sendSuccess(res, 200, {
            id: dataset._id.toString(),
            userId: dataset.userId ? dataset.userId.toString() : null,
            name: dataset.name,
            status: dataset.status,
            createdAt: dataset.createdAt,
            updatedAt: dataset.updatedAt,
            files: parsedFiles,
            complianceReports: complianceReports.map((report) => ({
                id: report._id.toString(),
                datasetId: report.datasetId.toString(),
                overallScore: report.overallScore,
                violations: report.violations,
                warnings: report.warnings,
                autoFixSuggestions: report.autoFixSuggestions,
                createdAt: report.createdAt
            }))
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

exports.getAllDatasets = async (req, res) => {
    try {
        const datasets = await Dataset.find().sort({ createdAt: -1 }).lean();
        const reports = await ComplianceReport.find({
            datasetId: { $in: datasets.map((dataset) => dataset._id) }
        }).sort({ createdAt: -1 }).lean();
        const latestReportByDatasetId = new Map();

        for (const report of reports) {
            const key = report.datasetId.toString();
            if (!latestReportByDatasetId.has(key)) {
                latestReportByDatasetId.set(key, report);
            }
        }

        return sendSuccess(res, 200, datasets.map((dataset) => {
            const report = latestReportByDatasetId.get(dataset._id.toString());
            return {
                id: dataset._id.toString(),
                userId: dataset.userId ? dataset.userId.toString() : null,
                name: dataset.name,
                status: dataset.status,
                createdAt: dataset.createdAt,
                updatedAt: dataset.updatedAt,
                complianceReports: report ? [{
                    id: report._id.toString(),
                    datasetId: report.datasetId.toString(),
                    overallScore: report.overallScore,
                    violations: report.violations,
                    warnings: report.warnings,
                    autoFixSuggestions: report.autoFixSuggestions,
                    createdAt: report.createdAt
                }] : []
            };
        }));
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
        const updated = await Metadata.findByIdAndUpdate(
            metadataId,
            { tags: JSON.stringify(tags) },
            { new: true }
        );
        return sendSuccess(res, 200, updated ? updated.toJSON() : null);
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
        const report = await ComplianceReport.findOne({
            datasetId: req.params.dataset_id
        }).sort({ createdAt: -1 });
        
        if (!report) return sendError(res, 404, 'Report not found');
        
        return sendSuccess(res, 200, {
            id: report.id,
            datasetId: report.datasetId.toString(),
            overallScore: report.overallScore,
            createdAt: report.createdAt,
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

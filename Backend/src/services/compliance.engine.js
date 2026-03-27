const File = require('../models/file.model');
const Metadata = require('../models/metadata.model');
const ComplianceReport = require('../models/compliance-report.model');
const { evaluateFileCompliance, loadRawText } = require('./complianceEngine');

exports.analyzeDataset = async (datasetId) => {
    let overallScore = 100;
    const violations = [];
    const warnings = [];
    const autoFixSuggestions = [];

    const files = await File.find({ datasetId }).lean();
    const fileIds = files.map((file) => file._id);
    const metadataRecords = await Metadata.find({ fileId: { $in: fileIds } }).lean();
    const metadataByFileId = new Map();

    for (const meta of metadataRecords) {
        const key = meta.fileId.toString();
        const current = metadataByFileId.get(key) || [];
        current.push(meta);
        metadataByFileId.set(key, current);
    }

    for (const file of files) {
        const fileMetadata = metadataByFileId.get(file._id.toString()) || [];

        for (const meta of fileMetadata) {
            const aiMetadata = {
                type: file.format.toLowerCase(),
                tags: JSON.parse(meta.tags || '[]'),
                entities: [],
                caption: '',
                objects: [],
                sensitive_flags: JSON.parse(meta.sensitiveFlags || '[]'),
                pii_detected: false
            };

            try {
                const confidenceScores = JSON.parse(meta.confidenceScores || '{}');
                if (confidenceScores.ai) {
                    Object.assign(aiMetadata, confidenceScores.ai);
                }
            } catch (error) {
                console.error('[ai][compliance] Failed to parse metadata payload', {
                    fileId: file._id.toString(),
                    error: error.message
                });
            }

            const fileResult = evaluateFileCompliance({
                file: {
                    id: file._id.toString(),
                    originalName: file.originalName,
                    format: file.format
                },
                aiMetadata,
                rawText: loadRawText({
                    id: file._id.toString(),
                    originalName: file.originalName,
                    format: file.format,
                    storedPath: file.storedPath
                })
            });

            violations.push(...fileResult.violations);
            warnings.push(...fileResult.warnings);
            autoFixSuggestions.push(...fileResult.auto_fix_suggestions);
            overallScore = Math.min(overallScore, fileResult.compliance_score);
        }
    }

    if (overallScore < 0) overallScore = 0;

    const report = await ComplianceReport.create({
        datasetId,
        overallScore,
        violations: JSON.stringify(violations),
        warnings: JSON.stringify(warnings),
        autoFixSuggestions: JSON.stringify(autoFixSuggestions)
    });

    return report.toJSON();
};

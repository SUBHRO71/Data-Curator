const fs = require('fs');
const path = require('path');
const Dataset = require('../models/dataset.model');
const File = require('../models/file.model');
const Metadata = require('../models/metadata.model');

exports.createExport = async (datasetId, format = 'json') => {
    const dataset = await Dataset.findById(datasetId).lean();

    if (!dataset) throw new Error('Dataset not found');

    const files = await File.find({ datasetId }).lean();
    const metadataRecords = await Metadata.find({
        fileId: { $in: files.map((file) => file._id) }
    }).lean();
    const metadataByFileId = new Map();

    for (const meta of metadataRecords) {
        const key = meta.fileId.toString();
        const current = metadataByFileId.get(key) || [];
        current.push(meta);
        metadataByFileId.set(key, current);
    }

    const exportDir = path.join(__dirname, '../../uploads/exports');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportFileName = `dataset-${datasetId}-${Date.now()}.${format}`;
    const exportPath = path.join(exportDir, exportFileName);

    if (format === 'json') {
        const jsonData = files.map(f => ({
            id: f._id.toString(),
            originalName: f.originalName,
            format: f.format,
            metadata: (metadataByFileId.get(f._id.toString()) || []).map(m => ({
                tags: JSON.parse(m.tags || '[]'),
                language: m.language,
                sensitiveFlags: JSON.parse(m.sensitiveFlags || '[]')
            }))
        }));
        fs.writeFileSync(exportPath, JSON.stringify(jsonData, null, 2));
    } else if (format === 'csv') {
        let csvData = 'FileID,OriginalName,Format,Tags,Language,SensitiveFlags\n';
        files.forEach(f => {
            const m = (metadataByFileId.get(f._id.toString()) || [])[0];
            const tags = m ? m.tags.replace(/,/g, ' ') : '[]';
            const language = m ? m.language : 'unknown';
            const sFlags = m ? m.sensitiveFlags.replace(/,/g, ' ') : '[]';
            csvData += `${f._id.toString()},${f.originalName},${f.format},"${tags}",${language},"${sFlags}"\n`;
        });
        fs.writeFileSync(exportPath, csvData);
    } else {
        throw new Error('Unsupported format');
    }

    // Return the relative path for download
    return exportFileName;
};

exports.getExportFile = async (datasetId, fileName) => {
    if (!fileName) return null;
    const filePath = path.join(__dirname, '../../uploads/exports', fileName);
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    return null;
};

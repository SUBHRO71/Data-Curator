const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

exports.createExport = async (datasetId, format = 'json') => {
    const dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
        include: {
            files: {
                include: { metadata: true }
            }
        }
    });

    if (!dataset) throw new Error('Dataset not found');

    const exportDir = path.join(__dirname, '../../uploads/exports');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportFileName = `dataset-${datasetId}-${Date.now()}.${format}`;
    const exportPath = path.join(exportDir, exportFileName);

    if (format === 'json') {
        const jsonData = dataset.files.map(f => ({
            id: f.id,
            originalName: f.originalName,
            format: f.format,
            metadata: f.metadata.map(m => ({
                tags: JSON.parse(m.tags || '[]'),
                language: m.language,
                sensitiveFlags: JSON.parse(m.sensitiveFlags || '[]')
            }))
        }));
        fs.writeFileSync(exportPath, JSON.stringify(jsonData, null, 2));
    } else if (format === 'csv') {
        let csvData = 'FileID,OriginalName,Format,Tags,Language,SensitiveFlags\n';
        dataset.files.forEach(f => {
            const m = f.metadata[0]; // simplify to first metadata entry
            const tags = m ? m.tags.replace(/,/g, ' ') : '[]';
            const language = m ? m.language : 'unknown';
            const sFlags = m ? m.sensitiveFlags.replace(/,/g, ' ') : '[]';
            csvData += `${f.id},${f.originalName},${f.format},"${tags}",${language},"${sFlags}"\n`;
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

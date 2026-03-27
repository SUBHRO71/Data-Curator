const Dataset = require('../models/dataset.model');
const File = require('../models/file.model');

exports.processUpload = async (datasetName, uploadedFiles) => {
    // 1. Create Dataset
    const dataset = await Dataset.create({
        name: datasetName,
        status: 'Processing'
    });

    // 2. Map files and determine format
    const fileRecords = uploadedFiles.map(file => {
        let format = 'UNKNOWN';
        const mimeType = file.mimetype;
        if (mimeType.startsWith('image/')) format = 'IMAGE';
        else if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/csv') format = 'TEXT';
        else if (mimeType.startsWith('audio/')) format = 'AUDIO';
        else if (mimeType.startsWith('video/')) format = 'VIDEO';

        return {
            datasetId: dataset.id,
            originalName: file.originalname,
            storedPath: file.path,
            format: format,
            sizeBytes: file.size,
            status: 'Ready'
        };
    });

    // 3. Save files to DB
    await File.insertMany(fileRecords);

    return dataset.toJSON();
};

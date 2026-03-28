const Dataset = require('../models/dataset.model');
const File = require('../models/file.model');

exports.processUpload = async (datasetName, uploadedFiles, userId) => {
    // 1. Create Dataset
    const dataset = await Dataset.create({
        userId,
        name: datasetName,
        status: 'Processing'
    });

    // 2. Map files and determine format
    const fileRecords = uploadedFiles.map(file => {
        let format = 'UNKNOWN';
        const mimeType = file.mimetype;
        if (mimeType.startsWith('image/')) format = 'IMAGE';
        else if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/csv') format = 'TEXT';
        else if (
            mimeType === 'application/pdf' ||
            mimeType === 'application/msword' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/vnd.ms-excel' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'application/vnd.ms-powerpoint' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ) format = 'DOCUMENT';
        else if (mimeType.startsWith('audio/')) format = 'AUDIO';
        else if (mimeType.startsWith('video/')) format = 'VIDEO';

        return {
            datasetId: dataset.id,
            originalName: file.originalname,
            storedPath: file.path,
            mimeType,
            format: format,
            sizeBytes: file.size,
            status: 'Ready'
        };
    });

    // 3. Save files to DB
    await File.insertMany(fileRecords);

    return dataset.toJSON();
};

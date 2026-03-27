const File = require('../models/file.model');
const Metadata = require('../models/metadata.model');
const { processTextFile } = require('./textProcessor');
const { processImageFile } = require('./imageProcessor');

function buildDefaultOutput(file) {
    return {
        type: file.format.toLowerCase(),
        tags: ['unclassified'],
        entities: [],
        caption: '',
        objects: [],
        sensitive_flags: [],
        pii_detected: false,
        language: file.format === 'TEXT' ? 'unknown' : 'n/a',
        source: 'default'
    };
}

exports.generateForDataset = async (datasetId) => {
    const files = await File.find({ datasetId });

    for (const file of files) {
        const existingMetadata = await Metadata.findOne({
            fileId: file.id
        });

        if (existingMetadata) {
            continue;
        }

        let aiOutput = buildDefaultOutput(file);

        if (file.format === 'TEXT') {
            aiOutput = await processTextFile(file);
        } else if (file.format === 'IMAGE') {
            aiOutput = await processImageFile(file);
        }

        // Save metadata
        await Metadata.create({
            fileId: file.id,
            tags: JSON.stringify(aiOutput.tags || []),
            language: aiOutput.language || 'unknown',
            sensitiveFlags: JSON.stringify(aiOutput.sensitive_flags || []),
            confidenceScores: JSON.stringify({
                ai: aiOutput,
                generatedAt: new Date().toISOString()
            })
        });
    }
};

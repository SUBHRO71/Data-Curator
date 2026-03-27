const fs = require('fs');
const File = require('../models/file.model');
const Metadata = require('../models/metadata.model');

exports.generateForDataset = async (datasetId) => {
    const files = await File.find({ datasetId });

    for (const file of files) {
        const existingMetadata = await Metadata.findOne({
            fileId: file.id
        });

        if (existingMetadata) {
            continue;
        }

        let tags = [];
        let language = 'unknown';
        let sensitiveFlags = [];
        let confidenceScores = {};

        // Mock AI Processing based on file format
        if (file.format === 'TEXT') {
            language = 'en';
            // Simple mock extraction based on file content. In real scenario, NLP model goes here.
            try {
                const content = fs.readFileSync(file.storedPath, 'utf-8');
                if (content.toLowerCase().includes('invoice') || content.toLowerCase().includes('price')) {
                    tags.push('receipt', 'finance');
                    confidenceScores['finance'] = 0.95;
                }
                if (content.toLowerCase().includes('stupid') || content.toLowerCase().includes('hate')) {
                    sensitiveFlags.push('toxic_text');
                    confidenceScores['toxic_text'] = 0.88;
                }
                tags.push('document', 'text-data');
            } catch (e) {
                console.error('Error reading text file for AI meta extraction', e);
            }
        } 
        else if (file.format === 'IMAGE') {
            const ext = file.originalName.split('.').pop().toLowerCase();
            tags.push('object', 'scene', ext);
            confidenceScores['scene'] = 0.89;
            confidenceScores['object'] = 0.92;
            
            // Randomly mock identifying a face
            if (Math.random() > 0.7) {
                tags.push('face');
                sensitiveFlags.push('contains_face');
                confidenceScores['face'] = 0.99;
            }
        }
        else if (file.format === 'AUDIO') {
            language = 'en';
            tags.push('speech', 'conversation');
            confidenceScores['speech'] = 0.98;
        }
        else if (file.format === 'VIDEO') {
            tags.push('moving-objects', 'frames');
            confidenceScores['moving-objects'] = 0.85;
            if (Math.random() > 0.5) {
                sensitiveFlags.push('contains_face');
            }
        } else {
            tags.push('unclassified');
        }

        // Save metadata
        await Metadata.create({
            fileId: file.id,
            tags: JSON.stringify(tags),
            language,
            sensitiveFlags: JSON.stringify(sensitiveFlags),
            confidenceScores: JSON.stringify(confidenceScores)
        });
    }
};

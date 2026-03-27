const fs = require('fs');
const path = require('path');

const DEFAULT_IMAGE_OUTPUT = {
    type: 'image',
    tags: [],
    entities: [],
    caption: '',
    objects: [],
    sensitive_flags: [],
    pii_detected: false,
    language: 'n/a',
    source: 'unknown'
};

const STOP_WORDS = new Set(['a', 'an', 'the', 'with', 'and', 'for', 'this', 'that', 'image', 'photo', 'picture', 'showing']);

function uniqueNormalized(values) {
    return [...new Set((values || [])
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean))];
}

function captionToTags(caption) {
    return uniqueNormalized(
        caption
            .split(/[^a-zA-Z0-9]+/)
            .map((token) => token.toLowerCase())
            .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    );
}

function buildFallbackImageOutput(file) {
    return {
        ...DEFAULT_IMAGE_OUTPUT,
        caption: 'Caption unavailable because the local BLIP service is not running.',
        tags: ['image', 'needs-captioning'],
        objects: [],
        sensitive_flags: ['caption_unavailable'],
        source: 'fallback'
    };
}

async function callBlip(file) {
    const serviceUrl = process.env.BLIP_SERVICE_URL || 'http://127.0.0.1:8001/caption';
    const imageBuffer = fs.readFileSync(file.storedPath);
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'application/octet-stream' }), file.originalName);

    const response = await fetch(serviceUrl, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Local BLIP service request failed with ${response.status}`);
    }

    const payload = await response.json();
    const caption = payload?.caption || '';

    if (!caption) {
        throw new Error('BLIP returned an empty caption');
    }

    const tags = captionToTags(caption);
    return {
        ...DEFAULT_IMAGE_OUTPUT,
        caption,
        tags,
        objects: tags,
        source: 'blip_local'
    };
}

async function processImageFile(file) {
    try {
        const aiOutput = await callBlip(file);
        console.log('[ai][image] BLIP output', { fileId: file.id, fileName: file.originalName, aiOutput });
        return aiOutput;
    } catch (error) {
        console.error('[ai][image] BLIP processing failed, using fallback', {
            fileId: file.id,
            fileName: file.originalName,
            error: error.message
        });
        return buildFallbackImageOutput(file);
    }
}

module.exports = {
    processImageFile
};

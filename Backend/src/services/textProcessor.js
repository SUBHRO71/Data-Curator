const fs = require('fs');
const path = require('path');

const DEFAULT_TEXT_OUTPUT = {
    type: 'text',
    tags: [],
    entities: [],
    caption: '',
    objects: [],
    sensitive_flags: [],
    pii_detected: false,
    language: 'unknown',
    source: 'unknown'
};

const TEXT_MIME_TYPES = new Set([
    'application/json',
    'text/csv'
]);

const EXTENSION_TO_MIME = {
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.xml': 'application/xml'
};

const GEMINI_SCHEMA = {
    type: 'object',
    properties: {
        type: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        entities: { type: 'array', items: { type: 'string' } },
        caption: { type: 'string' },
        objects: { type: 'array', items: { type: 'string' } },
        sensitive_flags: { type: 'array', items: { type: 'string' } },
        pii_detected: { type: 'boolean' },
        language: { type: 'string' }
    },
    required: ['type', 'tags', 'entities', 'caption', 'objects', 'sensitive_flags', 'pii_detected', 'language']
};

function uniqueNormalized(values) {
    return [...new Set((values || [])
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean))];
}

function extractJsonPayload(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return JSON.parse(trimmed);
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
        return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error('No JSON object found in Gemini response');
}

function buildFallbackTextOutput(content) {
    const lowerContent = content.toLowerCase();
    const entityMatches = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
    const tags = ['text-data'];
    const sensitiveFlags = [];

    if (lowerContent.includes('invoice') || lowerContent.includes('receipt') || lowerContent.includes('price')) {
        tags.push('finance', 'invoice', 'document');
    }
    if (lowerContent.includes('patient') || lowerContent.includes('hospital') || lowerContent.includes('doctor')) {
        tags.push('medical', 'healthcare');
        sensitiveFlags.push('medical_context');
    }
    if (lowerContent.includes('hate') || lowerContent.includes('violence') || lowerContent.includes('weapon')) {
        sensitiveFlags.push('sensitive_content');
    }

    const piiDetected = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content);

    return {
        ...DEFAULT_TEXT_OUTPUT,
        tags: uniqueNormalized(tags),
        entities: uniqueNormalized(entityMatches),
        sensitive_flags: uniqueNormalized(piiDetected ? [...sensitiveFlags, 'pii_detected'] : sensitiveFlags),
        pii_detected: piiDetected,
        language: 'en',
        source: 'fallback'
    };
}

function inferMimeType(file) {
    if (file.mimeType) {
        return file.mimeType;
    }

    return EXTENSION_TO_MIME[path.extname(file.originalName || '').toLowerCase()] || 'application/octet-stream';
}

function isTextLikeMimeType(mimeType) {
    return mimeType.startsWith('text/') || TEXT_MIME_TYPES.has(mimeType);
}

function readTextPreview(file, mimeType) {
    if (!isTextLikeMimeType(mimeType)) {
        return '';
    }

    return fs.readFileSync(file.storedPath, 'utf-8');
}

function deriveOutputType(file, mimeType) {
    if (file.format === 'DOCUMENT') {
        return 'document';
    }
    if (file.format === 'AUDIO') {
        return 'audio';
    }
    if (file.format === 'VIDEO') {
        return 'video';
    }
    if (mimeType === 'application/pdf') {
        return 'document';
    }
    return 'text';
}

async function callGeminiForFile(file, content, mimeType) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const modelPath = model.startsWith('models/') ? model : `models/${model}`;
    const prompt = [
        'Extract dataset metadata from this uploaded file and return valid JSON only.',
        'Recommend concise metatags, detect whether PII is present, and add sensitive flags when appropriate.',
        `Filename: ${file.originalName}`,
        `Detected format: ${file.format}`,
        `MIME type: ${mimeType}`
    ].join('\n');
    const parts = [{ text: prompt }];

    if (content) {
        parts.push({
            text: `Text preview:\n${content.slice(0, 15000)}`
        });
    } else {
        const fileBuffer = fs.readFileSync(file.storedPath);
        parts.push({
            inlineData: {
                mimeType,
                data: fileBuffer.toString('base64')
            }
        });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{
                parts
            }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseJsonSchema: GEMINI_SCHEMA
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini request failed with ${response.status}`);
    }

    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!text) {
        throw new Error('Gemini returned an empty response');
    }

    return extractJsonPayload(text);
}

function normalizeTextOutput(file, rawOutput, mimeType) {
    return {
        ...DEFAULT_TEXT_OUTPUT,
        ...rawOutput,
        type: deriveOutputType(file, mimeType),
        tags: uniqueNormalized(rawOutput.tags),
        entities: uniqueNormalized(rawOutput.entities),
        objects: uniqueNormalized(rawOutput.objects),
        sensitive_flags: uniqueNormalized(rawOutput.sensitive_flags),
        pii_detected: Boolean(rawOutput.pii_detected),
        caption: '',
        source: 'gemini'
    };
}

async function processNonImageFile(file) {
    const mimeType = inferMimeType(file);
    const content = readTextPreview(file, mimeType);

    try {
        const aiOutput = normalizeTextOutput(file, await callGeminiForFile(file, content, mimeType), mimeType);
        console.log('[ai][file] Gemini output', { fileId: file.id, fileName: file.originalName, mimeType, aiOutput });
        return aiOutput;
    } catch (error) {
        console.error('[ai][file] Gemini processing failed, using fallback', {
            fileId: file.id,
            fileName: file.originalName,
            error: error.message
        });
        return {
            ...buildFallbackTextOutput(content || file.originalName || ''),
            type: deriveOutputType(file, mimeType)
        };
    }
}

module.exports = {
    processNonImageFile
};

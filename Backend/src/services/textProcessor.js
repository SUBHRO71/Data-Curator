const fs = require('fs');

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

async function callGeminiForText(content) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const modelPath = model.startsWith('models/') ? model : `models/${model}`;
    const prompt = [
        'Extract dataset metadata from the following text and return valid JSON only.',
        'Return concise tags and entities, detect whether PII is present, and add sensitive flags when appropriate.',
        '',
        content.slice(0, 15000)
    ].join('\n');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
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

function normalizeTextOutput(rawOutput) {
    return {
        ...DEFAULT_TEXT_OUTPUT,
        ...rawOutput,
        type: 'text',
        tags: uniqueNormalized(rawOutput.tags),
        entities: uniqueNormalized(rawOutput.entities),
        objects: uniqueNormalized(rawOutput.objects),
        sensitive_flags: uniqueNormalized(rawOutput.sensitive_flags),
        pii_detected: Boolean(rawOutput.pii_detected),
        caption: '',
        source: 'gemini'
    };
}

async function processTextFile(file) {
    const content = fs.readFileSync(file.storedPath, 'utf-8');

    try {
        const aiOutput = normalizeTextOutput(await callGeminiForText(content));
        console.log('[ai][text] Gemini output', { fileId: file.id, fileName: file.originalName, aiOutput });
        return aiOutput;
    } catch (error) {
        console.error('[ai][text] Gemini processing failed, using fallback', {
            fileId: file.id,
            fileName: file.originalName,
            error: error.message
        });
        return buildFallbackTextOutput(content);
    }
}

module.exports = {
    processTextFile
};

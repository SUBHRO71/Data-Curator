const fs = require('fs');

const RULES = {
    healthcare: ['hospital', 'patient', 'doctor', 'medical'],
    violence: ['gun', 'blood', 'weapon'],
    adult: ['nudity', 'explicit']
};

function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))];
}

function uniqueObjects(items) {
    const seen = new Set();
    return items.filter((item) => {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function detectPiiFromText(content) {
    const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const phones = content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
    const names = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];

    return {
        emails: uniqueValues(emails),
        phones: uniqueValues(phones),
        names: uniqueValues(names)
    };
}

function scoreFromSignals({ violations, warnings }) {
    return Math.max(0, 100 - violations.length * 18 - warnings.length * 6);
}

function evaluateFileCompliance({ file, aiMetadata, rawText }) {
    const searchable = [
        ...(aiMetadata.tags || []),
        ...(aiMetadata.entities || []),
        ...(aiMetadata.objects || []),
        aiMetadata.caption || '',
        rawText || ''
    ].join(' ').toLowerCase();

    const violations = [];
    const warnings = [];
    const autoFixSuggestions = [];

    if (rawText) {
        const pii = detectPiiFromText(rawText);
        if (pii.emails.length) {
            violations.push({ fileId: file.id, issue: 'PII detected: email addresses found in text.' });
            autoFixSuggestions.push(`Redact email addresses in ${file.originalName}`);
        }
        if (pii.phones.length) {
            violations.push({ fileId: file.id, issue: 'PII detected: phone numbers found in text.' });
            autoFixSuggestions.push(`Redact phone numbers in ${file.originalName}`);
        }
        if (pii.names.length) {
            warnings.push({ fileId: file.id, issue: 'Potential personal names found in text.' });
            autoFixSuggestions.push(`Review named entities in ${file.originalName} for direct identifiers`);
        }

        if (pii.emails.length || pii.phones.length || pii.names.length) {
            aiMetadata.pii_detected = true;
        }
    }

    const hasHealthcareSignal = RULES.healthcare.some((tag) => searchable.includes(tag));
    const hasIdentitySignal = aiMetadata.pii_detected || (aiMetadata.entities || []).length > 0;
    if (hasHealthcareSignal && hasIdentitySignal) {
        violations.push({ fileId: file.id, issue: 'Potential HIPAA risk: healthcare context combined with identifiable entities.' });
        autoFixSuggestions.push(`Remove direct identifiers or de-identify healthcare content in ${file.originalName}`);
    }

    if (RULES.violence.some((tag) => searchable.includes(tag))) {
        warnings.push({ fileId: file.id, issue: 'Sensitive content warning: violence-related content detected.' });
        autoFixSuggestions.push(`Review violence-related content in ${file.originalName} before downstream use`);
    }

    if (RULES.adult.some((tag) => searchable.includes(tag))) {
        violations.push({ fileId: file.id, issue: 'Sensitive content violation: adult or explicit content detected.' });
        autoFixSuggestions.push(`Remove or isolate explicit content from ${file.originalName}`);
    }

    if ((aiMetadata.sensitive_flags || []).includes('medical_context')) {
        warnings.push({ fileId: file.id, issue: 'Medical context detected. Confirm consent and de-identification.' });
    }

    if ((aiMetadata.sensitive_flags || []).includes('pii_detected')) {
        violations.push({ fileId: file.id, issue: 'Processor flagged potential PII in the file.' });
    }

    const normalized = {
        compliance_score: scoreFromSignals({ violations, warnings }),
        violations: uniqueObjects(violations),
        warnings: uniqueObjects(warnings),
        auto_fix_suggestions: uniqueValues(autoFixSuggestions)
    };

    console.log('[ai][compliance] Compliance output', {
        fileId: file.id,
        fileName: file.originalName,
        normalized
    });

    return normalized;
}

function loadRawText(file) {
    if (file.format !== 'TEXT') {
        return '';
    }

    try {
        return fs.readFileSync(file.storedPath, 'utf-8');
    } catch (error) {
        console.error('[ai][compliance] Failed to read text file', {
            fileId: file.id,
            fileName: file.originalName,
            error: error.message
        });
        return '';
    }
}

module.exports = {
    evaluateFileCompliance,
    loadRawText
};

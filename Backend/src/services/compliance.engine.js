const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

exports.analyzeDataset = async (datasetId) => {
    let overallScore = 100;
    const violations = [];
    const warnings = [];
    const autoFixSuggestions = [];

    const files = await prisma.file.findMany({
        where: { datasetId },
        include: { metadata: true }
    });

    for (const file of files) {
        // Evaluate AI Extracted Metadata
        for (const meta of file.metadata) {
            const sensitiveFlags = JSON.parse(meta.sensitiveFlags || '[]');
            const tags = JSON.parse(meta.tags || '[]');
            
            if (sensitiveFlags.includes('contains_face')) {
                overallScore -= 5;
                warnings.push({ fileId: file.id, issue: 'Face detected in media. Ensure consent is collected.' });
                autoFixSuggestions.push(`Blur faces in file ${file.originalName}`);
            }
            if (sensitiveFlags.includes('toxic_text')) {
                overallScore -= 15;
                violations.push({ fileId: file.id, issue: 'Toxic or harmful content detected in text.' });
                autoFixSuggestions.push(`Redact harmful phrases or remove file ${file.originalName}`);
            }
            
            if (file.format === 'IMAGE' && !tags.includes('alt-text')) {
                // Mock accessibility warning
                warnings.push({ fileId: file.id, issue: 'Missing alt-text description for image data.' });
                autoFixSuggestions.push(`Generate alt-text for ${file.originalName}`);
                overallScore -= 2;
            }
        }

        // Deep text check for PII
        if (file.format === 'TEXT') {
            try {
                const content = fs.readFileSync(file.storedPath, 'utf-8');
                
                // PII Regex Checkers
                const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
                const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

                if (ssnRegex.test(content)) {
                    overallScore -= 20;
                    violations.push({ fileId: file.id, issue: 'PII Detected: SSN/Aadhaar like pattern found.' });
                    autoFixSuggestions.push(`Redact SSN patterns in ${file.originalName}`);
                }
                if (phoneRegex.test(content)) {
                    overallScore -= 10;
                    violations.push({ fileId: file.id, issue: 'PII Detected: Phone number found.' });
                    autoFixSuggestions.push(`Redact phone patterns in ${file.originalName}`);
                }
                if (emailRegex.test(content)) {
                    overallScore -= 10;
                    violations.push({ fileId: file.id, issue: 'PII Detected: Email address found.' });
                    autoFixSuggestions.push(`Redact email patterns in ${file.originalName}`);
                }
            } catch(e) {
                console.error('Error scanning text file for PII', e);
            }
        }
    }

    if (overallScore < 0) overallScore = 0;

    const report = await prisma.complianceReport.create({
        data: {
            datasetId,
            overallScore,
            violations: JSON.stringify(violations),
            warnings: JSON.stringify(warnings),
            autoFixSuggestions: JSON.stringify(autoFixSuggestions)
        }
    });

    return report;
};

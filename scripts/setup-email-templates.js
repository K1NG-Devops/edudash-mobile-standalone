#!/usr/bin/env node

/**
 * Setup script for EduDash Pro email templates
 * This script provides instructions and validation for email template setup
 */

const fs = require('fs');
const path = require('path');


// Check if template files exist
const templateDir = path.join(__dirname, '../supabase/email-templates');
const htmlTemplate = path.join(templateDir, 'password-reset.html');
const textTemplate = path.join(templateDir, 'password-reset.txt');
const instructions = path.join(templateDir, 'setup-instructions.md');


const files = [
    { path: htmlTemplate, name: 'HTML Template', required: true },
    { path: textTemplate, name: 'Text Template', required: true },
    { path: instructions, name: 'Setup Instructions', required: false }
];

let allFilesExist = true;

files.forEach(file => {
    if (fs.existsSync(file.path)) {
    } else {
        if (file.required) allFilesExist = false;
    }
});

if (!allFilesExist) {
    process.exit(1);
}





// Validate HTML template content
try {
    const htmlContent = fs.readFileSync(htmlTemplate, 'utf8');

    if (htmlContent.includes('{{ .ConfirmationURL }}')) {
    } else {
    }

    if (htmlContent.includes('EduDash Pro')) {
    } else {
    }
} catch (error) {
}



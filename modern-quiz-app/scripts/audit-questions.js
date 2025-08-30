#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Patterns to flag for review
const INAPPROPRIATE_PATTERNS = [
    /drunk/i,
    /grandma/i,
    /pentium/i,
    /christmas/i,
    /wine/i,
    /solitaire/i,
    /slippers/i,
    /everest/i,
    /dinosaur/i,
    /hearts/i,
    /poor/i,
    /really drunk/i,
    /arnoldc/i,
    /break.*hearts/i
];

const QUESTION_ISSUES = [
    /\[\s*\]\s*\[\s*x\s*\]/i, // Both checked and unchecked
    /\[\s*x\s*\]\s*\[\s*x\s*\]/i, // Multiple correct answers when shouldn't be
    /answer:\s*$/im, // Empty answer
    /question:\s*$/im, // Empty question
];

const questionFiles = [
    'API Management.md',
    'AZ CLI.md', 
    'App Configuration.md',
    'App Service.md',
    'Application Insights.md',
    'Azure.md',
    'Blob Storage.md',
    'Compute Solutions.md',
    'Containers.md',
    'Cosmos DB.md',
    'Docker.md',
    'Entra ID.md',
    'Event Grid.md',
    'Event Hubs.md',
    'Functions.md',
    'Graph.md',
    'Key Vault.md',
    'Managed Identities.md',
    'Message Queues.md',
    'Monitor.md',
    'Queue Storage.md',
    'Resource Groups.md',
    'Service Bus.md',
    'Shared Access Signatures.md',
    'Storage Redundancy.md',
    'Storage Security.md'
];

const issues = [];

function analyzeQuestion(content, startLine, endLine, filename) {
    const questionContent = content.slice(startLine, endLine).join('\n');
    const questionNum = Math.floor(startLine / 10) + 1; // Rough estimate
    
    // Check for inappropriate content
    INAPPROPRIATE_PATTERNS.forEach(pattern => {
        if (pattern.test(questionContent)) {
            issues.push({
                type: 'INAPPROPRIATE',
                file: filename,
                line: startLine,
                issue: `Inappropriate content found: ${pattern.source}`,
                content: questionContent.substring(0, 200) + '...'
            });
        }
    });
    
    // Check for formatting issues
    QUESTION_ISSUES.forEach(pattern => {
        if (pattern.test(questionContent)) {
            issues.push({
                type: 'FORMATTING',
                file: filename,
                line: startLine,
                issue: `Formatting issue: ${pattern.source}`,
                content: questionContent.substring(0, 200) + '...'
            });
        }
    });
    
    // Check for duplicate answer choices
    const answerLines = questionContent.split('\n').filter(line => line.trim().startsWith('- ['));
    const answerTexts = answerLines.map(line => line.replace(/- \[[x ]\]\s*/, '').trim());
    const duplicates = answerTexts.filter((item, index) => answerTexts.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
        issues.push({
            type: 'DUPLICATE_ANSWERS',
            file: filename,
            line: startLine,
            issue: `Duplicate answer choices: ${duplicates.join(', ')}`,
            content: answerLines.join('\n')
        });
    }
    
    // Check for too many correct answers (more than 3 might be suspicious)
    const correctAnswers = answerLines.filter(line => line.includes('[x]')).length;
    if (correctAnswers > 4) {
        issues.push({
            type: 'TOO_MANY_CORRECT',
            file: filename,
            line: startLine,
            issue: `${correctAnswers} correct answers marked (might be too many)`,
            content: answerLines.join('\n')
        });
    }
    
    // Check for no correct answers
    if (correctAnswers === 0 && answerLines.length > 0) {
        issues.push({
            type: 'NO_CORRECT_ANSWERS',
            file: filename,
            line: startLine,
            issue: 'No correct answers marked',
            content: answerLines.join('\n')
        });
    }
}

console.log('🔍 Starting comprehensive question audit...\n');

questionFiles.forEach(filename => {
    const filePath = path.join('content/questions', filename);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`);
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8').split('\n');
    let questionStart = -1;
    
    content.forEach((line, index) => {
        if (line.trim().startsWith('Question:')) {
            if (questionStart !== -1) {
                // Analyze previous question
                analyzeQuestion(content, questionStart, index, filename);
            }
            questionStart = index;
        }
    });
    
    // Analyze last question
    if (questionStart !== -1) {
        analyzeQuestion(content, questionStart, content.length, filename);
    }
    
    console.log(`✅ Analyzed ${filename}`);
});

console.log(`\n🔍 Audit complete! Found ${issues.length} potential issues:\n`);

// Group issues by type
const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
}, {});

Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
    console.log(`\n📋 ${type} (${typeIssues.length} issues):`);
    console.log('=' .repeat(50));
    
    typeIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.file} (line ~${issue.line})`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Preview: ${issue.content.substring(0, 150)}...`);
    });
});

if (issues.length === 0) {
    console.log('🎉 No issues found! All questions look good.');
} else {
    console.log(`\n⚠️  Found ${issues.length} issues that need review.`);
}

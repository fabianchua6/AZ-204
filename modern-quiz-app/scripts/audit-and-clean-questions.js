#!/usr/bin/env node
/**
 * Question Audit and Cleanup Script
 * Finds and removes:
 * - Duplicate questions
 * - Questions with signatures/garbage text
 * - Questions with no answers
 * - Malformed questions
 */

const fs = require('fs');
const path = require('path');

const REGULAR_FILE = path.join(__dirname, '../public/data/questions.json');
const PDF_FILE = path.join(__dirname, '../public/data/pdf-questions.json');
const SRC_PDF_FILE = path.join(__dirname, '../src/data/pdf-questions.json');

// Load questions
let regularQuestions = JSON.parse(fs.readFileSync(REGULAR_FILE, 'utf8'));
let pdfQuestions = JSON.parse(fs.readFileSync(PDF_FILE, 'utf8'));

console.log('=== QUESTION AUDIT & CLEANUP ===\n');
console.log(`Starting with: ${regularQuestions.length} regular + ${pdfQuestions.length} PDF = ${regularQuestions.length + pdfQuestions.length} total\n`);

const issues = {
  duplicates: [],
  signatures: [],
  noAnswer: [],
  malformed: [],
  garbage: []
};

// Normalize text for comparison
function normalizeForComparison(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 150);
}

// Clean answer text by removing signatures and garbage
function cleanAnswerText(answer) {
  if (!answer) return answer;
  
  // Remove common signature patterns
  let cleaned = answer
    // Remove trailing usernames/signatures (common patterns from PDF extraction)
    .replace(/\s+(jasonsmith|sghaha|[a-z]{5,}ss)\s*$/i, '')
    // Remove trailing random characters
    .replace(/\s+[a-z]{2,8}\s*$/i, (match) => {
      // Only remove if it looks like garbage (not a real word)
      const word = match.trim().toLowerCase();
      const commonEndings = ['the', 'and', 'for', 'are', 'was', 'not', 'but', 'can', 'has', 'had', 'you', 'all', 'any', 'use', 'set', 'get', 'new', 'add', 'key', 'api', 'app', 'url', 'uri', 'sas', 'dns', 'etc', 'via', 'ids'];
      if (commonEndings.includes(word) || word.length > 8) return match;
      // Check if it's likely garbage
      const vowels = (word.match(/[aeiou]/g) || []).length;
      if (vowels === 0 && word.length > 2) return ''; // No vowels = likely garbage
      return match;
    })
    .trim();
  
  return cleaned;
}

// Check if question is malformed
function isMalformed(q) {
  if (!q.question || q.question.trim().length < 20) return 'Question too short';
  if (!q.options || q.options.length < 2) return 'Too few options';
  if (!q.answerIndexes || q.answerIndexes.length === 0) return 'No answer specified';
  if (q.answerIndexes.some(idx => idx >= q.options.length || idx < 0)) return 'Invalid answer index';
  return null;
}

// Find duplicates
console.log('1. Finding duplicates...');
const allQuestions = [...regularQuestions, ...pdfQuestions];
const seenQuestions = new Map();
const duplicateIds = new Set();

allQuestions.forEach((q, idx) => {
  const key = normalizeForComparison(q.question);
  if (seenQuestions.has(key)) {
    const original = seenQuestions.get(key);
    issues.duplicates.push({
      originalId: original.id,
      duplicateId: q.id,
      question: q.question.substring(0, 80)
    });
    duplicateIds.add(q.id);
  } else {
    seenQuestions.set(key, q);
  }
});
console.log(`   Found ${issues.duplicates.length} duplicates`);

// Find questions with signature garbage
console.log('2. Finding questions with garbage/signatures...');
const garbagePatterns = [
  /jasonsmith/i,
  /sghaha/i,
  /\s[a-z]{4,8}ss\s*$/i,  // trailing "xxxss" pattern
];

allQuestions.forEach(q => {
  const answer = q.answer || '';
  for (const pattern of garbagePatterns) {
    if (pattern.test(answer)) {
      issues.signatures.push({
        id: q.id,
        pattern: pattern.toString(),
        answer: answer.substring(Math.max(0, answer.length - 60))
      });
      break;
    }
  }
});
console.log(`   Found ${issues.signatures.length} questions with garbage text`);

// Find questions with no answers
console.log('3. Finding questions with no answers...');
allQuestions.forEach(q => {
  if (!q.answerIndexes || q.answerIndexes.length === 0) {
    issues.noAnswer.push({
      id: q.id,
      question: q.question?.substring(0, 80)
    });
  }
});
console.log(`   Found ${issues.noAnswer.length} questions with no answer`);

// Find malformed questions
console.log('4. Finding malformed questions...');
allQuestions.forEach(q => {
  const malformReason = isMalformed(q);
  if (malformReason && !issues.noAnswer.find(x => x.id === q.id)) {
    issues.malformed.push({
      id: q.id,
      reason: malformReason,
      question: q.question?.substring(0, 80)
    });
  }
});
console.log(`   Found ${issues.malformed.length} malformed questions`);

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Duplicates: ${issues.duplicates.length}`);
console.log(`Garbage/signatures: ${issues.signatures.length}`);
console.log(`No answer: ${issues.noAnswer.length}`);
console.log(`Malformed: ${issues.malformed.length}`);

// Clean up
console.log('\n=== CLEANING UP ===');

// Remove duplicates from both arrays
const beforeRegular = regularQuestions.length;
const beforePdf = pdfQuestions.length;

regularQuestions = regularQuestions.filter(q => !duplicateIds.has(q.id));
pdfQuestions = pdfQuestions.filter(q => !duplicateIds.has(q.id));

console.log(`Removed ${beforeRegular - regularQuestions.length} duplicate regular questions`);
console.log(`Removed ${beforePdf - pdfQuestions.length} duplicate PDF questions`);

// Clean answer text (remove garbage)
let cleanedCount = 0;
[...regularQuestions, ...pdfQuestions].forEach(q => {
  if (q.answer) {
    const cleaned = cleanAnswerText(q.answer);
    if (cleaned !== q.answer) {
      q.answer = cleaned;
      cleanedCount++;
    }
  }
});
console.log(`Cleaned garbage from ${cleanedCount} answer texts`);

// Remove questions with no answers (these are incomplete)
const noAnswerIds = new Set(issues.noAnswer.map(x => x.id));
const beforeNoAnsRegular = regularQuestions.length;
const beforeNoAnsPdf = pdfQuestions.length;

regularQuestions = regularQuestions.filter(q => !noAnswerIds.has(q.id));
pdfQuestions = pdfQuestions.filter(q => !noAnswerIds.has(q.id));

console.log(`Removed ${beforeNoAnsRegular - regularQuestions.length} regular questions with no answer`);
console.log(`Removed ${beforeNoAnsPdf - pdfQuestions.length} PDF questions with no answer`);

// Final counts
console.log('\n=== FINAL COUNTS ===');
console.log(`Regular questions: ${regularQuestions.length}`);
console.log(`PDF questions: ${pdfQuestions.length}`);
console.log(`Total: ${regularQuestions.length + pdfQuestions.length}`);

// Save cleaned files
console.log('\n=== SAVING ===');
fs.writeFileSync(REGULAR_FILE, JSON.stringify(regularQuestions, null, 2));
console.log(`Saved ${REGULAR_FILE}`);

fs.writeFileSync(PDF_FILE, JSON.stringify(pdfQuestions, null, 2));
fs.writeFileSync(SRC_PDF_FILE, JSON.stringify(pdfQuestions, null, 2));
console.log(`Saved ${PDF_FILE}`);

// Output detailed report
console.log('\n=== DETAILED ISSUES ===');
if (issues.duplicates.length > 0) {
  console.log('\nDuplicates removed (showing first 10):');
  issues.duplicates.slice(0, 10).forEach(d => {
    console.log(`  - ${d.question}...`);
  });
}

if (issues.signatures.length > 0) {
  console.log('\nGarbage text cleaned:');
  issues.signatures.forEach(s => {
    console.log(`  - ...${s.answer}`);
  });
}

console.log('\n✅ Cleanup complete!');

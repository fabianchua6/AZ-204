const fs = require('fs');
const path = require('path');

// Load questions
const regularPath = path.join(__dirname, '../public/data/questions.json');
const pdfPath = path.join(__dirname, '../public/data/pdf-questions.json');

let regularQ = JSON.parse(fs.readFileSync(regularPath, 'utf8'));
let pdfQ = JSON.parse(fs.readFileSync(pdfPath, 'utf8'));

console.log('=== QUESTION CLEANUP SCRIPT ===\n');
console.log('Initial counts:');
console.log('  Regular questions:', regularQ.length);
console.log('  PDF questions:', pdfQ.length);

// Track changes
let removedCount = 0;
let fixedCount = 0;
const removed = [];

// 1. Remove garbage patterns from answers
const garbageInAnswer = [
  /\s+FeriAZ\s+\d+\s+month.*ago/gi,  // "FeriAZ 1 month, 2 weeks ago"
  /\s+jasonsmith\w*/gi,              // "jasonsmithss" etc
  /\s+sghaha\w*/gi,                  // "sghaha" 
  /\s{2,}/g,                         // Multiple spaces
];

function cleanAnswer(answer) {
  if (!answer) return answer;
  let cleaned = answer;
  for (const pattern of garbageInAnswer) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned.trim();
}

// 2. Questions to remove entirely (broken/irrelevant)
function shouldRemove(q) {
  // Very short answers that are likely broken
  if (q.answer && q.answer.trim().length < 5 && !/^\d+/.test(q.answer)) {
    return 'Answer too short: "' + q.answer + '"';
  }
  
  // Answer is just a letter
  if (q.answer && /^[A-D]\.?$/i.test(q.answer.trim())) {
    return 'Answer is just a letter';
  }
  
  // No correct answer indexes
  if (!q.answerIndexes || q.answerIndexes.length === 0) {
    return 'No answer indexes';
  }
  
  // Answer index out of range
  if (q.answerIndexes.some(i => i >= q.options.length || i < 0)) {
    return 'Answer index out of range';
  }
  
  // Question text is too short
  if (q.question.length < 20) {
    return 'Question too short';
  }
  
  return null;
}

// 3. Find and remove duplicates (keep first occurrence)
function removeDuplicates(questions) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 200);
  const seen = new Map();
  const unique = [];
  let dupCount = 0;
  
  for (const q of questions) {
    const key = normalize(q.question);
    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(q);
    } else {
      dupCount++;
      removed.push({ reason: 'Duplicate', text: q.question.slice(0, 60) });
    }
  }
  
  return { unique, dupCount };
}

// Process regular questions
console.log('\n--- Processing Regular Questions ---');
regularQ = regularQ.map(q => {
  const originalAnswer = q.answer;
  q.answer = cleanAnswer(q.answer);
  if (q.answer !== originalAnswer) {
    fixedCount++;
    console.log('  Fixed answer:', q.question.slice(0, 50) + '...');
  }
  return q;
}).filter(q => {
  const removeReason = shouldRemove(q);
  if (removeReason) {
    removedCount++;
    removed.push({ reason: removeReason, text: q.question.slice(0, 60) });
    console.log('  Removed:', removeReason, '-', q.question.slice(0, 40) + '...');
    return false;
  }
  return true;
});

// Process PDF questions
console.log('\n--- Processing PDF Questions ---');
pdfQ = pdfQ.map(q => {
  const originalAnswer = q.answer;
  q.answer = cleanAnswer(q.answer);
  if (q.answer !== originalAnswer) {
    fixedCount++;
    console.log('  Fixed answer:', q.question.slice(0, 50) + '...');
  }
  return q;
}).filter(q => {
  const removeReason = shouldRemove(q);
  if (removeReason) {
    removedCount++;
    removed.push({ reason: removeReason, text: q.question.slice(0, 60) });
    console.log('  Removed:', removeReason, '-', q.question.slice(0, 40) + '...');
    return false;
  }
  return true;
});

// Remove duplicates within each set
console.log('\n--- Removing Duplicates ---');
const regularResult = removeDuplicates(regularQ);
const pdfResult = removeDuplicates(pdfQ);
regularQ = regularResult.unique;
pdfQ = pdfResult.unique;

// Check for cross-duplicates (PDF questions that exist in regular)
console.log('\n--- Checking Cross-Duplicates ---');
const regularNormalized = new Set(regularQ.map(q => q.question.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 200)));
const originalPdfCount = pdfQ.length;
pdfQ = pdfQ.filter(q => {
  const key = q.question.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 200);
  if (regularNormalized.has(key)) {
    removed.push({ reason: 'Cross-duplicate with regular', text: q.question.slice(0, 60) });
    return false;
  }
  return true;
});
const crossDups = originalPdfCount - pdfQ.length;

// Summary
console.log('\n=== CLEANUP SUMMARY ===');
console.log('Fixed answers:', fixedCount);
console.log('Removed (broken):', removedCount);
console.log('Removed (duplicates in regular):', regularResult.dupCount);
console.log('Removed (duplicates in PDF):', pdfResult.dupCount);
console.log('Removed (cross-duplicates):', crossDups);
console.log('\nFinal counts:');
console.log('  Regular questions:', regularQ.length);
console.log('  PDF questions:', pdfQ.length);
console.log('  TOTAL:', regularQ.length + pdfQ.length);

// Save cleaned files
fs.writeFileSync(regularPath, JSON.stringify(regularQ, null, 2));
fs.writeFileSync(path.join(__dirname, '../src/data/questions.json'), JSON.stringify(regularQ, null, 2));
console.log('\n✅ Saved cleaned regular questions');

fs.writeFileSync(pdfPath, JSON.stringify(pdfQ, null, 2));
fs.writeFileSync(path.join(__dirname, '../src/data/pdf-questions.json'), JSON.stringify(pdfQ, null, 2));
console.log('✅ Saved cleaned PDF questions');

// Show removed questions
if (removed.length > 0) {
  console.log('\n--- Removed Questions Detail ---');
  removed.forEach(r => console.log(`  [${r.reason}] ${r.text}...`));
}

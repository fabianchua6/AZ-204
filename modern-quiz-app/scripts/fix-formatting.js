#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const questionsDir = './content/questions';

// Get all question files
const files = fs
  .readdirSync(questionsDir)
  .filter(file => file.endsWith('.md'))
  .map(file => path.join(questionsDir, file));

console.log('🔧 Fixing formatting issues...\n');

let totalFixes = 0;

files.forEach(filePath => {
  const fileName = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixes = 0;

  // Fix empty Answer: lines (add a line break after Answer: when it's followed by empty line)
  const beforeAnswerFix = content.length;
  content = content.replace(/Answer:\s*\n\n/g, 'Answer:\n\n');
  if (content.length !== beforeAnswerFix) {
    fixes++;
  }

  // Fix triple or more newlines to double newlines
  const beforeNewlineFix = content.length;
  content = content.replace(/\n{3,}/g, '\n\n');
  if (content.length !== beforeNewlineFix) {
    fixes++;
  }

  // Fix "Questions:" to "Question:"
  const beforeQuestionFix = content.length;
  content = content.replace(/^Questions:/gm, 'Question:');
  if (content.length !== beforeQuestionFix) {
    fixes++;
  }

  // Write back if changes were made
  if (fixes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${fileName} (${fixes} formatting issues)`);
    totalFixes += fixes;
  }
});

console.log(`\n🎉 Fixed ${totalFixes} formatting issues across all files.`);

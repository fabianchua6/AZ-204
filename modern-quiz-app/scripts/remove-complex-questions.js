#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const questionsDir = './content/questions';

// Get all question files
const files = fs
  .readdirSync(questionsDir)
  .filter(file => file.endsWith('.md'))
  .map(file => path.join(questionsDir, file));

console.log('🔍 Finding questions with too many options...\n');

let totalRemoved = 0;

files.forEach(filePath => {
  const fileName = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Split into questions
  const sections = content.split(/(?=^Question:)/gm);
  let modified = false;

  // Filter out questions with too many options
  const filteredSections = sections.filter(section => {
    if (!section.trim().startsWith('Question:')) {
      return true; // Keep non-question sections (headers, etc.)
    }

    // Count answer options (lines starting with - [ ] or - [x])
    const answerLines = section.match(/^- \[[ x]\]/gm) || [];
    const optionCount = answerLines.length;

    if (optionCount > 7) {
      console.log(
        `❌ Removing question with ${optionCount} options from ${fileName}`
      );
      console.log(
        `   Preview: ${section.substring(0, 100).replace(/\n/g, ' ')}...`
      );
      totalRemoved++;
      modified = true;
      return false; // Remove this question
    }

    return true; // Keep this question
  });

  if (modified) {
    const newContent = filteredSections.join('');
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated ${fileName}\n`);
  }
});

console.log(`🎉 Removed ${totalRemoved} questions with too many options.`);

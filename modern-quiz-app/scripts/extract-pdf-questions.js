#!/usr/bin/env node

/**
 * PDF Question Extractor for AZ-204 Quiz App
 * 
 * Extracts questions from PDF files and converts them to the quiz format.
 * Handles multiple PDF formats and deduplicates against existing questions.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFParse } = require('pdf-parse');
const { TOPIC_MAPPING } = require('./topic-mapping');

// Configuration
const PDF_DIR = path.join(__dirname, '../pdf_qns');
const OUTPUT_FILE = path.join(__dirname, '../src/data/pdf-questions.json');
const EXISTING_QUESTIONS_FILE = path.join(__dirname, '../src/data/questions.json');

// PDF files to process (in order)
const PDF_FILES = [
  'AZ204 - QN 001 - 100.pdf',
  'AZ204 - QN 101 - 200.pdf',
  'AZ204 - QN 201 - 300.pdf',
  'AZ204 - QN 301 - 402.pdf',
];

/**
 * Clean text by removing PDF artifacts and fixing common issues
 */
function cleanText(text) {
  if (!text) return text;
  return text
    // Remove null characters (common PDF extraction artifact)
    .replace(/\u0000/g, 'fi')  // Common ligature issue
    .replace(/\ufffd/g, '')    // Replacement character
    // Fix common OCR/PDF issues
    .replace(/con\s*gur/gi, 'configur')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate unique question ID from content
 */
function generateQuestionId(questionText, options, answerIndexes) {
  const normalizedQuestion = questionText.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedOptions = options.map(o => o.toLowerCase().trim()).sort().join('|');
  const data = `${normalizedQuestion}::${normalizedOptions}::${answerIndexes.sort().join(',')}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Normalize text for comparison (used in deduplication)
 */
function normalizeForComparison(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Map topic to standard categories
 */
function mapTopic(originalTopic) {
  if (!originalTopic) return 'Azure';
  
  // Try direct mapping first
  if (TOPIC_MAPPING[originalTopic]) {
    return TOPIC_MAPPING[originalTopic];
  }
  
  // Try partial matching
  const lowerTopic = originalTopic.toLowerCase();
  for (const [key, value] of Object.entries(TOPIC_MAPPING)) {
    if (lowerTopic.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTopic)) {
      return value;
    }
  }
  
  // Keyword-based mapping
  const keywordMap = {
    'function': 'Functions',
    'cosmos': 'Cosmos DB',
    'container': 'Containers',
    'kubernetes': 'Containers',
    'aks': 'Containers',
    'docker': 'Docker',
    'app service': 'App Service',
    'web app': 'App Service',
    'blob': 'Blob Storage',
    'storage': 'Blob Storage',
    'key vault': 'Key Vault',
    'keyvault': 'Key Vault',
    'api management': 'API Management',
    'apim': 'API Management',
    'event grid': 'Event Grid',
    'event hub': 'Event Hubs',
    'service bus': 'Service Bus',
    'queue': 'Message Queues',
    'identity': 'Managed Identities',
    'managed identity': 'Managed Identities',
    'entra': 'Entra ID',
    'azure ad': 'Entra ID',
    'active directory': 'Entra ID',
    'monitor': 'Monitor',
    'application insights': 'Application Insights',
    'graph': 'Graph',
    'cli': 'AZ CLI',
  };
  
  for (const [keyword, topic] of Object.entries(keywordMap)) {
    if (lowerTopic.includes(keyword)) {
      return topic;
    }
  }
  
  return 'Azure';
}

/**
 * Extract questions from PDF text using pattern matching
 * Format: ExamTopics-style with "Question #Y" headers
 */
function extractQuestionsFromText(text, startingNumber = 1) {
  const questions = [];
  
  // Pattern: "Question #Y" (with optional Topic prefix)
  const questionPattern = /(?:Topic\s*\d+\s*)?Question\s*#(\d+)/gi;
  
  // Find all question markers
  const markers = [];
  let match;
  while ((match = questionPattern.exec(text)) !== null) {
    markers.push({
      index: match.index,
      number: parseInt(match[1]),
      fullMatch: match[0]
    });
  }
  
  console.log(`  Found ${markers.length} question markers`);
  
  // If we found markers, split by them
  if (markers.length > 0) {
    for (let i = 0; i < markers.length; i++) {
      const start = markers[i].index + markers[i].fullMatch.length;
      const end = i < markers.length - 1 ? markers[i + 1].index : text.length;
      let block = text.substring(start, end);
      
      // Clean up the block - remove page headers, comments, voting sections
      block = cleanQuestionBlock(block);
      
      if (block.length > 50) {
        const question = parseExamTopicsQuestion(block, markers[i].number);
        if (question) {
          questions.push(question);
        }
      }
    }
  }
  
  return questions;
}

/**
 * Clean up a question block by removing noise
 */
function cleanQuestionBlock(block) {
  // Remove page headers (date patterns, URLs, page numbers)
  block = block.replace(/\d{2}\/\d{2}\/\d{4},?\s*\d{2}:\d{2}[^\n]*/g, '');
  block = block.replace(/https?:\/\/[^\s\n]+/g, '');
  block = block.replace(/\d+\/\d+\s*$/gm, '');
  
  // Remove ExamTopics specific noise
  block = block.replace(/- Expert Veried[^\n]*/gi, '');
  block = block.replace(/Custom View Settings/gi, '');
  block = block.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '');
  
  // Remove community discussion sections (starts with username patterns)
  // These typically come after "Community vote distribution" or after the explanation
  const discussionStart = block.search(/(?:Community vote distribution|upvoted \d+ times|Highly Voted|Most Recent)/i);
  if (discussionStart > 0) {
    block = block.substring(0, discussionStart);
  }
  
  return block.trim();
}

/**
 * Parse an ExamTopics-style question block
 */
function parseExamTopicsQuestion(block, questionNumber) {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l);
  
  if (lines.length < 3) return null;
  
  const question = {
    question: '',
    options: [],
    answerIndexes: [],
    answer: '',
    topic: 'Azure',
    hasCode: false,
    isPdf: true,
    pdfQuestionNumber: questionNumber,
  };
  
  let state = 'question';
  let questionLines = [];
  let currentOption = '';
  let currentOptionLetter = '';
  let explanationLines = [];
  let waitingForAnswer = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty or noise lines
    if (!line || line.match(/^(AZ-204 Exam|ExamTopics|Page \d+)/i)) {
      continue;
    }
    
    // If we're waiting for an answer after "Correct Answer:" line
    if (waitingForAnswer) {
      const answerLetters = line.match(/^([A-E](?:[,\s]+[A-E])*)$/i);
      if (answerLetters) {
        const answers = answerLetters[1].toUpperCase().match(/[A-E]/g) || [];
        question.answerIndexes = answers.map(a => a.charCodeAt(0) - 65);
        waitingForAnswer = false;
        state = 'explanation';
        continue;
      }
      waitingForAnswer = false;
    }
    
    // Detect topic line (usually at start)
    if (state === 'question' && i < 3) {
      const topicMatch = line.match(/^Topic\s*\d+\s*[-–]\s*(.+)/i);
      if (topicMatch) {
        question.topic = mapTopic(topicMatch[1].trim());
        continue;
      }
    }
    
    // Detect "Correct Answer:" line - answer may be on same line or next line
    if (line.match(/^(?:Correct\s*)?Answer[s]?:?\s*$/i)) {
      // Save any pending option
      if (currentOption && currentOptionLetter) {
        question.options.push(currentOption.trim());
        currentOption = '';
        currentOptionLetter = '';
      }
      waitingForAnswer = true;
      continue;
    }
    
    // Detect correct answer line with answer on same line
    const answerMatch = line.match(/^(?:Correct\s*)?Answer[s]?:?\s*([A-E](?:[,\s]+[A-E])*)/i);
    if (answerMatch) {
      // Save any pending option
      if (currentOption && currentOptionLetter) {
        question.options.push(currentOption.trim());
      }
      
      const answers = answerMatch[1].toUpperCase().match(/[A-E]/g) || [];
      question.answerIndexes = answers.map(a => a.charCodeAt(0) - 65);
      state = 'explanation';
      continue;
    }
    
    // Detect standalone letter answer after options section
    if (state === 'option' && line.match(/^[A-E]$/)) {
      // Save any pending option first
      if (currentOption && currentOptionLetter) {
        question.options.push(currentOption.trim());
      }
      question.answerIndexes = [line.charCodeAt(0) - 65];
      state = 'explanation';
      continue;
    }
    
    // Detect explanation/reference sections
    if (line.match(/^(?:Explanation|Rationale|Reference|Box \d+):/i)) {
      state = 'explanation';
      const explanationStart = line.replace(/^(?:Explanation|Rationale|Reference|Box \d+):\s*/i, '');
      if (explanationStart) explanationLines.push(explanationStart);
      continue;
    }
    
    // Detect option lines (A., B., C., D., E. or A), B), etc.)
    const optionMatch = line.match(/^([A-E])[.)]\s*(.*)$/);
    if (optionMatch) {
      // Save previous option if exists
      if (currentOption && currentOptionLetter) {
        question.options.push(currentOption.trim());
      }
      
      state = 'option';
      currentOptionLetter = optionMatch[1];
      currentOption = optionMatch[2];
      continue;
    }
    
    // Continue building current section
    if (state === 'question') {
      // Skip lines that look like leftover headers
      if (!line.match(/^\d+\/\d+$/) && !line.match(/^Topic \d+$/i)) {
        questionLines.push(line);
      }
    } else if (state === 'option') {
      currentOption += ' ' + line;
    } else if (state === 'explanation') {
      // Stop at discussion/voting sections
      if (line.match(/^(upvoted|Highly Voted|Most Recent|Selected Answer)/i)) {
        break;
      }
      explanationLines.push(line);
    }
  }
  
  // Save last option if not saved
  if (currentOption && currentOptionLetter && state === 'option') {
    question.options.push(currentOption.trim());
  }
  
  // Build question text and clean up PDF artifacts
  question.question = cleanText(questionLines.join('\n').trim());
  
  // Build explanation/answer
  question.answer = cleanText(explanationLines.join('\n').trim());
  
  // Clean options too
  question.options = question.options.map(opt => cleanText(opt));
  
  // Detect if question has code
  question.hasCode = question.question.includes('```') || 
                     question.question.includes('az ') ||
                     question.question.includes('kubectl') ||
                     /\{[\s\S]*\}/.test(question.question) ||
                     question.question.includes('public class') ||
                     question.question.includes('namespace ');
  
  // Validate question
  if (!question.question || question.options.length < 2) {
    return null;
  }
  
  // If no answer indexes found, skip
  if (question.answerIndexes.length === 0) {
    return null;
  }
  
  // Generate ID
  question.id = generateQuestionId(question.question, question.options, question.answerIndexes);
  
  return question;
}

/**
 * Process a single PDF file
 */
async function processPdf(filePath) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    
    console.log(`  Pages: ${result.total || 'unknown'}`);
    console.log(`  Text length: ${result.text.length} chars`);
    
    const questions = extractQuestionsFromText(result.text);
    console.log(`  Questions extracted: ${questions.length}`);
    
    await parser.destroy();
    return questions;
  } catch (error) {
    console.error(`  Error processing ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Load existing questions for deduplication
 */
function loadExistingQuestions() {
  const existing = new Set();
  
  // Load from questions.json
  try {
    const questionsData = JSON.parse(fs.readFileSync(EXISTING_QUESTIONS_FILE, 'utf-8'));
    for (const q of questionsData) {
      existing.add(normalizeForComparison(q.question));
    }
    console.log(`Loaded ${questionsData.length} existing questions from questions.json`);
  } catch (e) {
    console.log('No existing questions.json found');
  }
  
  return existing;
}

/**
 * Deduplicate questions
 */
function deduplicateQuestions(questions, existingNormalized) {
  const seen = new Set();
  const seenIds = new Set();
  const deduplicated = [];
  let duplicateCount = 0;
  let existingMatchCount = 0;
  
  for (const q of questions) {
    const normalized = normalizeForComparison(q.question);
    
    // Check against existing questions
    if (existingNormalized.has(normalized)) {
      existingMatchCount++;
      continue;
    }
    
    // Check within PDF questions
    if (seen.has(normalized) || seenIds.has(q.id)) {
      duplicateCount++;
      continue;
    }
    
    seen.add(normalized);
    seenIds.add(q.id);
    deduplicated.push(q);
  }
  
  console.log(`\nDeduplication results:`);
  console.log(`  Duplicates within PDFs: ${duplicateCount}`);
  console.log(`  Matches with existing questions: ${existingMatchCount}`);
  console.log(`  Unique new questions: ${deduplicated.length}`);
  
  return deduplicated;
}

/**
 * Main execution
 */
async function main() {
  console.log('=== AZ-204 PDF Question Extractor ===\n');
  
  // Check if PDF directory exists
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`PDF directory not found: ${PDF_DIR}`);
    process.exit(1);
  }
  
  // Load existing questions for deduplication
  const existingNormalized = loadExistingQuestions();
  
  // Process all PDFs
  let allQuestions = [];
  
  for (const pdfFile of PDF_FILES) {
    const filePath = path.join(PDF_DIR, pdfFile);
    if (fs.existsSync(filePath)) {
      const questions = await processPdf(filePath);
      allQuestions = allQuestions.concat(questions);
    } else {
      console.log(`File not found: ${pdfFile}`);
    }
  }
  
  console.log(`\nTotal questions extracted: ${allQuestions.length}`);
  
  // Deduplicate
  const deduplicated = deduplicateQuestions(allQuestions, existingNormalized);
  
  // Topic distribution
  const topicCounts = {};
  for (const q of deduplicated) {
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  }
  
  console.log('\nTopic distribution:');
  for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${topic}: ${count}`);
  }
  
  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(deduplicated, null, 2));
  console.log(`\n✅ Saved ${deduplicated.length} questions to ${OUTPUT_FILE}`);
  
  // Also copy to public folder
  const publicPath = path.join(__dirname, '../public/data/pdf-questions.json');
  fs.writeFileSync(publicPath, JSON.stringify(deduplicated, null, 2));
  console.log(`✅ Copied to ${publicPath}`);
}

main().catch(console.error);

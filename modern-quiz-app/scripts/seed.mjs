// @ts-check
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} Question
 * @property {string} id - Unique identifier for the question.
 * @property {string} question - The question text.
 * @property {boolean} hasCode - Flag indicating if the question contains code.
 * @property {string[]} options - Array of options for the question.
 * @property {number[]} answerIndexes - Array of indexes indicating the correct answers.
 * @property {string} answer - The answer text.
 * @property {string} topic - The topic related to the question.
 */

/**
 * @typedef {Object} FileContent
 * @property {string} name
 * @property {string} content
 */

/**
 * Parses a text string containing Q&A items and returns an array of Question objects.
 * @param {string} name - The name of the Q&A items.
 * @param {string} text - The text string containing the Q&A items.
 * @returns {Question[]} An array of Question objects.
 */
const parseQuestionItems = (name, text) => {
  const lines = text.split('\n');
  /** @type {Question[]} */
  const questions = [];
  /** @type {string[]} */
  let currentQuestion = [];
  /** @type {string[]} */
  let currentOptions = [];
  /** @type {string[]} */
  let currentAnswer = [];
  /** @type {number[]} */
  let currentAnswerIndex = [];
  /** @type {boolean} */
  let currentHasCode = false;

  /** @type {RegExp} */
  const optionRegex = /^\s*- \[(?:x|\s)\]\s/;

  /** @type {("question" | "option" | "answer" | null)} */
  let itemType = null;

  for (const line of lines) {
    if (line.startsWith('Question:')) {
      if (currentQuestion.length > 0) {
        const question = currentQuestion.join('\n').trimEnd();
        questions.push({
          id: createHash('sha256').update(question).digest('hex'),
          question,
          answer: currentAnswer.join('\n').trimEnd(),
          options: [...currentOptions],
          answerIndexes: currentAnswerIndex,
          hasCode: currentHasCode,
          topic: name,
        });
        currentQuestion = [];
        currentAnswer = [];
        currentOptions = [];
        currentAnswerIndex = [];
        currentHasCode = false;
        itemType = null;
      }

      currentQuestion = [line.replace('Question:', '').trimStart()];
      itemType = 'question';
    } else if (line.startsWith('Answer:')) {
      currentAnswer = [line.replace('Answer:', '').trimStart()];
      itemType = 'answer';
    } else if (line.trim() === '---') {
      if (itemType === 'question') currentQuestion.push(line);
    } else {
      if (optionRegex.test(line)) {
        currentOptions.push(line.replace(optionRegex, ''));
        itemType = 'option';
        if (/^(\s*- \[x\])/.test(line))
          currentAnswerIndex.push(currentOptions.length - 1);
      } else {
        switch (itemType) {
          case 'question':
            currentQuestion.push(line);
            if (/^```(cs|ps|Dockerfile|jsonc|tsql|bash|powershell|javascript|typescript|json|yaml|xml)$/i.test(line.trim()))
              currentHasCode = true;
            break;
          case 'answer':
            currentAnswer.push(line);
            break;
          case 'option':
            if (line.trim() !== '') currentOptions.push(line);
            break;
          default:
            break;
        }
      }
    }
  }

  // For the last question without trailing empty line
  if (currentQuestion.length > 0) {
    const question = currentQuestion.join('\n').trimEnd();
    if (currentOptions.length > 0 && currentAnswerIndex.length === 0)
      throw new Error(`Question '${question}' has missing answer`);
    questions.push({
      id: createHash('sha256').update(question).digest('hex'),
      question,
      answer: currentAnswer.join('\n').trimEnd(),
      options: [...currentOptions],
      answerIndexes: currentAnswerIndex,
      hasCode: currentHasCode,
      topic: name,
    });
  }

  return questions;
};

/**
 * Loads the content of all markdown files from multiple possible directories.
 * @async
 * @returns {Promise<FileContent[]>} An array of FileContent objects.
 */
const loadContents = async () => {
  const possiblePaths = [
    path.join(__dirname, '..', 'content', 'questions'),
    path.join(__dirname, '..', '..', 'Questions'),
    path.join(__dirname, '..', 'Questions'),
  ];
  
  let questionsDir = null;
  
  // Find the first existing directory
  for (const dirPath of possiblePaths) {
    try {
      await fs.access(dirPath);
      questionsDir = dirPath;
      break;
    } catch {
      // Directory doesn't exist, try next
    }
  }
  
  if (!questionsDir) {
    throw new Error(`No questions directory found. Tried: ${possiblePaths.join(', ')}`);
  }
  
  console.log(`📁 Loading questions from: ${questionsDir}`);
  
  try {
    const fileNames = await fs.readdir(questionsDir);
    
    const filePromises = fileNames
      .filter(name => name.endsWith('.md') && name.toLowerCase() !== 'readme.md')
      .map(async (fileName) => {
        const filePath = path.join(questionsDir, fileName);
        const content = await fs.readFile(filePath, 'utf-8');
        const name = fileName.replace(/\.[^/.]+$/, '');
        return { name, content };
      });

    return await Promise.all(filePromises);
  } catch (error) {
    console.error('❌ Error loading question files:', error);
    return [];
  }
};

/**
 * Parses an array of files containing Q&A items, extracting topics and data.
 * @param {FileContent[]} files - The files to be parsed.
 * @returns {Object} An object containing topics and data.
 */
const parseQuestionFiles = (files) => {
  const topics = [];
  const data = [];

  for (const file of files) {
    try {
      const questions = parseQuestionItems(file.name, file.content);
      if (questions.length > 0) {
        topics.push(file.name);
        data.push(...questions);
        console.log(`✅ ${file.name}: ${questions.length} questions`);
      }
    } catch (error) {
      console.error(`❌ Error parsing ${file.name}:`, error.message);
    }
  }

  return { topics, data };
};

/**
 * Main function to seed the quiz data.
 */
const main = async () => {
  try {
    console.log('🌱 Seeding quiz data...\n');
    
    const files = await loadContents();
    
    if (files.length === 0) {
      throw new Error('No question files found to process');
    }
    
    const { topics, data } = parseQuestionFiles(files);
    
    console.log(`\n� Summary:`);
    console.log(`   Topics: ${topics.length}`);
    console.log(`   Questions: ${data.length}`);
    
    // Create data directories
    const publicDataDir = path.join(__dirname, '..', 'public', 'data');
    const srcDataDir = path.join(__dirname, '..', 'src', 'data');
    
    await fs.mkdir(publicDataDir, { recursive: true });
    await fs.mkdir(srcDataDir, { recursive: true });
    
    // Write to public for client-side access
    await fs.writeFile(
      path.join(publicDataDir, 'topics.json'),
      JSON.stringify(topics, null, 2)
    );
    
    await fs.writeFile(
      path.join(publicDataDir, 'questions.json'),
      JSON.stringify(data, null, 2)
    );
    
    // Write to src for server-side access (optional)
    await fs.writeFile(
      path.join(srcDataDir, 'topics.json'),
      JSON.stringify(topics, null, 2)
    );
    
    await fs.writeFile(
      path.join(srcDataDir, 'questions.json'),
      JSON.stringify(data, null, 2)
    );
    
    console.log('\n✅ Quiz data seeded successfully!');
    console.log(`� Data written to: public/data/ and src/data/`);
    
  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    process.exit(1);
  }
};

main();

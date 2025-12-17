#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { TOPIC_MAPPING } = require('./topic-mapping');

// Function to generate a unique ID for a question
// Includes question text, options, and answer to handle question variants
// Uses JSON serialization for safe, collision-free hashing
function generateQuestionId(questionText, options, answer) {
  const data = { q: questionText, o: options, a: answer };
  const combinedText = JSON.stringify(data);
  return crypto.createHash('sha256').update(combinedText).digest('hex');
}

// Function to map PDF topics to existing categories
function mapTopic(originalTopic) {
  return TOPIC_MAPPING[originalTopic] || originalTopic;
}

// Function to parse the markdown content and extract questions
function parseQuestions(markdownContent) {
  const questions = [];
  const sections = markdownContent.split(/## \[PDF\] Question \d+/);

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section
      .trim()
      .split('\n')
      .filter(line => line.trim());

    if (lines.length === 0) continue;

    const question = {
      id: '',
      question: '',
      answer: '',
      options: [],
      answerIndexes: [],
      hasCode: false,
      topic: '',
      isPdf: true,
    };

    let currentState = 'topic';
    let currentText = '';
    let collectingAnswer = false;

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();

      // Extract topic
      if (line.startsWith('**Topic:') && currentState === 'topic') {
        const topicMatch = line.match(/\*\*Topic:\s*([^*]+)\*\*/);
        if (topicMatch) {
          const originalTopic = topicMatch[1].trim();
          question.topic = mapTopic(originalTopic); // Map to existing categories
          currentState = 'question';
        }
        continue;
      }

      // Start collecting question text
      if (
        currentState === 'question' &&
        !line.startsWith('**') &&
        !line.startsWith('A.')
      ) {
        if (currentText) {
          currentText += ' ' + line;
        } else {
          currentText = line;
        }
        continue;
      }

      // Found options, save question and start collecting options
      if (line.startsWith('A.') && currentState === 'question') {
        question.question = currentText.trim();
        currentState = 'options';

        // Add the first option
        const optionText = line.substring(2).trim();
        question.options.push(optionText);
        continue;
      }

      // Continue collecting options
      if (
        currentState === 'options' &&
        (line.startsWith('B.') ||
          line.startsWith('C.') ||
          line.startsWith('D.') ||
          line.startsWith('E.'))
      ) {
        const optionText = line.substring(2).trim();
        question.options.push(optionText);
        continue;
      }

      // Found correct answer
      if (line.startsWith('**Correct Answer:')) {
        currentState = 'answer';
        const answerMatch = line.match(/\*\*Correct Answer:\s*([^*]+)\*\*/);
        if (answerMatch) {
          const answerText = answerMatch[1].trim();

          // Handle different answer formats
          if (answerText.includes(',')) {
            // Multiple answers like "D, E"
            const answerLetters = answerText
              .split(/[,\s]+/)
              .filter(a => a.match(/^[A-E]$/));
            question.answerIndexes = answerLetters.map(
              letter => letter.charCodeAt(0) - 65
            );
          } else if (answerText.match(/^[A-E]$/)) {
            // Single letter answer
            question.answerIndexes = [answerText.charCodeAt(0) - 65];
          } else if (answerText.match(/^[A-E]\./)) {
            // Answer with period like "A."
            question.answerIndexes = [answerText.charAt(0).charCodeAt(0) - 65];
          }
        }
        continue;
      }

      // Start collecting explanation
      if (line.startsWith('**Explanation:**')) {
        collectingAnswer = true;
        currentText = '';
        continue;
      }

      // Collect explanation text
      if (
        collectingAnswer &&
        !line.startsWith('**Reference:**') &&
        !line.startsWith('---')
      ) {
        if (currentText) {
          currentText += ' ' + line;
        } else {
          currentText = line;
        }
        continue;
      }

      // End of explanation
      if (
        (line.startsWith('**Reference:**') || line.startsWith('---')) &&
        collectingAnswer
      ) {
        question.answer = currentText.trim();
        collectingAnswer = false;
        break;
      }
    }

    // If we were still collecting answer at the end
    if (collectingAnswer && currentText) {
      question.answer = currentText.trim();
    }

    // Check if question has code
    const questionAndAnswer = (
      question.question +
      ' ' +
      question.answer
    ).toLowerCase();
    question.hasCode =
      questionAndAnswer.includes('code') ||
      questionAndAnswer.includes('json') ||
      questionAndAnswer.includes('xml') ||
      questionAndAnswer.includes('yaml') ||
      questionAndAnswer.includes('sql') ||
      questionAndAnswer.includes('cli') ||
      questionAndAnswer.includes('powershell') ||
      questionAndAnswer.includes('script') ||
      questionAndAnswer.includes('az ') ||
      questionAndAnswer.includes('kubectl') ||
      questionAndAnswer.includes('docker');

    // Only add if we have a valid question with answer indexes
    if (question.question && question.topic && question.options.length > 0 && question.answerIndexes.length > 0) {
      // Generate ID after all data is collected, including answer for uniqueness
      question.id = generateQuestionId(question.question, question.options, question.answer);
      questions.push(question);
    } else if (question.question) {
      // Debug: log questions that were skipped
      console.warn(`⚠️  Skipped question (section ${i}): Missing ${!question.topic ? 'topic' : !question.options.length ? 'options' : 'answer indexes'}`);
      console.warn(`   Topic: ${question.topic || 'N/A'}`);
      console.warn(`   Question: ${question.question.substring(0, 80)}...`);
      console.warn(`   Options: ${question.options.length}`);
      console.warn(`   Answer indexes: ${question.answerIndexes.length}`);
    }
  }

  return questions;
}

// Main execution
async function main() {
  try {
    const pdfQuestionsPath = path.join(
      __dirname,
      '../../Questions/AZ204_PDF_Questions_Complete.md'
    );
    const outputPath = path.join(__dirname, '../src/data/pdf-questions.json');

    // Read the markdown file
    const markdownContent = fs.readFileSync(pdfQuestionsPath, 'utf-8');

    // Parse questions
    const questions = parseQuestions(markdownContent);

    console.log(`Parsed ${questions.length} PDF questions`);

    // Group by mapped topic for summary
    const topicCounts = {};
    questions.forEach(q => {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    });

    console.log('\nQuestions by mapped topic:');
    Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([topic, count]) => {
        console.log(`  ${topic}: ${count}`);
      });

    // Show mapping summary
    console.log('\nTopic mapping summary:');
    const mappingUsed = new Set();
    for (const [original, mapped] of Object.entries(TOPIC_MAPPING)) {
      const hasQuestions = questions.some(q => {
        const originalTopic = Object.keys(TOPIC_MAPPING).find(
          key => TOPIC_MAPPING[key] === q.topic && key === original
        );
        return originalTopic;
      });
      if (hasQuestions) {
        console.log(`  "${original}" → "${mapped}"`);
        mappingUsed.add(original);
      }
    }

    // Show a sample question for verification
    if (questions.length > 0) {
      console.log('\nSample question:');
      const sample = questions[0];
      console.log(`Topic: ${sample.topic}`);
      console.log(`Question: ${sample.question.substring(0, 100)}...`);
      console.log(`Options: ${sample.options.length}`);
      console.log(`Answer indexes: ${sample.answerIndexes}`);
      console.log(`Has code: ${sample.hasCode}`);
    }

    // Write to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
    console.log(`\nWritten ${questions.length} questions to ${outputPath}`);
  } catch (error) {
    console.error('Error processing PDF questions:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

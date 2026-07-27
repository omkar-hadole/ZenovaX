const { validateCreateQuiz, validateEditQuiz, validateSubmitQuiz } = require('../utils/quizValidation');

let passed = 0;
let failed = 0;

const assert = (label, actual, expected) => {
  if (actual === expected) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertContains = (label, actual, expectedSubstring) => {
  if (typeof actual === 'string' && actual.includes(expectedSubstring)) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label} — expected "${actual}" to contain "${expectedSubstring}"`);
  }
};

const validQuiz = {
  sessionId: '00000000-0000-0000-0000-000000000001',
  title: 'Test Quiz',
  description: 'A test quiz',
  duration: 30,
  totalMarks: 10,
  passingMarks: 5,
  questions: [
    {
      questionText: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      marks: 2
    },
    {
      questionText: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      marks: 3
    }
  ]
};

// ========================
// Validation Tests
// ========================

console.log('\n--- Create Quiz Validation ---');

// Valid quiz
{
  const result = validateCreateQuiz(validQuiz);
  assert('valid quiz passes', result.valid, true);
}

// Missing title
{
  const result = validateCreateQuiz({ ...validQuiz, title: '' });
  assert('missing title fails', result.valid, false);
  assertContains('missing title error', result.error, 'title');
}

// Missing sessionId
{
  const result = validateCreateQuiz({ ...validQuiz, sessionId: '' });
  assert('missing sessionId fails', result.valid, false);
  assertContains('missing sessionId error', result.error, 'sessionId');
}

// Missing questions
{
  const result = validateCreateQuiz({ ...validQuiz, questions: [] });
  assert('empty questions fails', result.valid, false);
  assertContains('empty questions error', result.error, 'questions');
}

// Too many questions
{
  const manyQuestions = Array.from({ length: 201 }, (_, i) => ({
    questionText: `Question ${i}`,
    options: ['A', 'B'],
    correctAnswer: 'A',
    marks: 1
  }));
  const result = validateCreateQuiz({ ...validQuiz, questions: manyQuestions });
  assert('too many questions fails', result.valid, false);
  assertContains('too many questions error', result.error, 'questions');
}

// Question with less than 2 options
{
  const result = validateCreateQuiz({
    ...validQuiz,
    questions: [{
      questionText: 'Test?',
      options: ['Only one'],
      correctAnswer: 'Only one',
      marks: 1
    }]
  });
  assert('less than 2 options fails', result.valid, false);
  assertContains('options error', result.error, 'options');
}

// Empty option
{
  const result = validateCreateQuiz({
    ...validQuiz,
    questions: [{
      questionText: 'Test?',
      options: ['Option A', ''],
      correctAnswer: 'Option A',
      marks: 1
    }]
  });
  assert('empty option string fails', result.valid, false);
  assertContains('empty option error', result.error, 'empty');
}

// Missing correctAnswer
{
  const result = validateCreateQuiz({
    ...validQuiz,
    questions: [{
      questionText: 'Test?',
      options: ['A', 'B'],
      correctAnswer: '',
      marks: 1
    }]
  });
  assert('missing correctAnswer fails', result.valid, false);
  assertContains('correctAnswer error', result.error, 'correctAnswer');
}

// Invalid sessionId (non-uuid)
{
  const result = validateCreateQuiz({ ...validQuiz, sessionId: 'not-a-uuid' });
  assert('invalid uuid fails', result.valid, false);
}

// Duration exceeding max
{
  const result = validateCreateQuiz({ ...validQuiz, duration: 9999 });
  assert('excessive duration fails', result.valid, false);
}

// Duration as null (untimed) — should pass
{
  const result = validateCreateQuiz({ ...validQuiz, duration: null });
  assert('null duration (untimed) passes', result.valid, true);
}

// Negative marks
{
  const result = validateCreateQuiz({
    ...validQuiz,
    questions: [{
      questionText: 'Test?',
      options: ['A', 'B'],
      correctAnswer: 'A',
      marks: -1
    }]
  });
  assert('negative marks fails', result.valid, false);
}

console.log('\n--- Edit Quiz Validation ---');

// Valid edit (partial)
{
  const result = validateEditQuiz({ title: 'Updated Title' });
  assert('partial edit passes', result.valid, true);
}

// Valid edit (full questions)
{
  const result = validateEditQuiz({
    title: 'Updated',
    questions: [
      { questionText: 'Q1', options: ['A', 'B'], correctAnswer: 'A', marks: 1 }
    ]
  });
  assert('full edit with questions passes', result.valid, true);
}

// Invalid edit (bad question)
{
  const result = validateEditQuiz({
    questions: [
      { questionText: '', options: [], correctAnswer: '', marks: 0 }
    ]
  });
  assert('invalid edit question fails', result.valid, false);
}

console.log('\n--- Submit Quiz Validation ---');

// Valid submit
{
  const result = validateSubmitQuiz({ answers: { q1: 'Answer' } });
  assert('valid submit passes', result.valid, true);
}

// Missing answers
{
  const result = validateSubmitQuiz({});
  assert('missing answers fails', result.valid, false);
  assertContains('answers required error', result.error, 'answers');
}

// Valid submit with startedAt
{
  const result = validateSubmitQuiz({
    answers: { q1: 'Answer' },
    startedAt: '2026-07-26T10:00:00.000Z'
  });
  assert('submit with startedAt passes', result.valid, true);
}

// ========================
// Scoring Logic Tests (simulating server-side logic)
// ========================

console.log('\n--- Scoring Logic ---');

function calculateScore(questions, answers, passingMarks) {
  let score = 0;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  questions.forEach(q => {
    if (answers[q.id] === q.correctAnswer) {
      score += q.marks;
    }
  });

  return { score, totalMarks, isPassed: score >= passingMarks };
}

// All correct
{
  const questions = [
    { id: 'q1', correctAnswer: '4', marks: 2 },
    { id: 'q2', correctAnswer: 'Paris', marks: 3 }
  ];
  const answers = { q1: '4', q2: 'Paris' };
  const result = calculateScore(questions, answers, 3);
  assert('all correct — score equals total', result.score, 5);
  assert('all correct — isPassed true', result.isPassed, true);
}

// All wrong
{
  const questions = [
    { id: 'q1', correctAnswer: '4', marks: 2 },
    { id: 'q2', correctAnswer: 'Paris', marks: 3 }
  ];
  const answers = { q1: '5', q2: 'London' };
  const result = calculateScore(questions, answers, 3);
  assert('all wrong — score is 0', result.score, 0);
  assert('all wrong — isPassed false', result.isPassed, false);
}

// Partial correct
{
  const questions = [
    { id: 'q1', correctAnswer: '4', marks: 2 },
    { id: 'q2', correctAnswer: 'Paris', marks: 3 }
  ];
  const answers = { q1: '4', q2: 'London' };
  const result = calculateScore(questions, answers, 3);
  assert('partial correct — score is 2', result.score, 2);
  assert('partial correct — isPassed false', result.isPassed, false);
}

// Exact passing marks
{
  const questions = [
    { id: 'q1', correctAnswer: '4', marks: 3 },
    { id: 'q2', correctAnswer: 'Paris', marks: 3 }
  ];
  const answers = { q1: '4', q2: 'London' };
  const result = calculateScore(questions, answers, 3);
  assert('exact passing marks — isPassed true', result.isPassed, true);
}

// Passing marks of 0 (everyone passes)
{
  const questions = [
    { id: 'q1', correctAnswer: '4', marks: 2 }
  ];
  const answers = { q1: 'wrong' };
  const result = calculateScore(questions, answers, 0);
  assert('passing marks 0 — isPassed true even if score 0', result.isPassed, true);
}

// Passing marks exceeding total marks (edge case)
{
  const questions = [
    { id: 'q1', correctAnswer: '4', marks: 2 }
  ];
  const answers = { q1: '4' };
  const result = calculateScore(questions, answers, 10);
  assert('passing marks > total — isPassed false even if all correct', result.isPassed, false);
}

// Unanswered question
{
  const questions = [
    { id: 'q1', correctAnswer: '4', marks: 2 },
    { id: 'q2', correctAnswer: 'Paris', marks: 3 }
  ];
  const answers = { q1: '4' };
  const result = calculateScore(questions, answers, 3);
  assert('unanswered question — score from answered only', result.score, 2);
  assert('unanswered question — isPassed false', result.isPassed, false);
}

// ========================
// Time Taken Logic Tests
// ========================

console.log('\n--- Time Taken Logic ---');

function calculateTimeTaken(startedAtStr, submittedAtStr) {
  if (!startedAtStr) return null;
  const startDate = new Date(startedAtStr);
  const submittedDate = new Date(submittedAtStr);
  if (isNaN(startDate.getTime()) || startDate >= submittedDate) return null;
  return Math.floor((submittedDate - startDate) / 1000);
}

{
  const taken = calculateTimeTaken('2026-07-26T10:00:00.000Z', '2026-07-26T10:05:30.000Z');
  assert('5m30s = 330 seconds', taken, 330);
}

{
  const taken = calculateTimeTaken('2026-07-26T10:00:00.000Z', '2026-07-26T10:00:00.000Z');
  assert('same time = null (start >= submit)', taken, null);
}

{
  const taken = calculateTimeTaken(null, '2026-07-26T10:00:00.000Z');
  assert('no startedAt = null', taken, null);
}

{
  const taken = calculateTimeTaken('invalid', '2026-07-26T10:00:00.000Z');
  assert('invalid startedAt = null', taken, null);
}

// ========================
// Summary
// ========================

console.log(`\n=== Quiz Tests: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);

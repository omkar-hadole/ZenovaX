import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  Loader2,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';

import { apiCall } from '../utils/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/common/ConfirmModal';
import { trackEvent } from '../utils/analytics';

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const parseOptions = (options) => {
  if (Array.isArray(options)) return options;

  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeTaken = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';

  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

/* -------------------------------------------------------------------------- */
/*                               Loading State                                */
/* -------------------------------------------------------------------------- */

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0D12] flex items-center justify-center px-6">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF0FF] dark:bg-[#171A2B] flex items-center justify-center mb-4">
          <Loader2 className="w-5 h-5 text-[#6264D9] animate-spin" />
        </div>

        <p className="text-sm font-semibold text-[#24262D] dark:text-white">
          Loading quiz
        </p>

        <p className="text-xs text-[#8A8F9C] mt-1">
          Preparing your questions...
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Error State                                 */
/* -------------------------------------------------------------------------- */

function ErrorScreen({ error, onBack }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0D12] flex items-center justify-center px-5">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#12151C] border border-[#E8E9EE] dark:border-[#252936] rounded-3xl p-8 shadow-[0_12px_40px_rgba(20,24,40,0.06)] text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-[-0.02em] text-[#202229] dark:text-white">
          Unable to start quiz
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#737885] dark:text-[#9297A5]">
          {error}
        </p>

        <button
          onClick={onBack}
          className="mt-7 w-full h-11 rounded-xl bg-[#202229] dark:bg-white text-white dark:text-[#15171C] text-sm font-semibold transition hover:opacity-90 active:scale-[0.99]"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Result Component                              */
/* -------------------------------------------------------------------------- */

function ResultScreen({ quiz, result, from, navigate }) {
  const answers = Array.isArray(result?.answers) ? result.answers : [];
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

  const correctCount = answers.filter((answer) => answer?.isCorrect).length;
  const totalQuestions = questions.length;

  const percentage =
    Number(result?.totalMarks) > 0
      ? Math.round((Number(result.score) / Number(result.totalMarks)) * 100)
      : 0;

  const passingMarks = result?.passingMarks > 0 ? result.passingMarks : Math.max(1, Math.round(Number(result.totalMarks) * 0.4));
  const isPassed = Number(result.score) >= passingMarks;

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0D12] text-[#202229] dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E7E8EC] dark:border-[#232731] bg-white/95 dark:bg-[#0F1117]/95 backdrop-blur-xl">
        <div className="max-w-[1240px] mx-auto h-[68px] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0">
            <button
              onClick={() => navigate(from)}
              className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-[#686D78] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D25] transition"
              aria-label="Go back"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>

            <div className="w-px h-6 bg-[#E6E7EA] dark:bg-[#2A2E39] mx-3 sm:mx-4" />

            <div className="min-w-0">
              <h1 className="font-semibold text-sm sm:text-[15px] truncate max-w-[160px] xs:max-w-[240px] sm:max-w-[500px]">
                {quiz?.title}
              </h1>

              {quiz?.session?.title && (
                <p className="text-[12px] text-[#9498A2] truncate mt-0.5">
                  {quiz.session.title}
                </p>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#737885] dark:text-[#9A9EAA]">
            <BookOpen className="w-4 h-4" />
            Quiz results
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Result Hero */}
        <section className="bg-white dark:bg-[#12151C] border border-[#E7E8EC] dark:border-[#252936] rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
              <div className="flex items-start gap-4 sm:gap-5">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-2xl flex items-center justify-center ${
                    isPassed
                      ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : 'bg-red-50 dark:bg-red-500/10'
                  }`}
                >
                  {isPassed ? (
                    <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isPassed
                        ? 'text-emerald-500 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10'
                        : 'text-red-500 bg-red-50 dark:text-red-300 dark:bg-red-500/10'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}

                    {isPassed ? 'Passed' : 'Not passed'}
                  </div>

                  <h2 className="mt-3 text-xl sm:text-3xl font-bold tracking-[-0.035em] leading-tight">
                    {percentage >= 90 ? 'Outstanding!' : percentage >= 70 ? 'Great work!' : percentage >= passingMarks ? 'Good effort!' : 'Keep practicing'}
                  </h2>

                  <p className="mt-2 text-sm sm:text-[15px] text-[#7C818D] dark:text-[#9297A5]">
                    You answered {correctCount} of {totalQuestions} questions
                    correctly.
                  </p>
                </div>
              </div>

              <div className="lg:hidden">
                <div className="flex items-center gap-2.5">
                  <span className="text-4xl sm:text-5xl font-bold tracking-[-0.06em]">
                    {percentage}
                  </span>
                  <span className="text-lg text-[#9A9EAA] font-medium">
                    %
                  </span>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-3">
                <span className="text-5xl sm:text-6xl font-bold tracking-[-0.06em]">
                  {percentage}
                </span>

                <span className="text-xl text-[#9A9EAA] font-medium mb-1">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#ECEDEF] dark:border-[#252936] grid grid-cols-2 md:grid-cols-4">
            <ResultStat
              label="Score"
              value={`${result?.score ?? 0}/${result?.totalMarks ?? 0}`}
            />

            <ResultStat
              label="Correct"
              value={`${correctCount}/${totalQuestions}`}
              mobileNoBorder
            />

            <ResultStat
              label="Passing marks"
              value={passingMarks}
            />

            <ResultStat
              label="Time taken"
              value={formatTimeTaken(result?.timeTaken)}
              last
            />
          </div>
        </section>

        {/* Review */}
        <section className="mt-6 bg-white dark:bg-[#12151C] border border-[#E7E8EC] dark:border-[#252936] rounded-3xl overflow-hidden">
          <div className="px-5 sm:px-7 py-5 border-b border-[#ECEDEF] dark:border-[#252936] flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[15px]">Answer review</h3>
              <p className="text-xs text-[#9297A3] mt-1">
                Review your responses and correct answers.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#777C87]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {correctCount} correct
            </div>
          </div>

          <div className="divide-y divide-[#ECEDEF] dark:divide-[#252936]">
            {questions.map((question, index) => {
              const answer = answers.find(
                (item) => item?.questionId === question.id
              );

              const isCorrect = Boolean(answer?.isCorrect);
              const options = parseOptions(question.options);

              return (
                <article
                  key={question.id}
                  className="p-4 sm:p-7 lg:p-8"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div
                      className={`hidden sm:flex w-8 h-8 rounded-xl flex-shrink-0 items-center justify-center ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isCorrect ? (
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <X className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#A0A4AE]">
                            Question {index + 1}
                          </p>

                          <h4 className="mt-2 text-[15px] sm:text-base leading-7 font-semibold text-[#2A2D34] dark:text-[#F2F3F5]">
                            {question.questionText}
                          </h4>
                        </div>

                        <span
                          className={`text-xs font-semibold ${
                            isCorrect
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-red-400'
                          }`}
                        >
                          {answer?.marksObtained ?? 0}/
                          {answer?.marks ?? question.marks} marks
                        </span>
                      </div>

                      <div className="mt-5 grid gap-2.5">
                        {options.map((option, optionIndex) => {
                          const isSelected =
                            option === answer?.selectedAnswer;

                          const isCorrectOption =
                            option === answer?.correctAnswer;

                          let optionClass =
                            'border-[#E6E8EC] dark:border-[#2A2E38] bg-white dark:bg-[#12151C]';

                          let letterClass =
                            'border-[#DADCE2] dark:border-[#363B47] text-[#8A8F99]';

                          let textClass =
                            'text-[#555A65] dark:text-[#B4B8C1]';

                          if (isCorrectOption) {
                            optionClass =
                              'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/[0.06]';

                            letterClass =
                              'border-emerald-400 bg-emerald-400 text-white';

                            textClass =
                              'text-emerald-600 dark:text-emerald-300 font-medium';
                          }

                          if (isSelected && !isCorrectOption) {
                            optionClass =
                              'border-red-300 dark:border-red-500/30 bg-red-50/60 dark:bg-red-500/[0.06]';

                            letterClass =
                              'border-red-400 bg-red-400 text-white';

                            textClass =
                              'text-red-500 dark:text-red-300 font-medium';
                          }

                          return (
                            <div
                              key={`${question.id}-${optionIndex}`}
                              className={`min-h-[52px] px-4 py-3 rounded-xl border flex items-center gap-3 ${optionClass}`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg border flex-shrink-0 flex items-center justify-center text-xs font-semibold ${letterClass}`}
                              >
                                {String.fromCharCode(65 + optionIndex)}
                              </div>

                              <span
                                className={`flex-1 text-sm leading-6 ${textClass}`}
                              >
                                {option}
                              </span>

                              {isCorrectOption && (
                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-500 dark:text-emerald-300">
                                  <Check className="w-3 h-3 sm:hidden" />
                                  <span className="sm:inline">Correct</span>
                                  <span className="hidden sm:inline">answer</span>
                                </span>
                              )}

                              {isSelected && !isCorrectOption && (
                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-red-500 dark:text-red-300">
                                  <X className="w-3 h-3 sm:hidden" />
                                  <span className="sm:inline">Your</span>
                                  <span className="hidden sm:inline">answer</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-11 px-6 rounded-xl border border-[#D7D9FA] text-[#7B74F1] text-sm font-semibold hover:bg-[#FAFAFF] transition flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4" />
            Go to top
          </button>
        </div>
      </main>
    </div>
  );
}

function ResultStat({ label, value, last = false, mobileNoBorder = false }) {
  return (
    <div
      className={`px-4 sm:px-7 py-5 ${
        !last
          ? `border-r border-[#ECEDEF] dark:border-[#252936] ${
              mobileNoBorder ? 'md:border-r' : ''
            }`
          : ''
      }`}
    >
      <p className="text-[11px] sm:text-xs font-medium text-[#9297A3]">
        {label}
      </p>

      <p className="mt-1.5 text-base sm:text-lg font-bold tracking-[-0.02em]">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const startedAt = useRef(null);
  const submitLock = useRef(false);

  // Always-fresh snapshot of answers so the autosubmit timer (which is set up in
  // an effect that only depends on timeLeft/result) never submits a stale set.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  });

  const from =
    new URLSearchParams(window.location.search).get('from') || '/dashboard';

  /* ------------------------------------------------------------------------ */
  /*                                Fetch Quiz                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiCall(`/quiz/${id}/attempt`);

        if (response.alreadyAttempted) {
          setQuiz(response.quiz);

          setResult({
            score: response.attempt.score,
            totalMarks: response.attempt.totalMarks,
            isPassed: response.attempt.isPassed,
            passingMarks: response.quiz.passingMarks,
            averageScore: response.attempt.averageScore ?? response.attempt.score,
            timeTaken: response.attempt.timeTaken,
            answers: response.attempt.answers || [],
          });

          return;
        }

        setQuiz(response.quiz);

        const initialAnswers = {};

        response.quiz.questions.forEach((question) => {
          initialAnswers[question.id] = '';
        });

        setAnswers(initialAnswers);

        startedAt.current = new Date().toISOString();

        if (response.quiz.duration) {
          setTimeLeft(Number(response.quiz.duration) * 60);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  /* ------------------------------------------------------------------------ */
  /*                                  Timer                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (result || timeLeft === null || timeLeft === undefined) return;

    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [timeLeft, result]);

  /* ------------------------------------------------------------------------ */
  /*                                Computed                                  */
  /* ------------------------------------------------------------------------ */

  const questions = quiz?.questions || [];
  const question = questions[currentQuestionIndex];

  const options = useMemo(
    () => parseOptions(question?.options),
    [question]
  );

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(
      (answer) => answer !== '' && answer !== null && answer !== undefined
    ).length;
  }, [answers]);

  const totalQuestions = questions.length;

  const progress =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const isLastQuestion =
    currentQuestionIndex === totalQuestions - 1;

  const unansweredCount = Math.max(
    0,
    totalQuestions - answeredCount
  );

  /* ------------------------------------------------------------------------ */
  /*                                Handlers                                  */
  /* ------------------------------------------------------------------------ */

  const handleOptionSelect = (questionId, option) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));
  };

  const handleSubmit = async (automatic = false) => {
    if (submitLock.current || submitting || result) return;

    submitLock.current = true;
    setSubmitting(true);

    try {
      const response = await apiCall(`/quiz/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: answersRef.current,
          startedAt: startedAt.current,
        }),
      });

      trackEvent('quiz_submitted', {
        quiz_id: id,
        score: response.result?.score,
        total_marks: response.result?.totalMarks,
      });

      setResult(response.result);
    } catch (err) {
      submitLock.current = false;
      setSubmitting(false);

      setToast({
        message:
          err?.message ||
          (automatic
            ? 'Time expired, but the quiz could not be submitted.'
            : 'Failed to submit quiz.'),
        type: 'error',
      });
    }
  };

  const goToQuestion = (index) => {
    if (index < 0 || index >= totalQuestions) return;
    setCurrentQuestionIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ------------------------------------------------------------------------ */
  /*                                  States                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  if (!quiz || !questions.length) {
    return (
      <ErrorScreen
        error="This quiz does not contain any questions."
        onBack={() => navigate(from)}
      />
    );
  }

  if (result) {
    return (
      <ResultScreen
        quiz={quiz}
        result={result}
        from={from}
        navigate={navigate}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                Quiz UI                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0D12] text-[#202229] dark:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F1117]/95 backdrop-blur-xl border-b border-[#E6E8EC] dark:border-[#232731]">
        <div className="max-w-[1280px] mx-auto h-[68px] px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Quiz information */}
          <div className="flex items-center min-w-0">
            <button
              onClick={() => navigate(from)}
              className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-[#6E737E] hover:text-[#202229] dark:hover:text-white hover:bg-[#F2F3F5] dark:hover:bg-[#1A1D25] transition"
              aria-label="Exit quiz"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>

            <div className="w-px h-6 bg-[#E5E7EB] dark:bg-[#292D37] mx-3 sm:mx-4" />

            <div className="min-w-0">
              <h1 className="text-sm sm:text-[15px] font-semibold tracking-[-0.01em] truncate max-w-[150px] xs:max-w-[220px] sm:max-w-[400px]">
                {quiz.title}
              </h1>

              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs text-[#969AA4]">
                {quiz.session?.title && (
                  <>
                    <span className="truncate max-w-[130px] sm:max-w-[260px]">
                      {quiz.session.title}
                    </span>

                    <span className="w-1 h-1 rounded-full bg-[#C5C8CF]" />
                  </>
                )}

                <span>
                  {answeredCount}/{totalQuestions} answered
                </span>
              </div>
            </div>
          </div>

          {/* Timer */}
          {timeLeft !== null && (
            <div
              className={`flex-shrink-0 h-10 px-3 sm:px-4 rounded-xl flex items-center gap-2 border transition ${
                timeLeft <= 60
                  ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                  : 'border-[#E3E5EA] dark:border-[#2A2E38] bg-[#FAFAFB] dark:bg-[#161920] text-[#454A54] dark:text-[#D7D9DE]'
              }`}
            >
              <Clock3
                className={`w-4 h-4 ${
                  timeLeft <= 60
                    ? 'text-red-500'
                    : 'text-[#777C88]'
                }`}
              />

              <span className="font-mono tabular-nums text-sm font-bold tracking-tight">
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Overall progress */}
        <div className="h-[3px] bg-[#F0F1F3] dark:bg-[#1B1E25]">
          <div
            className="h-full bg-[#C9C7F5] transition-[width] duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </header>

      {/* Mobile question navigator */}
      <div className="lg:hidden sticky top-[71px] z-30 bg-white/95 dark:bg-[#0F1117]/95 backdrop-blur-xl border-b border-[#E6E8EC] dark:border-[#232731] px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {questions.map((item, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isAnswered =
                answers[item.id] !== '' &&
                answers[item.id] !== null &&
                answers[item.id] !== undefined;

              return (
                <button
                  key={item.id}
                  onClick={() => goToQuestion(index)}
                  aria-label={`Go to question ${index + 1}`}
                  className={`flex-shrink-0 w-9 h-9 rounded-lg text-xs font-semibold border transition ${
                    isCurrent
                      ? 'bg-[#C9C7F5] border-[#C9C7F5] text-[#5a59b5]'
                      : isAnswered
                        ? 'bg-[#F4F4FF] dark:bg-[#6264D9]/10 border-[#D7D9FA] dark:border-[#6264D9]/25 text-[#7B74F1]'
                        : 'bg-white dark:bg-[#12151C] border-[#E2E4E8] dark:border-[#292D37] text-[#858A95]'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <span className="flex-shrink-0 text-[11px] font-semibold text-[#8A8F99] tabular-nums">
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Main layout */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 sm:py-7 lg:py-8">
        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:gap-8">
          {/* ---------------------------------------------------------------- */}
          {/*                         Desktop Sidebar                           */}
          {/* ---------------------------------------------------------------- */}

          <aside className="hidden lg:block">
            <div className="sticky top-[100px]">
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#999DA7]">
                  Questions
                </p>

                <p className="text-xs text-[#A2A6AF] mt-1">
                  Click a question to jump to it.
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((item, index) => {
                  const isCurrent =
                    index === currentQuestionIndex;

                  const isAnswered =
                    answers[item.id] !== '' &&
                    answers[item.id] !== null &&
                    answers[item.id] !== undefined;

                  return (
                    <button
                      key={item.id}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-lg text-xs font-semibold border transition ${
                        isCurrent
                          ? 'bg-[#C9C7F5] border-[#C9C7F5] text-[#5a59b5]'
                          : isAnswered
                            ? 'bg-[#F4F4FF] dark:bg-[#6264D9]/10 border-[#D7D9FA] dark:border-[#6264D9]/25 text-[#7B74F1]'
                            : 'bg-white dark:bg-[#12151C] border-[#E2E4E8] dark:border-[#292D37] text-[#858A95] hover:border-[#C9C7F5] hover:text-[#7B74F1]'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-[#E4E6EA] dark:border-[#242832] space-y-3">
                <Legend
                  className="bg-[#C9C7F5]"
                  label="Current"
                />

                <Legend
                  className="bg-[#F4F4FF] border border-[#D7D9FA] dark:border-[#6264D9]/30"
                  label="Answered"
                />

                <Legend
                  className="bg-white dark:bg-[#12151C] border border-[#DCDDDF] dark:border-[#30343E]"
                  label="Not answered"
                />
              </div>

              <div className="mt-6 rounded-2xl bg-white dark:bg-[#12151C] border border-[#E5E7EB] dark:border-[#272B35] p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8A8F99]">
                    Progress
                  </span>

                  <span className="font-semibold">
                    {answeredCount}/{totalQuestions}
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-[#EEEFF2] dark:bg-[#242832] mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#C9C7F5] transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ---------------------------------------------------------------- */}
          {/*                           Question Area                           */}
          {/* ---------------------------------------------------------------- */}

          <section className="min-w-0">
            <div className="bg-white dark:bg-[#12151C] border border-[#E5E7EB] dark:border-[#262A34] rounded-2xl sm:rounded-3xl shadow-[0_2px_12px_rgba(16,24,40,0.025)] overflow-hidden">
              {/* Question header */}
              <div className="px-5 sm:px-7 lg:px-9 pt-6 sm:pt-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] uppercase tracking-[0.13em] font-bold text-[#969AA4]">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <span className="w-1 h-1 bg-[#D0D2D7] rounded-full" />
                    <span className="text-xs text-[#A0A4AD]">
                      {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF8E8] text-[#9A7022]">
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">
                      {question.marks} {Number(question.marks) === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="px-5 sm:px-7 lg:px-9 pt-7 pb-8 sm:pb-10">
                <h2 className="max-w-[850px] text-xl sm:text-2xl lg:text-[26px] leading-[1.45] font-semibold tracking-[-0.025em] text-[#24262D] dark:text-[#F3F4F6]">
                  {question.questionText}
                </h2>


                {/* Options */}
                <div className="mt-7 sm:mt-8 grid gap-3">
                  {options.map((option, index) => {
                    const selected = answers[question.id] === option;

                    return (
                      <button
                        key={`${question.id}-${index}`}
                        onClick={() => handleOptionSelect(question.id, option)}
                        className={`group w-full min-h-[62px] sm:min-h-[66px] px-4 sm:px-5 py-3.5 rounded-xl sm:rounded-2xl border text-left transition-all duration-150 ${
                          selected
                            ? 'border-[#C9C7F5] bg-[#FAFAFF] shadow-[0_0_0_1px_rgba(201,199,245,0.3)]'
                            : 'border-[#E3E5E9] dark:border-[#2A2E38] bg-white dark:bg-[#12151C] hover:border-[#D7D9FA] hover:bg-[#FAFAFE]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-[10px] border flex items-center justify-center text-xs sm:text-sm font-bold transition ${
                            selected
                              ? 'bg-[#C9C7F5] border-[#C9C7F5] text-[#5a59b5]'
                              : 'border-[#D9DBE0] text-[#898E99] group-hover:border-[#C9C7F5] group-hover:text-[#7B74F1]'
                          }`}>
                            {selected ? <Check className="w-4 h-4" strokeWidth={2.5} /> : String.fromCharCode(65 + index)}
                          </div>
                          <span className={`flex-1 text-sm sm:text-[15px] leading-6 ${
                            selected
                              ? 'text-[#5a59b5] dark:text-[#B9BAF5] font-medium'
                              : 'text-[#50545E] dark:text-[#C1C4CB] font-medium'
                          }`}>
                            {option}
                          </span>
                          {selected && (
                            <div className="hidden sm:flex w-5 h-5 rounded-full bg-[#C9C7F5] items-center justify-center">
                              <Check className="w-3 h-3 text-[#5a59b5]" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom navigation */}
              <div className="px-5 sm:px-7 lg:px-9 py-4 border-t border-[#EBECEF] dark:border-[#252933] bg-[#FBFBFC] dark:bg-[#101319] flex items-center justify-between gap-3">
                <button
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  className={`h-11 px-3 sm:px-5 rounded-xl flex items-center gap-2 text-sm font-semibold transition ${
                    currentQuestionIndex === 0
                      ? 'text-[#C3C6CC] cursor-not-allowed'
                      : 'text-[#606570] hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="hidden md:block text-xs text-[#A0A4AD]">
                  {unansweredCount === 0
                    ? 'All questions answered'
                    : `${unansweredCount} unanswered`}
                </div>

                {isLastQuestion ? (
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={submitting}
                    className="h-11 px-5 sm:px-7 rounded-xl bg-[#C9C7F5] text-[#5a59b5] flex items-center justify-center gap-2 text-sm font-semibold shadow-sm hover:bg-[#b8b6e5] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting
                      </>
                    ) : (
                      <>
                        Finish quiz
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    className="h-11 px-5 sm:px-6 rounded-xl bg-[#C9C7F5] text-[#5a59b5] flex items-center gap-2 text-sm font-semibold hover:bg-[#b8b6e5] active:scale-[0.98] transition"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>

            {/* Bottom information */}
            <div className="mt-4 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs text-[#9A9EA8]">
              <div className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" />
                Your answers are saved when you submit the quiz.
              </div>
              {timeLeft !== null && (
                <div className="flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5" />
                  Quiz submits automatically when time expires.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <ConfirmModal
        isOpen={showSubmitConfirm}
        title="Submit quiz?"
        message={`You have answered ${answeredCount} of ${totalQuestions} questions. Once submitted, you cannot change your answers.`}
        confirmText="Submit"
        type="default"
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleSubmit(false);
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Small UI                                    */
/* -------------------------------------------------------------------------- */

function Legend({ className, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`w-3 h-3 rounded-[4px] flex-shrink-0 ${className}`}
      />

      <span className="text-xs text-[#8B909A]">
        {label}
      </span>
    </div>
  );
}
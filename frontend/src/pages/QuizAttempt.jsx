import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, ArrowLeft, BookOpen, Timer } from 'lucide-react';
import Toast from '../components/Toast';

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
  const startedAt = useRef(null);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
    if (timeLeft === null || timeLeft === undefined) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      const response = await apiCall(`/quiz/${id}/attempt`);
      if (response.alreadyAttempted) {
        setResult({
          score: response.attempt.score,
          totalMarks: response.attempt.totalMarks,
          isPassed: response.attempt.isPassed,
          passingMarks: response.quiz.passingMarks,
          averageScore: response.attempt.score,
          timeTaken: response.attempt.timeTaken,
          answers: response.attempt.answers
        });
        setQuiz(response.quiz);
        setLoading(false);
        return;
      }
      setQuiz(response.quiz);

      const initialAnswers = {};
      response.quiz.questions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);

      startedAt.current = new Date().toISOString();

      if (response.quiz.duration) {
        setTimeLeft(response.quiz.duration * 60);
      }
    } catch (err) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await apiCall(`/quiz/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers,
          startedAt: startedAt.current
        })
      });
      setResult(response.result);
    } catch (err) {
      setToast({ message: err.message || 'Failed to submit quiz', type: 'error' });
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeTaken = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F4F9] dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9C7F5]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F4F4F9] dark:bg-gray-950 p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-red-100 dark:border-red-500/20 text-center max-w-md relative z-10">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Unable to Start Quiz</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#C9C7F5] text-[#5a59b5] py-3.5 rounded-xl font-bold hover:bg-[#b8b6e5] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const isPassed = result.isPassed;
    const correctCount = result.answers.filter(a => a.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;

    return (
      <div className="min-h-screen bg-[#F4F4F9] dark:bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{quiz?.title}</h1>
              <p className="text-sm text-gray-400">{quiz?.session?.title}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
                {isPassed ? <CheckCircle className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-400" />}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isPassed ? 'Congratulations, you passed!' : 'Keep practicing'}</h2>
                <p className="text-gray-500 mt-0.5">
                  {correctCount}/{totalQuestions} correct &middot; Scored <strong>{result.score}/{result.totalMarks}</strong> ({percentage}%)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {result.timeTaken && (
                  <div className="text-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="text-xs text-gray-400 font-medium">Time</div>
                    <div className="text-base font-bold text-gray-700 dark:text-gray-200">{formatTimeTaken(result.timeTaken)}</div>
                  </div>
                )}
                <div className="text-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-xs text-gray-400 font-medium">Average</div>
                  <div className="text-base font-bold text-gray-700 dark:text-gray-200">{result.averageScore || percentage}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Answer Review
              </h3>
              <span className="text-sm text-gray-400">{correctCount}/{totalQuestions} correct</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {quiz.questions.map((q, index) => {
                const answer = result.answers.find(a => a.questionId === q.id);
                const isCorrect = answer?.isCorrect;
                const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

                return (
                  <div key={q.id} className="px-6 py-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          <span className="text-gray-400 mr-2">Q{index + 1}.</span>
                          {q.questionText}
                        </p>
                      </div>
                    </div>
                    <div className="ml-9 space-y-2">
                      {options.map((opt, oi) => {
                        const isSelected = opt === answer?.selectedAnswer;
                        const isCorrectOpt = opt === answer?.correctAnswer;
                        let borderColor = 'border-gray-100 dark:border-gray-700';
                        let bgColor = 'bg-white dark:bg-gray-900';
                        let textColor = 'text-gray-700 dark:text-gray-300';
                        let indicator = null;
                        if (isCorrectOpt) {
                          borderColor = 'border-green-400';
                          bgColor = 'bg-green-50/50 dark:bg-green-500/5';
                          textColor = 'text-green-700 dark:text-green-300 font-medium';
                          indicator = <span className="ml-auto text-xs font-semibold text-green-600">Correct answer</span>;
                        }
                        if (isSelected && !isCorrect) {
                          borderColor = 'border-red-400';
                          bgColor = 'bg-red-50/50 dark:bg-red-500/5';
                          textColor = 'text-red-600 dark:text-red-400 font-medium';
                          indicator = <span className="ml-auto text-xs font-semibold text-red-500">Your answer</span>;
                        }
                        if (isSelected && isCorrectOpt) {
                          indicator = <span className="ml-auto text-xs font-semibold text-green-600">Your answer (correct)</span>;
                        }
                        return (
                          <div key={oi} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 ${borderColor} ${bgColor}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCorrectOpt ? 'border-green-500 bg-green-50' : isSelected && !isCorrect ? 'border-red-500 bg-red-50' : 'border-gray-200 dark:border-gray-600'}`}>
                              {(isCorrectOpt || (isSelected && !isCorrect)) && (
                                <div className={`w-2.5 h-2.5 rounded-full ${isCorrectOpt ? 'bg-green-500' : 'bg-red-500'}`} />
                              )}
                            </div>
                            <span className={`flex-1 text-base ${textColor}`}>{opt}</span>
                            {indicator}
                          </div>
                        );
                      })}
                    </div>
                    <div className="ml-9 mt-2 flex items-center gap-4 text-sm text-gray-400">
                      <span>Marks: <strong className={isCorrect ? 'text-green-600' : 'text-red-500'}>{answer?.marksObtained || 0}</strong>/{answer?.marks || q.marks}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F4F4F9] dark:bg-gray-950 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
      </div>

      <header className="relative z-10 pt-6 px-6 pb-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between bg-white/60 dark:bg-gray-900/60 backdrop-blur-md p-4 rounded-[1.5rem] border border-white/50 dark:border-gray-800/50 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{quiz.title}</h1>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{quiz.session.title}</p>
              </div>
            </div>

            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-bold transition-colors ${timeLeft < 60
                ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20 animate-pulse'
                : 'bg-white dark:bg-gray-800 text-[#5a59b5] dark:text-[#b3b1f0] border border-[#C9C7F5] dark:border-[#C9C7F5]/40'
                }`}>
                <Clock className="w-4 h-4" />
                <span className="text-lg">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 relative z-10 flex flex-col h-full">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-[#C9C7F5]/20 dark:border-gray-800 flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-[#C9C7F5] to-[#5a59b5] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex-1 p-8 md:p-12 flex flex-col relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9C7F5]/5 rounded-bl-[100%] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">Q{currentQuestionIndex + 1}</span>
                <span>/ {quiz.questions.length}</span>
              </span>
              <div className="flex items-center gap-2 text-[#b59a5a] dark:text-[#e0c076] bg-[#F7D483]/10 px-3 py-1.5 rounded-lg border border-[#F7D483]/20">
                <span className="text-xs font-bold">{question.marks} Points</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-10 leading-snug">
                {question.questionText}
              </h2>

              <div className="grid gap-4">
                {JSON.parse(question.options).map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(question.id, option)}
                    className={`group w-full text-left p-5 rounded-[1.25rem] border-2 transition-all duration-200 relative overflow-hidden ${answers[question.id] === option
                      ? 'border-[#C9C7F5] bg-[#C9C7F5]/10 text-[#5a59b5] dark:text-[#b3b1f0] shadow-sm'
                      : 'border-gray-100 dark:border-gray-800 hover:border-[#C9C7F5]/50 hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${answers[question.id] === option
                        ? 'border-[#C9C7F5] bg-white dark:bg-gray-900 text-[#5a59b5] dark:text-[#b3b1f0]'
                        : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 group-hover:border-[#C9C7F5]/50'
                        }`}>
                        <span className="font-bold text-sm">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <span className="text-lg font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between relative z-10">
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors ${currentQuestionIndex === 0
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#C9C7F5] text-[#5a59b5] px-8 py-3.5 rounded-[1rem] font-bold text-sm hover:bg-[#b8b6e5] transition-all shadow-md shadow-[#C9C7F5]/20 hover:-translate-y-0.5 flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Finish Quiz'}
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="bg-gray-900 text-white px-8 py-3.5 rounded-[1rem] font-bold text-sm hover:bg-gray-800 transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2"
              >
                Next Question
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

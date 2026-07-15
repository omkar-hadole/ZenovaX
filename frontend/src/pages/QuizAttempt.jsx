import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, ArrowLeft, HelpCircle, BookOpen, Trophy, Star } from 'lucide-react';
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

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
    if (!timeLeft) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      const response = await apiCall(`/quiz/${id}/attempt`);
      setQuiz(response.quiz);

      const initialAnswers = {};
      response.quiz.questions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);

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
        body: JSON.stringify({ answers })
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

    return (
      <div className="min-h-screen bg-[#F4F4F9] dark:bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm max-w-4xl w-full overflow-hidden relative z-10 grid grid-cols-1 lg:grid-cols-2">
          <div className={`p-10 flex flex-col items-center justify-center text-center ${isPassed ? 'bg-gradient-to-br from-[#C9C7F5]/20 to-[#A9C1F7]/20 dark:from-[#C9C7F5]/10 dark:to-[#A9C1F7]/10' : 'bg-red-50/50 dark:bg-red-500/10'}`}>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white dark:border-gray-900 ${isPassed ? 'bg-[#C9C7F5] text-[#5a59b5]' : 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400'}`}>
              {isPassed ? <Trophy className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{isPassed ? 'Congratulations!' : 'Keep Practicing'}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">{isPassed ? 'You have successfully passed the quiz.' : 'Don\'t worry, you can try again to improve.'}</p>

            <div className="flex items-center gap-4 mb-8">
              <div className="text-center px-6 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Score</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{result.score}<span className="text-lg text-gray-400 dark:text-gray-500">/{result.totalMarks}</span></div>
              </div>
              <div className="text-center px-6 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Avg Score</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result.averageScore}</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 hover:shadow-xl hover:-translate-y-1"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="p-8 bg-white dark:bg-gray-900 h-[600px] overflow-y-auto">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                <BookOpen size={18} />
              </div>
              Review Answers
            </h3>
            <div className="space-y-4">
              {quiz.questions.map((q, index) => {
                const answer = result.answers.find(a => a.questionId === q.id);
                const isCorrect = answer?.isCorrect;

                return (
                  <div key={q.id} className="p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-sm transition-all group">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${isCorrect ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-sm">
                          <span className="text-gray-400 dark:text-gray-500 mr-2 font-mono">My Q{index + 1}.</span>
                          {q.questionText}
                        </p>

                        <div className="text-xs space-y-2 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-400 dark:text-gray-500 min-w-[60px]">You:</span>
                            <span className={`${isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 dark:text-red-400 font-medium'}`}>
                              {answer?.selectedAnswer || 'Skipped'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-400 dark:text-gray-500 min-w-[60px]">Correct:</span>
                              <span className="text-green-600 dark:text-green-400 font-medium">{answer?.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      </div>
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
                <Star className="w-4 h-4 fill-current" />
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

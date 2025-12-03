import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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
      
      // Initialize answers
      const initialAnswers = {};
      response.quiz.questions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);

      // Set timer if duration exists
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
      alert(err.message || 'Failed to submit quiz');
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Start Quiz</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-gray-900 text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden">
          <div className={`p-8 text-center ${result.isPassed ? 'bg-green-50' : 'bg-red-50'}`}>
            {result.isPassed ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
            <h2 className={`text-3xl font-bold mb-2 ${result.isPassed ? 'text-green-700' : 'text-red-700'}`}>
              {result.isPassed ? 'Quiz Passed!' : 'Quiz Failed'}
            </h2>
            <p className="text-gray-600">
              You scored <span className="font-bold text-gray-900">{result.score}</span> out of {result.totalMarks}
            </p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Passing Score</span>
              <span className="font-bold text-gray-900">{result.passingMarks}</span>
            </div>
            
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-gray-50 p-8 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Detailed Analysis</h3>
            <div className="space-y-4">
              {quiz.questions.map((q, index) => {
                const answer = result.answers.find(a => a.questionId === q.id);
                const isCorrect = answer?.isCorrect;
                
                return (
                  <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                        {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          <span className="text-gray-500 mr-2">Q{index + 1}.</span>
                          {q.questionText}
                        </p>
                        
                        <div className="text-sm space-y-1">
                          <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                            <span className="font-semibold">Your Answer:</span> {answer?.selectedAnswer || 'Not Answered'}
                          </p>
                          {!isCorrect && (
                            <p className="text-green-700">
                              <span className="font-semibold">Correct Answer:</span> {answer?.correctAnswer}
                            </p>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{quiz.session.title}</h1>
            <p className="text-sm text-gray-500">Quiz: {quiz.title}</p>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${
              timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col justify-center">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
              {question.marks} Marks
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
            {question.questionText}
          </h2>

          <div className="space-y-3">
            {JSON.parse(question.options).map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(question.id, option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[question.id] === option
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[question.id] === option ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {answers[question.id] === option && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  {option}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              currentQuestionIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

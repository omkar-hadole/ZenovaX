import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Rocket,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  Target
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';
import Header from '../components/dashboard/Header';
import MentorSidebar from '../components/dashboard/mentor/MentorSidebar';
import Toast from '../components/Toast';

export default function LaunchQuiz() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isEditMode = !!quizId;

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    duration: 15,
    totalMarks: 0,
    passingMarks: 0,
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1
      }
    ]
  });

  useEffect(() => {
    if (user && user.id) {
      if (isEditMode) {
        loadQuiz();
      } else {
        fetchSessions();
      }
    }
  }, [user, quizId]);

  const loadQuiz = async () => {
    try {
      const data = await apiCall(`/quiz/${quizId}`);
      const quiz = data.quiz;
      const [upcoming, past] = await Promise.all([
        apiCall('/sessions/all?type=upcoming&limit=50'),
        apiCall('/sessions/all?type=past&limit=50')
      ]);
      setSessions([...upcoming.sessions, ...past.sessions].filter(s => s.mentorId === user?.id));

      setSelectedSessionId(quiz.sessionId);
      setQuizData({
        title: quiz.title,
        description: quiz.description || '',
        duration: quiz.duration || 15,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        questions: quiz.questions.map(q => ({
          questionText: q.questionText,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks
        }))
      });
    } catch (error) {
      setToast({ message: 'Failed to load quiz', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const [upcoming, past] = await Promise.all([
        apiCall('/sessions/all?type=upcoming&limit=50'),
        apiCall('/sessions/all?type=past&limit=50')
      ]);
      const mySessions = [...upcoming.sessions, ...past.sessions]
        .filter(s => s.mentorId === user?.id);
      setSessions(mySessions);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[index][field] = value;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          marks: 1
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const calculateTotalMarks = () => {
    return quizData.questions.reduce((acc, q) => acc + (parseInt(q.marks) || 0), 0);
  };

  const validateQuiz = () => {
    if (!selectedSessionId) return 'Please select a session';
    if (!quizData.title) return 'Please enter a quiz title';
    if (quizData.passingMarks < 0) return 'Passing marks cannot be negative';
    const totalMarks = calculateTotalMarks();
    if (quizData.passingMarks > totalMarks) return 'Passing marks cannot exceed total marks';

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (!q.questionText.trim()) {
        return `Question ${i + 1}: Question text is required`;
      }
      const validOptions = q.options.filter(o => o.trim() !== '');
      if (validOptions.length < 2) {
        return `Question ${i + 1}: At least 2 options are required`;
      }
      if ((parseInt(q.marks) || 0) < 0) {
        return `Question ${i + 1}: Marks cannot be negative`;
      }
      if (!q.correctAnswer) {
        return `Question ${i + 1}: Please select a correct answer`;
      }
      if (!validOptions.includes(q.correctAnswer)) {
        return `Question ${i + 1}: Correct answer must match one of the options`;
      }
    }
    return null;
  };

  const handleSaveDraft = () => {
    const error = validateQuiz();
    if (error) {
      setToast({ message: error, type: 'error' });
      return;
    }
    submitQuiz(false);
  };

  const handleLaunchClick = () => {
    const error = validateQuiz();
    if (error) {
      setToast({ message: error, type: 'error' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmLaunch = () => {
    setShowConfirmModal(false);
    submitQuiz(true);
  };

  const submitQuiz = async (launch = false) => {
    setSubmitting(true);
    try {
      const totalMarks = calculateTotalMarks();
      const payload = {
        sessionId: selectedSessionId,
        ...quizData,
        totalMarks
      };

      if (isEditMode) {
        await apiCall(`/quiz/${quizId}/edit`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'Quiz updated successfully!', type: 'success' });
        setTimeout(() => navigate('/mentor/dashboard'), 1500);
      } else {
        const response = await apiCall('/quiz/create', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (launch && response.quiz) {
          await apiCall(`/quiz/${response.quiz.id}/launch`, { method: 'POST' });
          trackEvent('quiz_launched', { quiz_id: response.quiz.id });
          setToast({ message: 'Quiz created and launched successfully!', type: 'success' });
        } else {
          setToast({ message: 'Quiz draft created successfully!', type: 'success' });
        }
        setTimeout(() => navigate('/mentor/dashboard'), 1500);
      }
    } catch (error) {
      console.error('Failed to save quiz', error);
      setToast({ message: error.message || 'Failed to save quiz', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F4F9] dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9C7F5]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4F4F9] dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <MentorSidebar activeTab="Launch Code" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto relative">
          <Header user={user || {}} title={isEditMode ? 'Edit Quiz' : 'Launch Quiz'} onMenuClick={() => setSidebarOpen(true)} />

          <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/mentor/dashboard')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
                  <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isEditMode ? 'Edit Quiz' : 'Create & Launch Quiz'}</h1>
                  <p className="text-gray-500 dark:text-gray-400">Assess your learners' knowledge</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={isEditMode ? () => submitQuiz(false) : handleLaunchClick}
                  disabled={submitting}
                  className={`flex-1 sm:flex-none px-6 py-3 font-bold rounded-[1rem] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-1 ${isEditMode
                    ? 'bg-[#A9C1F7] text-[#4a7ac7] hover:bg-[#98b0e5]'
                    : 'bg-[#C9C7F5] text-[#5a59b5] hover:bg-[#b8b6e5]'
                    }`}
                >
                  <Rocket className="w-5 h-5" />
                  {isEditMode ? 'Save Changes' : 'Launch Now'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-[#C9C7F5]/20 dark:border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9C7F5]/10 rounded-bl-full -mr-6 -mt-6" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 rounded-lg text-[#5a59b5] dark:text-[#b3b1f0]">
                      <BookOpen size={20} />
                    </div>
                    Quiz Basics
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Session</label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        disabled={isEditMode}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all disabled:opacity-50"
                      >
                        <option value="">-- Choose a session --</option>
                        {sessions.map(session => (
                          <option key={session.id} value={session.id}>
                            {session.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quiz Title</label>
                      <input
                        type="text"
                        value={quizData.title}
                        onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                        placeholder="e.g., Figma Basics Assessment"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={quizData.description}
                        onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                        placeholder="Brief description..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-[#A9C1F7]/20 dark:border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#A9C1F7]/10 rounded-bl-full -mr-6 -mt-6" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#A9C1F7]/20 dark:bg-[#A9C1F7]/10 rounded-lg text-[#4a7ac7] dark:text-[#8fb2f2]">
                      <Target size={20} />
                    </div>
                    Settings
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration (min)</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type="number"
                          min="1"
                          value={quizData.duration}
                          onChange={(e) => setQuizData({ ...quizData, duration: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#A9C1F7] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Marks</label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type="number"
                          value={calculateTotalMarks()}
                          disabled
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-gray-500 dark:text-gray-400 font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Passing Marks <span className="text-xs text-gray-400">(default: 40%)</span>
                      </label>
                      <div className="relative">
                        <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type="number"
                          min="0"
                          value={quizData.passingMarks}
                          onChange={(e) => setQuizData({ ...quizData, passingMarks: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#A9C1F7] transition-all"
                          placeholder="e.g. 10"
                        />
                      </div>
                      {calculateTotalMarks() > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {Math.round((quizData.passingMarks / calculateTotalMarks()) * 100) || 0}% of total marks
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#F7D483]/20 dark:bg-[#F7D483]/10 text-[#b59a5a] dark:text-[#e0c076] flex items-center justify-center text-sm font-bold">
                      {quizData.questions.length}
                    </span>
                    Questions
                  </h2>
                  <button
                    onClick={addQuestion}
                    className="text-[#b59a5a] dark:text-[#e0c076] text-sm font-bold hover:bg-[#F7D483]/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-6">
                  {quizData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-8 shadow-sm border border-[#F7D483]/20 dark:border-gray-800 relative group hover:shadow-md transition-all">
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="absolute top-6 right-6 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-[#F7D483]/20 dark:bg-[#F7D483]/10 text-[#b59a5a] dark:text-[#e0c076] rounded-lg flex items-center justify-center font-bold text-sm mt-1">
                            Q{qIndex + 1}
                          </span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={question.questionText}
                              onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                              placeholder="Enter your question here..."
                              className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#F7D483] font-medium text-lg placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="pl-12 space-y-3">
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-3 group/option">
                              <button
                                onClick={() => handleQuestionChange(qIndex, 'correctAnswer', option)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${question.correctAnswer === option && option !== ''
                                  ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                                  : 'border-gray-200 dark:border-gray-700 group-hover/option:border-gray-300 dark:group-hover/option:border-gray-600'
                                  }`}
                              >
                                {question.correctAnswer === option && option !== '' && (
                                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                                )}
                              </button>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                placeholder={`Option ${oIndex + 1}`}
                                className={`flex-1 p-3 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#F7D483] transition-all ${question.correctAnswer === option && option !== '' ? 'bg-green-50/50 dark:bg-green-500/10 text-green-800 dark:text-green-400 font-medium' : 'bg-white dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                              />
                            </div>
                          ))}
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Click the circle to mark as correct answer</p>
                        </div>

                        <div className="pl-12 pt-2 flex items-center gap-4 border-t border-gray-50 dark:border-gray-800 mt-4">
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Marks</label>
                            <input
                              type="number"
                              min="0"
                              value={question.marks}
                              onChange={(e) => handleQuestionChange(qIndex, 'marks', Math.max(0, e.target.value))}
                              className="w-16 bg-transparent border-none text-center font-bold text-gray-800 dark:text-gray-100 focus:ring-0 p-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full mx-auto mb-4">
                  <Rocket size={24} />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Launch Quiz?</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                  This will make the quiz available to all registered learners immediately.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLaunch}
                    className="flex-1 py-3 bg-[#C9C7F5] text-[#5a59b5] font-bold rounded-xl hover:bg-[#b8b6e5] transition-colors"
                  >
                    Confirm Launch
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

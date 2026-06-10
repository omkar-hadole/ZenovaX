import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Rocket,
  CheckCircle,
  HelpCircle,
  Clock,
  Award,
  BookOpen,
  LayoutDashboard,
  Calendar,
  Star,
  Settings,
  Layers,
  QrCode,
  Code
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import MentorSidebar from '../components/dashboard/mentor/MentorSidebar';
import Toast from '../components/Toast';

export default function LaunchQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null);

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
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const data = await apiCall('/sessions/all');
      const mySessions = data.sessions.filter(s => s.mentorId === user?.id && s.status !== 'COMPLETED');
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

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (!q.questionText.trim()) {
        return `Question ${i + 1}: Question text is required`;
      }
      const validOptions = q.options.filter(o => o.trim() !== '');
      if (validOptions.length < 2) {
        return `Question ${i + 1}: At least 2 options are required`;
      }
      if (!q.correctAnswer) {
        // Optional: warn if no correct answer is set logic could go here if needed
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
        totalMarks,
        passingMarks: Math.ceil(totalMarks * 0.4)
      };

      const response = await apiCall('/quiz/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (launch && response.quiz) {
        await apiCall(`/quiz/${response.quiz.id}/launch`, { method: 'POST' });
        setToast({ message: 'Quiz created and launched successfully!', type: 'success' });
      } else {
        setToast({ message: 'Quiz draft created successfully!', type: 'success' });
      }
      setTimeout(() => {
        navigate('/mentor-dashboard');
      }, 1500);
    } catch (error) {
      console.error('Failed to create quiz', error);
      setToast({ message: error.message || 'Failed to create quiz', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F4F9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9C7F5]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4F4F9] relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <MentorSidebar activeTab="Launch Code" />

        <main className="flex-1 overflow-y-auto relative">
          <Header user={user || {}} title="Launch Quiz" />

          <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/mentor-dashboard')} className="p-2 hover:bg-white rounded-full transition-colors">
                  <ArrowLeft className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Create & Launch Quiz</h1>
                  <p className="text-gray-500">Assess your learners' knowledge</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="px-6 py-3 text-gray-700 font-bold hover:bg-white rounded-[1rem] transition-all flex items-center gap-2 border border-transparent hover:border-gray-200 hover:shadow-sm"
                >
                  <Save className="w-5 h-5" />
                  Save Draft
                </button>
                <button
                  onClick={handleLaunchClick}
                  disabled={submitting}
                  className="px-6 py-3 bg-[#C9C7F5] text-[#5a59b5] font-bold rounded-[1rem] hover:bg-[#b8b6e5] transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-1"
                >
                  <Rocket className="w-5 h-5" />
                  Launch Now
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[#C9C7F5]/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9C7F5]/10 rounded-bl-full -mr-6 -mt-6" />
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#C9C7F5]/20 rounded-lg text-[#5a59b5]">
                      <BookOpen size={20} />
                    </div>
                    Quiz Basics
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Session</label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Title</label>
                      <input
                        type="text"
                        value={quizData.title}
                        onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                        placeholder="e.g., Figma Basics Assessment"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={quizData.description}
                        onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                        placeholder="Brief description..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[#A9C1F7]/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#A9C1F7]/10 rounded-bl-full -mr-6 -mt-6" />
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#A9C1F7]/20 rounded-lg text-[#4a7ac7]">
                      <Settings size={20} />
                    </div>
                    Settings
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (min)</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={quizData.duration}
                          onChange={(e) => setQuizData({ ...quizData, duration: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#A9C1F7] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Marks</label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={calculateTotalMarks()}
                          disabled
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border-none text-gray-500 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#F7D483]/20 text-[#b59a5a] flex items-center justify-center text-sm font-bold">
                      {quizData.questions.length}
                    </span>
                    Questions
                  </h2>
                  <button
                    onClick={addQuestion}
                    className="text-[#b59a5a] text-sm font-bold hover:bg-[#F7D483]/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-6">
                  {quizData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-[#F7D483]/20 relative group hover:shadow-md transition-all">
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="absolute top-6 right-6 text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-[#F7D483]/20 text-[#b59a5a] rounded-lg flex items-center justify-center font-bold text-sm mt-1">
                            Q{qIndex + 1}
                          </span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={question.questionText}
                              onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                              placeholder="Enter your question here..."
                              className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#F7D483] font-medium text-lg placeholder:text-gray-400 transition-all required"
                            />
                            {!question.questionText && <p className="text-red-400 text-xs mt-1 ml-1 hidden group-focus-within/q:block">* Question text required</p>}
                          </div>
                        </div>

                        <div className="pl-12 space-y-3">
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-3 group/option">
                              <button
                                onClick={() => handleQuestionChange(qIndex, 'correctAnswer', option)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${question.correctAnswer === option && option !== ''
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 group-hover/option:border-gray-300'
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
                                className={`flex-1 p-3 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#F7D483] transition-all ${question.correctAnswer === option && option !== '' ? 'bg-green-50/50 text-green-800 font-medium' : 'bg-white hover:bg-gray-50'
                                  }`}
                              />
                            </div>
                          ))}
                          <p className="text-xs text-gray-400 italic">Enter at least 2 options</p>
                        </div>

                        <div className="pl-12 pt-2 flex items-center gap-4 border-t border-gray-50 mt-4">
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                            <label className="text-sm font-semibold text-gray-500">Marks</label>
                            <input
                              type="number"
                              value={question.marks}
                              onChange={(e) => handleQuestionChange(qIndex, 'marks', e.target.value)}
                              className="w-16 bg-transparent border-none text-center font-bold text-gray-800 focus:ring-0 p-0"
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

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mx-auto mb-4">
                  <Rocket size={24} />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Launch Quiz?</h3>
                <p className="text-gray-500 text-center mb-6">
                  Are you sure you want to launch this quiz? It will maintain draft status but be available for managing by you.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-colors"
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

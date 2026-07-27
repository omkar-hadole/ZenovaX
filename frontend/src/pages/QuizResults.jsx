import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  Timer,
  TrendingUp,
  Award,
  HelpCircle
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import MentorSidebar from '../components/dashboard/mentor/MentorSidebar';
import Toast from '../components/Toast';

export default function QuizResults() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [sortBy, setSortBy] = useState('submittedAt');

  useEffect(() => {
    fetchResults();
  }, [quizId]);

  const fetchResults = async () => {
    try {
      const response = await apiCall(`/quiz/${quizId}/results`);
      setData(response);
    } catch (err) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeTaken = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const sortedAttempts = data?.attempts ? [...data.attempts].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'percentage') return b.percentage - a.percentage;
    if (sortBy === 'timeTaken') return (a.timeTaken || 0) - (b.timeTaken || 0);
    return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
  }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F4F9] dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#7B74F1' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F4F9] dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[1.5rem] shadow-sm text-center max-w-md border border-red-100 dark:border-red-500/20">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 font-bold mb-2">Failed to load results</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/mentor/dashboard')}
            className="px-6 py-2.5 rounded-xl font-bold text-white transition-colors"
            style={{ backgroundColor: '#7B74F1' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { quiz, stats, questionStats } = data;

  return (
    <div className="flex h-screen bg-[#F4F4F9] dark:bg-gray-950">
      <div className="relative z-10 flex h-full w-full">
        <MentorSidebar activeTab="Launch Code" />

        <main className="flex-1 overflow-y-auto">
          <Header user={user || {}} title={`Hello, ${user?.name || 'Mentor'}!`} />

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{quiz.title}</h2>
                <p className="text-sm text-gray-400">
                  Passing: {quiz.passingMarks}/{quiz.totalMarks} &middot; {quiz.status}
                </p>
              </div>
              {quiz.status === 'LIVE' && (
                <button
                  onClick={async () => {
                    try {
                      await apiCall(`/quiz/${quizId}/close`, { method: 'POST' });
                      setToast({ message: 'Quiz closed successfully', type: 'success' });
                      fetchResults();
                    } catch (err) {
                      setToast({ message: err.message, type: 'error' });
                    }
                  }}
                  className="px-5 py-2.5 bg-red-400 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Close Quiz
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-gray-900 rounded-xl px-5 py-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#7B74F1', color: 'white' }}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">Total Attempts</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{stats.totalAttempts}</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl px-5 py-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-green-100 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">Passed</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{stats.passedCount} <span className="text-sm text-gray-400 font-normal">({stats.passRate}%)</span></p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl px-5 py-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-red-100 text-red-500">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">Failed</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{stats.failedCount} <span className="text-sm text-gray-400 font-normal">({100 - stats.passRate}%)</span></p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl px-5 py-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#7B74F1', color: 'white' }}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">Average Score</span>
                </div>
                <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{stats.averageScore}%</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: '#7B74F1' }} />
                  Student Results
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border-none text-sm font-medium text-gray-600 dark:text-gray-400 focus:ring-2 transition-all"
                  style={{ focusRingColor: '#7B74F1' }}
                >
                  <option value="submittedAt">Latest First</option>
                  <option value="score">Highest Score</option>
                  <option value="percentage">Highest Percentage</option>
                  <option value="timeTaken">Fastest Time</option>
                </select>
              </div>

              {sortedAttempts.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No attempts yet</p>
                  <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">Results will appear here once learners submit the quiz</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Percentage</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {sortedAttempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ backgroundColor: '#7B74F1' }}
                              >
                                {attempt.user?.name?.charAt(0) || '?'}
                              </div>
                              <p className="font-medium text-gray-700 dark:text-gray-200 text-sm">{attempt.user?.name || 'Unknown'}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{attempt.score}/{attempt.totalMarks}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${attempt.percentage}%`,
                                    backgroundColor: attempt.percentage >= 60 ? '#22c55e' : attempt.percentage >= 40 ? '#eab308' : '#ef4444'
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-500">{attempt.percentage}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium ${attempt.isPassed
                              ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400'
                              }`}>
                              {attempt.isPassed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {attempt.isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-400">
                              <Timer className="w-3.5 h-3.5" />
                              {formatTimeTaken(attempt.timeTaken)}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-400">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: '#7B74F1' }} />
                  Question-Level Analytics
                </h3>
              </div>

              {questionStats.length === 0 ? (
                <div className="p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">No question data available</p>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {questionStats.map((qs, index) => (
                    <div
                      key={qs.questionId}
                      className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all cursor-pointer"
                      onClick={() => setSelectedQuestion(selectedQuestion === qs.questionId ? null : qs.questionId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: '#7B74F1' }}
                            >
                              {index + 1}
                            </span>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{qs.questionText}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{qs.marks} marks</span>
                            <span>{qs.totalResponses} responses</span>
                            <span className={qs.successRate >= 60 ? 'text-green-500' : qs.successRate >= 40 ? 'text-yellow-500' : 'text-red-500'}>
                              {qs.successRate}% correct
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                          <div className="text-center px-2.5 py-1 bg-green-50 dark:bg-green-500/10 rounded-lg">
                            <p className="text-xs text-green-500 font-medium">{qs.correctCount}</p>
                            <p className="text-[10px] text-green-400">Correct</p>
                          </div>
                          <div className="text-center px-2.5 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            <p className="text-xs text-red-500 font-medium">{qs.incorrectCount}</p>
                            <p className="text-[10px] text-red-400">Wrong</p>
                          </div>
                        </div>
                      </div>

                      {selectedQuestion === qs.questionId && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Option Distribution</p>
                          <div className="space-y-1.5">
                            {Object.entries(qs.optionBreakdown).map(([option, count]) => {
                              const total = qs.totalResponses || 1;
                              const pct = Math.round((count / total) * 100);
                              const isCorrect = option === qs.correctAnswer;
                              return (
                                <div key={option} className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                  <span className={`text-xs flex-1 ${isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500'}`}>
                                    {option} {isCorrect && <span className="text-[10px] text-green-500 ml-1">(correct)</span>}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${pct}%`, backgroundColor: isCorrect ? '#22c55e' : '#7B74F1' }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-400 min-w-[2.5rem] text-right">{count} ({pct}%)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Video, MapPin,
  DollarSign, Users, BookOpen, Layers, PlusCircle, LayoutDashboard, Star, HelpCircle, Settings, Edit, QrCode, Code, Eye
} from 'lucide-react';
import { apiCall, logout as apiLogout } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import logoLight from '../assets/mentorlogo.svg'
import logoDark from '../assets/mentorlogo-dark.svg'
import MentorSidebar from '../components/dashboard/mentor/MentorSidebar';
import DescriptionEditor from '../components/dashboard/mentor/DescriptionEditor';
import SessionPreviewModal from '../components/dashboard/mentor/SessionPreviewModal';
import { cleanDescription } from '../utils/descriptionFormatter';

export default function CreateSession() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    department: '',
    topics: '',
    mode: 'ONLINE',
    venue: '',
    meetingLink: '',
    proposedDate: '',
    time: '',
    duration: 60,
    priceType: 'FREE',
    price: 0,
    maxSeats: 10
  });

  useEffect(() => {
    if (isEditing) {
      const fetchRequest = async () => {
        try {
          console.log("Fetching session request for ID:", id);
          const data = await apiCall(`/sessions/request/${id}`);
          console.log("Fetched data:", data);

          if (!data || !data.request) {
            throw new Error("No request data found");
          }

          const req = data.request;
          const date = new Date(req.proposedDate);

          let parsedTopics = "";
          try {
            // Handle case where topics might be already parsed or invalid
            const rawTopics = req.topics;
            if (Array.isArray(rawTopics)) {
              parsedTopics = rawTopics.join(', ');
            } else if (typeof rawTopics === 'string') {
              // Try parsing if it looks like JSON array
              if (rawTopics.trim().startsWith('[')) {
                parsedTopics = JSON.parse(rawTopics).join(', ');
              } else {
                parsedTopics = rawTopics;
              }
            }
          } catch (e) {
            console.warn("Failed to parse topics:", e);
            parsedTopics = req.topics || "";
          }

          setFormData({
            title: req.title || '',
            description: req.description || '',
            subject: req.subject || '',
            department: req.department || '',
            topics: parsedTopics,
            mode: req.mode || 'ONLINE',
            venue: req.venue || '',
            meetingLink: req.meetingLink || '',
            proposedDate: !isNaN(date) ? date.toISOString().split('T')[0] : '',
            time: !isNaN(date) ? date.toTimeString().slice(0, 5) : '',
            duration: req.duration || '',
            priceType: req.priceType || 'FREE',
            price: req.price || '',
            maxSeats: req.maxSeats || ''
          });
        } catch (err) {
          setError("Failed to load session details: " + err.message);
          console.error("Fetch request error:", err);
        }
      };
      fetchRequest();
    }
  }, [id, isEditing]);

  const isAdmin = user?.role === 'ADMIN';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dateTime = new Date(`${formData.proposedDate}T${formData.time}`);

      if (dateTime < new Date()) {
        setError("You cannot schedule a session in the past. Please check the date and time.");
        setLoading(false);
        return;
      }

      const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(Boolean);

      if (topicsArray.length > 20) {
        setError("You can add a maximum of 20 topics.");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        description: cleanDescription(formData.description),
        proposedDate: dateTime.toISOString(),
        topics: topicsArray,
        price: formData.price ? parseFloat(formData.price) : 0,
        maxSeats: formData.maxSeats ? parseInt(formData.maxSeats) : 0,
        duration: formData.duration ? parseInt(formData.duration) : 0
      };

      if (isEditing) {
        await apiCall(`/sessions/request/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiCall('/sessions/request', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (isAdmin) {
        navigate('/admin/pending-sessions');
      } else {
        navigate('/mentor/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F4F9] dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        {isAdmin ? (
          <Sidebar
            logo={theme === 'dark' ? logoDark : logoLight}
            logoClassName="w-56 h-auto"
            items={[
              { icon: LayoutDashboard, label: 'Dashboard', onClick: () => navigate('/admin/dashboard') },
              { icon: Clock, label: 'Pending Sessions', onClick: () => navigate('/admin/pending-sessions') },
            ]}
            activeTab="Pending Sessions"
            setActiveTab={() => { }}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onLogout={async () => {
              try {
                await logout();
              } catch (err) {
                console.error("Logout error:", err);
              }
              navigate('/auth');
            }}
          >
            {/* Admin specific sidebar children if any */}
          </Sidebar>
        ) : (
          <MentorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 overflow-y-auto">
          <Header user={user || {}} title={isEditing ? "Edit Session Request" : "Create New Session"} onMenuClick={() => setSidebarOpen(true)} />

          <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => navigate('/mentor/dashboard')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft className="text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isEditing ? "Edit Request" : "Design Your Session"}</h1>
                <p className="text-gray-500 dark:text-gray-400">{isEditing ? "Update details before approval" : "Craft a unique learning experience for your students"}</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-8 shadow-sm border border-[#C9C7F5]/20 dark:border-gray-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9C7F5]/10 dark:bg-[#C9C7F5]/5 rounded-bl-full -mr-8 -mt-8" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 rounded-lg text-[#5a59b5] dark:text-[#9190F8]">
                      <BookOpen size={20} />
                    </div>
                    Session Basics
                  </h3>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Session Title</label>
                      <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all text-lg font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="e.g. Mastering Advanced React Patterns"
                      />
                    </div>
                    <div>
                      <label htmlFor="session-description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What will they learn?</label>
                      <DescriptionEditor
                        id="session-description"
                        value={formData.description}
                        onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                        placeholder="Describe the key takeaways and learning outcomes..."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                        <input
                          type="text"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Department</label>
                        <input
                          type="text"
                          name="department"
                          required
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          placeholder="e.g. CSE"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Topics</label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.topics ? formData.topics.split(',').map(t => t.trim()).filter(Boolean).length : 0}/20 topics
                        </span>
                      </div>
                      <input
                        type="text"
                        name="topics"
                        value={formData.topics}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="React, Hooks, State"
                      />
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Separate topics with commas (maximum 20 topics).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-8 shadow-sm border border-[#A9C1F7]/20 dark:border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#A9C1F7]/10 dark:bg-[#A9C1F7]/5 rounded-bl-full -mr-8 -mt-8" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#A9C1F7]/20 dark:bg-[#A9C1F7]/10 rounded-lg text-[#4a7ac7] dark:text-[#98b0e5]">
                      <Layers size={20} />
                    </div>
                    Logistics & Timing
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Session Mode</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.mode === 'ONLINE' ? 'border-[#A9C1F7] bg-[#A9C1F7]/10 dark:bg-[#A9C1F7]/10 text-[#4a7ac7] dark:text-[#98b0e5]' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                          <input type="radio" name="mode" value="ONLINE" checked={formData.mode === 'ONLINE'} onChange={handleChange} className="hidden" />
                          <Video className="w-6 h-6" />
                          <span className="font-bold">Online Meeting</span>
                        </label>
                        <label className={`flex-1 cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.mode === 'OFFLINE' ? 'border-[#F7D483] bg-[#F7D483]/10 dark:bg-[#F7D483]/10 text-[#b59a5a] dark:text-[#e5c372]' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                          <input type="radio" name="mode" value="OFFLINE" checked={formData.mode === 'OFFLINE'} onChange={handleChange} className="hidden" />
                          <MapPin className="w-6 h-6" />
                          <span className="font-bold">In-Person</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                      <input
                        type="date"
                        name="proposedDate"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.proposedDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#A9C1F7] [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time</label>
                      <input
                        type="time"
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#A9C1F7] [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {formData.mode === 'ONLINE' ? 'Meeting Link' : 'Venue Address'}
                      </label>
                      <input
                        type="text"
                        name={formData.mode === 'ONLINE' ? 'meetingLink' : 'venue'}
                        required
                        value={formData.mode === 'ONLINE' ? formData.meetingLink : formData.venue}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#A9C1F7] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder={formData.mode === 'ONLINE' ? 'https://meet.google.com/...' : 'Room 304, Block B'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-8 shadow-sm border border-[#F7D483]/20 dark:border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F7D483]/10 dark:bg-[#F7D483]/5 rounded-bl-full -mr-8 -mt-8" />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#F7D483]/20 dark:bg-[#F7D483]/10 rounded-lg text-[#b59a5a] dark:text-[#e5c372]">
                      <DollarSign size={20} />
                    </div>
                    Settings
                  </h3>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration (min)</label>
                      <input
                        type="number"
                        name="duration"
                        required
                        min="15"
                        step="15"
                        value={formData.duration}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#F7D483]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max Participants</label>
                      <input
                        type="number"
                        name="maxSeats"
                        required
                        min="1"
                        value={formData.maxSeats}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#F7D483]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Session Type</label>
                      <select
                        name="priceType"
                        value={formData.priceType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#F7D483]"
                      >
                        <option value="FREE">Free Session</option>
                        <option value="PAID">Paid Session</option>
                      </select>
                    </div>
                    {formData.priceType === 'PAID' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price (₹)</label>
                        <input
                          type="number"
                          name="price"
                          required
                          min="0"
                          value={formData.price}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#F7D483]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-[1.5rem] font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <Eye className="w-6 h-6" />
                  Preview Session
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C9C7F5] text-[#5a59b5] py-4 rounded-[1.5rem] font-bold text-lg hover:bg-[#b8b6e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#5a59b5] border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-6 h-6" />
                      Publish Session
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {showPreview && (
        <SessionPreviewModal
          formData={formData}
          user={user}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div >
  );
}

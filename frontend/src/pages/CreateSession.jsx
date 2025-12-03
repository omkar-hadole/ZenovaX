import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Video, MapPin,
  DollarSign, Users, BookOpen, Layers, Tag, PlusCircle, LayoutDashboard, Star, HelpCircle, Settings
} from 'lucide-react';
import { apiCall } from '../utils/api';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

export default function CreateSession() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(Boolean);

      const payload = {
        ...formData,
        proposedDate: dateTime.toISOString(),
        topics: topicsArray,
        price: parseFloat(formData.price),
        maxSeats: parseInt(formData.maxSeats),
        duration: parseInt(formData.duration)
      };

      await apiCall('/sessions/request', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      navigate('/mentor-dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', onClick: () => navigate('/mentor-dashboard') },
    { icon: Calendar, label: 'My Sessions', onClick: () => navigate('/mentor-dashboard') },
    { icon: Star, label: 'Reviews Received', onClick: () => navigate('/mentor-dashboard') },
    { icon: HelpCircle, label: 'Help Center' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F4F4F9] relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          title="ZenovaX Mentor"
          subtitle="Session Manager"
          items={sidebarItems}
          activeTab=""
          setActiveTab={() => { }}
          onLogout={() => { }}
        >
          <div className="bg-gradient-to-br from-[#C9C7F5] to-[#A9C1F7] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-bl-full" />
            <h3 className="font-bold text-lg mb-2 text-gray-800">Upgrade to Gold</h3>
            <p className="text-sm text-gray-700 mb-4">Get access to premium features and analytics.</p>
            <button className="bg-white text-[#5a59b5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors w-full shadow-sm">
              Upgrade Now
            </button>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          <Header user={user} title="Create New Session" />

          <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => navigate('/mentor-dashboard')} className="p-2 hover:bg-white rounded-full transition-colors">
                <ArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Design Your Session</h1>
                <p className="text-gray-500">Craft a unique learning experience for your students</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title & Description Card */}
                <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-[#C9C7F5]/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9C7F5]/10 rounded-bl-full -mr-8 -mt-8" />
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#C9C7F5]/20 rounded-lg text-[#5a59b5]">
                      <BookOpen size={20} />
                    </div>
                    Session Basics
                  </h3>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Session Title</label>
                      <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all text-lg font-medium placeholder:text-gray-400"
                        placeholder="e.g. Mastering Advanced React Patterns"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">What will they learn?</label>
                      <textarea
                        name="description"
                        required
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all resize-none placeholder:text-gray-400"
                        placeholder="Describe the key takeaways and learning outcomes..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                        <input
                          type="text"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5]"
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          name="department"
                          required
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5]"
                          placeholder="e.g. CSE"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Topics</label>
                      <input
                        type="text"
                        name="topics"
                        value={formData.topics}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5]"
                        placeholder="React, Hooks, State"
                      />
                    </div>
                  </div>
                </div>

                {/* Logistics Card */}
                <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-[#A9C1F7]/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#A9C1F7]/10 rounded-bl-full -mr-8 -mt-8" />
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#A9C1F7]/20 rounded-lg text-[#4a7ac7]">
                      <Layers size={20} />
                    </div>
                    Logistics & Timing
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Session Mode</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.mode === 'ONLINE' ? 'border-[#A9C1F7] bg-[#A9C1F7]/10 text-[#4a7ac7]' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}>
                          <input type="radio" name="mode" value="ONLINE" checked={formData.mode === 'ONLINE'} onChange={handleChange} className="hidden" />
                          <Video className="w-6 h-6" />
                          <span className="font-bold">Online Meeting</span>
                        </label>
                        <label className={`flex-1 cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.mode === 'OFFLINE' ? 'border-[#F7D483] bg-[#F7D483]/10 text-[#b59a5a]' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}>
                          <input type="radio" name="mode" value="OFFLINE" checked={formData.mode === 'OFFLINE'} onChange={handleChange} className="hidden" />
                          <MapPin className="w-6 h-6" />
                          <span className="font-bold">In-Person</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        name="proposedDate"
                        required
                        value={formData.proposedDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#A9C1F7]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#A9C1F7]"
                      />
                    </div>
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {formData.mode === 'ONLINE' ? 'Meeting Link' : 'Venue Address'}
                      </label>
                      <input
                        type="text"
                        name={formData.mode === 'ONLINE' ? 'meetingLink' : 'venue'}
                        required
                        value={formData.mode === 'ONLINE' ? formData.meetingLink : formData.venue}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#A9C1F7]"
                        placeholder={formData.mode === 'ONLINE' ? 'https://meet.google.com/...' : 'Room 304, Block B'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Settings & Action */}
              <div className="space-y-6">
                <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-[#F7D483]/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F7D483]/10 rounded-bl-full -mr-8 -mt-8" />
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#F7D483]/20 rounded-lg text-[#b59a5a]">
                      <DollarSign size={20} />
                    </div>
                    Settings
                  </h3>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (min)</label>
                      <input
                        type="number"
                        name="duration"
                        required
                        min="15"
                        step="15"
                        value={formData.duration}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#F7D483]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Max Participants</label>
                      <input
                        type="number"
                        name="maxSeats"
                        required
                        min="1"
                        value={formData.maxSeats}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#F7D483]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Session Type</label>
                      <select
                        name="priceType"
                        value={formData.priceType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#F7D483]"
                      >
                        <option value="FREE">Free Session</option>
                        <option value="PAID">Paid Session</option>
                      </select>
                    </div>
                    {formData.priceType === 'PAID' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
                        <input
                          type="number"
                          name="price"
                          required
                          min="0"
                          value={formData.price}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#F7D483]"
                        />
                      </div>
                    )}
                  </div>
                </div>

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
    </div>
  );
}

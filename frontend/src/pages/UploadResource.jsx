import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link, FileText, Video, Image, ArrowLeft, LayoutDashboard, Calendar, Star, HelpCircle, Settings, BookOpen, Layers } from 'lucide-react';
import { apiCall } from '../utils/api';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

export default function UploadResource() {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fileUrl: '',
        fileType: 'PDF',
        sessionId: ''
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const data = await apiCall('/sessions/my-sessions');
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await apiCall('/resources/create', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            alert('Resource uploaded successfully!');
            navigate('/mentor-dashboard');
        } catch (error) {
            console.error('Upload failed', error);
            alert(error.message || 'Failed to upload resource');
        } finally {
            setIsLoading(false);
        }
    };

    const resourceTypes = [
        { value: 'PDF', icon: FileText, label: 'PDF Document' },
        { value: 'PPT', icon: FileText, label: 'Presentation' },
        { value: 'DOC', icon: FileText, label: 'Word Document' },
        { value: 'VIDEO', icon: Video, label: 'Video' },
        { value: 'IMAGE', icon: Image, label: 'Image' },
        { value: 'LINK', icon: Link, label: 'External Link' },
        { value: 'OTHER', icon: FileText, label: 'Other' }
    ];

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
                    subtitle="Resource Manager"
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
                    <Header user={user} title="Upload Resource" />

                    <div className="p-8 max-w-6xl mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => navigate('/mentor-dashboard')} className="p-2 hover:bg-white rounded-full transition-colors">
                                <ArrowLeft className="text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Share Knowledge</h1>
                                <p className="text-gray-500">Upload study materials for your learners</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Resource Details */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-[#C9C7F5]/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9C7F5]/10 rounded-bl-full -mr-8 -mt-8" />
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <div className="p-2 bg-[#C9C7F5]/20 rounded-lg text-[#5a59b5]">
                                            <FileText size={20} />
                                        </div>
                                        Resource Details
                                    </h3>

                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g., React Fundamentals Cheatsheet"
                                                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all text-lg font-medium placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Brief description of the resource..."
                                                rows="4"
                                                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all resize-none placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Resource URL</label>
                                            <div className="relative">
                                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="url"
                                                    required
                                                    value={formData.fileUrl}
                                                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                                                    placeholder="https://drive.google.com/..."
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 ml-1">
                                                Paste the direct link to your file (Google Drive, Dropbox, etc.)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Settings & Action */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-[#A9C1F7]/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#A9C1F7]/10 rounded-bl-full -mr-8 -mt-8" />
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <div className="p-2 bg-[#A9C1F7]/20 rounded-lg text-[#4a7ac7]">
                                            <Layers size={20} />
                                        </div>
                                        Configuration
                                    </h3>

                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Session</label>
                                            <select
                                                required
                                                value={formData.sessionId}
                                                onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#A9C1F7]"
                                            >
                                                <option value="">Select a session...</option>
                                                {sessions.map((session) => (
                                                    <option key={session.id} value={session.id}>
                                                        {session.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Type</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {resourceTypes.map((type) => (
                                                    <button
                                                        key={type.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, fileType: type.value })}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${formData.fileType === type.value
                                                            ? 'bg-[#A9C1F7]/20 border-[#A9C1F7] text-[#4a7ac7]'
                                                            : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <type.icon className="w-4 h-4" />
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#A9C1F7] text-[#4a7ac7] py-4 rounded-[1.5rem] font-bold text-lg hover:bg-[#98b3e9] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-[#4a7ac7] border-t-transparent rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6" />
                                            Upload Resource
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

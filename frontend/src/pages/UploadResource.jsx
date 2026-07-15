import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link, FileText, Video, Image, ArrowLeft, LayoutDashboard, Calendar, Star, HelpCircle, Settings, BookOpen, Layers, QrCode, Code } from 'lucide-react';
import { apiCall } from '../utils/api';
import Header from '../components/dashboard/Header';
import MentorSidebar from '../components/dashboard/mentor/MentorSidebar';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function UploadResource() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fileUrl: '',
        fileType: 'PDF',
        sessionId: ''
    });
    const [toast, setToast] = useState(null);

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
            setToast({ message: 'Resource uploaded successfully!', type: 'success' });
            setTimeout(() => {
                navigate('/mentor/dashboard');
            }, 1500);
        } catch (error) {
            console.error('Upload failed', error);
            setToast({ message: error.message || 'Failed to upload resource', type: 'error' });
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

    return (
        <div className="flex h-screen bg-[#F4F4F9] dark:bg-gray-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
            </div>

            <div className="relative z-10 flex h-full w-full">
                <MentorSidebar activeTab="Dashboard" />

                <main className="flex-1 overflow-y-auto">
                    <Header user={user || {}} title="Upload Resource" />

                    <div className="p-8 max-w-6xl mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => navigate('/mentor/dashboard')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
                                <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Share Knowledge</h1>
                                <p className="text-gray-500 dark:text-gray-400">Upload study materials for your learners</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-8 shadow-sm border border-[#C9C7F5]/20 dark:border-gray-800 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9C7F5]/10 rounded-bl-full -mr-8 -mt-8" />
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                                        <div className="p-2 bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 rounded-lg text-[#5a59b5] dark:text-[#b3b1f0]">
                                            <FileText size={20} />
                                        </div>
                                        Resource Details
                                    </h3>

                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resource Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g., React Fundamentals Cheatsheet"
                                                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all text-lg font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Brief description of the resource..."
                                                rows="4"
                                                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resource URL</label>
                                            <div className="relative">
                                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                                <input
                                                    type="url"
                                                    required
                                                    value={formData.fileUrl}
                                                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                                                    placeholder="https://drive.google.com/..."
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#C9C7F5] transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                                                Paste the direct link to your file (Google Drive, Dropbox, etc.)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-8 shadow-sm border border-[#A9C1F7]/20 dark:border-gray-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#A9C1F7]/10 rounded-bl-full -mr-8 -mt-8" />
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                                        <div className="p-2 bg-[#A9C1F7]/20 dark:bg-[#A9C1F7]/10 rounded-lg text-[#4a7ac7] dark:text-[#8fb2f2]">
                                            <Layers size={20} />
                                        </div>
                                        Configuration
                                    </h3>

                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Session</label>
                                            <select
                                                required
                                                value={formData.sessionId}
                                                onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-none focus:ring-2 focus:ring-[#A9C1F7]"
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
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resource Type</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {resourceTypes.map((type) => (
                                                    <button
                                                        key={type.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, fileType: type.value })}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${formData.fileType === type.value
                                                            ? 'bg-[#A9C1F7]/20 dark:bg-[#A9C1F7]/10 border-[#A9C1F7] text-[#4a7ac7] dark:text-[#8fb2f2]'
                                                            : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, VideoOff, MessageSquare, Users, Settings, PhoneOff } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function LiveSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Live Session</h1>
            <p className="text-xs text-gray-400">Session ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 p-6 flex items-center justify-center bg-gray-950 relative">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Waiting for host to join...</h2>
            <p className="text-gray-500">The session will begin shortly.</p>
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/90 p-4 rounded-2xl border border-gray-800 backdrop-blur-sm">
            <button className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
              <MicOff className="w-6 h-6" />
            </button>
            <button className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
              <VideoOff className="w-6 h-6" />
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-4 rounded-xl bg-red-600 hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-bold">Live Chat</h3>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-500 text-sm">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p>Chat is quiet...</p>
          </div>
          <div className="p-4 border-t border-gray-800">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

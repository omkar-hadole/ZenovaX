import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  MessageSquare, 
  PhoneOff, 
  AlertCircle, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Smile,
  ScreenShare,
  ScreenShareOff,
  Hand
} from 'lucide-react';
import { apiCall } from '../utils/api';
import logo from '../assets/footerlogo.svg';
import { getOptimizedImageUrl } from '../utils/cloudinary';

// Helper to dynamically load external scripts
const loadExternalScript = (url) => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${url}`));
    document.body.appendChild(script);
  });
};

export default function LiveSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [state, setState] = useState('LOADING'); // LOADING | NOT_REGISTERED | TOO_EARLY | SESSION_ENDED | ACTIVE
  const [errorMsg, setErrorMsg] = useState('');
  const [scheduledAt, setScheduledAt] = useState(null);
  const [liveAccess, setLiveAccess] = useState(null);
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Chat Sidebar States
  const [isNativeChatOpen, setIsNativeChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Screen Share & Raise Hand States
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [myParticipantId, setMyParticipantId] = useState(null);

  const myParticipantIdRef = useRef(null);
  useEffect(() => {
    myParticipantIdRef.current = myParticipantId;
  }, [myParticipantId]);



  // Reactions States
  const [showReactions, setShowReactions] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // Control Bar Autohide States & Refs
  const [showControlBar, setShowControlBar] = useState(true);
  const timeoutRef = useRef(null);
  const isHoveringControlBarRef = useRef(false);
  const showReactionsRef = useRef(false);

  useEffect(() => {
    showReactionsRef.current = showReactions;
  }, [showReactions]);

  const resetInactivityTimeout = () => {
    setShowControlBar(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!isHoveringControlBarRef.current && !showReactionsRef.current) {
        setShowControlBar(false);
      } else {
        resetInactivityTimeout();
      }
    }, 3000);
  };

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // Fetch live access parameters from backend
  const checkLiveAccess = async () => {
    setState('LOADING');
    try {
      const data = await apiCall(`/sessions/${id}/live-access`);
      setLiveAccess(data);
      setState('ACTIVE');
    } catch (error) {
      console.error('Live access error:', error);
      setErrorMsg(error.message || 'Unable to join the live session.');
      if (error.scheduledAt) {
        setScheduledAt(error.scheduledAt);
      }
      
      if (error.reason === 'NOT_REGISTERED') {
        setState('NOT_REGISTERED');
      } else if (error.reason === 'TOO_EARLY') {
        setState('TOO_EARLY');
      } else if (error.reason === 'SESSION_ENDED') {
        setState('SESSION_ENDED');
      } else {
        setState('NOT_REGISTERED'); // Fallback gating
      }
    }
  };

  useEffect(() => {
    checkLiveAccess();
  }, [id]);

  // Countdown logic for TOO_EARLY state
  useEffect(() => {
    if (state !== 'TOO_EARLY' || !scheduledAt) return;
    
    const openTime = new Date(new Date(scheduledAt).getTime() - 10 * 60 * 1000);

    const updateTimer = () => {
      const diff = openTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        checkLiveAccess();
      } else {
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state, scheduledAt]);



  // Jitsi Iframe Initialization
  useEffect(() => {
    if (state !== 'ACTIVE' || !liveAccess) return;

    let api = null;
    const jaasAppId = liveAccess.roomName.split('/')[0];
    
    loadExternalScript(`https://8x8.vc/${jaasAppId}/external_api.js`)
      .then(() => {
        if (!jitsiContainerRef.current) return;

        const options = {
          roomName: liveAccess.roomName,
          jwt: liveAccess.token,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            toolbarButtons: [], // Hide Jitsi default toolbar to use our bespoke UI overlay
            disableDeepLinking: true,
            disablePolls: true, // Disable Jitsi's native polls tab entirely
            fileSharing: {
              enabled: liveAccess.isModerator
            }
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#0B0F19'
          }
        };

        api = new window.JitsiMeetExternalAPI(liveAccess.domain, options);
        jitsiApiRef.current = api;

        // Sync local control states with Jitsi iframe updates
        api.addEventListener('audioMuteStatusChanged', ({ muted }) => {
          setIsAudioMuted(muted);
        });

        api.addEventListener('videoMuteStatusChanged', ({ muted }) => {
          setIsVideoMuted(muted);
        });

        api.addEventListener('chatUpdated', ({ isOpen, unreadCount }) => {
          setIsNativeChatOpen(isOpen);
          setUnreadCount(unreadCount || 0);
        });

        api.addEventListener('videoConferenceJoined', ({ id }) => {
          setMyParticipantId(id);
        });

        api.addEventListener('screenSharingStatusChanged', ({ on }) => {
          setIsScreenSharing(on);
        });

        api.addEventListener('raiseHandUpdated', ({ handRaised, participantId }) => {
          if (!participantId || participantId === myParticipantIdRef.current) {
            setIsHandRaised(handRaised);
          }
        });

        // Chat message and reaction listener
        api.addEventListener('incomingMessage', ({ from, nick, message }) => {
          if (message.startsWith('[REACTION]: ')) {
            // Trigger floating reaction animation
            const emoji = message.replace('[REACTION]: ', '').trim();
            const reactionId = Math.random().toString();
            const leftOffset = 15 + Math.random() * 50; // Random offset from 15% to 65%

            setFloatingEmojis((prev) => [
              ...prev,
              { id: reactionId, emoji, sender: nick, left: leftOffset }
            ]);

            // Auto-clean reaction item after 3.5 seconds
            setTimeout(() => {
              setFloatingEmojis((prev) => prev.filter((e) => e.id !== reactionId));
            }, 3500);
          }
        });

        api.addEventListener('readyToClose', () => {
          navigate('/dashboard');
        });
      })
      .catch((err) => {
        console.error('Failed to load Jitsi Meet script:', err);
        setErrorMsg('Failed to initialize the video classroom.');
        setState('NOT_REGISTERED');
      });

    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [state, liveAccess]);

  // Control Bar Inactivity Tracking
  useEffect(() => {
    if (state !== 'ACTIVE') return;

    const handleMovement = () => {
      resetInactivityTimeout();
    };

    window.addEventListener('mousemove', handleMovement);
    window.addEventListener('touchstart', handleMovement);
    
    resetInactivityTimeout();

    return () => {
      window.removeEventListener('mousemove', handleMovement);
      window.removeEventListener('touchstart', handleMovement);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state]);

  // Wire control bar handlers to Jitsi external API
  const handleToggleAudio = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const handleToggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const handleHangup = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    } else {
      navigate('/dashboard');
    }
  };

  const handleToggleScreenShare = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleShareScreen');
      setIsScreenSharing(prev => !prev);
    }
  };

  const handleToggleRaiseHand = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleRaiseHand');
      setIsHandRaised(prev => !prev);
    }
  };

  // Toggle Native Chat Panel Handler
  const handleToggleNativeChat = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleChat');
    }
  };

  // Reactions Trigger Handler
  const triggerReaction = (emoji) => {
    if (!jitsiApiRef.current) return;
    jitsiApiRef.current.executeCommand('sendChatMessage', `[REACTION]: ${emoji}`);
  };

  const formatCountdown = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    
    let timeStr = '';
    if (hours > 0) {
      timeStr += `${hours}h `;
    }
    timeStr += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return timeStr;
  };

  const renderStateContent = () => {
    switch (state) {
      case 'LOADING':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#070913] text-white">
            <div className="relative flex items-center justify-center mb-6">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <Video className="w-6 h-6 text-indigo-400 absolute animate-pulse" />
            </div>
            <h2 className="text-xl font-medium tracking-tight font-outfit mb-1">Securing classroom connection...</h2>
            <p className="text-slate-400 text-sm">Verifying session registration and window</p>
          </div>
        );

      case 'NOT_REGISTERED':
        return (
          <div className="flex-1 flex items-center justify-center bg-[#070913] text-white p-6">
            <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight font-outfit mb-3">Registration Required</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Only learners with a confirmed booking for this session are authorized to join. Please check your booking status or register for this session on the dashboard.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors font-medium rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        );

      case 'TOO_EARLY':
        return (
          <div className="flex-1 flex items-center justify-center bg-[#070913] text-white p-6">
            <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight font-outfit mb-2 font-outfit">Too Early to Join</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                The classroom opens 10 minutes prior to the scheduled start time. 
              </p>
              
              <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-4 mb-6">
                <div className="text-xs text-indigo-400 uppercase tracking-widest font-semibold mb-1">Room Opens In</div>
                <div className="text-3xl font-bold font-mono text-white tracking-wider">
                  {formatCountdown(timeLeft)}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 transition-colors font-medium rounded-xl text-sm"
                >
                  Dashboard
                </button>
                <button 
                  onClick={checkLiveAccess}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors font-medium rounded-xl text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        );

      case 'SESSION_ENDED':
        return (
          <div className="flex-1 flex items-center justify-center bg-[#070913] text-white p-6">
            <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
              <div className="w-12 h-12 bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight font-outfit mb-3">Session Completed</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 font-outfit">
                This live session has concluded. The room has been closed and is no longer accepting joins.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors font-medium rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        );

      case 'ACTIVE':
        return (
          <div className="flex-1 flex relative overflow-hidden">
            {/* Jitsi meeting iframe container - full screen */}
            <div className="absolute inset-0 bg-[#0B0F19]" id="jitsi-container" ref={jitsiContainerRef} />
            
            {/* Dynamic Floating Emojis Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
              {floatingEmojis.map((e) => (
                <div
                  key={e.id}
                  className="absolute bottom-24 flex flex-col items-center"
                  style={{ 
                    left: `${e.left}%`,
                    animation: 'float-up 3.5s cubic-bezier(0.08, 0.82, 0.17, 1) forwards'
                  }}
                >
                  <div className="text-4xl filter drop-shadow-[0_4px_12px_rgba(99,97,224,0.3)] transform hover:scale-125 transition-transform duration-200">
                    {e.emoji}
                  </div>
                  <span className="text-[9px] bg-slate-950/80 backdrop-blur-md text-slate-300 px-2 py-0.5 rounded-full border border-white/10 font-outfit mt-1 max-w-[90px] truncate shadow-md">
                    {e.sender}
                  </span>
                </div>
              ))}
            </div>

            {/* Transparent sensor overlay to catch mouse moves when control bar is hidden */}
            <div 
              onMouseMove={() => {
                if (!showControlBar) {
                  resetInactivityTimeout();
                }
              }}
              onTouchStart={() => {
                if (!showControlBar) {
                  resetInactivityTimeout();
                }
              }}
              onClick={() => {
                if (!showControlBar) {
                  resetInactivityTimeout();
                }
              }}
              className={`absolute inset-0 z-40 bg-transparent ${
                showControlBar ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
            />

            {/* Reactions Overlay Panel (above emoji trigger) */}
            {showReactions && (
              <div className="absolute bottom-[85px] left-1/2 flex items-center gap-3 bg-slate-900/70 backdrop-blur-3xl px-4 py-2 rounded-full border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.1)_inset] z-50 origin-bottom transform animate-[apple-pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                {['❤️', '👍', '🎉', '😂', '😮', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      triggerReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="text-2xl hover:scale-125 hover:-translate-y-1 active:scale-90 transition-all duration-200 ease-out filter drop-shadow-md cursor-pointer transform origin-bottom"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Bespoke Spatial Liquid Glass Control Bar Centering Wrapper */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              {/* Inner control bar (this is what gets translated, blurred, and has GPU transitions) */}
              <div 
                onMouseEnter={() => {
                  isHoveringControlBarRef.current = true;
                  resetInactivityTimeout();
                }}
                onMouseLeave={() => {
                  isHoveringControlBarRef.current = false;
                  resetInactivityTimeout();
                }}
                className={`flex items-center gap-2 bg-slate-900/60 backdrop-blur-3xl p-1.5 rounded-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.1)_inset] pointer-events-auto transform ${
                  showControlBar 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-14 opacity-0 pointer-events-none'
                }`}
                style={{
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Group 1: Media Toggles */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handleToggleAudio}
                    className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                      isAudioMuted 
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30' 
                        : 'bg-white/5 border border-white/5 text-white/90 hover:bg-white/12 hover:text-white'
                    }`}
                    title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <button 
                    onClick={handleToggleVideo}
                    className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                      isVideoMuted 
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30' 
                        : 'bg-white/5 border border-white/5 text-white/90 hover:bg-white/12 hover:text-white'
                    }`}
                    title={isVideoMuted ? "Start Video" : "Stop Video"}
                  >
                    {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                </div>

                {/* Divider */}
                <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

                {/* Group 2: Interactivity */}
                <div className="flex items-center gap-1.5">
                  {/* Share Screen button */}
                  <button 
                    onClick={handleToggleScreenShare}
                    className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                      isScreenSharing 
                        ? 'bg-indigo-500/25 border border-indigo-500/35 text-indigo-200 hover:bg-indigo-500/35' 
                        : 'bg-white/5 border border-white/5 text-white/90 hover:bg-white/12 hover:text-white'
                    }`}
                    title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
                  >
                    {isScreenSharing ? <ScreenShareOff className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
                  </button>

                  {/* Reaction toggle */}
                  <button 
                    onClick={() => setShowReactions(!showReactions)}
                    className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                      showReactions 
                        ? 'bg-indigo-500/25 border border-indigo-500/35 text-indigo-200' 
                        : 'bg-white/5 border border-white/5 text-white/90 hover:bg-white/12 hover:text-white'
                    }`}
                    title="Send Reaction"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Raise Hand button */}
                  <button 
                    onClick={handleToggleRaiseHand}
                    className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                      isHandRaised 
                        ? 'bg-indigo-500/25 border border-indigo-500/35 text-indigo-200 hover:bg-indigo-500/35' 
                        : 'bg-white/5 border border-white/5 text-white/90 hover:bg-white/12 hover:text-white'
                    }`}
                    title={isHandRaised ? "Lower Hand" : "Raise Hand"}
                  >
                    <Hand className="w-5 h-5" />
                  </button>
                </div>

                {/* Divider */}
                <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

                {/* Group 3: Utility / Chat */}
                <div className="flex items-center gap-1.5">
                  {/* Chat Toggle button */}
                  <button 
                    onClick={handleToggleNativeChat}
                    className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 relative ${
                      isNativeChatOpen 
                        ? 'bg-indigo-500/25 border border-indigo-500/35 text-indigo-200' 
                        : 'bg-white/5 border border-white/5 text-white/90 hover:bg-white/12 hover:text-white'
                    }`}
                    title={isNativeChatOpen ? "Hide Chat" : "Show Chat"}
                  >
                    <MessageSquare className="w-5 h-5" />
                    {!isNativeChatOpen && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white border border-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

                {/* Group 4: Call Actions */}
                <div className="flex items-center">
                  <button 
                    onClick={handleHangup}
                    className="p-2.5 rounded-xl bg-red-500/90 border border-red-400/25 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 text-white transition-all duration-200 active:scale-95"
                    title="Hang Up"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-[#070913] text-white flex flex-col overflow-hidden relative">
      {/* Dynamic Keyframes injected locally */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-up {
          0% {
            transform: translateY(100px) scale(0.3) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
            transform: translateY(0px) scale(1.1) rotate(6deg);
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-80vh) scale(0.6) rotate(-12deg);
            opacity: 0;
          }
        }
        @keyframes apple-pop {
          0% {
            transform: translate3d(-50%, 15px, 0) scale(0.85);
            opacity: 0;
          }
          100% {
            transform: translate3d(-50%, 0, 0) scale(1);
            opacity: 1;
          }
        }
      `}} />

      {/* Top Header bar - Apple glass styling */}
      <div className="h-16 border-b border-white/10 bg-slate-950/20 backdrop-blur-xl flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <img
            src={getOptimizedImageUrl(logo)}
            width={120}
            height={24}
            fetchpriority="high"
            alt="ZenovaX"
            className="h-6 object-contain"
          />
          <div className="w-[1px] h-5 bg-white/15 mx-1" />
          <span className="bg-white/5 border border-white/10 text-slate-300 px-2.5 py-0.5 rounded-md text-[10px] font-mono shadow-sm">
            ID: {id}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-red-500/15 border border-red-500/25 text-red-400 px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-bold flex items-center gap-1.5 shadow-sm shadow-red-500/5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            LIVE
          </span>
        </div>
      </div>

      {renderStateContent()}
    </div>
  );
}

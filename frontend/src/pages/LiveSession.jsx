import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  MessageSquare, 
  Users, 
  Settings, 
  PhoneOff, 
  AlertCircle, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Smile,
  BarChart2
} from 'lucide-react';
import { apiCall } from '../utils/api';

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

  // Chat / Polls Sidebar States
  const [isNativeChatOpen, setIsNativeChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Polls Custom States
  const [polls, setPolls] = useState([]);
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [unreadPollsCount, setUnreadPollsCount] = useState(0);
  const [myParticipantId, setMyParticipantId] = useState(null);

  // Poll Creator Form States
  const [creatorQuestion, setCreatorQuestion] = useState('');
  const [creatorOptions, setCreatorOptions] = useState(['', '']);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  const pollsRef = useRef([]);
  useEffect(() => {
    pollsRef.current = polls;
  }, [polls]);

  const myParticipantIdRef = useRef(null);
  useEffect(() => {
    myParticipantIdRef.current = myParticipantId;
  }, [myParticipantId]);

  useEffect(() => {
    if (isPollsOpen) {
      setUnreadPollsCount(0);
    }
  }, [isPollsOpen]);

  // Reactions States
  const [showReactions, setShowReactions] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

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
          if (isOpen) {
            setIsPollsOpen(false); // Close custom Polls if native chat is opened
          }
        });

        api.addEventListener('videoConferenceJoined', ({ id }) => {
          setMyParticipantId(id);
          // Request polls state sync from moderator
          broadcastEndpointMessage(JSON.stringify({ type: 'POLL_REQUEST_SYNC' }));
        });

        api.addEventListener('endpointTextMessageReceived', (event) => {
          try {
            console.log('Received Jitsi data message:', event);
            const senderId = event?.senderInfo?.id || event?.senderId;
            const textContent = event?.eventData?.text || event?.eventData?.event?.text || event?.text || event?.message;

            if (!textContent) return;

            // Ignore messages sent by ourselves
            if (senderId && senderId === myParticipantIdRef.current) return;

            const data = JSON.parse(textContent);

            if (data.type === 'POLL_CREATE') {
              setPolls((prev) => {
                if (prev.some((p) => p.id === data.poll.id)) return prev;
                return [...prev, data.poll];
              });
              if (!isPollsOpen) {
                setUnreadPollsCount((prev) => prev + 1);
              }
            } else if (data.type === 'POLL_VOTE') {
              setPolls((prev) => prev.map((p) => {
                if (p.id === data.pollId) {
                  return {
                    ...p,
                    votes: {
                      ...p.votes,
                      [senderId]: data.optionIndex
                    }
                  };
                }
                return p;
              }));
            } else if (data.type === 'POLL_REQUEST_SYNC') {
              if (liveAccess.isModerator && jitsiApiRef.current) {
                jitsiApiRef.current.executeCommand('sendEndpointTextMessage', senderId, JSON.stringify({
                  type: 'POLL_SYNC',
                  polls: pollsRef.current
                }));
              }
            } else if (data.type === 'POLL_SYNC') {
              setPolls(data.polls);
            }
          } catch (err) {
            console.error('Error handling endpoint text message:', err);
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

  const handleToggleSettings = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleSettings');
    }
  };

  // Toggle Native Chat/Polls Panel Handler
  const handleToggleNativeChat = () => {
    if (jitsiApiRef.current) {
      if (isPollsOpen) {
        setIsPollsOpen(false);
      }
      jitsiApiRef.current.executeCommand('toggleChat');
    }
  };

  // Polls Trigger Handler
  const handleTogglePolls = () => {
    const nextState = !isPollsOpen;
    setIsPollsOpen(nextState);
    if (nextState && isNativeChatOpen && jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleChat');
    }
  };

  const broadcastEndpointMessage = async (messageText) => {
    if (!jitsiApiRef.current) return;
    try {
      // 1. Try Jitsi's standard broadcast message command
      jitsiApiRef.current.executeCommand('sendEndpointTextMessage', '', messageText);
      
      // 2. Loop through all active participant IDs to guarantee delivery across all Jitsi versions
      const participants = await jitsiApiRef.current.getParticipantsInfo();
      if (participants && Array.isArray(participants)) {
        participants.forEach((p) => {
          const pId = p.participantId || p.id;
          if (pId) {
            jitsiApiRef.current.executeCommand('sendEndpointTextMessage', pId, messageText);
          }
        });
      }
    } catch (e) {
      console.error("Error broadcasting endpoint message:", e);
    }
  };

  const handleLaunchPoll = () => {
    if (!creatorQuestion.trim() || creatorOptions.some(opt => !opt.trim())) return;
    const newPoll = {
      id: Math.random().toString(36).substr(2, 9),
      question: creatorQuestion.trim(),
      options: creatorOptions.map(opt => opt.trim()),
      votes: {}
    };

    setPolls(prev => [...prev, newPoll]);
    broadcastEndpointMessage(JSON.stringify({
      type: 'POLL_CREATE',
      poll: newPoll
    }));

    setCreatorQuestion('');
    setCreatorOptions(['', '']);
    setIsCreatingPoll(false);
  };

  const handleVote = (pollId, optionIndex) => {
    const localId = myParticipantId || 'local';
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        return {
          ...p,
          votes: {
            ...p.votes,
            [localId]: optionIndex
          }
        };
      }
      return p;
    }));

    broadcastEndpointMessage(JSON.stringify({
      type: 'POLL_VOTE',
      pollId,
      optionIndex
    }));
  };

  const getPollResults = (poll) => {
    const totalVotes = Object.keys(poll.votes || {}).length;
    const results = poll.options.map((option, idx) => {
      const optionVotes = Object.values(poll.votes || {}).filter(val => val === idx).length;
      const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
      return {
        option,
        votes: optionVotes,
        percent
      };
    });
    return { totalVotes, results };
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



            {/* Apple Spatial / Liquid Glass Polls Panel */}
            {isPollsOpen && (
              <div className="absolute right-6 top-6 bottom-28 w-80 bg-slate-950/30 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col text-white z-40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold font-outfit text-sm tracking-wide flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    Live Polls
                  </h3>
                  <button 
                    onClick={() => setIsPollsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-5">
                  {/* Poll Creation form for Moderator */}
                  {liveAccess?.isModerator && (
                    <div className="border border-white/10 bg-white/5 rounded-xl p-3.5 backdrop-blur-md space-y-3">
                      {!isCreatingPoll ? (
                        <button
                          onClick={() => setIsCreatingPoll(true)}
                          className="w-full py-2 bg-indigo-600/80 hover:bg-indigo-600 transition-colors rounded-xl text-xs font-bold font-outfit tracking-wide"
                        >
                          + Create New Poll
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase font-outfit">Question</label>
                            <input
                              type="text"
                              value={creatorQuestion}
                              onChange={(e) => setCreatorQuestion(e.target.value)}
                              placeholder="e.g. Do you understand the scope?"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs placeholder-white/30 text-white focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase font-outfit">Options</label>
                            {creatorOptions.map((opt, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const next = [...creatorOptions];
                                    next[idx] = e.target.value;
                                    setCreatorOptions(next);
                                  }}
                                  placeholder={`Option ${idx + 1}`}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                />
                                {creatorOptions.length > 2 && (
                                  <button
                                    onClick={() => setCreatorOptions(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                            {creatorOptions.length < 6 && (
                              <button
                                onClick={() => setCreatorOptions(prev => [...prev, ''])}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                              >
                                + Add Option
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-white/5">
                            <button
                              onClick={() => {
                                setIsCreatingPoll(false);
                                setCreatorQuestion('');
                                setCreatorOptions(['', '']);
                              }}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleLaunchPoll}
                              disabled={!creatorQuestion.trim() || creatorOptions.some(o => !o.trim())}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:text-white/30 rounded-lg text-xs font-bold"
                            >
                              Launch
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Polls Listing */}
                  {polls.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400/50 text-xs py-8">
                      <BarChart2 className="w-8 h-8 mb-2 opacity-30 text-indigo-400" />
                      <p className="font-outfit">No active polls yet.</p>
                    </div>
                  ) : (
                    [...polls].reverse().map((poll) => {
                      const { totalVotes, results } = getPollResults(poll);
                      const myVote = poll.votes ? poll.votes[myParticipantId || 'local'] : undefined;
                      const hasVotedPoll = myVote !== undefined;

                      return (
                        <div key={poll.id} className="border border-white/10 bg-white/5 p-4 rounded-xl space-y-3.5 backdrop-blur-md shadow-lg">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm tracking-wide font-outfit text-white leading-snug">
                              {poll.question}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {results.map((res, idx) => {
                              const isMyOption = myVote === idx;
                              return (
                                <div key={idx} className="relative">
                                  {hasVotedPoll ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex justify-between items-center text-xs px-1 font-outfit relative z-10">
                                        <span className={`font-medium ${isMyOption ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}>
                                          {res.option} {isMyOption && '✓'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {res.votes} ({res.percent}%)
                                        </span>
                                      </div>
                                      <div className="h-7 w-full bg-white/5 border border-white/5 rounded-lg overflow-hidden relative">
                                        <div 
                                          className={`h-full transition-all duration-500 rounded-l-lg ${isMyOption ? 'bg-indigo-500/20' : 'bg-slate-400/10'}`} 
                                          style={{ width: `${res.percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleVote(poll.id, idx)}
                                      className="w-full text-left text-xs bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 px-4 py-2.5 rounded-xl font-outfit transition-all duration-200 active:scale-98"
                                    >
                                      {res.option}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Reactions Overlay Panel (above emoji trigger) */}
            {showReactions && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3.5 bg-slate-950/30 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-300">
                {['❤️', '👍', '🎉', '😂', '😮', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      triggerReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="text-3xl hover:scale-130 active:scale-90 transition-all duration-150 filter drop-shadow-md cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Bespoke Spatial Liquid Glass Control Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-950/20 backdrop-blur-2xl p-3.5 rounded-2xl border border-white/10 shadow-[0_15px_40px_rgba(99,97,224,0.15)] z-50 transition-all duration-300">
              <button 
                onClick={handleToggleAudio}
                className={`p-3.5 rounded-xl transition-all duration-300 ${
                  isAudioMuted 
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/35' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                }`}
                title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isAudioMuted ? <MicOff className="w-5.5 h-5.5" /> : <Mic className="w-5.5 h-5.5" />}
              </button>
              
              <button 
                onClick={handleToggleVideo}
                className={`p-3.5 rounded-xl transition-all duration-300 ${
                  isVideoMuted 
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/35' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                }`}
                title={isVideoMuted ? "Start Video" : "Stop Video"}
              >
                {isVideoMuted ? <VideoOff className="w-5.5 h-5.5" /> : <Video className="w-5.5 h-5.5" />}
              </button>

              {/* Reaction toggle */}
              <button 
                onClick={() => setShowReactions(!showReactions)}
                className={`p-3.5 rounded-xl transition-all duration-300 bg-white/5 border border-white/10 text-white hover:bg-white/15 ${showReactions ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : ''}`}
                title="Send Reaction"
              >
                <Smile className="w-5.5 h-5.5" />
              </button>

              {/* Chat Toggle button */}
              <button 
                onClick={handleToggleNativeChat}
                className={`p-3.5 rounded-xl transition-all duration-300 bg-white/5 border border-white/10 text-white hover:bg-white/15 relative ${isNativeChatOpen ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : ''}`}
                title={isNativeChatOpen ? "Hide Chat" : "Show Chat"}
              >
                <MessageSquare className="w-5.5 h-5.5" />
                {!isNativeChatOpen && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white border border-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Jitsi Native Polls Toggle */}
              <button 
                onClick={handleTogglePolls}
                className={`p-3.5 rounded-xl transition-all duration-300 bg-white/5 border border-white/10 text-white hover:bg-white/15 relative ${isPollsOpen ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : ''}`}
                title="Launch/View Polls"
              >
                <BarChart2 className="w-5.5 h-5.5" />
                {!isPollsOpen && unreadPollsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white border border-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    {unreadPollsCount}
                  </span>
                )}
              </button>

              <button 
                onClick={handleHangup}
                className="p-3.5 rounded-xl bg-red-600/80 border border-red-500/30 hover:bg-red-600 text-white transition-all duration-300 shadow-lg shadow-red-600/10 hover:shadow-red-600/35"
                title="Hang Up"
              >
                <PhoneOff className="w-5.5 h-5.5" />
              </button>

              <button 
                onClick={handleToggleSettings}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/15 transition-all duration-300"
                title="Settings"
              >
                <Settings className="w-5.5 h-5.5" />
              </button>
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
      `}} />

      {/* Top Header bar - Apple glass styling */}
      <div className="h-16 border-b border-white/10 bg-slate-950/20 backdrop-blur-xl flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10 border border-white/15">
            <Video className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight font-outfit text-white">Live Classroom</h1>
            <p className="text-[10px] font-mono text-white/40">Session ID: {id}</p>
          </div>
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

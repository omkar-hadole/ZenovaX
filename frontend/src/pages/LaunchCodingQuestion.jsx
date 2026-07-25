import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useSignInWithChatGPT } from '@openai-oauth/react';
import {
  ArrowLeft, Save, Rocket, Plus, Trash2, EyeOff, Eye,
  Code2, FileText, Sparkles, ChevronDown, Check, X, GripVertical, Link2, LogOut, ExternalLink
} from 'lucide-react';
import { apiCall } from '../utils/api';
import Toast from '../components/Toast';

const aiFillKeyframes = `
@keyframes ai-fill-pulse {
  0% { border-color: #8B84FF; background-color: rgba(139, 132, 255, 0.04); box-shadow: 0 0 0 0 rgba(139, 132, 255, 0.1); }
  30% { border-color: #8B84FF; background-color: rgba(139, 132, 255, 0.10); box-shadow: 0 0 0 4px rgba(139, 132, 255, 0.06); }
  70% { border-color: #8B84FF; background-color: rgba(139, 132, 255, 0.06); box-shadow: 0 0 0 8px rgba(139, 132, 255, 0.02); }
  100% { border-color: var(--ai-border, #e5e7eb); background-color: var(--ai-bg, #f9fafb); box-shadow: 0 0 0 0 rgba(139, 132, 255, 0); }
}
.ai-fill-target {
  animation: ai-fill-pulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.dark .ai-fill-target {
  --ai-border: #374151;
  --ai-bg: #1f2937;
}
`;

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
];

const SUPPORTED_TYPES = ['integer', 'float', 'string', 'boolean', 'integer[]', 'float[]', 'string[]', 'boolean[]', 'integer[][]', 'float[][]', 'string[][]', 'boolean[][]'];

const emptyStarterCode = { javascript: '', python: '', java: '' };

const TYPE_TO_JAVA = {
  integer: 'int', float: 'double', string: 'String', boolean: 'boolean',
  'integer[]': 'int[]', 'float[]': 'double[]', 'string[]': 'String[]', 'boolean[]': 'boolean[]',
  'integer[][]': 'int[][]', 'float[][]': 'double[][]', 'string[][]': 'String[][]', 'boolean[][]': 'boolean[][]'
};

const generateStarterCodeFromSignature = (functionName, parameters, returnType, language) => {
  const paramList = parameters.map(p => {
    if (language === 'python') return p.name;
    if (language === 'java') {
      return `${TYPE_TO_JAVA[p.type] || 'String'} ${p.name}`;
    }
    return p.name;
  }).join(', ');
  const returnJavaType = TYPE_TO_JAVA[returnType] || 'void';
  const templates = {
    javascript: `function ${functionName}(${paramList}) {\n  \n}`,
    python: `def ${functionName}(${paramList}):\n    pass\n`,
    java: `class Solution {\n    public static ${returnJavaType} ${functionName}(${paramList}) {\n        \n    }\n}\n`
  };
  return templates;
};

const styleSheet = document.createElement('style');
styleSheet.textContent = aiFillKeyframes;
document.head.appendChild(styleSheet);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default function LaunchCodingQuestion({ setActiveTab, mySessions }) {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [questionType, setQuestionType] = useState('legacy');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [questionData, setQuestionData] = useState({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    testCases: [{ input: '', output: '', isHidden: false }],
    points: 100,
    timeLimitMinutes: '',
    referenceSolution: ''
  });
  const [structuredData, setStructuredData] = useState({
    functionName: '',
    parameters: [{ name: '', type: 'integer' }],
    returnType: 'integer',
    structuredTestCases: [{ inputs: {}, expected: '' }]
  });
  const [allowedLanguages, setAllowedLanguages] = useState(['javascript', 'python', 'java']);
  const [starterCode, setStarterCode] = useState(emptyStarterCode);
  const [starterCodeTab, setStarterCodeTab] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [status, setStatus] = useState('DRAFT');
  const [toast, setToast] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [animatingFields, setAnimatingFields] = useState({});

  const {
    status: chatGptStatus,
    installUrl: chatGptInstallUrl,
    isSignedIn: chatGptConnected,
    login: connectChatGPT,
    logout: disconnectChatGPT,
  } = useSignInWithChatGPT({
    onSuccess: () => {
      setAiPrompt('');
      setToast({ message: 'ChatGPT connected! You can now generate questions with Zen.', type: 'success' });
    },
  });
  const needsChatGptExtension = chatGptStatus === 'needs-extension';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const loadQuestion = async () => {
      try {
        const data = await apiCall(`/coding-questions/${id}`);
        const q = data.question;
        if (q.status !== 'DRAFT') {
          setToast({ message: 'Only draft questions can be edited. Close and relaunch a new one instead.', type: 'error' });
        }
        setStatus(q.status);
        setSelectedSessionId(q.sessionId);

        const isStructured = q.questionType === 'structured';
        setQuestionType(isStructured ? 'structured' : 'legacy');

        if (isStructured) {
          let params = [{ name: '', type: 'integer' }];
          try {
            const parsed = typeof q.parameters === 'string' ? JSON.parse(q.parameters) : q.parameters;
            if (Array.isArray(parsed) && parsed.length > 0) params = parsed;
          } catch (e) { console.error('Failed to parse parameters', e); }

          let stcs = [{ inputs: {}, expected: '' }];
          try {
            const parsed = typeof q.structuredTestCases === 'string' ? JSON.parse(q.structuredTestCases) : q.structuredTestCases;
            if (Array.isArray(parsed) && parsed.length > 0) {
              stcs = parsed.map((tc, idx) => ({
                inputs: tc.inputs || {},
                expected: tc.expected ?? '',
                isHidden: typeof tc.isHidden === 'boolean' ? tc.isHidden : idx >= 2
              }));
            }
          } catch (e) { console.error('Failed to parse structured test cases', e); }

          setStructuredData({
            functionName: q.functionName || '',
            parameters: params,
            returnType: q.returnType || 'integer',
            structuredTestCases: stcs
          });

          const sigStarter = generateStarterCodeFromSignature(q.functionName, params, q.returnType);
          if (!q.starterCode) {
            setStarterCode({
              javascript: sigStarter.javascript || '',
              python: sigStarter.python || '',
              java: sigStarter.java || ''
            });
          }
        }

        let parsedTestCases = [{ input: '', output: '', isHidden: false }];
        try {
          const parsed = typeof q.testCases === 'string' ? JSON.parse(q.testCases) : q.testCases;
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsedTestCases = parsed.map((tc, idx) => ({
              input: tc.input || '',
              output: tc.output || '',
              isHidden: typeof tc.isHidden === 'boolean' ? tc.isHidden : idx >= 2
            }));
          }
        } catch (e) {
          console.error('Failed to parse existing test cases', e);
        }
        setQuestionData({
          title: q.title || '',
          description: q.description || '',
          difficulty: q.difficulty || 'MEDIUM',
          testCases: parsedTestCases,
          points: q.points ?? 100,
          timeLimitMinutes: q.timeLimitMinutes ?? '',
          referenceSolution: q.referenceSolution || ''
        });
        if (q.allowedLanguages) {
          try {
            const langs = typeof q.allowedLanguages === 'string' ? JSON.parse(q.allowedLanguages) : q.allowedLanguages;
            if (Array.isArray(langs) && langs.length > 0) setAllowedLanguages(langs);
          } catch (e) { console.error('Failed to parse allowedLanguages', e); }
        }
        if (q.starterCode) {
          try {
            const map = typeof q.starterCode === 'string' ? JSON.parse(q.starterCode) : q.starterCode;
            setStarterCode({ ...emptyStarterCode, ...map });
          } catch (e) { console.error('Failed to parse starterCode', e); }
        }
      } catch (error) {
        console.error('Failed to load question for editing', error);
        setToast({ message: 'Failed to load question', type: 'error' });
      } finally {
        setFetching(false);
      }
    };
    loadQuestion();
  }, [id, isEditMode]);

  const handleAddTestCase = () => {
    if (questionData.testCases.length >= 17) {
      setToast({ message: 'Maximum 17 test cases allowed', type: 'error' });
      return;
    }
    setQuestionData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', output: '', isHidden: prev.testCases.length >= 2 }]
    }));
  };

  const handleRemoveTestCase = (index) => {
    if (questionData.testCases.length > 1) {
      setQuestionData(prev => ({
        ...prev,
        testCases: prev.testCases.filter((_, i) => i !== index)
      }));
    }
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...questionData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setQuestionData(prev => ({ ...prev, testCases: newTestCases }));
  };

  const handleAddParameter = () => {
    setStructuredData(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', type: 'integer' }]
    }));
  };

  const handleRemoveParameter = (index) => {
    if (structuredData.parameters.length > 1) {
      setStructuredData(prev => ({
        ...prev,
        parameters: prev.parameters.filter((_, i) => i !== index)
      }));
    }
  };

  const handleParameterChange = (index, field, value) => {
    const newParams = [...structuredData.parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    setStructuredData(prev => ({ ...prev, parameters: newParams }));
  };

  const handleAddStructuredTestCase = () => {
    if (structuredData.structuredTestCases.length >= 17) {
      setToast({ message: 'Maximum 17 test cases allowed', type: 'error' });
      return;
    }
    const inputs = {};
    structuredData.parameters.forEach(p => { inputs[p.name] = ''; });
    setStructuredData(prev => ({
      ...prev,
      structuredTestCases: [...prev.structuredTestCases, { inputs, expected: '', isHidden: prev.structuredTestCases.length >= 2 }]
    }));
  };

  const handleRemoveStructuredTestCase = (index) => {
    if (structuredData.structuredTestCases.length > 1) {
      setStructuredData(prev => ({
        ...prev,
        structuredTestCases: prev.structuredTestCases.filter((_, i) => i !== index)
      }));
    }
  };

  const handleStructuredTestCaseChange = (index, field, value) => {
    const newCases = [...structuredData.structuredTestCases];
    if (field.startsWith('inputs.')) {
      const paramName = field.slice(7);
      newCases[index] = { ...newCases[index], inputs: { ...newCases[index].inputs, [paramName]: value } };
    } else {
      newCases[index] = { ...newCases[index], [field]: value };
    }
    setStructuredData(prev => ({ ...prev, structuredTestCases: newCases }));
  };

  const toggleLanguage = (lang) => {
    setAllowedLanguages(prev => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const handleSubmit = async (isLaunch = false) => {
    if (!selectedSessionId) {
      setToast({ message: 'Please select a session', type: 'error' });
      return;
    }
    if (!questionData.title || !questionData.description) {
      setToast({ message: 'Please fill in title and description', type: 'error' });
      return;
    }

    const isStructured = questionType === 'structured';

    if (isStructured) {
      if (!structuredData.functionName || !structuredData.functionName.trim()) {
        setToast({ message: 'Please provide a function name', type: 'error' });
        return;
      }
      const validParams = structuredData.parameters.filter(p => p.name && p.name.trim());
      if (validParams.length === 0) {
        setToast({ message: 'Please add at least one parameter', type: 'error' });
        return;
      }
    } else {
      const validTestCases = questionData.testCases.filter(tc => tc.input && tc.output);
      if (validTestCases.length === 0) {
        setToast({ message: 'Please add at least one valid test case (input/output pair)', type: 'error' });
        return;
      }
    }

    setLoading(true);
    try {
      const basePayload = {
        title: questionData.title,
        description: questionData.description,
        difficulty: questionData.difficulty,
        sessionId: selectedSessionId,
        allowedLanguages: allowedLanguages.length === LANGUAGES.length ? null : allowedLanguages,
        starterCode: Object.fromEntries(allowedLanguages.map(l => [l, starterCode[l] || ''])),
        referenceSolution: questionData.referenceSolution || null,
        timeLimitMinutes: questionData.timeLimitMinutes === '' ? null : Number(questionData.timeLimitMinutes),
        points: questionData.points === '' ? 100 : Number(questionData.points)
      };

      const payload = isStructured
        ? {
            ...basePayload,
            questionType: 'structured',
            functionName: structuredData.functionName,
            parameters: structuredData.parameters.filter(p => p.name && p.name.trim()),
            returnType: structuredData.returnType,
            structuredTestCases: structuredData.structuredTestCases,
            testCases: undefined
          }
        : {
            ...basePayload,
            questionType: 'legacy',
            testCases: questionData.testCases.filter(tc => tc.input && tc.output)
          };

      let questionId = id;
      if (isEditMode) {
        await apiCall(`/coding-questions/${id}`, 'PUT', payload);
      } else {
        const response = await apiCall('/coding-questions/create', 'POST', payload);
        questionId = response.codingQuestion?.id;
      }

      if (isLaunch && questionId) {
        await apiCall(`/coding-questions/${questionId}/launch`, 'PUT');
        setToast({ message: 'Coding Question Launched Successfully!', type: 'success' });
      } else {
        setToast({ message: isEditMode ? 'Changes Saved Successfully!' : 'Draft Saved Successfully!', type: 'success' });
      }
      setTimeout(() => {
        setActiveTab('Dashboard');
      }, 1500);
    } catch (error) {
      console.error('Submission error:', error);
      setToast({ message: error.message || 'Failed to save/launch question', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setToast({ message: 'Please describe the question you want to generate', type: 'error' });
      return;
    }
    setAiGenerating(true);
    setAiFilled(false);
    try {
      const data = await apiCall('/help/generate-question', 'POST', { prompt: aiPrompt });
      if (data.error) {
        setToast({ message: data.error, type: 'error' });
        return;
      }
      const q = data.question;
      if (!q) {
        setToast({ message: 'Zen returned an empty response. Try again.', type: 'error' });
        return;
      }

      const params = (q.parameters || []).filter(p => p.name);
      const stcs = (q.testCases || []).slice(0, 17).map((tc, idx) => ({
        inputs: tc.inputs || {},
        expected: typeof tc.expected === 'string' ? tc.expected : JSON.stringify(tc.expected),
        isHidden: tc.isHidden === true || idx >= 3,
      }));

      setQuestionType('structured');

      const fieldIds = [];
      const schedule = [];

      if (q.title) {
        schedule.push(async () => {
          setAnimatingFields(p => ({ ...p, title: true }));
          setQuestionData(prev => ({ ...prev, title: q.title }));
          await sleep(30);
          setAnimatingFields(p => ({ ...p, title: false }));
        });
        fieldIds.push('title');
      }
      if (q.difficulty) {
        schedule.push(async () => {
          setQuestionData(prev => ({ ...prev, difficulty: q.difficulty }));
        });
      }
      if (q.description) {
        schedule.push(async () => {
          setAnimatingFields(p => ({ ...p, description: true }));
          setQuestionData(prev => ({ ...prev, description: q.description }));
          await sleep(50);
          setAnimatingFields(p => ({ ...p, description: false }));
        });
      }
      if (q.functionName) {
        schedule.push(async () => {
          setAnimatingFields(p => ({ ...p, functionName: true }));
          setStructuredData(prev => ({ ...prev, functionName: q.functionName }));
          await sleep(30);
          setAnimatingFields(p => ({ ...p, functionName: false }));
        });
      }
      if (q.returnType) {
        schedule.push(async () => {
          setStructuredData(prev => ({ ...prev, returnType: q.returnType }));
        });
      }
      if (params.length > 0) {
        schedule.push(async () => {
          setAnimatingFields(p => ({ ...p, parameters: true }));
          setStructuredData(prev => ({ ...prev, parameters: params }));
          await sleep(40);
          setAnimatingFields(p => ({ ...p, parameters: false }));
        });
      }
      if (stcs.length > 0) {
        schedule.push(async () => {
          setAnimatingFields(p => ({ ...p, testCases: true }));
          setStructuredData(prev => ({ ...prev, structuredTestCases: stcs }));
          await sleep(60);
          setAnimatingFields(p => ({ ...p, testCases: false }));
        });
      }
      if (q.functionName && params.length > 0 && q.returnType) {
        schedule.push(async () => {
          setAnimatingFields(p => ({ ...p, starterCode: true }));
          const sigStarter = generateStarterCodeFromSignature(q.functionName, params, q.returnType);
          setStarterCode(prev => ({
            ...prev,
            javascript: sigStarter.javascript || prev.javascript,
            python: sigStarter.python || prev.python,
            java: sigStarter.java || prev.java,
          }));
          await sleep(50);
          setAnimatingFields(p => ({ ...p, starterCode: false }));
        });
      }

      for (const step of schedule) {
        await step();
        await sleep(120);
      }

      setAiPrompt('');
      setAiFilled(true);
      setTimeout(() => setAiFilled(false), 2000);
      setToast({ message: 'Question generated! Review and edit before saving.', type: 'success' });
    } catch (error) {
      console.error('AI generate error:', error);
      setToast({ message: error.message || 'Failed to generate question', type: 'error' });
    } finally {
      setAiGenerating(false);
    }
  };

  const buildSignaturePreview = () => {
    const { functionName, parameters, returnType } = structuredData;
    if (!functionName.trim()) return null;
    const validParams = parameters.filter(p => p.name.trim());
    const parts = validParams.map(p => `${p.name}: ${p.type}`);
    return `${functionName}(${parts.join(', ')}) → ${returnType}`;
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#C9C7F5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading question...</p>
        </div>
      </div>
    );
  }

  const isLocked = isEditMode && status === 'CLOSED';
  const isEditingLive = isEditMode && status === 'LIVE';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('Dashboard')}
          className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Coding Question' : 'Create Coding Question'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditMode ? 'Update this coding challenge' : 'Build a new coding challenge for your students'}
          </p>
        </div>
      </div>

      {isLocked && (
        <div className="mb-6 px-4 py-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-400">
          This question is closed and can no longer be edited. Create a new one to make changes.
        </div>
      )}

      {isEditingLive && (
        <div className="mb-6 px-4 py-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-sm text-blue-800 dark:text-blue-400">
          This question is live — changes, including new or edited test cases, apply immediately for students.
        </div>
      )}

      <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-60">
        {/* ─── AI GENERATE ─── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-200 hover:shadow-md">
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#8B84FF]/10 dark:bg-[#8B84FF]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#8B84FF] dark:text-[#8B84FF]" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Generate with Zen</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Describe the problem — Zen fills everything in</p>
              </div>
              {chatGptConnected && (
                <button
                  type="button"
                  onClick={disconnectChatGPT}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  title="Disconnect ChatGPT"
                >
                  <LogOut className="w-3 h-3" /> Disconnect
                </button>
              )}
            </div>
            {chatGptConnected ? (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !aiGenerating) handleAIGenerate(); }}
                    className={`w-full p-3.5 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border-2 rounded-xl text-sm outline-none transition-all duration-300 ${
                      aiFilled
                        ? 'border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/5'
                        : aiGenerating
                          ? 'border-[#8B84FF]/40 dark:border-[#8B84FF]/40 bg-[#8B84FF]/5 dark:bg-[#8B84FF]/5'
                          : 'border-gray-200 dark:border-gray-700 focus:border-[#8B84FF]/50 dark:focus:border-[#8B84FF]/50 focus:bg-white dark:focus:bg-gray-800'
                    }`}
                    placeholder='e.g. "two sum problem with 8 test cases"'
                    disabled={aiGenerating}
                  />
                  {aiGenerating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B84FF] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B84FF] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B84FF] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  {aiFilled && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="w-4 h-4 text-green-500 animate-bounce" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  className="flex items-center gap-2 px-5 py-3.5 bg-[#8B84FF] text-white rounded-xl font-medium hover:bg-[#7B74F0] transition-all disabled:opacity-50 whitespace-nowrap shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <Sparkles className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} />
                  {aiGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#8B84FF]/10 dark:bg-[#8B84FF]/10 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-4 h-4 text-[#8B84FF]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Connect ChatGPT to generate questions with Zen</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Connect once — works across Zen chat and coding question generation</p>
                  </div>
                  {needsChatGptExtension ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(chatGptInstallUrl, '_blank', 'noopener,noreferrer')}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B84FF] text-white rounded-xl font-medium hover:bg-[#7B74F0] transition-all text-sm whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Install Extension
                      </button>
                      <button
                        type="button"
                        onClick={connectChatGPT}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#8B84FF] dark:hover:text-[#8B84FF] underline underline-offset-2 whitespace-nowrap"
                      >
                        Installed? Try again
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={connectChatGPT}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B84FF] text-white rounded-xl font-medium hover:bg-[#7B74F0] transition-all text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Connect ChatGPT
                    </button>
                  )}
                </div>
              </div>
            )}
            <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#8B84FF]" />
              Auto-fills title, description, function signature, parameters, and test cases
            </p>
          </div>
        </div>

        {/* ─── 1. BASIC DETAILS ─── */}
        <Section title="Basic Details" icon={FileText} defaultOpen={true}>
          <div className="space-y-5">
            {/* Session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Session <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all"
              >
                <option value="">Choose a session...</option>
                {mySessions.map(session => (
                  <option key={session.id} value={session.id}>{session.title}</option>
                ))}
              </select>
            </div>

            {/* Title + Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Question Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={questionData.title}
                  onChange={(e) => setQuestionData({ ...questionData, title: e.target.value })}
                  className={`w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all ${animatingFields.title ? 'ai-fill-target' : ''}`}
                  placeholder="e.g. Reverse a Linked List"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty</label>
                <select
                  value={questionData.difficulty}
                  onChange={(e) => setQuestionData({ ...questionData, difficulty: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {/* Points + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Points</label>
                <input
                  type="number"
                  min="0"
                  value={questionData.points}
                  onChange={(e) => setQuestionData({ ...questionData, points: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time Limit (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={questionData.timeLimitMinutes}
                  onChange={(e) => setQuestionData({ ...questionData, timeLimitMinutes: e.target.value })}
                  placeholder="No limit"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Problem Statement <span className="text-red-400">*</span>
              </label>
              <textarea
                value={questionData.description}
                onChange={(e) => setQuestionData({ ...questionData, description: e.target.value })}
                rows={5}
                className={`w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all resize-y ${animatingFields.description ? 'ai-fill-target' : ''}`}
                placeholder="Describe the problem, input format, constraints, example, etc."
              />
            </div>
          </div>
        </Section>

        {/* ─── 2. QUESTION TYPE ─── */}
        <Section title="Question Type" icon={questionType === 'structured' ? Code2 : FileText} defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setQuestionType('structured')}
              className={`relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                questionType === 'structured'
                  ? 'border-[#C9C7F5] bg-[#C9C7F5]/10 dark:bg-[#C9C7F5]/5 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B84FF]/10 dark:bg-[#8B84FF]/20 text-[#8B84FF] dark:text-[#8B84FF]">
                  Recommended
                </span>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                questionType === 'structured'
                  ? 'bg-[#C9C7F5] text-[#5a59b5]'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                <Code2 className="w-4 h-4" />
              </div>
              <span className={`text-sm font-bold mb-1 ${
                questionType === 'structured' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
              }`}>Structured</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Typed function with parameters, return type — modern, auto-gradable
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuestionType('legacy')}
              className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                questionType === 'legacy'
                  ? 'border-[#C9C7F5] bg-[#C9C7F5]/10 dark:bg-[#C9C7F5]/5 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                questionType === 'legacy'
                  ? 'bg-[#C9C7F5] text-[#5a59b5]'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <span className={`text-sm font-bold mb-1 ${
                questionType === 'legacy' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
              }`}>Legacy</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Free-form solve(input) → output — flexible but requires manual grading
              </span>
            </button>
          </div>
        </Section>

        {/* ─── 3. FUNCTION SETUP (Structured only) ─── */}
        {questionType === 'structured' && (
          <Section title="Function Setup" icon={Code2} defaultOpen={true}>
            <div className="space-y-5">
              {/* Function Name + Return Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Function Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={structuredData.functionName}
                    onChange={(e) => setStructuredData(prev => ({ ...prev, functionName: e.target.value }))}
                    className={`w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all font-mono text-sm ${animatingFields.functionName ? 'ai-fill-target' : ''}`}
                    placeholder="e.g. twoSum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Return Type</label>
                  <select
                    value={structuredData.returnType}
                    onChange={(e) => setStructuredData(prev => ({ ...prev, returnType: e.target.value }))}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all text-sm"
                  >
                    {SUPPORTED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Parameters</label>
                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#5a59b5] hover:text-[#4a49a5] dark:text-[#C9C7F5] dark:hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Parameter
                  </button>
                </div>
                <div className={`space-y-2.5 ${animatingFields.parameters ? 'ai-fill-target' : ''}`}>
                  {structuredData.parameters.map((param, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center group">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => handleParameterChange(idx, 'name', e.target.value)}
                        className="flex-1 min-w-0 p-2.5 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all font-mono text-sm"
                        placeholder="param name"
                      />
                      <select
                        value={param.type}
                        onChange={(e) => handleParameterChange(idx, 'type', e.target.value)}
                        className="p-2.5 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all text-sm w-32"
                      >
                        {SUPPORTED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {structuredData.parameters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          aria-label={`Remove parameter ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Signature Preview */}
              {buildSignaturePreview() && (
                <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">Signature Preview</span>
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                    {buildSignaturePreview()}
                  </code>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ─── 4. TEST CASES ─── */}
        {questionType === 'structured' ? (
          <Section title="Test Cases" icon={questionType === 'structured' ? Check : FileText} defaultOpen={true}>
            <div className={`space-y-4 ${animatingFields.testCases ? 'ai-fill-target' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Define input/output pairs to validate student solutions
                </p>
                <button
                  type="button"
                  onClick={handleAddStructuredTestCase}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#5a59b5] hover:text-[#4a49a5] dark:text-[#C9C7F5] dark:hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Case
                </button>
              </div>

              {structuredData.structuredTestCases.length === 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No test cases yet. Click "Add Case" to create one.</p>
                </div>
              )}

              {structuredData.structuredTestCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Case #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStructuredTestCaseChange(idx, 'isHidden', !tc.isHidden)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          tc.isHidden
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {tc.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {tc.isHidden ? 'Hidden' : 'Visible'}
                      </button>
                      {structuredData.structuredTestCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStructuredTestCase(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                          aria-label={`Remove case ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {structuredData.parameters.filter(p => p.name && p.name.trim()).map(param => (
                        <div key={param.name}>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">
                            {param.name} <span className="text-gray-400 font-normal">({param.type})</span>
                          </label>
                          <input
                            type="text"
                            value={tc.inputs[param.name] || ''}
                            onChange={(e) => handleStructuredTestCaseChange(idx, `inputs.${param.name}`, e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all font-mono text-sm"
                            placeholder={`Value for ${param.name}...`}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">
                          Expected <span className="text-gray-400 font-normal">({structuredData.returnType})</span>
                        </label>
                        <input
                          type="text"
                          value={tc.expected}
                          onChange={(e) => handleStructuredTestCaseChange(idx, 'expected', e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all font-mono text-sm"
                          placeholder="Expected result..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : (
          <Section title="Test Cases" icon={FileText} defaultOpen={true}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Define free-form input/output pairs
                </p>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#5a59b5] hover:text-[#4a49a5] dark:text-[#C9C7F5] dark:hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Case
                </button>
              </div>

              {questionData.testCases.length === 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No test cases yet. Click "Add Case" to create one.</p>
                </div>
              )}

              {questionData.testCases.map((tc, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Case #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestCaseChange(index, 'isHidden', !tc.isHidden)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          tc.isHidden
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {tc.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {tc.isHidden ? 'Hidden' : 'Visible'}
                      </button>
                      {questionData.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                          aria-label={`Remove case ${index + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Input</label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                          rows={2}
                          className="w-full p-2.5 bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all font-mono text-sm resize-none"
                          placeholder="Input data..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Expected Output</label>
                        <textarea
                          value={tc.output}
                          onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                          rows={2}
                          className="w-full p-2.5 bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all font-mono text-sm resize-none"
                          placeholder="Expected output..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ─── 5. ALLOWED LANGUAGES + STARTER CODE ─── */}
        <Section title="Starter Code & Languages" icon={Code2} defaultOpen={true}>
          <div className="space-y-5">
            {/* Allowed Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Languages</label>
              <div className="flex flex-wrap gap-2.5">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => toggleLanguage(lang.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
                      allowedLanguages.includes(lang.value)
                        ? 'bg-[#C9C7F5]/20 dark:bg-[#C9C7F5]/10 text-[#5a59b5] dark:text-[#C9C7F5] border-[#C9C7F5] shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {allowedLanguages.includes(lang.value) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5 opacity-0" />
                    )}
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Starter Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Starter Code <span className="text-gray-400 font-normal">(optional, per language)</span></label>
              <div className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 ${animatingFields.starterCode ? 'ai-fill-target' : ''}`}>
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                  {LANGUAGES.filter(l => allowedLanguages.includes(l.value)).map(lang => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setStarterCodeTab(lang.value)}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        starterCodeTab === lang.value
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                <Editor
                  height="200px"
                  language={allowedLanguages.includes(starterCodeTab) ? starterCodeTab : allowedLanguages[0]}
                  value={starterCode[allowedLanguages.includes(starterCodeTab) ? starterCodeTab : allowedLanguages[0]] || ''}
                  theme="vs-dark"
                  onChange={(value) => setStarterCode(prev => ({ ...prev, [starterCodeTab]: value }))}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 6. ADDITIONAL SETTINGS ─── */}
        <Section title="Additional Settings" icon={FileText} defaultOpen={false}>
          <div className="space-y-5">
            {/* Reference Solution */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Reference Solution
              </label>
              <div className="relative">
                <textarea
                  value={questionData.referenceSolution}
                  onChange={(e) => setQuestionData({ ...questionData, referenceSolution: e.target.value })}
                  rows={4}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent transition-all font-mono text-sm resize-y"
                  placeholder="Never shown to students — for your reference when reviewing submissions."
                />
                <div className="absolute bottom-3 right-3">
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                    Mentor only
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </fieldset>

      {/* ─── STICKY FOOTER ─── */}
      <div className="sticky bottom-0 z-40 mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-[#F4F4F9]/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
          {isEditingLive ? (
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</span>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</span>
                ) : (
                  <><Rocket className="w-4 h-4" /> Launch Question</>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function Section({ title, icon: Icon, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </div>
          )}
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

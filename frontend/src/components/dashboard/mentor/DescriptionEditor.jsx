import React, { useRef, useCallback, useEffect } from 'react';
import { Bold, List, ListOrdered } from 'lucide-react';
import { countLines, cleanDescription, insertFormatting, MAX_LINES } from '../../../utils/descriptionFormatter';

export default function DescriptionEditor({ id, value, onChange, placeholder }) {
  const textareaRef = useRef(null);
  const lineCount = countLines(value);
  const isAtLimit = lineCount >= MAX_LINES;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleFormat = useCallback((type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const result = insertFormatting(value, textarea, type);
    onChange(result.text);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = result.cursorStart;
      textarea.selectionEnd = result.cursorEnd;
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      handleFormat('bold');
      return;
    }

    if (e.key === 'Enter') {
      if (isAtLimit) {
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [value, onChange, isAtLimit, handleFormat]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    if (countLines(newValue) > MAX_LINES) {
      return;
    }
    onChange(newValue);
  }, [onChange]);

  const handlePaste = useCallback((e) => {
    if (isAtLimit) {
      e.preventDefault();
      return;
    }

    const textarea = textareaRef.current;
    const pastedText = e.clipboardData.getData('text');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentLineCount = textarea.value.split('\n').length;
    const selectedLineCount = textarea.value.substring(start, end).split('\n').length;
    const pastedLineCount = pastedText.split('\n').length;
    const totalAfterPaste = currentLineCount - selectedLineCount + pastedLineCount;

    if (totalAfterPaste >= MAX_LINES) {
      e.preventDefault();
      const linesBefore = textarea.value.substring(0, start).split('\n').length;
      const linesAfter = textarea.value.substring(end).split('\n').length - 1;
      const consumedLines = linesBefore + linesAfter;
      const availableLines = MAX_LINES - consumedLines;
      const truncated = pastedText.split('\n').slice(0, Math.max(0, availableLines)).join('\n');
      const newValue = textarea.value.substring(0, start) + truncated + textarea.value.substring(end);
      onChange(cleanDescription(newValue));
    }
  }, [value, onChange, isAtLimit]);

  return (
    <div className="rounded-xl bg-gray-50 border-none focus-within:ring-2 focus-within:ring-[#C9C7F5] transition-all overflow-hidden">
      <div role="toolbar" aria-label="Text formatting" className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
        <button
          type="button"
          onClick={() => handleFormat('bold')}
          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleFormat('bullet')}
          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
          title="Bullet list"
          aria-label="Bullet list"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleFormat('numbered')}
          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered size={16} />
        </button>
      </div>
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        rows={4}
        required
        placeholder={placeholder || 'Describe the key takeaways and learning outcomes...'}
        className="w-full px-4 py-3.5 bg-transparent border-none focus:outline-none resize-none placeholder:text-gray-400 min-h-[120px]"
        aria-label={placeholder || 'Describe the key takeaways and learning outcomes...'}
      />
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
        <span className={`text-xs font-medium ${isAtLimit ? 'text-amber-600' : 'text-gray-400'}`}>
          {isAtLimit && (
            <span className="mr-1">Max lines reached</span>
          )}
        </span>
        <span
          aria-live="polite"
          aria-atomic="true"
          className={`text-xs font-medium ${isAtLimit ? 'text-amber-600' : 'text-gray-400'}`}
        >
          {lineCount}/{MAX_LINES} lines
        </span>
      </div>
    </div>
  );
}

export const MAX_LINES = 15;

export function countLines(text) {
  if (!text) return 0;
  return text.split('\n').length;
}

export function cleanDescription(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim()
    .replace(/\n{3,}/g, '\n\n');
}

export function isAtLineLimit(text) {
  return countLines(text) >= MAX_LINES;
}

export function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function insertFormatting(text, textarea, type) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = text.substring(start, end);
  const before = text.substring(0, start);
  const after = text.substring(end);

  switch (type) {
    case 'bold': {
      const wrapped = selected ? `**${selected}**` : '**bold text**';
      return {
        text: before + wrapped + after,
        cursorStart: start + (selected ? 2 : 0),
        cursorEnd: start + wrapped.length - (selected ? 0 : 2),
      };
    }
    case 'bullet': {
      const lineStart = before.lastIndexOf('\n') + 1;
      const lineContent = text.substring(lineStart, end);
      const isAlreadyBullet = lineContent.startsWith('- ');
      if (isAlreadyBullet) {
        const newText = before.substring(0, lineStart) + lineContent.substring(2) + after;
        return { text: newText, cursorStart: start - 2, cursorEnd: end - 2 };
      }
      const prefix = before.substring(lineStart);
      const newBefore = before;
      const inserted = '- ';
      return {
        text: newBefore + inserted + selected + after,
        cursorStart: start + inserted.length,
        cursorEnd: start + inserted.length + selected.length,
      };
    }
    case 'numbered': {
      const lineStart = before.lastIndexOf('\n') + 1;
      const lineContent = text.substring(lineStart, end);
      const numMatch = lineContent.match(/^\d+\.\s/);
      if (numMatch) {
        const newText = before.substring(0, lineStart) + lineContent.substring(numMatch[0].length) + after;
        return { text: newText, cursorStart: start - numMatch[0].length, cursorEnd: end - numMatch[0].length };
      }
      const inserted = '1. ';
      return {
        text: before + inserted + selected + after,
        cursorStart: start + inserted.length,
        cursorEnd: start + inserted.length + selected.length,
      };
    }
    default:
      return { text, cursorStart: start, cursorEnd: end };
  }
}

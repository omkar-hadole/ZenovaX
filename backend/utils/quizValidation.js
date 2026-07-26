function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function validateCreateQuiz(data) {
  const errors = [];

  if (!data || typeof data !== 'object') return { valid: false, error: 'Request body is required' };

  if (!data.sessionId || !isUUID(data.sessionId)) {
    errors.push('sessionId: valid UUID is required');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('title: is required');
  } else if (data.title.length > 200) {
    errors.push('title: must be at most 200 characters');
  }

  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.push('description: must be a string');
  } else if (data.description && data.description.length > 2000) {
    errors.push('description: must be at most 2000 characters');
  }

  if (data.duration !== undefined && data.duration !== null) {
    const d = Number(data.duration);
    if (!Number.isInteger(d) || d < 0 || d > 1440) {
      errors.push('duration: must be an integer between 0 and 1440');
    }
  }

  if (data.totalMarks !== undefined) {
    const tm = Number(data.totalMarks);
    if (!Number.isInteger(tm) || tm < 0) {
      errors.push('totalMarks: must be a non-negative integer');
    }
  }

  if (data.passingMarks !== undefined) {
    const pm = Number(data.passingMarks);
    if (!Number.isInteger(pm) || pm < 0) {
      errors.push('passingMarks: must be a non-negative integer');
    }
  }

  if (data.passingMarks !== undefined && data.totalMarks !== undefined) {
    if (Number(data.passingMarks) > Number(data.totalMarks)) {
      errors.push('passingMarks: cannot exceed totalMarks');
    }
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('questions: at least 1 question is required');
  } else if (data.questions.length > 200) {
    errors.push('questions: maximum 200 questions allowed');
  } else {
    data.questions.forEach((q, i) => {
      const prefix = `questions[${i}]`;

      if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim().length === 0) {
        errors.push(`${prefix}.questionText: is required`);
      } else if (q.questionText.length > 2000) {
        errors.push(`${prefix}.questionText: must be at most 2000 characters`);
      }

      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`${prefix}.options: at least 2 options required`);
      } else if (q.options.length > 10) {
        errors.push(`${prefix}.options: maximum 10 options allowed`);
      } else {
        q.options.forEach((opt, oi) => {
          if (typeof opt !== 'string' || opt.trim().length === 0) {
            errors.push(`${prefix}.options[${oi}]: cannot be empty`);
          } else if (opt.length > 500) {
            errors.push(`${prefix}.options[${oi}]: must be at most 500 characters`);
          }
        });
      }

      if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || q.correctAnswer.trim().length === 0) {
        errors.push(`${prefix}.correctAnswer: is required`);
      }

      if (q.marks !== undefined) {
        const m = Number(q.marks);
        if (!Number.isInteger(m) || m < 1 || m > 1000) {
          errors.push(`${prefix}.marks: must be an integer between 1 and 1000`);
        }
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return {
    valid: true,
    data: {
      sessionId: data.sessionId,
      title: data.title.trim(),
      description: data.description || '',
      duration: data.duration !== undefined && data.duration !== null ? Number(data.duration) : null,
      totalMarks: Number(data.totalMarks) || 0,
      passingMarks: Number(data.passingMarks) || 0,
      questions: data.questions.map((q, i) => ({
        questionText: q.questionText.trim(),
        options: q.options.map(o => o.trim()),
        correctAnswer: q.correctAnswer.trim(),
        marks: Number(q.marks) || 1,
        order: i + 1
      }))
    }
  };
}

function validateEditQuiz(data) {
  const errors = [];
  const cleaned = {};

  if (!data || typeof data !== 'object') return { valid: false, error: 'Request body is required' };

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('title: is required');
    } else if (data.title.length > 200) {
      errors.push('title: must be at most 200 characters');
    } else {
      cleaned.title = data.title.trim();
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('description: must be a string');
    } else if (data.description.length > 2000) {
      errors.push('description: must be at most 2000 characters');
    } else {
      cleaned.description = data.description;
    }
  }

  if (data.duration !== undefined) {
    if (data.duration !== null) {
      const d = Number(data.duration);
      if (!Number.isInteger(d) || d < 0 || d > 1440) {
        errors.push('duration: must be an integer between 0 and 1440 or null');
      } else {
        cleaned.duration = d;
      }
    } else {
      cleaned.duration = null;
    }
  }

  if (data.totalMarks !== undefined) {
    const tm = Number(data.totalMarks);
    if (!Number.isInteger(tm) || tm < 0) {
      errors.push('totalMarks: must be a non-negative integer');
    } else {
      cleaned.totalMarks = tm;
    }
  }

  if (data.passingMarks !== undefined) {
    const pm = Number(data.passingMarks);
    if (!Number.isInteger(pm) || pm < 0) {
      errors.push('passingMarks: must be a non-negative integer');
    } else {
      cleaned.passingMarks = pm;
    }
  }

  if (data.passingMarks !== undefined && data.totalMarks !== undefined) {
    if (cleaned.passingMarks !== undefined && cleaned.totalMarks !== undefined && cleaned.passingMarks > cleaned.totalMarks) {
      errors.push('passingMarks: cannot exceed totalMarks');
    }
  }

  if (data.questions !== undefined) {
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      errors.push('questions: at least 1 question is required');
    } else if (data.questions.length > 200) {
      errors.push('questions: maximum 200 questions allowed');
    } else {
      const qs = [];
      data.questions.forEach((q, i) => {
        const prefix = `questions[${i}]`;
        if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim().length === 0) {
          errors.push(`${prefix}.questionText: is required`);
        } else if (q.questionText.length > 2000) {
          errors.push(`${prefix}.questionText: must be at most 2000 characters`);
        }

        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`${prefix}.options: at least 2 options required`);
        } else if (q.options.length > 10) {
          errors.push(`${prefix}.options: maximum 10 options allowed`);
        } else {
          q.options.forEach((opt, oi) => {
            if (typeof opt !== 'string' || opt.trim().length === 0) {
              errors.push(`${prefix}.options[${oi}]: cannot be empty`);
            } else if (opt.length > 500) {
              errors.push(`${prefix}.options[${oi}]: must be at most 500 characters`);
            }
          });
        }

        if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || q.correctAnswer.trim().length === 0) {
          errors.push(`${prefix}.correctAnswer: is required`);
        }

        qs.push({
          questionText: (q.questionText || '').trim(),
          options: (q.options || []).map(o => o.trim()),
          correctAnswer: (q.correctAnswer || '').trim(),
          marks: Number(q.marks) || 1
        });
      });
      cleaned.questions = qs;
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true, data: cleaned };
}

function validateSubmitQuiz(data) {
  const errors = [];

  if (!data || typeof data !== 'object') return { valid: false, error: 'Request body is required' };

  if (!data.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) {
    errors.push('answers: object mapping questionId to answer is required');
  }

  if (data.startedAt !== undefined && typeof data.startedAt !== 'string') {
    errors.push('startedAt: must be a string (ISO datetime)');
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true, data: { answers: data.answers, startedAt: data.startedAt } };
}

module.exports = { validateCreateQuiz, validateEditQuiz, validateSubmitQuiz };

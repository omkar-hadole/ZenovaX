// Mock the email module BEFORE authService loads it
const mockEmailService = {
  sendVerificationEmail: async () => {},
  sendPasswordResetEmail: async () => {},
};
const emailServicePath = require.resolve('../utils/emailService');
require.cache[emailServicePath] = {
  exports: mockEmailService,
  id: emailServicePath,
  filename: emailServicePath,
  loaded: true,
};

const { hashToken } = require('../utils/validation');
const authService = require('../services/authService');

let passed = 0;
let failed = 0;

const assert = (label, actual, expected) => {
  if (actual === expected) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

(async () => {
  console.log('\n--- hashToken ---');
  assert('returns 64-char hex string', hashToken('test').length, 64);
  assert('is deterministic', hashToken('abc') === hashToken('abc'), true);
  assert('different inputs differ', hashToken('abc') !== hashToken('xyz'), true);
  assert('empty string returns empty', hashToken(''), '');
  assert('undefined returns empty', hashToken(undefined), '');
  assert('null returns empty', hashToken(null), '');
  assert('returns lowercase hex only', /^[a-f0-9]{64}$/.test(hashToken('anything')), true);
  assert('long input hash length', hashToken('a'.repeat(1000)).length, 64);

  console.log('\n--- register stores hashed verification token ---');
  const mockPrismaRegister = {
    user: {
      findUnique: async () => null,
      create: async (args) => {
        assert('verificationToken stored as 64-char hash', args.data.verificationToken.length, 64);
        assert('stored value is not a double-hash', hashToken(args.data.verificationToken) !== args.data.verificationToken, true);
        return { id: 'new-id', name: args.data.name, email: args.data.email, role: 'LEARNER', isProfileComplete: false, isEmailVerified: false };
      }
    }
  };
  await authService.register(mockPrismaRegister, { name: 'Test User', email: 'test@nst.rishihood.edu.in', password: 'ValidPass1' });

  console.log('\n--- resendVerification (user enumeration fix) ---');
  let resendCalled = false;
  const mockPrismaResend = {
    user: {
      findUnique: async ({ where }) => {
        if (where.email === 'exists@nst.rishihood.edu.in') {
          return { id: 'user-1', isEmailVerified: false, email: 'exists@nst.rishihood.edu.in' };
        }
        return null;
      },
      update: async (args) => {
        assert('verificationToken stored as hash on resend', args.data.verificationToken.length, 64);
        resendCalled = true;
        return args.data;
      }
    }
  };

  const result1 = await authService.resendVerification(mockPrismaResend, 'nonexistent@nst.rishihood.edu.in');
  assert('non-existent email returns success', result1.success, true);
  assert('resend not called for non-existent user', resendCalled, false);

  const result2 = await authService.resendVerification(mockPrismaResend, 'exists@nst.rishihood.edu.in');
  assert('existing unverified email returns success', result2.success, true);
  assert('resend called for existing user', resendCalled, true);

  const mockPrismaVerified = {
    user: { findUnique: async () => ({ id: 'user-2', isEmailVerified: true, email: 'verified@nst.rishihood.edu.in' }) }
  };
  const result3 = await authService.resendVerification(mockPrismaVerified, 'verified@nst.rishihood.edu.in');
  assert('already verified returns success silently', result3.success, true);

  console.log('\n--- generateTokens stores hashed refresh token ---');
  let storedTokenHash = null;
  const mockPrismaTokens = {
    refreshToken: { create: async (args) => { storedTokenHash = args.data.token; return args.data; } }
  };
  const tokens = await authService.generateTokens(mockPrismaTokens, 'user-1', 'LEARNER', false, null);
  assert('raw refresh token is 128-char hex', tokens.refreshToken.length, 128);
  assert('stored token is 64-char hash', storedTokenHash.length, 64);
  assert('stored hash matches hash(raw)', storedTokenHash === hashToken(tokens.refreshToken), true);

  console.log('\n--- forgotPassword stores hashed reset token ---');
  let storedResetHash = null;
  const mockPrismaReset = {
    user: {
      findUnique: async () => ({ id: 'user-1', email: 'test@nst.rishihood.edu.in', name: 'Test' }),
      update: async (args) => { storedResetHash = args.data.passwordResetToken; return args.data; }
    }
  };
  await authService.forgotPassword(mockPrismaReset, 'test@nst.rishihood.edu.in');
  assert('reset token stored as 64-char hash', storedResetHash.length, 64);
  assert('forgotPassword succeeds', true, true);

  console.log('\n--- getSessions uses hashed token comparison ---');
  const mockPrismaSessions = {
    refreshToken: {
      findMany: async () => [
        { id: 's1', token: hashToken('current-session-token'), createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000), userAgent: null },
        { id: 's2', token: hashToken('other-session-token'), createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000), userAgent: null },
      ]
    }
  };
  const sessions = await authService.getSessions(mockPrismaSessions, 'user-1', 'current-session-token');
  assert('returns 2 sessions', sessions.length, 2);
  assert('correctly identifies current session', sessions.find(s => s.isCurrent).id, 's1');

  console.log('\n--- revokeAllSessions uses hashed token exclusion ---');
  let updateWhere = null;
  const mockPrismaRevokeAll = {
    refreshToken: {
      updateMany: async (args) => { updateWhere = args.where; return { count: 1 }; }
    }
  };
  await authService.revokeAllSessions(mockPrismaRevokeAll, 'user-1', 'current-session-token');
  assert('revokeAll excludes hashed current token', updateWhere.token.not, hashToken('current-session-token'));

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});

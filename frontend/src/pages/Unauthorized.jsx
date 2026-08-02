import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  ink: 'var(--color-text)',
  dim: 'var(--color-text-muted)',
  brand: '#7A79E6',
};

const navBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  padding: '14px 24px',
  borderRadius: 14,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  border: 0,
};

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const canvasRef = useRef(null);
  const hudLivesRef = useRef(null);
  const hudScoreRef = useRef(null);

  const userRole = location.state?.userRole || user?.role;
  const from = location.state?.from?.pathname;

  const handleGoHome = () => {
    if (!user) return navigate('/auth');
    if (user.role === 'ADMIN') navigate('/admin/dashboard');
    else if (user.role === 'MENTOR' || user.role === 'BOTH') navigate('/mentor/dashboard');
    else navigate('/dashboard');
  };

  const handleGoToLogin = async () => {
    await logout();
    navigate('/auth');
  };

  const handleRetry = () => {
    if (from) navigate(from, { replace: true });
    else window.location.reload();
  };

  // ---- Breakout mini-game ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    // Canvas doesn't resolve CSS variables, so read the computed theme colors.
    const cs = getComputedStyle(document.documentElement);
    const resolve = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
    const BG = resolve('--color-bg', '#f7f7fb');
    const INK = resolve('--color-text', '#14141f');
    const BRAND = '#7A79E6';
    const SURFACE = resolve('--color-surface', 'rgba(255,255,255,0)');

    const PIXEL_SCALE = 3;

    const DIGIT_4 = [
      [0, 0, 0, 1, 0],
      [0, 0, 1, 1, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0],
    ];
    const DIGIT_0 = [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ];
    const DIGIT_3 = [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [0, 0, 0, 0, 1],
      [0, 0, 1, 1, 0],
      [0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ];
    const ROWS = 7;
    const COLS = 17;
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        let on = 0;
        if (c < 5) on = DIGIT_4[r][c];
        else if (c === 5) on = 0;
        else if (c < 11) on = DIGIT_0[r][c - 6];
        else if (c === 11) on = 0;
        else on = DIGIT_3[r][c - 12];
        row.push(on);
      }
      grid.push(row);
    }

    // Tiny 5x7 bitmap font so "ACCESS DENIED" can be destructible bricks too.
    const FONT = {
      A: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
      ],
      C: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
      ],
      D: [
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 0],
      ],
      E: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
      ],
      N: [
        [1, 0, 0, 0, 1],
        [1, 1, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
      ],
      I: [
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
      ],
      S: [
        [0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0],
      ],
      ' ': [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
    };
    const buildTextGrid = (text) => {
      const cols = text.length * 6 - 1;
      const out = [];
      for (let r = 0; r < 7; r++) {
        const row = new Array(cols).fill(0);
        let col = 0;
        for (const ch of text) {
          const glyph = FONT[ch] || FONT[' '];
          for (let c = 0; c < 5; c++) row[col++] = glyph[r][c];
          col++;
        }
        out.push(row);
      }
      return out;
    };
    const textGrid = buildTextGrid('ACCESS DENIED');

    const BRICK_W = 42;
    const BRICK_H = 32;
    const GAP = 8;
    const gridW = COLS * BRICK_W + (COLS - 1) * GAP;
    const offsetX = (W - gridW) / 2;
    const offsetY = 104;
    const INNER_GAP = 2;
    const fineW = (BRICK_W - (PIXEL_SCALE - 1) * INNER_GAP) / PIXEL_SCALE;
    const fineH = (BRICK_H - (PIXEL_SCALE - 1) * INNER_GAP) / PIXEL_SCALE;

    let bricks = [];
    let totalBricks = 0;
    const addTextBricks = () => {
      const subW = 5;
      const subGap = 1;
      const scale = 2;
      const cellW = scale * subW + (scale - 1) * subGap;
      const colGap = 0;
      const cols = textGrid[0].length;
      const tW = cols * cellW + (cols - 1) * colGap;
      const ox = (W - tW) / 2;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < cols; c++) {
          if (textGrid[r][c] !== 1) continue;
          const baseX = ox + c * (cellW + colGap);
          const baseY = 1 + r * (cellW + colGap);
          for (let sr = 0; sr < scale; sr++) {
            for (let sc = 0; sc < scale; sc++) {
              bricks.push({
                x: baseX + sc * (subW + subGap),
                y: baseY + sr * (subW + subGap),
                w: subW,
                h: subW,
                alive: true,
              });
              totalBricks++;
            }
          }
        }
      }
    };
    const buildBricks = () => {
      bricks = [];
      totalBricks = 0;
      addTextBricks();
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r][c] !== 1) continue;
          const baseX = offsetX + c * (BRICK_W + GAP);
          const baseY = offsetY + r * (BRICK_H + GAP);
          for (let sr = 0; sr < PIXEL_SCALE; sr++) {
            for (let sc = 0; sc < PIXEL_SCALE; sc++) {
              bricks.push({
                x: baseX + sc * (fineW + INNER_GAP),
                y: baseY + sr * (fineH + INNER_GAP),
                w: fineW,
                h: fineH,
                alive: true,
              });
              totalBricks++;
            }
          }
        }
      }
    };
    buildBricks();

    const PADDLE_W = 140;
    const PADDLE_H = 18;
    const PADDLE_SPEED = 8;
    let paddleX = W / 2 - PADDLE_W / 2;
    const BALL_R = 5;
    let ball = { x: W / 2, y: 0, dx: 0, dy: 0 };
    const ballSpeed = 3.6;
    let lives = 3;
    let broken = 0;
    let state = 'idle';

    const hudLives = hudLivesRef.current;
    const hudScore = hudScoreRef.current;

    const updateHud = () => {
      hudLives.textContent = 'HEART ' + Math.max(0, lives);
      hudScore.textContent = 'CLEARED ' + Math.round((broken / totalBricks) * 100) + '%';
    };
    updateHud();

    const paddleY = () => H - 54;
    const resetBallOnPaddle = () => {
      ball.x = paddleX + PADDLE_W / 2;
      ball.y = paddleY() - BALL_R - 1;
      ball.dx = 0;
      ball.dy = 0;
    };

    const launchBall = () => {
      if (state !== 'idle') return;
      const angle = ((-70 + Math.random() * 40) * Math.PI) / 180;
      ball.dx = ballSpeed * Math.cos(angle);
      ball.dy = -Math.abs(ballSpeed * Math.sin(angle));
      state = 'playing';
    };

    const loseLife = () => {
      lives--;
      updateHud();
      if (lives <= 0) {
        state = 'lost';
      } else {
        state = 'idle';
        resetBallOnPaddle();
      }
    };

    const winGame = () => {
      state = 'won';
    };

    const resetGame = () => {
      buildBricks();
      lives = 3;
      broken = 0;
      state = 'idle';
      paddleX = W / 2 - PADDLE_W / 2;
      resetBallOnPaddle();
      updateHud();
    };

    // keyboard
    const keys = {};
    const onKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keys[e.key] = true;
      if (e.key === ' ') launchBall();
      if (e.key.toLowerCase() === 'r') resetGame();
    };
    const onKeyUp = (e) => {
      keys[e.key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Paddle follows the pointer so the game is playable with mouse/touch too.
    let pointerTarget = null;
    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      pointerTarget = Math.min(W - PADDLE_W, Math.max(0, x - PADDLE_W / 2));
    };
    canvas.addEventListener('pointermove', onPointerMove);
    // Click/tap the game to launch the ball.
    const onPointerDown = (e) => {
      e.preventDefault();
      launchBall();
    };
    canvas.addEventListener('pointerdown', onPointerDown);

    const update = () => {
      if (pointerTarget != null && !keys['ArrowLeft'] && !keys['ArrowRight']) {
        paddleX += (pointerTarget - paddleX) * 0.35;
      }
      if (keys['ArrowLeft']) paddleX -= PADDLE_SPEED;
      if (keys['ArrowRight']) paddleX += PADDLE_SPEED;
      paddleX = Math.min(W - PADDLE_W, Math.max(0, paddleX));

      if (state === 'idle') {
        resetBallOnPaddle();
        return;
      }
      if (state !== 'playing') return;

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x - BALL_R < 0) {
        ball.x = BALL_R;
        ball.dx *= -1;
      }
      if (ball.x + BALL_R > W) {
        ball.x = W - BALL_R;
        ball.dx *= -1;
      }
      if (ball.y - BALL_R < 0) {
        ball.y = BALL_R;
        ball.dy *= -1;
      }

      const pY = paddleY();
      if (
        ball.dy > 0 &&
        ball.y + BALL_R >= pY &&
        ball.y + BALL_R <= pY + PADDLE_H + 6 &&
        ball.x >= paddleX &&
        ball.x <= paddleX + PADDLE_W
      ) {
        const hit = (ball.x - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
        const angle = hit * (Math.PI / 3);
        ball.dx = ballSpeed * Math.sin(angle);
        ball.dy = -Math.abs(ballSpeed * Math.cos(angle));
        ball.y = pY - BALL_R;
      }

      for (const b of bricks) {
        if (!b.alive) continue;
        if (
          ball.x + BALL_R > b.x &&
          ball.x - BALL_R < b.x + b.w &&
          ball.y + BALL_R > b.y &&
          ball.y - BALL_R < b.y + b.h
        ) {
          b.alive = false;
          broken++;
          updateHud();
          const overlapLeft = ball.x + BALL_R - b.x;
          const overlapRight = b.x + b.w - (ball.x - BALL_R);
          const overlapTop = ball.y + BALL_R - b.y;
          const overlapBottom = b.y + b.h - (ball.y - BALL_R);
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          if (minOverlap === overlapTop || minOverlap === overlapBottom) ball.dy *= -1;
          else ball.dx *= -1;
          if (broken >= totalBricks) winGame();
          break;
        }
      }

      if (ball.y - BALL_R > H) loseLife();
    };

    const drawBricks = () => {
      ctx.fillStyle = BRAND;
      for (const b of bricks) if (b.alive) ctx.fillRect(b.x, b.y, b.w, b.h);
    };
    const drawPaddle = () => {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.roundRect(paddleX, paddleY(), PADDLE_W, PADDLE_H, PADDLE_H / 2);
      ctx.fill();
    };
    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = state === 'playing' ? BRAND : INK;
      ctx.fill();
    };
    const drawOverlay = () => {
      if (state === 'won' || state === 'lost') {
        ctx.fillStyle = SURFACE;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = INK;
        ctx.font = "18px 'Space Grotesk', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(state === 'won' ? 'ALL BRICKS CLEARED' : 'OUT OF LIVES', W / 2, H / 2 - 10);
        ctx.font = "12px 'Space Grotesk', sans-serif";
        ctx.fillStyle = BRAND;
        ctx.fillText('click or press SPACE to play again', W / 2, H / 2 + 18);
      }
      if (state === 'idle') {
        ctx.font = "16px 'Space Grotesk', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillStyle = BRAND;
        ctx.fillText('click to play', W / 2, 470);
      }
    };
    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      drawBricks();
      drawPaddle();
      drawBall();
      drawOverlay();
    };

    let raf;
    const loop = () => {
      update();
      render();
      raf = requestAnimationFrame(loop);
    };
    resetBallOnPaddle();
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between py-20 px-4"
      style={{ background: COLORS.bg, color: COLORS.ink, fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div
        className="w-full flex justify-between items-center"
        style={{ maxWidth: 520, padding: '0 8px', marginBottom: 6 }}
      >
        <span ref={hudLivesRef} style={{ color: '#9997B5', fontFamily: "'Press Start 2P', monospace", fontSize: 11, letterSpacing: 2 }}>
          HEART 3
        </span>
        <span
          ref={hudScoreRef}
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: '#9997B5' }}
        >
          CLEARED 0%
        </span>
      </div>

      <div className="stage" style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
        <canvas
          ref={canvasRef}
          width={920}
          height={640}
          aria-label="Breakout mini-game: break the 403 bricks"
          style={{ display: 'block', width: '100%', height: 'auto', background: COLORS.bg, touchAction: 'none' }}
        />
      </div>

      <div className="mt-4 w-full flex flex-col gap-2" style={{ maxWidth: 520 }}>
        {!user && (
          <p className="text-sm text-center mb-1" style={{ color: '#B2521F', background: '#FDEEDC', borderRadius: 10, padding: '8px 12px' }}>
            Your session has expired. Please sign in again.
          </p>
        )}
        <button onClick={handleGoHome} style={{ ...navBtn, background: COLORS.brand, color: '#fff' }}>
          <Home size={16} />
          {user ? 'Go to Dashboard' : 'Go Home'}
        </button>
        {!user && (
          <button onClick={handleGoToLogin} style={{ ...navBtn, border: `1px solid ${COLORS.brand}`, color: COLORS.brand, background: 'transparent' }}>
            <LogIn size={16} />
            Sign In
          </button>
        )}
        {from && (
          <button onClick={handleRetry} style={{ ...navBtn, border: `1px solid ${COLORS.brand}`, color: COLORS.ink, background: 'transparent' }}>
            <RefreshCw size={16} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
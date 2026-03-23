import { useEffect, useRef } from 'react';

const COLORS = [
  '#7C3AED', '#8B5CF6', '#A78BFA',
  '#F59E0B', '#FBBF24', '#FCD34D',
  '#10B981', '#34D399',
  '#3B82F6', '#60A5FA',
  '#F472B6', '#EC4899',
  '#FFFFFF',
];

const SHAPES = ['circle', 'square', 'triangle', 'star'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function createParticle(canvas) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return {
    x: randomBetween(0, canvas.width),
    y: randomBetween(-50, -10),
    vx: randomBetween(-3, 3),
    vy: randomBetween(2, 7),
    rotation: randomBetween(0, 360),
    rotationSpeed: randomBetween(-8, 8),
    size: randomBetween(6, 14),
    opacity: 1,
    color,
    shape,
    gravity: randomBetween(0.05, 0.15),
    wobble: randomBetween(0, Math.PI * 2),
    wobbleSpeed: randomBetween(0.05, 0.15),
  };
}

function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = p.color;
  ctx.strokeStyle = p.color;
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rotation * Math.PI) / 180);

  switch (p.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'square':
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(p.size / 2, p.size / 2);
      ctx.lineTo(-p.size / 2, p.size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = i === 0 ? p.size / 2 : p.size / 4;
        const x = Math.cos(angle) * (i % 2 === 0 ? p.size / 2 : p.size / 4);
        const y = Math.sin(angle) * (i % 2 === 0 ? p.size / 2 : p.size / 4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    default:
      break;
  }

  ctx.restore();
}

export default function ConfettiEffect({ active }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!active) {
      // Let particles fade naturally
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    startTimeRef.current = Date.now();

    // Launch 150 particles in bursts
    particlesRef.current = [];
    for (let i = 0; i < 150; i++) {
      particlesRef.current.push(createParticle(canvas));
    }

    // Additional burst from center-ish
    for (let i = 0; i < 50; i++) {
      const p = createParticle(canvas);
      p.x = canvas.width / 2 + randomBetween(-100, 100);
      p.y = canvas.height / 2 + randomBetween(-50, 50);
      p.vy = randomBetween(-8, -2);
      p.vx = randomBetween(-6, 6);
      particlesRef.current.push(p);
    }

    let running = true;

    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.01);

      for (const p of particlesRef.current) {
        p.vy += p.gravity;
        p.vx += Math.sin(p.wobble) * 0.1;
        p.wobble += p.wobbleSpeed;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out as they fall near bottom
        if (p.y > canvas.height * 0.7) {
          p.opacity -= 0.02;
        }

        if (p.y > canvas.height + 20) p.opacity = 0;

        drawParticle(ctx, p);
      }

      if (particlesRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[200]"
      style={{ display: active || particlesRef.current?.length > 0 ? 'block' : 'none' }}
    />
  );
}

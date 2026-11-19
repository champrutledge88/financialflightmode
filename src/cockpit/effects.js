// Celebration effects for earned medals. Canvas confetti in brand colors plus a soft
// burst. Skipped entirely when the person prefers reduced motion.

const COLORS = ["#E95C03", "#FF8A3D", "#FFFFFF", "#FFD60A", "#FFE08A", "#F5B98A"];

export const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export const confetti = (canvas, { count = 170, duration = 3200 } = {}) => {
  if (!canvas || prefersReducedMotion()) return () => {};
  const context = canvas.getContext("2d");
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
  };
  resize();

  const width = canvas.width;
  const height = canvas.height;
  const pieces = Array.from({ length: count }, (_, index) => {
    const fromLeft = index % 2 === 0;
    const angle = (fromLeft ? -60 : -120) + (Math.random() * 40 - 20);
    const speed = (9 + Math.random() * 9) * ratio;
    return {
      x: fromLeft ? width * 0.12 : width * 0.88,
      y: height * 0.62,
      vx: Math.cos((angle * Math.PI) / 180) * speed,
      vy: Math.sin((angle * Math.PI) / 180) * speed,
      size: (5 + Math.random() * 6) * ratio,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.35,
      tilt: Math.random() * Math.PI,
      color: COLORS[index % COLORS.length],
      shape: index % 3,
    };
  });

  const start = performance.now();
  let frame = 0;
  const draw = (now) => {
    const elapsed = now - start;
    context.clearRect(0, 0, width, height);
    const fade = Math.max(0, 1 - Math.max(0, elapsed - duration * 0.6) / (duration * 0.4));
    for (const piece of pieces) {
      piece.vy += 0.32 * ratio;
      piece.vx *= 0.985;
      piece.vy *= 0.985;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.spin;
      piece.tilt += 0.12;
      context.save();
      context.globalAlpha = fade;
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      const squash = Math.abs(Math.cos(piece.tilt));
      if (piece.shape === 0) context.fillRect(-piece.size / 2, (-piece.size / 4) * squash, piece.size, (piece.size / 2) * squash);
      else if (piece.shape === 1) {
        context.beginPath();
        context.ellipse(0, 0, piece.size / 2.4, (piece.size / 2.4) * squash, 0, 0, Math.PI * 2);
        context.fill();
      } else {
        context.beginPath();
        context.moveTo(0, -piece.size / 2);
        context.lineTo(piece.size / 2, (piece.size / 2) * squash);
        context.lineTo(-piece.size / 2, (piece.size / 2) * squash);
        context.fill();
      }
      context.restore();
    }
    if (elapsed < duration) frame = requestAnimationFrame(draw);
    else context.clearRect(0, 0, width, height);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
};

export const haptic = (pattern = 8) => navigator.vibrate?.(pattern);

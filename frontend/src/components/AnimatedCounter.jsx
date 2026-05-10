import { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({ to, duration = 1500, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const prevTo = useRef(to);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevTo.current !== to) {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      prevTo.current = to;
    }

    let start = 0;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * to));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };

    requestAnimationFrame(animate);
  }, [to, duration]);

  return (
    <span
      className="font-mono"
      style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: 'var(--accent-cyan)',
        textShadow: flash ? '0 0 20px var(--accent-cyan)' : 'none',
        transition: 'text-shadow 0.3s ease',
      }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

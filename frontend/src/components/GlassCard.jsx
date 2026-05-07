import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', glowColor = 'cyan', onClick, style }) {
  const glowMap = {
    cyan: 'rgba(0, 245, 255, 0.2)',
    violet: 'rgba(124, 58, 237, 0.2)',
    green: 'rgba(16, 185, 129, 0.2)',
    red: 'rgba(239, 68, 68, 0.2)',
    amber: 'rgba(245, 158, 11, 0.2)',
  };

  return (
    <motion.div
      className={`glass-card ${className}`}
      onClick={onClick}
      style={{ padding: '24px', cursor: onClick ? 'pointer' : 'default', ...style }}
      whileHover={{
        boxShadow: `0 0 30px ${glowMap[glowColor] || glowMap.cyan}`,
        y: -3,
      }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

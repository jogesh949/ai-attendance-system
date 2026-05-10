import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function DrawerPanel({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '400px',
              maxWidth: '90vw',
              height: '100vh',
              background: 'var(--bg-cosmic-light)',
              borderLeft: '1px solid var(--glass-border)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--glass-border)',
            }}>
              <h3 className="font-orbitron" style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

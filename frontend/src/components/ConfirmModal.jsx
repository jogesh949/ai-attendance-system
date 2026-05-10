import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ isOpen, icon, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', children }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--bg-cosmic-light)',
              border: '1px solid var(--glass-border)',
              borderRadius: 20,
              padding: '32px',
              width: '420px',
              maxWidth: '90vw',
              zIndex: 1001,
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(0, 245, 255, 0.1)',
            }}
          >
            {icon && <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{icon}</div>}
            <h3 className="font-orbitron" style={{
              fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-primary)',
            }}>{title}</h3>
            {message && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>{message}</p>}
            {children && <div style={{ marginBottom: 16 }}>{children}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button className="btn-ghost" onClick={onCancel}>Cancel</button>
              <button className="btn-primary" onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

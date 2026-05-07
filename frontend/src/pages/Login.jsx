import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import NeuralBackground from '../components/NeuralBackground';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const data = res.data;
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back! The AI is ready. 🤖');
      setTimeout(() => {
        if (data.user.role === 'admin') window.location.href = '/admin/dashboard';
        else if (data.user.role === 'teacher') window.location.href = '/teacher/dashboard';
        else if (data.user.role === 'student') window.location.href = '/student/dashboard';
      }, 500);
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      const status = err.response?.status;
      if (status === 404) toast.error('User not found. Check your email.');
      else if (status === 401) toast.error('😓 Invalid credentials. Please try again.');
      else toast.error(err.response?.data?.detail || '😓 Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#0a1628', color: '#F0F9FF', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12 } }} />
      <NeuralBackground />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: shake ? [-8, 8, -8, 8, 0] : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, padding: '40px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${shake ? 'rgba(239,68,68,0.5)' : 'rgba(0,245,255,0.15)'}`,
          borderRadius: 24, backdropFilter: 'blur(24px)',
          boxShadow: shake ? '0 0 30px rgba(239,68,68,0.2)' : '0 0 60px rgba(0,245,255,0.05), 0 24px 48px rgba(0,0,0,0.4)',
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</motion.div>
          <h1 className="font-orbitron" style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(135deg, #00F5FF, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>SmartAttend AI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your classroom, powered by intelligence ✨</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" style={{ paddingLeft: 42 }} aria-label="Email address" id="login-email" />
          </div>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" style={{ paddingLeft: 42, paddingRight: 42 }} aria-label="Password" id="login-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} id="login-submit" style={{ width: '100%', padding: '14px', fontSize: '0.95rem', borderRadius: 14 }}>
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <>SIGN IN <ArrowRight size={18} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

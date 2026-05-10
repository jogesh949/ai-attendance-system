import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import NeuralBackground from '../components/NeuralBackground';
import GlassCard from '../components/GlassCard';
import { Camera, Upload, CheckCircle, ArrowLeft, Image } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function StudentFaceUpload() {
  const [step, setStep] = useState(1); // 1: permission, 2: capture, 3: done
  const [photos, setPhotos] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const token = localStorage.getItem('token');

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setStep(2);
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const capturePhoto = async () => {
    if (photos.length >= 10) { toast.error('Maximum 10 photos'); return; }
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640; canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      const form = new FormData();
      form.append('file', blob, 'photo.jpg');

      try {
        await axios.post(`${API}/student/upload-face`, form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        const preview = URL.createObjectURL(blob);
        const newPhotos = [...photos, { preview, status: 'success' }];
        setPhotos(newPhotos);
        toast.success(`📸 Photo ${newPhotos.length} saved! Looking great.`);
      } catch (err) {
        const detail = err.response?.data?.detail || 'Upload failed';
        if (detail === 'No face detected') {
          toast.error('😓 No face detected. Try better lighting.');
        } else {
          toast.error(detail);
        }
      } finally { setUploading(false); }
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (photos.length >= 10) break;
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      try {
        await axios.post(`${API}/student/upload-face`, form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        const preview = URL.createObjectURL(file);
        setPhotos(prev => [...prev, { preview, status: 'success' }]);
        toast.success(`📸 Photo saved! Looking great.`);
      } catch (err) {
        const detail = err.response?.data?.detail || 'Upload failed';
        toast.error(detail === 'No face detected' ? '😓 No face detected. Try better lighting.' : detail);
      } finally { setUploading(false); }
    }
  };

  const finishEnrollment = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraActive(false);
    setStep(3);
    toast.success("🎉 Face profile complete! You're AI-ready.");
  };

  const progress = (photos.length / 10) * 100;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#0a1628', color: '#F0F9FF', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12 },
      }} />
      <NeuralBackground />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        {/* Back button */}
        <button className="btn-ghost" onClick={() => window.location.href = '/student/dashboard'} style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {['Grant Camera', 'Capture Photos', 'Enrolled!'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 2, marginBottom: 8,
                background: step > i ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.4s',
              }} />
              <span style={{ fontSize: '0.7rem', color: step > i ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                {`① ② ③`.split(' ')[i]} {s}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1 — Choose Method */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
                 <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0, 245, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={32} color="var(--accent-cyan)" />
                 </div>
                 <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image size={32} color="var(--accent-violet)" />
                 </div>
              </div>

              <h2 className="font-orbitron" style={{ fontSize: '1.2rem', marginBottom: 12 }}>
                Set Up Your Face ID
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 32, maxWidth: 450, margin: '0 auto 32px' }}>
                The AI needs to learn your face to recognize you in class. Use your camera or upload clear photos from your gallery.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button className="btn-primary" onClick={enableCamera} style={{ padding: '16px' }}>
                  🎥 Use Camera
                </button>
                <button className="btn-ghost" onClick={() => { setStep(2); fileRef.current?.click(); }} style={{ padding: '16px' }}>
                  🖼️ From Gallery
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 24 }}>
                🔒 Your photos are encrypted and used only for attendance recognition.
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2 — Capture */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                  📸 {photos.length} / 10 photos captured
                </span>
                {photos.length >= 3 && (
                  <button className="btn-success" onClick={finishEnrollment}>
                    <CheckCircle size={14} /> Done
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))', borderRadius: 3 }}
                />
              </div>

              {/* Video or Gallery Placeholder */}
              <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, position: 'relative', background: '#000', minHeight: cameraActive ? 'auto' : 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cameraActive ? (
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', borderRadius: 12 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
                    <Image size={48} color="var(--accent-violet)" style={{ marginBottom: 16, margin: '0 auto' }} />
                    <p style={{ fontSize: '0.9rem' }}>Gallery Upload Mode Active</p>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {photos.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                      style={{
                        width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
                        border: '2px solid var(--accent-cyan)',
                      }}
                    >
                      <img src={p.preview} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </motion.div>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - photos.length) }).map((_, i) => (
                    <div key={`empty-${i}`} style={{
                      width: 52, height: 52, borderRadius: 8,
                      border: '1px dashed rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)',
                    }} />
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                {cameraActive && (
                  <button className="btn-primary" onClick={capturePhoto} disabled={uploading || photos.length >= 10} style={{ flex: 2 }}>
                    {uploading ? 'Capturing...' : '📷 Capture Photo'}
                  </button>
                )}
                <button className={cameraActive ? "btn-ghost" : "btn-primary"} onClick={() => fileRef.current?.click()} disabled={photos.length >= 10} style={{ flex: 1 }}>
                  <Upload size={14} /> {cameraActive ? 'Gallery' : 'Select Photos from Gallery'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>

              {photos.length < 3 && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem', color: '#F59E0B' }}>
                  ⚠️ Upload at least 3 photos for reliable AI recognition.
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard style={{ textAlign: 'center', padding: 48 }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: '3rem', marginBottom: 20 }}
              >
                🎉
              </motion.div>
              <h2 className="font-orbitron" style={{ fontSize: '1.3rem', marginBottom: 8, color: 'var(--accent-cyan)' }}>
                Face Profile Complete!
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>You're all set for AI recognition.</p>
              <p style={{ color: 'var(--success)', marginBottom: 24 }}>✅ {photos.length} photos successfully enrolled</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => window.location.href = '/student/dashboard'}>
                  Go to My Dashboard
                </button>
                <button className="btn-ghost" onClick={() => { setStep(2); enableCamera(); }}>
                  + Add More Photos
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
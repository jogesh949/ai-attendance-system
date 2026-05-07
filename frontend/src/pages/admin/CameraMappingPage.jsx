import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DrawerPanel from '../../components/DrawerPanel';
import StatusBadge from '../../components/StatusBadge';
import { Camera, Plus, Video } from 'lucide-react';

export default function CameraMappingPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [mappings, setMappings] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [cameraSource, setCameraSource] = useState('0');
  const [customUrl, setCustomUrl] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    api.get('/admin/classrooms').then(r => setClassrooms(r.data || [])).catch(() => {});
    const saved = localStorage.getItem('camera_mappings');
    if (saved) setMappings(JSON.parse(saved));
  }, []);

  const saveMapping = () => {
    if (!selectedRoom) { toast.error('Select a classroom'); return; }
    const source = cameraSource === 'custom' ? customUrl : `Camera ${cameraSource}`;
    const updated = {
      ...mappings,
      [selectedRoom]: { source, label: label || 'Default', status: cameraSource === 'custom' ? 'config' : 'idle' },
    };
    setMappings(updated);
    localStorage.setItem('camera_mappings', JSON.stringify(updated));
    const room = classrooms.find(c => String(c.id) === String(selectedRoom));
    toast.success(`📹 Camera mapping saved for ${room?.room_name || 'classroom'}!`);
    setDrawerOpen(false);
    setSelectedRoom(''); setCameraSource('0'); setCustomUrl(''); setLabel('');
  };

  const statusMap = { live: 'online', idle: 'offline', config: 'degraded' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Camera size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Camera Mapping</h1>
        </div>
        <button className="btn-primary" onClick={() => setDrawerOpen(true)}>
          <Plus size={16} /> Add Map
        </button>
      </div>

      <GlassCard>
        {Object.keys(mappings).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No camera mappings yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Classroom', 'Camera Source', 'Label', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(mappings).map(([roomId, m]) => {
                const room = classrooms.find(c => String(c.id) === String(roomId));
                return (
                  <tr key={roomId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{room?.room_name || `Room ${roomId}`}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.source}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.label}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge variant={statusMap[m.status] || 'offline'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Camera Mapping">
        <div className="form-group">
          <label className="form-label">Classroom</label>
          <select className="input-field" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
            <option value="">Select Classroom</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.room_name} {c.location ? `- ${c.location}` : ''}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Camera Source</label>
          {['0', '1', '2', 'custom'].map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input type="radio" name="cam" value={v} checked={cameraSource === v} onChange={e => setCameraSource(e.target.value)} />
              {v === 'custom' ? 'Custom IP/URL' : `Camera ${v}${v === '0' ? ' (Default)' : ''}`}
            </label>
          ))}
        </div>
        {cameraSource === 'custom' && (
          <div className="form-group">
            <label className="form-label">Custom URL</label>
            <input className="input-field" placeholder="rtsp://192.168.1.10/stream" value={customUrl} onChange={e => setCustomUrl(e.target.value)} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Label</label>
          <input className="input-field" placeholder="e.g. Front Wall" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={saveMapping} style={{ width: '100%', marginTop: 16 }}>Save Mapping</button>
      </DrawerPanel>
    </div>
  );
}

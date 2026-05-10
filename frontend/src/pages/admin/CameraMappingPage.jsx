import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
<<<<<<< HEAD
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmModal from '../../components/ConfirmModal';
import StatusBadge from '../../components/StatusBadge';
import { 
  Camera, Plus, Search, Pencil, Trash2, Video, 
  Activity, Settings, Play, Shield, ShieldCheck, 
  Wifi, Info, Monitor, Layers, Power, RefreshCw
} from 'lucide-react';

export default function CameraMappingPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Registration Form State
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    classroom_id: '',
    camera_name: '',
    camera_type: 'Webcam', // Webcam, USB Camera, CCTV, IP Camera
    source_url: '0',
    placement: 'Front', // Front, Back, Door, Ceiling
    resolution: '1280x720',
    fps: 30,
    status: 'Active',
    is_primary: false,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Preview & Test State
  const [previewingCam, setPreviewingCam] = useState(null);
  const [testingCam, setTestingCam] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { 
    fetchData(); 
    // Auto-monitor status every 10 seconds
    const interval = setInterval(monitorStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, camRes] = await Promise.all([
        api.get('/admin/classrooms'),
        api.get('/admin/classrooms'), // We'll get cameras from the enriched room list
      ]);
      setClassrooms(roomsRes.data || []);
      
      // Flatten cameras from classrooms
      const allCams = [];
      (roomsRes.data || []).forEach(room => {
        if (room.cameras) {
            room.cameras.forEach(c => allCams.push({ ...c, room_name: room.room_name }));
        }
      });
      setCameras(allCams);
    } catch (err) {
      toast.error('Failed to load camera infrastructure');
    } finally { setLoading(false); }
  };

  const monitorStatus = async () => {
     try {
        const res = await api.get('/admin/cameras/monitor');
        const statuses = res.data || [];
        setCameras(prev => prev.map(c => {
            const update = statuses.find(s => s.id === c.id);
            return update ? { ...c, current_status: update.status } : c;
        }));
     } catch { /* silent monitor */ }
  };

  const handleSave = async () => {
    if (!form.classroom_id || !form.camera_name || !form.source_url) {
      toast.error('Fill required fields: Classroom, Name, Source');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/admin/cameras/${editId}`, form);
        toast.success('Camera configuration updated');
      } else {
        await api.post(`/admin/classrooms/${form.classroom_id}/cameras`, form);
        toast.success('New Camera linked to infrastructure');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hardware link failed');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setForm({
      classroom_id: '', camera_name: '', camera_type: 'Webcam',
      source_url: '0', placement: 'Front', resolution: '1280x720',
      fps: 30, status: 'Active', is_primary: false, notes: ''
    });
    setEditId(null);
    setDrawerOpen(false);
  };

  const handleTest = async (cam) => {
    setTestingCam(cam);
    setTestResult(null);
    toast.loading('Initializing hardware connection...', { id: 'test-cam' });
    try {
        const res = await api.post(`/admin/cameras/${cam.id}/test`);
        setTestResult(res.data);
        if (res.data.status === 'success') {
            toast.success('Hardware verified! Connection stable.', { id: 'test-cam' });
            monitorStatus();
        } else {
            toast.error(res.data.message || 'Connection failed', { id: 'test-cam' });
        }
    } catch {
        toast.error('Critical hardware error', { id: 'test-cam' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/cameras/${deleteId}`);
      toast.success('Hardware unlinked successfully');
      fetchData();
    } catch { toast.error('Removal failed'); }
    finally { setIsConfirmOpen(false); setDeleteId(null); }
  };

  const filtered = cameras.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.room_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      label: 'Hardware Entity',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: row.is_primary ? 'rgba(0, 245, 255, 0.1)' : 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                {row.is_primary ? <ShieldCheck size={20} color="var(--accent-cyan)" /> : <Video size={20} color="var(--text-muted)" />}
            </div>
            <div>
                <div style={{ fontWeight: 600 }}>{row.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.type} • {row.placement}</div>
            </div>
        </div>
      )
    },
    { key: 'room_name', label: 'Classroom' },
    {
      key: 'source',
      label: 'Stream Source',
      render: (row) => <code style={{ fontSize: '0.75rem', opacity: 0.8 }}>{row.url}</code>
    },
    {
      key: 'status',
      label: 'Network Status',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <StatusBadge variant={row.current_status === 'Online' ? 'live' : (row.current_status === 'Error' ? 'offline' : 'degraded')} />
           <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{row.current_status}</span>
        </div>
      )
    },
    {
      key: 'analytics',
      label: 'AI Health',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last: {row.last_active ? new Date(row.last_active).toLocaleTimeString() : 'Never'}</span>
            <div style={{ height: 4, width: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: row.current_status === 'Online' ? '100%' : '0%', background: 'var(--accent-cyan)', boxShadow: '0 0 5px var(--accent-cyan)' }} />
            </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Command',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" title="Test Connection" onClick={() => handleTest(row)}><RefreshCw size={14} /></button>
          <button className="btn-icon" title="Live Stream" onClick={() => setPreviewingCam(row)} style={{ color: 'var(--accent-cyan)' }}><Play size={14} /></button>
          <button className="btn-icon" title="Configure" onClick={() => {
              setEditId(row.id);
              // Find classroom_id from name mapping
              const room = classrooms.find(r => r.room_name === row.room_name);
              setForm({
                  classroom_id: room?.id || '',
                  camera_name: row.name,
                  camera_type: row.type,
                  source_url: row.url,
                  placement: row.placement,
                  resolution: row.resolution || '1280x720',
                  fps: row.fps || 30,
                  status: row.status,
                  is_primary: row.is_primary,
                  notes: row.notes || ''
              });
              setDrawerOpen(true);
          }}><Settings size={14} /></button>
          <button className="btn-icon" title="Unlink" onClick={() => { setDeleteId(row.id); setIsConfirmOpen(true); }} style={{ color: '#F43F5E' }}><Trash2 size={14} /></button>
        </div>
      )
    }
  ];
=======
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
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<<<<<<< HEAD
          <Layers size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Infrastructure Mapping</h1>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setDrawerOpen(true); }}>
          <Plus size={16} /> Map New Hardware
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Network Points', value: cameras.length, icon: Wifi, color: 'var(--accent-cyan)' },
          { label: 'Online Streams', value: cameras.filter(c => c.current_status === 'Online').length, icon: Power, color: '#10B981' },
          { label: 'Primary Eyes', value: cameras.filter(c => c.is_primary).length, icon: Shield, color: '#F59E0B' },
        ].map(stat => (
          <GlassCard key={stat.label} style={{ flex: 1, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
                <stat.icon size={16} color="var(--text-muted)" />
            </div>
          </GlassCard>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 500 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input-field" placeholder="Search by camera or room..." style={{ paddingLeft: 40 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <GlassCard>
        <DataTable columns={columns} data={filtered} isLoading={loading} emptyMessage="No cameras mapped to physical infrastructure." />
      </GlassCard>

      {/* Registration Drawer */}
      <DrawerPanel isOpen={drawerOpen} onClose={resetForm} title={editId ? "Hardware Configuration" : "New Camera Deployment"} width={450}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
                <label className="form-label">Physical Classroom</label>
                <select className="input-field" value={form.classroom_id} onChange={e => setForm({...form, classroom_id: e.target.value})}>
                    <option value="">Select Room</option>
                    {classrooms.map(r => <option key={r.id} value={r.id}>{r.room_name}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Camera Identifier (Name)</label>
                <input className="input-field" placeholder="e.g. Front-Wall-AI-01" value={form.camera_name} onChange={e => setForm({...form, camera_name: e.target.value})} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                    <label className="form-label">Hardware Type</label>
                    <select className="input-field" value={form.camera_type} onChange={e => setForm({...form, camera_type: e.target.value})}>
                        <option value="Webcam">Laptop Webcam</option>
                        <option value="USB Camera">USB Camera</option>
                        <option value="CCTV">CCTV System</option>
                        <option value="IP Camera">IP Camera (RTSP)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Placement</label>
                    <select className="input-field" value={form.placement} onChange={e => setForm({...form, placement: e.target.value})}>
                        <option value="Front">Front Wall</option>
                        <option value="Back">Back Wall</option>
                        <option value="Door">Entrance Door</option>
                        <option value="Ceiling">Ceiling Mount</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Source URL / Index</label>
                <div style={{ position: 'relative' }}>
                    <Wifi size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: 36 }} placeholder="0, 1 or rtsp://..." value={form.source_url} onChange={e => setForm({...form, source_url: e.target.value})} />
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Use '0' for built-in webcam. Use RTSP URL for IP cameras.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                    <label className="form-label">Resolution</label>
                    <input className="input-field" placeholder="1920x1080" value={form.resolution} onChange={e => setForm({...form, resolution: e.target.value})} />
                </div>
                <div className="form-group">
                    <label className="form-label">Target FPS</label>
                    <input className="input-field" type="number" value={form.fps} onChange={e => setForm({...form, fps: Number(e.target.value)})} />
                </div>
            </div>

            <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_primary} onChange={e => setForm({...form, is_primary: e.target.checked})} style={{ accentColor: 'var(--accent-cyan)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Set as Primary Camera</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI will prefer this stream for primary face detection.</span>
                    </div>
                </label>
            </div>

            <div className="form-group">
                <label className="form-label">Deployment Notes</label>
                <textarea className="input-field" rows={3} placeholder="Technical notes about this camera..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ resize: 'none' }} />
            </div>

            <button className="btn-primary" onClick={handleSave} disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
                {submitting ? 'Connecting Hardware...' : (editId ? 'Apply Update' : 'Initialize Deployment')}
            </button>
        </div>
      </DrawerPanel>

      {/* Live Preview Modal */}
      {previewingCam && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
            <GlassCard style={{ width: 800, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <StatusBadge variant="live" />
                        <h3 className="font-orbitron" style={{ fontSize: '0.9rem' }}>LIVE: {previewingCam.name}</h3>
                    </div>
                    <button className="btn-ghost" onClick={() => setPreviewingCam(null)}>CLOSE FEED</button>
                </div>
                <div style={{ height: 450, background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="scanning-line" style={{ width: '100%', height: '2px', background: 'var(--accent-cyan)', position: 'absolute', top: 0, left: 0, boxShadow: '0 0 15px var(--accent-cyan)', zIndex: 10 }} />
                    <div style={{ position: 'absolute', top: 20, right: 20, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>RES: {previewingCam.resolution}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>FPS: {previewingCam.fps}</div>
                    </div>
                    <Video size={100} color="rgba(0,245,255,0.05)" />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Authenticating RTSP Stream...</p>
                </div>
            </GlassCard>
        </div>
      )}

      {/* Test Result Modal */}
      {testingCam && testResult && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
             <GlassCard style={{ width: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: testResult.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        {testResult.status === 'success' ? <ShieldCheck color="#10B981" /> : <Activity color="#F43F5E" />}
                    </div>
                    <h3 className="font-orbitron" style={{ fontSize: '1.1rem' }}>Test {testResult.status === 'success' ? 'Passed' : 'Failed'}</h3>
                </div>
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Resolution:</span>
                        <span>{testResult.resolution || '---'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Actual FPS:</span>
                        <span>{testResult.fps || '---'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Hardware State:</span>
                        <StatusBadge variant={testResult.status === 'success' ? 'online' : 'offline'} />
                    </div>
                </div>
                <button className="btn-primary" onClick={() => { setTestingCam(null); setTestResult(null); }} style={{ width: '100%' }}>Done</button>
             </GlassCard>
          </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        title="Unlink Camera Hardware" 
        message="Are you sure? This will remove the camera mapping and stop all AI monitoring for this room." 
        onConfirm={handleDelete} 
        onCancel={() => setIsConfirmOpen(false)} 
      />
=======
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
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
    </div>
  );
}

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  Monitor, Plus, Search, Pencil, Trash2, Camera as CameraIcon, 
  Video, MapPin, Users, Wifi, WifiOff, Eye, Settings 
} from 'lucide-react';

export default function ClassroomPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cameraDrawerOpen, setCameraDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Classroom Form
  const [editId, setEditId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  // Camera Form
  const [camName, setCamName] = useState('');
  const [camUrl, setCamUrl] = useState('');
  const [camPlacement, setCamPlacement] = useState('Front');

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteIdType] = useState('room'); // room or camera
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchClassrooms(); }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/classrooms');
      setClassrooms(res.data || []);
    } catch (err) {
      toast.error('Failed to load infrastructure data');
    } finally { setLoading(false); }
  };

  const handleSaveRoom = async () => {
    if (!roomName.trim() || !location.trim()) { toast.error('Fill all fields'); return; }
    setSubmitting(true);
    try {
      const payload = { room_name: roomName, location, capacity: Number(capacity) };
      if (editId) {
        await api.put(`/admin/classrooms/${editId}`, payload);
        toast.success('Room updated');
      } else {
        await api.post('/admin/classrooms', payload);
        toast.success('New Classroom added');
      }
      resetRoomForm();
      fetchClassrooms();
    } catch (err) {
      toast.error('Error saving classroom');
    } finally { setSubmitting(false); }
  };

  const handleAddCamera = async () => {
    if (!camName.trim() || !camUrl.trim()) { toast.error('Enter camera details'); return; }
    try {
      await api.post(`/admin/classrooms/${selectedRoom.id}/cameras`, {
        camera_name: camName,
        source_url: camUrl,
        camera_type: 'IP Camera', // Default for this simplified form
        placement: camPlacement,
        status: 'Active'
      });
      toast.success('Camera assigned successfully');
      setCameraDrawerOpen(false);
      setCamName(''); setCamUrl('');
      fetchClassrooms();
    } catch (err) {
      toast.error('Failed to assign camera');
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === 'room') {
        await api.delete(`/admin/classrooms/${deleteId}`);
        toast.success('Classroom removed');
      } else {
        await api.delete(`/admin/cameras/${deleteId}`);
        toast.success('Camera unassigned');
      }
      fetchClassrooms();
    } catch (err) {
      toast.error('Deletion failed');
    } finally {
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const resetRoomForm = () => {
    setRoomName(''); setLocation(''); setCapacity(60); setEditId(null); setDrawerOpen(false);
  };

  const columns = [
    { 
      key: 'room_name', 
      label: 'Room / Lab',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, background: 'rgba(0, 245, 255, 0.05)', borderRadius: 8 }}>
            <Monitor size={20} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.room_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={10} /> {row.location}
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'capacity', 
      label: 'Capacity',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <Users size={14} /> {row.capacity}
        </div>
      )
    },
    {
      key: 'cameras',
      label: 'Network Infrastructure',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {row.cameras && row.cameras.length > 0 ? row.cameras.map(cam => (
            <div key={cam.id} style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              background: 'rgba(255,255,255,0.03)', padding: '4px 8px', 
              borderRadius: 6, border: '1px solid var(--glass-border)'
            }}>
              {cam.status === 'online' ? <Wifi size={12} color="#10B981" /> : <WifiOff size={12} color="#F43F5E" />}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cam.placement}: {cam.name}</span>
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   setDeleteId(cam.id);
                   setDeleteIdType('camera');
                   setIsConfirmOpen(true);
                }}
                style={{ background: 'none', border: 'none', color: '#F43F5E', cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          )) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No cameras assigned</span>}
          <button 
            className="btn-ghost" 
            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
            onClick={() => { setSelectedRoom(row); setCameraDrawerOpen(true); }}
          >
            + Link Camera
          </button>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn-icon" 
            title="Live Preview" 
            style={{ color: 'var(--accent-cyan)' }}
            onClick={() => toast('Connecting to RTSP stream... (Simulated)')}
          >
            <Video size={16} />
          </button>
          <button 
            className="btn-icon" 
            onClick={() => {
              setEditId(row.id);
              setRoomName(row.room_name);
              setLocation(row.location);
              setCapacity(row.capacity);
              setDrawerOpen(true);
            }}
          >
            <Pencil size={16} />
          </button>
          <button 
            className="btn-icon" 
            style={{ color: '#F43F5E' }}
            onClick={() => {
              setDeleteId(row.id);
              setDeleteIdType('room');
              setIsConfirmOpen(true);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const filtered = classrooms.filter(r => 
    r.room_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CameraIcon size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Infrastructure Mapping</h1>
        </div>
        <button className="btn-primary" onClick={() => { resetRoomForm(); setDrawerOpen(true); }}>
          <Plus size={16} /> Add Classroom
        </button>
      </div>

      {/* Infrastructure Stats */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Mapped Rooms', value: classrooms.length, color: 'var(--accent-cyan)' },
          { label: 'Active Cameras', value: classrooms.reduce((acc, r) => acc + (r.cameras ? r.cameras.filter(c => c.status === 'online').length : 0), 0), color: '#10B981' },
          { label: 'Network Points', value: classrooms.reduce((acc, r) => acc + (r.cameras ? r.cameras.length : 0), 0), color: '#F59E0B' },
        ].map(stat => (
          <GlassCard key={stat.label} style={{ flex: 1, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 500 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          className="input-field" 
          placeholder="Search by room name or floor/location..." 
          style={{ paddingLeft: 40 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <GlassCard>
        <DataTable columns={columns} data={filtered} isLoading={loading} emptyMessage="No classrooms mapped. Start by adding your first room." />
      </GlassCard>

      {/* Classroom Drawer */}
      <DrawerPanel isOpen={drawerOpen} onClose={resetRoomForm} title={editId ? "Update Infrastructure" : "Add New Room"}>
        <div className="form-group">
          <label className="form-label">Room / Lab Name</label>
          <div style={{ position: 'relative' }}>
            <Monitor size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} placeholder="e.g. AI Research Lab 101" value={roomName} onChange={e => setRoomName(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Physical Location</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} placeholder="e.g. 2nd Floor, Main Block" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Seating Capacity</label>
          <div style={{ position: 'relative' }}>
            <Users size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" type="number" style={{ paddingLeft: 36 }} value={capacity} onChange={e => setCapacity(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary" onClick={handleSaveRoom} disabled={submitting} style={{ width: '100%', marginTop: 16 }}>
          {submitting ? 'Processing...' : (editId ? 'Update Classroom' : 'Register Classroom')}
        </button>
      </DrawerPanel>

      {/* Camera Link Drawer */}
      <DrawerPanel isOpen={cameraDrawerOpen} onClose={() => setCameraDrawerOpen(false)} title={`Link Camera to ${selectedRoom?.room_name}`}>
        <div className="form-group">
          <label className="form-label">Camera Identifier</label>
          <input className="input-field" placeholder="e.g. Hikvision-Front-01" value={camName} onChange={e => setCamName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">RTSP / Stream URL</label>
          <div style={{ position: 'relative' }}>
            <Wifi size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: 36 }} placeholder="rtsp://admin:pass@ip:554/stream" value={camUrl} onChange={e => setCamUrl(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Placement Angle</label>
          <select className="input-field" value={camPlacement} onChange={e => setCamPlacement(e.target.value)}>
            <option value="Front">Front Wall (Teacher's View)</option>
            <option value="Back">Back Wall (Student's View)</option>
            <option value="Entrance">Entrance Door</option>
            <option value="Ceiling">Ceiling (Overhead)</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleAddCamera} style={{ width: '100%', marginTop: 16 }}>
          Link Physical Hardware
        </button>
      </DrawerPanel>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={deleteType === 'room' ? "Remove Classroom" : "Unlink Camera"}
        message={`Are you sure? This will permanently remove this ${deleteType} and all its associated mappings.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
        icon={<Trash2 color="#ff4757" size={40} />}
      />
    </div>
  );
}

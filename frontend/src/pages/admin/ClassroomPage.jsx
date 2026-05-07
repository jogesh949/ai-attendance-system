import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import { DoorOpen, Plus } from 'lucide-react';

export default function ClassroomPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchClassrooms(); }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/classrooms');
      setClassrooms(res.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const addClassroom = async () => {
    if (!roomName.trim() || !location.trim()) { toast.error('Fill all fields'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/classrooms', { room_name: roomName, location });
      toast.success('🎉 Classroom added successfully!');
      setRoomName(''); setLocation(''); setDrawerOpen(false);
      fetchClassrooms();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error adding classroom');
    } finally { setSubmitting(false); }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'room_name', label: 'Room Name' },
    { key: 'location', label: 'Location' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DoorOpen size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Classrooms</h1>
        </div>
        <button className="btn-primary" onClick={() => setDrawerOpen(true)}>
          <Plus size={16} /> Add New
        </button>
      </div>

      <GlassCard>
        <DataTable columns={columns} data={classrooms} isLoading={loading} emptyMessage="No classrooms yet." />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Classroom">
        <div className="form-group">
          <label className="form-label">Room Name</label>
          <input className="input-field" placeholder="e.g. Room 101" value={roomName} onChange={e => setRoomName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="input-field" placeholder="e.g. MCA Block" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={addClassroom} disabled={submitting} style={{ width: '100%', marginTop: 16 }}>
          {submitting ? 'Adding...' : 'Add Classroom'}
        </button>
      </DrawerPanel>
    </div>
  );
}
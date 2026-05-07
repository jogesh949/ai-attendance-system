import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import { GraduationCap, Plus } from 'lucide-react';

export default function ClassPage() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [c, d] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/departments'),
      ]);
      setClasses(c.data || []);
      setDepartments(d.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const addClass = async () => {
    if (!name.trim() || !departmentId) { toast.error('Fill all fields'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/classes', { name, department_id: Number(departmentId) });
      toast.success('🎉 Class added successfully!');
      setName(''); setDepartmentId(''); setDrawerOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error adding class');
    } finally { setSubmitting(false); }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Class Name' },
    { key: 'department_id', label: 'Dept ID' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GraduationCap size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Classes</h1>
        </div>
        <button className="btn-primary" onClick={() => setDrawerOpen(true)}>
          <Plus size={16} /> Add New
        </button>
      </div>

      <GlassCard>
        <DataTable columns={columns} data={classes} isLoading={loading} emptyMessage="No classes yet." />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Class">
        <div className="form-group">
          <label className="form-label">Class Name</label>
          <input className="input-field" placeholder="e.g. MCA 1st Year" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="input-field" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={addClass} disabled={submitting} style={{ width: '100%', marginTop: 16 }}>
          {submitting ? 'Adding...' : 'Add Class'}
        </button>
      </DrawerPanel>
    </div>
  );
}
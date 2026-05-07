import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import { BookOpen, Plus } from 'lucide-react';

export default function SubjectPage() {
  const [subjects, setSubjects] = useState([]);
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
      const [s, d] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/departments'),
      ]);
      setSubjects(s.data || []);
      setDepartments(d.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const addSubject = async () => {
    if (!name.trim() || !departmentId) { toast.error('Fill all fields'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/subjects', { name, department_id: Number(departmentId) });
      toast.success('🎉 Subject added successfully!');
      setName(''); setDepartmentId(''); setDrawerOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error adding subject');
    } finally { setSubmitting(false); }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Subject Name' },
    { key: 'department_id', label: 'Dept ID' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Subjects</h1>
        </div>
        <button className="btn-primary" onClick={() => setDrawerOpen(true)}>
          <Plus size={16} /> Add New
        </button>
      </div>

      <GlassCard>
        <DataTable columns={columns} data={subjects} isLoading={loading} emptyMessage="No subjects yet." />
      </GlassCard>

      <DrawerPanel isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Subject">
        <div className="form-group">
          <label className="form-label">Subject Name</label>
          <input className="input-field" placeholder="e.g. Artificial Intelligence" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="input-field" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={addSubject} disabled={submitting} style={{ width: '100%', marginTop: 16 }}>
          {submitting ? 'Adding...' : 'Add Subject'}
        </button>
      </DrawerPanel>
    </div>
  );
}
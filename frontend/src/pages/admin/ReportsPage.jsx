import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import GlassCard from '../../components/GlassCard';
import AnimatedCounter from '../../components/AnimatedCounter';
import { BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00F5FF', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'];

export default function ReportsPage() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/students'), api.get('/admin/teachers'),
      api.get('/admin/classes'), api.get('/admin/subjects'),
      api.get('/admin/departments'),
    ]).then(([s, t, c, sub, d]) => {
      setStudents(s.data || []); setTeachers(t.data || []);
      setClasses(c.data || []); setSubjects(sub.data || []);
      setDepartments(d.data || []);
    }).catch(() => {});
  }, []);

  // Students per department
  const studentsPerDept = departments.map(dept => {
    const deptClasses = classes.filter(c => c.department_id === dept.id).map(c => c.id);
    const count = students.filter(s => deptClasses.includes(s.class_id)).length;
    return { name: dept.name, count };
  }).filter(d => d.count > 0);

  // Subjects per department
  const subjectsPerDept = departments.map(dept => {
    const count = subjects.filter(s => s.department_id === dept.id).length;
    return { name: dept.name, value: count };
  }).filter(d => d.value > 0);

  const downloadCSV = () => {
    const csv = [
      ['User ID', 'Roll No', 'Class ID'],
      ...students.map(s => [s.user_id, s.roll_no, s.class_id]),
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'enrollment_report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 Report downloaded! Check your Downloads folder.');
  };

  const stats = [
    { icon: '🧑‍🎓', label: 'Total Students', value: students.length },
    { icon: '👨‍🏫', label: 'Total Teachers', value: teachers.length },
    { icon: '📚', label: 'Total Classes', value: classes.length },
    { icon: '📖', label: 'Total Subjects', value: subjects.length },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BarChart3 size={24} color="var(--accent-cyan)" />
          <h1 className="font-orbitron" style={{ fontSize: '1.3rem' }}>Reports</h1>
        </div>
        <button className="btn-primary" onClick={downloadCSV}><Download size={14} /> Export CSV</button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <GlassCard key={i} style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>{s.icon}</div>
            <AnimatedCounter to={s.value} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        <GlassCard>
          <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Students per Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={studentsPerDept}>
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 8, color: '#F0F9FF' }} />
              <Bar dataKey="count" fill="#00F5FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Subjects per Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={subjectsPerDept} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {subjectsPerDept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 8, color: '#F0F9FF' }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}

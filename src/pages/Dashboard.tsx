import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, client } from '../api/client';
import StatCard from '../components/StatCard';
import StudentCard from '../components/StudentCard';
import toast from 'react-hot-toast';
import { AlertTriangle, Send } from 'lucide-react';

export default function Dashboard() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [atRisk, setAtRisk] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.getAnalytics(),
            api.getStudents({ risk: 'AT_RISK' }),
            api.getStudents({ risk: 'CRITICAL' })
        ]).then(([analyticsRes, atRiskRes, criticalRes]) => {
            setAnalytics(analyticsRes.data.data);
            setAtRisk([...criticalRes.data.data, ...atRiskRes.data.data]);
        }).catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    const sendBulkAlerts = async () => {
        setSending(true);
        try {
            await client.post('/api/alerts/attendance', { threshold: 75 });
            toast.success('Bulk alerts sent to all at-risk parents!');
        } catch {
            toast.error('Failed to send alerts');
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div style={{ color: '#6b6a8a', textAlign: 'center', marginTop: '80px' }}>
            Loading dashboard...
        </div>
    );

    return (
        <div style={{ maxWidth: '1100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Dashboard</h1>
                    <p style={{ fontSize: '13px', color: '#6b6a8a' }}>Overview of student performance</p>
                </div>
                <button onClick={sendBulkAlerts} disabled={sending} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#7c3aed', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '10px 16px', fontSize: '13px',
                    fontWeight: 500, cursor: 'pointer'
                }}>
                    <Send size={15} />
                    {sending ? 'Sending...' : 'Send Bulk Alerts'}
                </button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatCard label="Total Students" value={analytics?.totalStudents || 0} color="#7c3aed" />
                <StatCard label="Critical" value={analytics?.critical || 0} color="#ef4444" sub="Needs urgent attention" />
                <StatCard label="At Risk" value={analytics?.atRisk || 0} color="#f59e0b" sub="Below thresholds" />
                <StatCard label="On Track" value={analytics?.onTrack || 0} color="#22c55e" sub="Performing well" />
            </div>

            {/* Second row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatCard label="Avg Attendance" value={`${analytics?.avgAttendance || 0}%`} color="#3b82f6" />
                <StatCard label="Avg CGPA" value={analytics?.avgCgpa || '0.00'} color="#a855f7" />
            </div>

            {/* At Risk Students */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertTriangle size={18} color="#f59e0b" />
                    <h2 style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>
                        At Risk Students ({atRisk.length})
                    </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {atRisk.length === 0 ? (
                        <p style={{ color: '#6b6a8a', fontSize: '14px' }}>No at-risk students found.</p>
                    ) : (
                        atRisk.map(s => <StudentCard key={s.id} student={s} />)
                    )}
                </div>
                {atRisk.length > 0 && (
                    <button onClick={() => navigate('/students')} style={{
                        marginTop: '12px', background: 'transparent', color: '#7c3aed',
                        border: '1px solid #7c3aed', borderRadius: '8px',
                        padding: '8px 16px', fontSize: '13px', cursor: 'pointer'
                    }}>
                        View all students →
                    </button>
                )}
            </div>
        </div>
    );
}
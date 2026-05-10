import { useEffect, useState } from 'react';
import { api } from '../api/client';
import StudentCard from '../components/StudentCard';
import toast from 'react-hot-toast';
import { Search, Filter } from 'lucide-react';

const RISK_FILTERS = ['ALL', 'CRITICAL', 'AT_RISK', 'MONITOR', 'ON_TRACK'];

export default function Students() {
    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStudents()
            .then(res => { setStudents(res.data.data); setFiltered(res.data.data); })
            .catch(() => toast.error('Failed to load students'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let result = students;
        if (riskFilter !== 'ALL') result = result.filter(s => s.riskCategory === riskFilter);
        if (search) result = result.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.rollNumber.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(result);
    }, [search, riskFilter, students]);

    return (
        <div style={{ maxWidth: '1100px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Students</h1>
                <p style={{ fontSize: '13px', color: '#6b6a8a' }}>{filtered.length} students found</p>
            </div>

            {/* Search + Filter */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color="#6b6a8a" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or roll number..."
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px',
                            background: '#13112b', border: '1px solid #2d2b4e',
                            borderRadius: '8px', color: '#fff', fontSize: '14px',
                            outline: 'none', boxSizing: 'border-box'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Filter size={15} color="#6b6a8a" />
                    {RISK_FILTERS.map(f => (
                        <button key={f} onClick={() => setRiskFilter(f)} style={{
                            padding: '6px 12px', borderRadius: '20px', fontSize: '12px',
                            border: '1px solid', cursor: 'pointer',
                            background: riskFilter === f ? '#7c3aed' : 'transparent',
                            borderColor: riskFilter === f ? '#7c3aed' : '#2d2b4e',
                            color: riskFilter === f ? '#fff' : '#8b8aa8',
                        }}>
                            {f === 'ALL' ? 'All' : f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Student List */}
            {loading ? (
                <p style={{ color: '#6b6a8a' }}>Loading...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(s => <StudentCard key={s.id} student={s} />)}
                    {filtered.length === 0 && (
                        <p style={{ color: '#6b6a8a', textAlign: 'center', padding: '40px' }}>
                            No students match your search.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
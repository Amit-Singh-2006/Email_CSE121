import { useNavigate } from 'react-router-dom';
import RiskBadge from './RiskBadge';

export default function StudentCard({ student }: { student: any }) {
    const navigate = useNavigate();
    return (
        <div onClick={() => navigate(`/students/${student.id}`)} style={{
            background: '#13112b', border: '1px solid #2d2b4e', borderRadius: '10px',
            padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s',
            display: 'flex', alignItems: 'center', gap: '16px'
        }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c3aed')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2d2b4e')}
        >
            {/* Avatar */}
            <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: '#7c3aed33', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '16px', fontWeight: 600,
                color: '#a78bfa', flexShrink: 0
            }}>
                {student.name.charAt(0)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{student.name}</div>
                <div style={{ fontSize: '12px', color: '#6b6a8a' }}>{student.rollNumber} · {student.department}</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: student.attendance < 75 ? '#f87171' : '#4ade80' }}>
                        {student.attendance}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b6a8a' }}>Att.</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#a78bfa' }}>{student.cgpa}</div>
                    <div style={{ fontSize: '11px', color: '#6b6a8a' }}>CGPA</div>
                </div>
                <RiskBadge risk={student.riskCategory} />
            </div>
        </div>
    );
}
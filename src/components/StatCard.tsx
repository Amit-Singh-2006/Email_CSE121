export default function StatCard({ label, value, sub, color = '#7c3aed' }: {
    label: string; value: string | number; sub?: string; color?: string;
}) {
    return (
        <div style={{
            background: '#13112b', border: '1px solid #2d2b4e',
            borderRadius: '12px', padding: '20px',
            borderTop: `3px solid ${color}`
        }}>
            <div style={{ fontSize: '13px', color: '#6b6a8a', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#fff' }}>{value}</div>
            {sub && <div style={{ fontSize: '12px', color: '#6b6a8a', marginTop: '4px' }}>{sub}</div>}
        </div>
    );
}
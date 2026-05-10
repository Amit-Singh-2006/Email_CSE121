const config = {
    CRITICAL: { bg: '#3d1515', color: '#f87171', label: '🔴 Critical' },
    AT_RISK: { bg: '#3d2d0a', color: '#fbbf24', label: '🟡 At Risk' },
    MONITOR: { bg: '#0a1f3d', color: '#60a5fa', label: '🔵 Monitor' },
    ON_TRACK: { bg: '#0a2d1a', color: '#4ade80', label: '🟢 On Track' },
};

export default function RiskBadge({ risk }: { risk: string }) {
    const c = config[risk as keyof typeof config] || config.MONITOR;
    return (
        <span style={{
            background: c.bg, color: c.color, padding: '3px 10px',
            borderRadius: '20px', fontSize: '12px', fontWeight: 500,
            whiteSpace: 'nowrap'
        }}>
            {c.label}
        </span>
    );
}
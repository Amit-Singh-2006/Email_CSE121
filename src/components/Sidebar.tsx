import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Users, Upload, LogOut, GraduationCap } from 'lucide-react';

const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/upload', icon: Upload, label: 'Upload' },
];

export default function Sidebar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div style={{
            width: '220px', minHeight: '100vh', background: '#13112b',
            borderRight: '1px solid #2d2b4e', display: 'flex',
            flexDirection: 'column', padding: '24px 16px'
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                <div style={{
                    width: '36px', height: '36px', background: '#7c3aed',
                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <GraduationCap size={20} color="white" />
                </div>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>EduPlatform</div>
                    <div style={{ fontSize: '11px', color: '#6b6a8a' }}>Smart Analytics</div>
                </div>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {links.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
                        fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',
                        background: isActive ? '#7c3aed22' : 'transparent',
                        color: isActive ? '#a78bfa' : '#8b8aa8',
                        borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                    })}>
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User + Logout */}
            <div style={{ borderTop: '1px solid #2d2b4e', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b6a8a', marginBottom: '4px' }}>Logged in as</div>
                <div style={{ fontSize: '13px', color: '#fff', marginBottom: '12px' }}>{user?.name || 'Admin'}</div>
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'transparent', border: '1px solid #2d2b4e',
                    color: '#8b8aa8', padding: '8px 12px', borderRadius: '8px',
                    fontSize: '13px', cursor: 'pointer', width: '100%'
                }}>
                    <LogOut size={15} /> Logout
                </button>
            </div>
        </div>
    );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.login(email, password);
            setAuth(res.data.token, res.data.user);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#0f0e1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', width: '400px', height: '400px',
                background: 'radial-gradient(circle, #7c3aed33 0%, transparent 70%)',
                borderRadius: '50%', top: '20%', left: '50%', transform: 'translateX(-50%)'
            }} />

            <div style={{
                background: '#13112b', border: '1px solid #2d2b4e',
                borderRadius: '16px', padding: '40px', width: '100%',
                maxWidth: '400px', position: 'relative', zIndex: 1
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', background: '#7c3aed',
                        borderRadius: '16px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 12px'
                    }}>
                        <GraduationCap size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                        EduPlatform
                    </h1>
                    <p style={{ fontSize: '13px', color: '#6b6a8a' }}>Student Intelligence Dashboard</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', color: '#8b8aa8', display: 'block', marginBottom: '6px' }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} color="#6b6a8a" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="admin@college.com" required
                                style={{
                                    width: '100%', padding: '10px 12px 10px 36px',
                                    background: '#0f0e1a', border: '1px solid #2d2b4e',
                                    borderRadius: '8px', color: '#fff', fontSize: '14px',
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', color: '#8b8aa8', display: 'block', marginBottom: '6px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} color="#6b6a8a" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" required
                                style={{
                                    width: '100%', padding: '10px 12px 10px 36px',
                                    background: '#0f0e1a', border: '1px solid #2d2b4e',
                                    borderRadius: '8px', color: '#fff', fontSize: '14px',
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        background: loading ? '#4c1d95' : '#7c3aed', color: '#fff',
                        border: 'none', borderRadius: '8px', padding: '12px',
                        fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                        marginTop: '8px', transition: 'background 0.15s'
                    }}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p style={{ fontSize: '12px', color: '#6b6a8a', textAlign: 'center', marginTop: '24px' }}>
                    Student Intelligence & Parent Communication Platform
                </p>
            </div>
        </div>
    );
}
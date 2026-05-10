import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, MessageSquare, Bot } from 'lucide-react';

export default function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [aiMsg, setAiMsg] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [tone, setTone] = useState('supportive');

    useEffect(() => {
        api.getStudent(id!)
            .then(res => setStudent(res.data.data))
            .catch(() => toast.error('Student not found'))
            .finally(() => setLoading(false));
    }, [id]);

    const sendEmail = async () => {
        try {
            await api.sendReport(id!);
            toast.success('Email report sent!');
        } catch { toast.error('Failed to send email'); }
    };

    const sendWhatsApp = async () => {
        try {
            await api.sendWhatsApp(id!);
            toast.success('WhatsApp alert sent!');
        } catch { toast.error('Failed to send WhatsApp'); }
    };

    const generateAI = async () => {
        setAiLoading(true);
        try {
            const res = await api.generateMessage(id!, tone);
            setAiMsg(res.data.data.parentMessage);
        } catch { toast.error('AI generation failed'); }
        finally { setAiLoading(false); }
    };

    if (loading) return <p style={{ color: '#6b6a8a' }}>Loading...</p>;
    if (!student) return <p style={{ color: '#f87171' }}>Student not found</p>;

    const latest = student.semesterRecords?.[student.semesterRecords.length - 1];

    return (
        <div style={{ maxWidth: '900px' }}>
            <button onClick={() => navigate('/students')} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: 'none', color: '#6b6a8a',
                fontSize: '13px', cursor: 'pointer', marginBottom: '20px'
            }}>
                <ArrowLeft size={15} /> Back to students
            </button>

            {/* Profile Header */}
            <div style={{
                background: '#13112b', border: '1px solid #2d2b4e',
                borderRadius: '12px', padding: '24px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '20px'
            }}>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: '#7c3aed33', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '24px', fontWeight: 600, color: '#a78bfa'
                }}>
                    {student.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{student.name}</h1>
                    <p style={{ fontSize: '13px', color: '#6b6a8a' }}>{student.rollNumber} · {student.department?.name} · Sem {student.currentSemester}</p>
                </div>
                <RiskBadge risk={student.riskCategory} />
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#13112b', border: '1px solid #2d2b4e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 600, color: student.attendance < 75 ? '#f87171' : '#4ade80' }}>{student.attendance}%</div>
                    <div style={{ fontSize: '12px', color: '#6b6a8a' }}>Attendance</div>
                </div>
                <div style={{ background: '#13112b', border: '1px solid #2d2b4e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 600, color: '#a78bfa' }}>{student.cgpa}</div>
                    <div style={{ fontSize: '12px', color: '#6b6a8a' }}>CGPA</div>
                </div>
                <div style={{ background: '#13112b', border: '1px solid #2d2b4e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 600, color: '#60a5fa' }}>{student.currentSemester}</div>
                    <div style={{ fontSize: '12px', color: '#6b6a8a' }}>Semester</div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button onClick={sendEmail} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: '#7c3aed', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer'
                }}>
                    <Mail size={15} /> Send Email Report
                </button>
                <button onClick={sendWhatsApp} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: '#16a34a', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer'
                }}>
                    <MessageSquare size={15} /> Send WhatsApp
                </button>
            </div>

            {/* AI Message Generator */}
            <div style={{ background: '#13112b', border: '1px solid #2d2b4e', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Bot size={18} color="#a78bfa" />
                    <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#fff' }}>AI Message Generator</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {['supportive', 'formal', 'urgent'].map(t => (
                        <button key={t} onClick={() => setTone(t)} style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                            border: '1px solid', cursor: 'pointer',
                            background: tone === t ? '#7c3aed' : 'transparent',
                            borderColor: tone === t ? '#7c3aed' : '#2d2b4e',
                            color: tone === t ? '#fff' : '#8b8aa8',
                        }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                    <button onClick={generateAI} disabled={aiLoading} style={{
                        marginLeft: 'auto', background: '#a855f7', color: '#fff',
                        border: 'none', borderRadius: '8px', padding: '6px 14px',
                        fontSize: '12px', cursor: 'pointer'
                    }}>
                        {aiLoading ? 'Generating...' : 'Generate ✨'}
                    </button>
                </div>
                {aiMsg && (
                    <div style={{ background: '#0f0e1a', borderRadius: '8px', padding: '14px', fontSize: '13px', color: '#d1d0e8', lineHeight: '1.7' }}>
                        {aiMsg}
                    </div>
                )}
            </div>

            {/* Subject Marks */}
            {latest?.subjects?.length > 0 && (
                <div style={{ background: '#13112b', border: '1px solid #2d2b4e', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#fff', marginBottom: '14px' }}>Subject Marks</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #2d2b4e' }}>
                                {['Subject', 'CA', 'Mid', 'End', 'Total'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b6a8a', fontWeight: 500 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {latest.subjects.map((s: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid #1a1830' }}>
                                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#fff' }}>{s.subjectName}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#d1d0e8' }}>{s.caMarks ?? '-'}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#d1d0e8' }}>{s.midtermMarks ?? '-'}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#d1d0e8' }}>{s.endtermMarks ?? '-'}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#a78bfa', fontWeight: 500 }}>{s.totalMarks ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
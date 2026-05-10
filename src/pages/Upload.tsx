import { useState, useRef } from 'react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';

const TENANT_ID = 'cmoy07h1h0000ksrjph6lv8iz';
const DEPT_ID = 'cmoy07ht70001ksrj91mu7u72';

export default function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('tenantId', TENANT_ID);
            form.append('departmentId', DEPT_ID);
            form.append('semester', '4');
            form.append('academicYear', '2024-25');
            const res = await api.uploadStudents(form);
            setResult(res.data);
            toast.success(`${res.data.summary.successRows} students uploaded!`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: '700px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Upload Students</h1>
                <p style={{ fontSize: '13px', color: '#6b6a8a' }}>Upload Excel or CSV file to import student data</p>
            </div>

            {/* Drop Zone */}
            <div onClick={() => inputRef.current?.click()} style={{
                border: `2px dashed ${file ? '#7c3aed' : '#2d2b4e'}`,
                borderRadius: '12px', padding: '48px', textAlign: 'center',
                cursor: 'pointer', background: file ? '#7c3aed11' : '#13112b',
                transition: 'all 0.15s', marginBottom: '16px'
            }}>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                    <>
                        <FileSpreadsheet size={40} color="#7c3aed" style={{ margin: '0 auto 12px' }} />
                        <p style={{ color: '#fff', fontWeight: 500 }}>{file.name}</p>
                        <p style={{ color: '#6b6a8a', fontSize: '13px', marginTop: '4px' }}>
                            {(file.size / 1024).toFixed(1)} KB
                        </p>
                    </>
                ) : (
                    <>
                        <UploadIcon size={40} color="#6b6a8a" style={{ margin: '0 auto 12px' }} />
                        <p style={{ color: '#8b8aa8', fontWeight: 500 }}>Click to select Excel file</p>
                        <p style={{ color: '#6b6a8a', fontSize: '13px', marginTop: '4px' }}>
                            .xlsx, .xls, .csv supported
                        </p>
                    </>
                )}
            </div>

            <button onClick={handleUpload} disabled={!file || uploading} style={{
                width: '100%', background: !file ? '#2d2b4e' : '#7c3aed',
                color: '#fff', border: 'none', borderRadius: '8px',
                padding: '12px', fontSize: '14px', fontWeight: 500,
                cursor: !file || uploading ? 'not-allowed' : 'pointer'
            }}>
                {uploading ? 'Uploading...' : 'Upload Students'}
            </button>

            {/* Result */}
            {result && (
                <div style={{ marginTop: '24px', background: '#13112b', border: '1px solid #2d2b4e', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '15px' }}>Upload Result</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 600, color: '#fff' }}>{result.summary.totalRows}</div>
                            <div style={{ fontSize: '12px', color: '#6b6a8a' }}>Total Rows</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 600, color: '#4ade80' }}>{result.summary.successRows}</div>
                            <div style={{ fontSize: '12px', color: '#6b6a8a' }}>Uploaded</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 600, color: '#f87171' }}>{result.summary.errorRows}</div>
                            <div style={{ fontSize: '12px', color: '#6b6a8a' }}>Errors</div>
                        </div>
                    </div>
                    {result.errors?.length > 0 && (
                        <div style={{ background: '#1a0a0a', borderRadius: '8px', padding: '12px' }}>
                            {result.errors.map((e: string, i: number) => (
                                <div key={i} style={{ fontSize: '12px', color: '#f87171', marginBottom: '4px' }}>
                                    ⚠️ {e}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
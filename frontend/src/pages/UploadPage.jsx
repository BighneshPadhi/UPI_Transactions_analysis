import React, { useRef, useState } from 'react';
import API_BASE from '../api';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useAppContext } from '../App';
import StatCard from '../components/StatCard';
import {
    TrendingUp, DollarSign, MapPin, ShoppingBag, AlertTriangle, BarChart3
} from 'lucide-react';

function formatNumber(n) {
    if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n?.toLocaleString?.() ?? n;
}

function formatCurrency(n) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${n?.toLocaleString?.('en-IN') ?? n}`;
}

export default function UploadPage() {
    const { setUploaded, setUploadSummary, setFilterOptions, uploadSummary } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef();

    const handleFile = async (file) => {
        if (!file) return;
        setLoading(true);
        setError('');
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 8, 90));
            }, 200);

            const resp = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (!resp.ok) {
                const d = await resp.json();
                throw new Error(d.error || 'Upload failed');
            }

            const data = await resp.json();
            setUploadSummary(data.summary);
            setFilterOptions(data.filters);
            setUploaded(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const summary = uploadSummary;

    return (
        <div>
            <div className="page-header">
                <h2>Upload Dataset</h2>
                <p>Upload your UPI transaction CSV file to begin analysis</p>
            </div>

            {!summary ? (
                <div className="upload-area">
                    <div
                        className={`upload-card${dragOver ? ' drag-over' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => !loading && fileRef.current?.click()}
                    >
                        <div className="upload-icon">
                            {loading ? <div className="spinner" style={{ borderTopColor: 'white', margin: 0, width: 28, height: 28 }} /> : <Upload size={32} />}
                        </div>
                        <h2>{loading ? 'Processing...' : 'Drop your CSV file here'}</h2>
                        <p>{loading ? 'Parsing 250K transactions' : 'or click to browse — supports .csv files up to 100 MB'}</p>

                        {loading && (
                            <div className="upload-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{progress}%</p>
                            </div>
                        )}

                        {error && <p style={{ color: 'var(--accent-red)', marginTop: 16 }}>{error}</p>}

                        {!loading && (
                            <button className="upload-btn" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                                <FileText size={16} /> Select CSV File
                            </button>
                        )}

                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={e => handleFile(e.target.files[0])}
                        />
                    </div>
                </div>
            ) : (
                <div className="upload-summary animate-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '16px 20px', background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CheckCircle size={22} style={{ color: 'var(--accent-green)' }} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>Dataset Loaded Successfully</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {summary.date_min?.slice(0, 10)} → {summary.date_max?.slice(0, 10)}
                            </div>
                        </div>
                        <button
                            className="upload-btn"
                            style={{ marginLeft: 'auto', padding: '8px 20px', fontSize: 13 }}
                            onClick={() => {
                                setUploadSummary(null);
                                setUploaded(false);
                            }}
                        >
                            Upload New
                        </button>
                    </div>

                    <div className="stats-grid">
                        <StatCard icon={BarChart3} label="Total Transactions" value={formatNumber(summary.total_transactions)} color="blue" />
                        <StatCard icon={DollarSign} label="Total Value" value={formatCurrency(summary.total_value)} color="green" />
                        <StatCard icon={MapPin} label="States" value={summary.num_states} color="purple" />
                        <StatCard icon={ShoppingBag} label="Categories" value={summary.num_categories} color="cyan" />
                        <StatCard icon={TrendingUp} label="Success Rate" value={`${summary.success_rate}%`} color="green" />
                        <StatCard icon={AlertTriangle} label="Fraud Rate" value={`${summary.fraud_pct}%`} sub="of all transactions" color="red" />
                    </div>
                </div>
            )}
        </div>
    );
}

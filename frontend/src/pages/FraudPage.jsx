import React, { useEffect, useState } from 'react';
import API_BASE from '../api';
import { useAppContext } from '../App';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { AlertTriangle, ShieldAlert, TrendingUp, Smartphone } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="custom-tooltip">
            <div className="label">{label}</div>
            {payload.map((p, i) => (
                <div key={i} className="item" style={{ color: p.color }}>
                    {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                </div>
            ))}
        </div>
    );
};

export default function FraudPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`${API_BASE}/api/fraud${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading fraud data...</p></div>;
    if (!data) return null;

    const byCat = (data.by_category || []).slice(0, 10);
    const byState = (data.by_state || []).slice(0, 10);
    const byHour = data.by_hour || [];
    const byDevice = data.by_device || [];

    return (
        <div>
            <div className="page-header">
                <h2>Fraud Analysis</h2>
                <p>Identify fraud patterns and high-risk segments</p>
            </div>

            <div className="stats-grid">
                <StatCard icon={AlertTriangle} label="Total Fraud" value={data.total_fraud?.toLocaleString()} color="red" />
                <StatCard icon={ShieldAlert} label="Fraud Rate" value={`${data.fraud_rate}%`} color="red" />
                <StatCard icon={TrendingUp} label="Top Fraud Category" value={byCat[0]?.category || '-'} sub={`${byCat[0]?.fraud_count?.toLocaleString() || 0} cases`} color="amber" />
                <StatCard icon={Smartphone} label="Top Fraud Device" value={byDevice.sort((a, b) => b.fraud_count - a.fraud_count)[0]?.device || '-'} color="purple" />
            </div>

            <div className="chart-grid">
                <ChartCard title="Fraud by Category" subtitle="Top categories by fraud count">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={byCat}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="category" stroke="#5e6b85" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="fraud_count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Fraud Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Fraud Rate by Category" subtitle="Percentage of fraudulent transactions">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={byCat.sort((a, b) => b.fraud_rate - a.fraud_rate)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="category" stroke="#5e6b85" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="fraud_rate" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Fraud Rate (%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Fraud by Hour" subtitle="Hourly fraud distribution" fullWidth>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={byHour}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="hour" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="fraud_count" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Fraud Count" />
                            <Line type="monotone" dataKey="fraud_rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Fraud Rate (%)" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Fraud by State" subtitle="Top states by fraud volume">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={byState} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis type="number" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="state" stroke="#5e6b85" tick={{ fontSize: 11 }} width={100} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="fraud_count" fill="#ef4444" radius={[0, 4, 4, 0]} name="Fraud Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Fraud by Device" subtitle="Device breakdown">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={byDevice} dataKey="fraud_count" nameKey="device" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={5}
                                label={({ device, percent }) => `${device} ${(percent * 100).toFixed(1)}%`}>
                                {byDevice.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Fraud heatmap */}
            <div className="chart-card animate-in" style={{ marginTop: 24 }}>
                <div className="chart-card-header">
                    <div className="chart-card-title">Fraud Intensity by Hour</div>
                </div>
                <div style={{ display: 'flex', gap: 3, padding: '0 4px' }}>
                    {byHour.map((h, i) => {
                        const maxRate = Math.max(...byHour.map(x => x.fraud_rate), 1);
                        const intensity = h.fraud_rate / maxRate;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{
                                    width: '100%',
                                    height: 40,
                                    borderRadius: 4,
                                    background: `rgba(239, 68, 68, ${0.1 + intensity * 0.8})`,
                                }} title={`${h.hour}:00 — ${h.fraud_rate}% fraud rate`} />
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{h.hour}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

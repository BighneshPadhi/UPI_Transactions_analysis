import React, { useEffect, useState } from 'react';
import API_BASE from '../api';
import { useAppContext } from '../App';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import {
    BarChart3, DollarSign, TrendingUp, ShieldCheck, AlertTriangle, XCircle
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#f97316'];

function fmt(n) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n?.toLocaleString?.() ?? n;
}

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

export default function OverviewPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        const qs = buildQuery();
        Promise.all([
            fetch(`${API_BASE}/api/summary${qs}`).then(r => r.json()),
            fetch(`${API_BASE}/api/overview${qs}`).then(r => r.json()),
        ]).then(([s, o]) => {
            setSummary(s);
            setData(o);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading overview...</p></div>;
    if (!summary || !data) return null;

    const catData = (data.category_distribution || []).slice(0, 8);
    const stateData = (data.state_distribution || []).slice(0, 10);

    // Heatmap data
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const heatmapMap = {};
    (data.heatmap || []).forEach(h => {
        const key = `${h.day_of_week}-${h.hour_of_day}`;
        heatmapMap[key] = h.count;
    });
    const maxHeat = Math.max(...Object.values(heatmapMap), 1);

    return (
        <div>
            <div className="page-header">
                <h2>Executive Overview</h2>
                <p>High-level metrics and transaction trends</p>
            </div>

            <div className="stats-grid">
                <StatCard icon={BarChart3} label="Total Volume" value={fmt(summary.total_transactions)} color="blue" />
                <StatCard icon={DollarSign} label="Total Value" value={fmt(summary.total_value)} color="green" />
                <StatCard icon={TrendingUp} label="Avg Transaction" value={`₹${Math.round(summary.avg_amount).toLocaleString()}`} color="purple" />
                <StatCard icon={ShieldCheck} label="Success Rate" value={`${summary.success_rate}%`} sub={`${fmt(summary.success_count)} transactions`} color="green" />
                <StatCard icon={XCircle} label="Failure Rate" value={`${summary.failure_rate}%`} sub={`${fmt(summary.failed_count)} transactions`} color="amber" />
                <StatCard icon={AlertTriangle} label="Fraud Rate" value={`${summary.fraud_rate}%`} sub={`${fmt(summary.fraud_count)} flagged`} color="red" />
            </div>

            <div className="chart-grid">
                <ChartCard title="Transactions Over Time" subtitle="Daily volume" fullWidth>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.txn_over_time}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="date" stroke="#5e6b85" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} tickFormatter={fmt} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Transactions" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Category Distribution" subtitle="Transaction share by category">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={catData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#5e6b85' }}>
                                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Transactions by State" subtitle="Top 10 states">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stateData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis type="number" stroke="#5e6b85" tick={{ fontSize: 11 }} tickFormatter={fmt} />
                            <YAxis type="category" dataKey="state" stroke="#5e6b85" tick={{ fontSize: 11 }} width={100} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Transactions" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Hourly Activity Heatmap" subtitle="Transaction density by hour & day" fullWidth>
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(24, 1fr)', gap: 2, fontSize: 10 }}>
                            <div />
                            {Array.from({ length: 24 }, (_, i) => (
                                <div key={i} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4px 0' }}>
                                    {i}h
                                </div>
                            ))}
                            {days.map(day => (
                                <React.Fragment key={day}>
                                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 11, paddingRight: 8 }}>
                                        {day.slice(0, 3)}
                                    </div>
                                    {Array.from({ length: 24 }, (_, h) => {
                                        const val = heatmapMap[`${day}-${h}`] || 0;
                                        const intensity = val / maxHeat;
                                        return (
                                            <div
                                                key={h}
                                                className="heatmap-cell"
                                                style={{
                                                    aspectRatio: '1',
                                                    backgroundColor: `rgba(59, 130, 246, ${0.05 + intensity * 0.85})`,
                                                    borderRadius: 3,
                                                }}
                                                title={`${day} ${h}:00 — ${val.toLocaleString()} txns`}
                                            />
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

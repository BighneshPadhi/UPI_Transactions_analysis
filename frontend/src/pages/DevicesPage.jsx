import React, { useEffect, useState } from 'react';
import API_BASE from '../api';
import { useAppContext } from '../App';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { Smartphone, Wifi, CheckCircle, XCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

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

export default function DevicesPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`${API_BASE}/api/devices${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading device data...</p></div>;
    if (!data) return null;

    const devices = data.by_device || [];
    const networks = data.by_network || [];
    const totalDevTxns = devices.reduce((s, d) => s + d.count, 0);

    return (
        <div>
            <div className="page-header">
                <h2>Device & Network Insights</h2>
                <p>Transaction patterns by device type and network connectivity</p>
            </div>

            <div className="stats-grid">
                {devices.map((d, i) => (
                    <StatCard
                        key={d.device}
                        icon={Smartphone}
                        label={d.device}
                        value={`${((d.count / totalDevTxns) * 100).toFixed(1)}%`}
                        sub={`${d.count.toLocaleString()} txns • ₹${Math.round(d.avg_amount).toLocaleString()} avg`}
                        color={i === 0 ? 'blue' : 'purple'}
                    />
                ))}
                {devices.map((d, i) => (
                    <StatCard
                        key={`sr-${d.device}`}
                        icon={d.success_rate > 90 ? CheckCircle : XCircle}
                        label={`${d.device} Success`}
                        value={`${d.success_rate}%`}
                        color="green"
                    />
                ))}
            </div>

            <div className="chart-grid">
                <ChartCard title="Device Usage Share" subtitle="Transaction distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={devices} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={5}
                                label={({ device, percent }) => `${device} ${(percent * 100).toFixed(1)}%`}>
                                {devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Average Transaction by Device" subtitle="Amount comparison">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={devices}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="device" stroke="#5e6b85" />
                            <YAxis stroke="#5e6b85" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avg_amount" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Avg Amount (₹)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Network Reliability" subtitle="Success and failure rates by network">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={networks}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="network" stroke="#5e6b85" />
                            <YAxis stroke="#5e6b85" unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="success_rate" fill="#10b981" radius={[4, 4, 0, 0]} name="Success %" />
                            <Bar dataKey="failure_rate" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failure %" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Network Transaction Volume" subtitle="By network type">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={networks} dataKey="count" nameKey="network" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={5}
                                label={({ network, percent }) => `${network} ${(percent * 100).toFixed(1)}%`}>
                                {networks.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

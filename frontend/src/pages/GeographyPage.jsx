import React, { useEffect, useState } from 'react';
import API_BASE from '../api';
import { useAppContext } from '../App';
import ChartCard from '../components/ChartCard';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

// Indian state centers for a simple bubble map
const STATE_COORDS = {
    'Andhra Pradesh': [15.9129, 79.74],
    'Arunachal Pradesh': [28.218, 94.7278],
    'Assam': [26.2006, 92.9376],
    'Bihar': [25.0961, 85.3131],
    'Chhattisgarh': [21.2787, 81.8661],
    'Delhi': [28.7041, 77.1025],
    'Goa': [15.2993, 74.124],
    'Gujarat': [22.2587, 71.1924],
    'Haryana': [29.0588, 76.0856],
    'Himachal Pradesh': [31.1048, 77.1734],
    'Jharkhand': [23.6102, 85.2799],
    'Karnataka': [15.3173, 75.7139],
    'Kerala': [10.8505, 76.2711],
    'Madhya Pradesh': [22.9734, 78.6569],
    'Maharashtra': [19.7515, 75.7139],
    'Manipur': [24.6637, 93.9063],
    'Meghalaya': [25.467, 91.3662],
    'Mizoram': [23.1645, 92.9376],
    'Nagaland': [26.1584, 94.5624],
    'Odisha': [20.9517, 85.0985],
    'Punjab': [31.1471, 75.3412],
    'Rajasthan': [27.0238, 74.2179],
    'Sikkim': [27.533, 88.5122],
    'Tamil Nadu': [11.1271, 78.6569],
    'Telangana': [18.1124, 79.0193],
    'Tripura': [23.9408, 91.9882],
    'Uttar Pradesh': [26.8467, 80.9462],
    'Uttarakhand': [30.0668, 79.0193],
    'West Bengal': [22.9868, 87.855],
};

export default function GeographyPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`${API_BASE}/api/geography${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading geography...</p></div>;
    if (!data) return null;

    const states = data.by_state || [];
    const maxCount = Math.max(...states.map(s => s.count), 1);

    return (
        <div>
            <div className="page-header">
                <h2>Geographic Analysis</h2>
                <p>Transaction distribution across Indian states</p>
            </div>

            {/* India bubble map */}
            <div className="chart-card animate-in" style={{ marginBottom: 24 }}>
                <div className="chart-card-header">
                    <div className="chart-card-title">India Transaction Map</div>
                    <div className="chart-card-subtitle">Bubble size = transaction volume</div>
                </div>
                <div style={{ position: 'relative', width: '100%', maxWidth: 700, margin: '0 auto', aspectRatio: '1.2' }}>
                    <svg viewBox="0 0 500 550" width="100%" height="100%">
                        {/* India outline hint */}
                        <text x="250" y="30" textAnchor="middle" fill="#1e2a45" fontSize="14">INDIA</text>
                        {states.map((s, i) => {
                            const coords = STATE_COORDS[s.state];
                            if (!coords) return null;
                            // Map lat/lon to SVG coords (rough approximation)
                            const x = ((coords[1] - 68) / (98 - 68)) * 440 + 30;
                            const y = ((37 - coords[0]) / (37 - 8)) * 500 + 25;
                            const radius = 8 + (s.count / maxCount) * 30;
                            const intensity = s.count / maxCount;
                            return (
                                <g key={s.state}>
                                    <circle
                                        cx={x} cy={y} r={radius}
                                        fill={`rgba(59, 130, 246, ${0.2 + intensity * 0.6})`}
                                        stroke="#3b82f6"
                                        strokeWidth={1}
                                        opacity={0.8}
                                    />
                                    <text x={x} y={y + 3} textAnchor="middle" fill="var(--text-primary)" fontSize={8} fontWeight={500}>
                                        {s.state.length > 6 ? s.state.slice(0, 5) + '..' : s.state}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            <div className="chart-grid">
                <ChartCard title="Transactions by State" subtitle="Top states by volume">
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={states.slice(0, 15)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis type="number" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="state" stroke="#5e6b85" tick={{ fontSize: 11 }} width={120} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Transactions" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Fraud Rate by State" subtitle="Percentage of fraudulent transactions">
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={[...states].sort((a, b) => (b.fraud_rate || 0) - (a.fraud_rate || 0)).slice(0, 15)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis type="number" stroke="#5e6b85" tick={{ fontSize: 11 }} unit="%" />
                            <YAxis type="category" dataKey="state" stroke="#5e6b85" tick={{ fontSize: 11 }} width={120} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="fraud_rate" fill="#ef4444" radius={[0, 4, 4, 0]} name="Fraud Rate (%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* State table */}
            <div className="chart-card animate-in">
                <div className="chart-card-header">
                    <div className="chart-card-title">State-wise Breakdown</div>
                </div>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>State</th>
                                <th>Transactions</th>
                                <th>Total Value</th>
                                <th>Avg Amount</th>
                                <th>Fraud Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {states.map((s, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.state}</td>
                                    <td>{s.count.toLocaleString()}</td>
                                    <td>₹{Math.round(s.total_value).toLocaleString()}</td>
                                    <td>₹{Math.round(s.avg_amount).toLocaleString()}</td>
                                    <td>
                                        <span style={{ color: s.fraud_rate > 5 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                                            {s.fraud_rate?.toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

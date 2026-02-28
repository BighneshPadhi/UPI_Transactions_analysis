import React, { useEffect, useState } from 'react';
import { useAppContext } from '../App';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { Users, DollarSign, ShieldAlert, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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

export default function DemographicsPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`/api/demographics${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading demographics...</p></div>;
    if (!data) return null;

    const ages = data.by_age || [];
    const ageCat = data.age_category || [];

    // Top age group
    const topAge = ages.reduce((max, a) => a.count > (max?.count || 0) ? a : max, null);
    const highSpender = ages.reduce((max, a) => a.avg_amount > (max?.avg_amount || 0) ? a : max, null);

    // Build age-category matrix for top 5 categories
    const allCats = [...new Set(ageCat.map(a => a.merchant_category))];
    const topCats = allCats.slice(0, 5);
    const ageCatData = ages.map(a => {
        const row = { age_group: a.age_group };
        topCats.forEach(cat => {
            const found = ageCat.find(ac => ac.sender_age_group === a.age_group && ac.merchant_category === cat);
            row[cat] = found ? found.count : 0;
        });
        return row;
    });

    return (
        <div>
            <div className="page-header">
                <h2>User Demographics</h2>
                <p>Spending patterns and preferences by age group</p>
            </div>

            <div className="stats-grid">
                <StatCard icon={Users} label="Most Active Age" value={topAge?.age_group || '-'} sub={`${topAge?.count?.toLocaleString() || 0} transactions`} color="blue" />
                <StatCard icon={DollarSign} label="Highest Spender" value={highSpender?.age_group || '-'} sub={`₹${Math.round(highSpender?.avg_amount || 0).toLocaleString()} avg`} color="green" />
                <StatCard icon={ShieldAlert} label="Highest Fraud Risk" value={ages.reduce((max, a) => (a.fraud_rate || 0) > (max?.fraud_rate || 0) ? a : max, null)?.age_group || '-'} color="red" />
                <StatCard icon={TrendingUp} label="Total Age Groups" value={ages.length} color="purple" />
            </div>

            <div className="chart-grid">
                <ChartCard title="Transactions by Age Group" subtitle="Volume and value">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="age_group" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Transaction Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Average Transaction by Age" subtitle="Spending power comparison">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="age_group" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avg_amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Amount (₹)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Fraud Rate by Age Group" subtitle="Risk distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="age_group" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="fraud_rate" fill="#ef4444" radius={[4, 4, 0, 0]} name="Fraud Rate (%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Category Preference by Age" subtitle="Top 5 categories" fullWidth>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={ageCatData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="age_group" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {topCats.map((cat, i) => (
                                <Bar key={cat} dataKey={cat} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} stackId="stack" />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Age group table */}
            <div className="chart-card animate-in" style={{ marginTop: 24 }}>
                <div className="chart-card-header">
                    <div className="chart-card-title">Age Group Summary</div>
                </div>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Age Group</th>
                                <th>Transactions</th>
                                <th>Total Value</th>
                                <th>Avg Amount</th>
                                <th>Fraud Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ages.map((a, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.age_group}</td>
                                    <td>{a.count.toLocaleString()}</td>
                                    <td>₹{Math.round(a.total_value).toLocaleString()}</td>
                                    <td>₹{Math.round(a.avg_amount).toLocaleString()}</td>
                                    <td style={{ color: (a.fraud_rate || 0) > 5 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                                        {a.fraud_rate?.toFixed(2)}%
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

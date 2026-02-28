import React, { useEffect, useState } from 'react';
import API_BASE from '../api';
import { useAppContext } from '../App';
import ChartCard from '../components/ChartCard';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#f97316'];

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

export default function CategoriesPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`${API_BASE}/api/categories${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading categories...</p></div>;
    if (!data) return null;

    const cats = data.by_category || [];

    // Build trend data for line chart — pivot month/category
    const trendsRaw = data.trends || [];
    const months = [...new Set(trendsRaw.map(t => t.month))].sort();
    const topCats = cats.slice(0, 5).map(c => c.category);
    const trendData = months.map(m => {
        const row = { month: m };
        topCats.forEach(cat => {
            const found = trendsRaw.find(t => t.month === m && t.merchant_category === cat);
            row[cat] = found ? found.count : 0;
        });
        return row;
    });

    return (
        <div>
            <div className="page-header">
                <h2>Spending & Category Analysis</h2>
                <p>Analyze merchant categories by volume, value, and trends</p>
            </div>

            {/* Table */}
            <div className="chart-card animate-in" style={{ marginBottom: 24 }}>
                <div className="chart-card-header">
                    <div className="chart-card-title">Category Performance</div>
                </div>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Volume</th>
                                <th>Total Value</th>
                                <th>Avg Amount</th>
                                <th>Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cats.map((c, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.category}</td>
                                    <td>{c.count.toLocaleString()}</td>
                                    <td>₹{Math.round(c.total_value).toLocaleString()}</td>
                                    <td>₹{Math.round(c.avg_amount).toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 60, height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${(c.count / (cats[0]?.count || 1)) * 100}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontSize: 12 }}>{((c.count / cats.reduce((s, x) => s + x.count, 0)) * 100).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="chart-grid">
                <ChartCard title="Category Share" subtitle="By transaction volume">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={cats.slice(0, 8)} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                                {cats.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Average Transaction Size" subtitle="By category">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={cats.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="category" stroke="#5e6b85" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avg_amount" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Avg Amount (₹)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Category Trends" subtitle="Monthly volume — top 5" fullWidth>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="month" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {topCats.map((cat, i) => (
                                <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

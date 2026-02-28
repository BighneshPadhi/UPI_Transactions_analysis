import React, { useEffect, useState } from 'react';
import { useAppContext } from '../App';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { Clock, CalendarDays, Sun, Moon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
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

export default function TimePage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`/api/time${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading time analysis...</p></div>;
    if (!data) return null;

    const hourly = data.hourly || [];
    const daily = data.daily || [];
    const ww = data.weekend_weekday || [];

    const peakHour = hourly.reduce((max, h) => h.count > (max?.count || 0) ? h : max, null);
    const peakDay = daily.reduce((max, d) => d.count > (max?.count || 0) ? d : max, null);

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
                <h2>Time-Based Analysis</h2>
                <p>Discover transaction patterns across hours, days, and weekends</p>
            </div>

            <div className="stats-grid">
                <StatCard icon={Clock} label="Peak Hour" value={peakHour ? `${peakHour.hour}:00` : '-'} sub={peakHour ? `${peakHour.count.toLocaleString()} transactions` : ''} color="blue" />
                <StatCard icon={CalendarDays} label="Peak Day" value={peakDay?.day || '-'} sub={peakDay ? `${peakDay.count.toLocaleString()} transactions` : ''} color="purple" />
                {ww.length === 2 && (
                    <>
                        <StatCard icon={Sun} label="Weekday Avg" value={`₹${Math.round(ww.find(w => w.label === 'Weekday')?.avg_amount || 0).toLocaleString()}`} color="amber" />
                        <StatCard icon={Moon} label="Weekend Avg" value={`₹${Math.round(ww.find(w => w.label === 'Weekend')?.avg_amount || 0).toLocaleString()}`} color="cyan" />
                    </>
                )}
            </div>

            <div className="chart-grid">
                <ChartCard title="Transactions by Hour" subtitle="24-hour distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="hour" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Transactions" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Transactions by Day" subtitle="Weekly distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="day" stroke="#5e6b85" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Transactions" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Weekend vs Weekday" subtitle="Transaction split">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={ww} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={4}>
                                {ww.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Hourly Activity Heatmap" subtitle="Transactions by hour & day" fullWidth>
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(24, 1fr)', gap: 2, fontSize: 10 }}>
                            <div />
                            {Array.from({ length: 24 }, (_, i) => (
                                <div key={i} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4px 0' }}>{i}h</div>
                            ))}
                            {days.map(day => (
                                <React.Fragment key={day}>
                                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 11, paddingRight: 8 }}>{day.slice(0, 3)}</div>
                                    {Array.from({ length: 24 }, (_, h) => {
                                        const val = heatmapMap[`${day}-${h}`] || 0;
                                        const intensity = val / maxHeat;
                                        return (
                                            <div key={h} className="heatmap-cell" style={{ aspectRatio: '1', backgroundColor: `rgba(139, 92, 246, ${0.05 + intensity * 0.85})`, borderRadius: 3 }} title={`${day} ${h}:00 — ${val.toLocaleString()} txns`} />
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

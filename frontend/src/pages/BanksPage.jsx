import React, { useEffect, useState } from 'react';
import { useAppContext } from '../App';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { Building, ArrowRightLeft, CheckCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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

export default function BanksPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`/api/banks${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Loading bank data...</p></div>;
    if (!data) return null;

    const senders = data.sender_banks || [];
    const receivers = data.receiver_banks || [];
    const cross = data.cross_bank || [];

    return (
        <div>
            <div className="page-header">
                <h2>Bank Analysis</h2>
                <p>Transaction volumes, cross-bank flows, and success rates</p>
            </div>

            <div className="stats-grid">
                <StatCard icon={Building} label="Top Sender Bank" value={senders[0]?.bank || '-'} sub={`${senders[0]?.count?.toLocaleString() || 0} transactions`} color="blue" />
                <StatCard icon={Building} label="Top Receiver Bank" value={receivers[0]?.bank || '-'} sub={`${receivers[0]?.count?.toLocaleString() || 0} received`} color="purple" />
                <StatCard icon={ArrowRightLeft} label="Top Flow" value={cross[0] ? `${cross[0].sender_bank} → ${cross[0].receiver_bank}` : '-'} sub={`${cross[0]?.count?.toLocaleString() || 0} transfers`} color="cyan" />
                <StatCard icon={CheckCircle} label="Best Success Rate" value={senders.sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))[0]?.bank || '-'} sub={`${senders[0]?.success_rate || 0}%`} color="green" />
            </div>

            <div className="chart-grid">
                <ChartCard title="Sender Bank Volume" subtitle="Top banks by outgoing transactions">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={senders.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis type="number" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="bank" stroke="#5e6b85" tick={{ fontSize: 11 }} width={80} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Transactions" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Receiver Bank Volume" subtitle="Top banks by incoming transactions">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={receivers.slice(0, 10)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis type="number" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="bank" stroke="#5e6b85" tick={{ fontSize: 11 }} width={80} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Transactions" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Bank Success Rates" subtitle="Transaction success percentage" fullWidth>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[...senders].sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0)).slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                            <XAxis dataKey="bank" stroke="#5e6b85" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#5e6b85" tick={{ fontSize: 11 }} unit="%" domain={[90, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="success_rate" fill="#10b981" radius={[4, 4, 0, 0]} name="Success Rate (%)" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Cross-bank flow table */}
            <div className="chart-card animate-in" style={{ marginTop: 24 }}>
                <div className="chart-card-header">
                    <div className="chart-card-title">Cross-Bank Transfer Patterns</div>
                    <div className="chart-card-subtitle">Top 20 sender→receiver flows</div>
                </div>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Sender Bank</th>
                                <th></th>
                                <th>Receiver Bank</th>
                                <th>Transactions</th>
                                <th>Flow</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cross.map((c, i) => (
                                <tr key={i}>
                                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                    <td style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>{c.sender_bank}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>→</td>
                                    <td style={{ fontWeight: 500, color: 'var(--accent-purple)' }}>{c.receiver_bank}</td>
                                    <td>{c.count.toLocaleString()}</td>
                                    <td>
                                        <div style={{ width: 80, height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${(c.count / (cross[0]?.count || 1)) * 100}%`, height: '100%', background: 'var(--gradient-blue)', borderRadius: 3 }} />
                                        </div>
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

import React, { useEffect, useState } from 'react';
import API_BASE from '../api';
import { useAppContext } from '../App';
import {
    Clock, ShoppingBag, Smartphone, AlertTriangle, MapPin,
    Calendar, Repeat, Wifi, Building, Users
} from 'lucide-react';

const iconMap = {
    clock: Clock,
    'shopping-bag': ShoppingBag,
    smartphone: Smartphone,
    'alert-triangle': AlertTriangle,
    'map-pin': MapPin,
    calendar: Calendar,
    repeat: Repeat,
    wifi: Wifi,
    building: Building,
    users: Users,
};

export default function InsightsPage() {
    const { uploaded, buildQuery } = useAppContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uploaded) return;
        setLoading(true);
        fetch(`${API_BASE}/api/insights${buildQuery()}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [uploaded, buildQuery]);

    if (!uploaded) return <div className="empty-state"><p>Please upload a dataset first.</p></div>;
    if (loading) return <div className="loading-state"><div className="spinner" /><p>Generating insights...</p></div>;
    if (!data) return null;

    const insights = data.insights || [];

    return (
        <div>
            <div className="page-header">
                <h2>AI-Generated Insights</h2>
                <p>Automatically discovered patterns and key findings from your data</p>
            </div>

            <div className="insights-grid">
                {insights.map((ins, i) => {
                    const IconComp = iconMap[ins.icon] || Clock;
                    return (
                        <div key={i} className="insight-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className={`insight-icon ${ins.type || 'time'}`}>
                                <IconComp size={22} />
                            </div>
                            <div className="insight-content">
                                <h4>{ins.title}</h4>
                                <p>{ins.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {insights.length === 0 && (
                <div className="empty-state">
                    <p>No insights generated. Try uploading data first.</p>
                </div>
            )}
        </div>
    );
}

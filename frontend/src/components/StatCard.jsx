import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
    return (
        <div className="stat-card animate-in">
            <div className={`stat-card-icon ${color}`}>
                {Icon && <Icon size={20} />}
            </div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{value}</div>
            {sub && <div className="stat-card-sub">{sub}</div>}
        </div>
    );
}

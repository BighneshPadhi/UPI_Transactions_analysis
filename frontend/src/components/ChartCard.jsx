import React from 'react';

export default function ChartCard({ title, subtitle, children, fullWidth = false }) {
    return (
        <div className={`chart-card animate-in${fullWidth ? ' chart-full-width' : ''}`}>
            <div className="chart-card-header">
                <div>
                    <div className="chart-card-title">{title}</div>
                    {subtitle && <div className="chart-card-subtitle">{subtitle}</div>}
                </div>
            </div>
            {children}
        </div>
    );
}

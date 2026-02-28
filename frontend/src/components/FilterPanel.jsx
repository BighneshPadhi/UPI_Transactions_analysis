import React from 'react';
import { useAppContext } from '../App';
import { Filter, X } from 'lucide-react';

export default function FilterPanel() {
    const { filters, setFilters, filterOptions, resetFilters } = useAppContext();

    if (!filterOptions) return null;

    const update = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
    const hasActive = Object.values(filters).some(v => v !== '');

    return (
        <div className="filter-bar animate-in">
            <Filter size={16} style={{ color: 'var(--accent-blue)' }} />
            <label>Filters</label>

            <input
                type="date"
                className="filter-input"
                value={filters.date_start}
                onChange={e => update('date_start', e.target.value)}
                placeholder="From"
            />
            <input
                type="date"
                className="filter-input"
                value={filters.date_end}
                onChange={e => update('date_end', e.target.value)}
                placeholder="To"
            />

            <select className="filter-select" value={filters.state} onChange={e => update('state', e.target.value)}>
                <option value="">All States</option>
                {(filterOptions.states || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="filter-select" value={filters.category} onChange={e => update('category', e.target.value)}>
                <option value="">All Categories</option>
                {(filterOptions.categories || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="filter-select" value={filters.device_type} onChange={e => update('device_type', e.target.value)}>
                <option value="">All Devices</option>
                {(filterOptions.devices || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="filter-select" value={filters.network_type} onChange={e => update('network_type', e.target.value)}>
                <option value="">All Networks</option>
                {(filterOptions.networks || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="filter-select" value={filters.age_group} onChange={e => update('age_group', e.target.value)}>
                <option value="">All Ages</option>
                {(filterOptions.age_groups || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {hasActive && (
                <button className="filter-reset-btn" onClick={resetFilters}>
                    <X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Reset
                </button>
            )}
        </div>
    );
}

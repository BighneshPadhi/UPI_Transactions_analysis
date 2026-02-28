import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
    Upload, LayoutDashboard, ShoppingBag, Clock, MapPin,
    Smartphone, AlertTriangle, Building, Users, Lightbulb, Filter
} from 'lucide-react';

import UploadPage from './pages/UploadPage';
import OverviewPage from './pages/OverviewPage';
import CategoriesPage from './pages/CategoriesPage';
import TimePage from './pages/TimePage';
import GeographyPage from './pages/GeographyPage';
import DevicesPage from './pages/DevicesPage';
import FraudPage from './pages/FraudPage';
import BanksPage from './pages/BanksPage';
import DemographicsPage from './pages/DemographicsPage';
import InsightsPage from './pages/InsightsPage';
import FilterPanel from './components/FilterPanel';

// ---------- Context ----------
export const AppContext = createContext();

const defaultFilters = {
    date_start: '',
    date_end: '',
    state: '',
    category: '',
    device_type: '',
    network_type: '',
    age_group: '',
};

export function useAppContext() {
    return useContext(AppContext);
}

// ---------- Sidebar ----------
const navItems = [
    { section: 'DATA' },
    { path: '/', label: 'Upload Dataset', icon: Upload },
    { section: 'ANALYTICS' },
    { path: '/overview', label: 'Executive Overview', icon: LayoutDashboard },
    { path: '/categories', label: 'Categories', icon: ShoppingBag },
    { path: '/time', label: 'Time Analysis', icon: Clock },
    { path: '/geography', label: 'Geography', icon: MapPin },
    { path: '/devices', label: 'Devices & Network', icon: Smartphone },
    { path: '/fraud', label: 'Fraud Analysis', icon: AlertTriangle },
    { path: '/banks', label: 'Banks', icon: Building },
    { path: '/demographics', label: 'Demographics', icon: Users },
    { section: 'INTELLIGENCE' },
    { path: '/insights', label: 'AI Insights', icon: Lightbulb },
];

function Sidebar({ uploaded }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h1>UPI Intelligence</h1>
                <p>Transaction Analytics</p>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item, i) =>
                    item.section ? (
                        <div key={i} className="sidebar-section-title">{item.section}</div>
                    ) : (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    )
                )}
            </nav>
            <div className="sidebar-upload-status">
                <div className={`upload-badge${uploaded ? '' : ' not-uploaded'}`}>
                    <span className="upload-badge-dot" />
                    {uploaded ? 'Dataset Loaded' : 'No Dataset'}
                </div>
            </div>
        </aside>
    );
}

// ---------- App ----------
function AppContent() {
    const { uploaded, filters, showFilters } = useAppContext();
    const location = useLocation();
    const showFilter = showFilters && uploaded && location.pathname !== '/';

    return (
        <div className="app-layout">
            <Sidebar uploaded={uploaded} />
            <main className="main-content">
                {showFilter && <FilterPanel />}
                <Routes>
                    <Route path="/" element={<UploadPage />} />
                    <Route path="/overview" element={<OverviewPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/time" element={<TimePage />} />
                    <Route path="/geography" element={<GeographyPage />} />
                    <Route path="/devices" element={<DevicesPage />} />
                    <Route path="/fraud" element={<FraudPage />} />
                    <Route path="/banks" element={<BanksPage />} />
                    <Route path="/demographics" element={<DemographicsPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    const [uploaded, setUploaded] = useState(false);
    const [uploadSummary, setUploadSummary] = useState(null);
    const [filterOptions, setFilterOptions] = useState(null);
    const [filters, setFilters] = useState(defaultFilters);
    const [showFilters, setShowFilters] = useState(true);

    const resetFilters = () => setFilters(defaultFilters);

    // Build query string from filters
    const buildQuery = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v) params.set(k, v);
        });
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    };

    return (
        <AppContext.Provider value={{
            uploaded, setUploaded,
            uploadSummary, setUploadSummary,
            filterOptions, setFilterOptions,
            filters, setFilters,
            showFilters, setShowFilters,
            resetFilters, buildQuery,
            defaultFilters,
        }}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AppContext.Provider>
    );
}

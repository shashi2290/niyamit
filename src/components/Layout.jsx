import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckSquare, Settings, Activity } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: Activity, label: 'Analytics', path: '/' }, // Dashboard as home
        { icon: Calendar, label: 'Schedule', path: '/calendar' },
        // { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="text-2xl font-bold gradient-text" style={{ paddingBottom: '0.5rem' }}>Niyamit</h1>
                <p className="text-sm text-muted">Organize your life</p>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar-circle"></div>
                    <div>
                        <p className="text-sm font-bold">User</p>
                        <p className="text-xs text-muted">Free Plan</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const Layout = () => {
    return (
        <div className="app-wrapper">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

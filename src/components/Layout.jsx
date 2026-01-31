import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckSquare, Settings, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    const { user } = useUser();
    const navItems = [
        { icon: Activity, label: 'Analytics', path: '/' }, // Dashboard as home
        { icon: Calendar, label: 'Schedule', path: '/calendar' },
        // { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="flex-between w-full">
            {!isCollapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src="/vite.png"
                  alt="Niyamit Logo"
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "inline-block",
                    verticalAlign: "middle",
                    borderRadius: "50%",
                  }}
                />
                <h1 className="text-xl font-bold gradient-text" style={{ margin: 0 }}>
                  Niyamit
                </h1>
              </div>
            )}
            {isCollapsed && (
               <img
               src="/vite.png"
               alt="Niyamit Logo"
               style={{
                 width: "32px",
                 height: "32px",
                 borderRadius: "50%",
               }}
             />
            )}
            <button onClick={toggleSidebar} className="btn-icon toggle-btn">
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          {!isCollapsed && <p className="text-sm text-muted mt-2">Organize your life</p>}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              title={isCollapsed ? item.label : ""}
            >
              <item.icon size={20} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="user-profile"
            style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: isCollapsed ? "center" : "flex-start" }}
          >
            <UserButton />
            {!isCollapsed && (
              <div style={{ overflow: "hidden" }}>
                <p
                  className="text-sm font-bold"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.firstName || user?.username || "User"}
                </p>
                <p
                  className="text-xs text-muted"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
};

const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
      setIsCollapsed(!isCollapsed);
    };

    return (
      <div className="app-wrapper scrollbox">
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        <main className={`main-content ${isCollapsed ? "expanded" : ""}`}>
          <Outlet />
        </main>
      </div>
    );
};

export default Layout;

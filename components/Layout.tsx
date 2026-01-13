import React from 'react';
import { User, Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onNavigate }) => {
  const isMobile = window.innerWidth < 768;

  const NavItem = ({ view, label, icon }: { view: string; label: string; icon: string }) => (
    <button
      onClick={() => onNavigate(view)}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
        currentView === view
          ? 'bg-village-green text-white shadow-lg'
          : 'text-gray-600 hover:bg-village-light'
      }`}
    >
      <i className={`fas ${icon} w-6 text-center`}></i>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar / Mobile Header */}
      <aside className="md:w-64 bg-white shadow-xl z-20 flex-shrink-0">
        <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-village-green text-white">
          <i className="fas fa-running mr-2 text-2xl"></i>
          <h1 className="text-xl font-bold tracking-wide">乡村体育</h1>
        </div>

        <div className="p-4 space-y-2">
          {user && (
            <div className="mb-6 p-4 bg-village-light rounded-xl border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-village-green text-white flex items-center justify-center font-bold text-lg">
                  {/* Fallback to username if realName is missing, then to a generic character */}
                  {(user.realName || user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate">{user.realName || user.username}</p>
                  <p className="text-xs text-gray-500 uppercase">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            <NavItem view="dashboard" label="总览" icon="fa-chart-pie" />
            <NavItem view="events" label="赛事活动" icon="fa-calendar-alt" />
            <NavItem view="materials" label="物资管理" icon="fa-box-open" />
            <NavItem view="community" label="互动社区" icon="fa-comments" />
            {(user?.role === Role.ADMIN || user?.role === Role.ORGANIZER) && (
              <NavItem view="admin" label="管理后台" icon="fa-users-cog" />
            )}
          </nav>
        </div>

        <div className="p-4 mt-auto border-t border-gray-100">
           <button onClick={onLogout} className="flex items-center space-x-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <i className="fas fa-sign-out-alt w-6"></i>
              <span>退出登录</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
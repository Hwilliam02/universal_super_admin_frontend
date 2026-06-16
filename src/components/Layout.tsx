import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { 
  Building2, 
  Users, 
  LogOut, 
  Activity, 
  FileText, 
  Code, 
  Package, 
  Menu
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const userRoles: string[] = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
  const isSuperadmin = userRoles.includes('superadmin');
  const isLead = userRoles.includes('lead');
  const isDeveloper = userRoles.includes('developer') || userRoles.includes('dev');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-primary text-primary-foreground transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <Building2 className="h-6 w-6 text-accent mr-3" />
          <span className="text-lg font-bold tracking-tight">Universal Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {isSuperadmin && (
            <>
              <NavLink 
                to="/dashboard" 
                className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Building2 className="h-4 w-4" /> Companies
              </NavLink>
              <NavLink 
                to="/universal-users" 
                className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Users className="h-4 w-4" /> Global Users
              </NavLink>
            </>
          )}

          {isLead && (
            <NavLink 
              to="/lead-dashboard" 
              className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              <Building2 className="h-4 w-4" /> Lead Dashboard
            </NavLink>
          )}

          {isDeveloper && (
            <>
              <NavLink 
                to="/dev" 
                className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Code className="h-4 w-4" /> Developer Hub
              </NavLink>
              <NavLink 
                to="/products" 
                className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Package className="h-4 w-4" /> Products
              </NavLink>
            </>
          )}

          {(isSuperadmin || isLead) && (
            <>
              <NavLink 
                to="/monitor" 
                className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity className="h-4 w-4" /> System Monitor
              </NavLink>
              <NavLink 
                to="/logs" 
                className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <FileText className="h-4 w-4" /> Audit Logs
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
              {user?.first_name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar for Mobile/Title */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 lg:hidden">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-primary focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="text-lg font-bold text-primary">Universal Admin</span>
          </div>
        </header>

        {/* Outlet for Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

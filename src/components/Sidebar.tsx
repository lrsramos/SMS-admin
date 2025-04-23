import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, History, MapPin, Settings, LogOut } from 'lucide-react';
import { signOut } from '../lib/supabase';
import { AuthContext } from './AuthProvider';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { userRole } = React.useContext(AuthContext);

  const mainLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Painel' },
    { to: '/appointments', icon: Calendar, label: 'Agendamentos' },
    { to: '/live', icon: MapPin, label: 'Localização' },
    { to: '/history', icon: History, label: 'Histórico' },
  ];

  const settingsLinks = [
    ...(userRole === 'cleaner' ? [] : [{ to: '/cleaners', label: 'Limpadores' }]),
    ...(userRole === 'cleaner' ? [] : [{ to: '/clients', label: 'Clientes' }]),
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">Serviço de Piscina</h1>
      </div>
      <nav className="flex-1">
        <div className="space-y-1">
          {mainLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 ${
                  isActive ? 'bg-blue-50 text-blue-600' : ''
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </NavLink>
          ))}
        </div>

        {settingsLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center w-full px-6 py-3 text-gray-700 hover:bg-blue-50"
            >
              <Settings className="w-5 h-5 mr-3" />
              Configurações
            </button>
            
            {isSettingsOpen && (
              <div className="bg-gray-50">
                {settingsLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center px-10 py-2 text-sm text-gray-700 hover:bg-blue-50 ${
                        isActive ? 'bg-blue-50 text-blue-600' : ''
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
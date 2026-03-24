import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { apiCall } from '../api/client';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Shield, 
  UserX, 
  UserCheck, 
  Key, 
  Search,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  BarChart3
} from 'lucide-react';
import AdminAnalytics from './AdminAnalytics';

// Simple API wrapper for admin endpoints
const adminApi = {
  get: (path) => apiCall('GET', path),
  post: (path, body) => apiCall('POST', path, body),
};

/**
 * Admin Dashboard Panel
 * Provides platform monitoring and user management for administrators
 */
export default function AdminPanel() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [activeView, setActiveView] = useState('users'); // 'users' or 'analytics'

  // Load stats and users on mount
  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  // Reload users when search or filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);

  const loadStats = async () => {
    try {
      const data = await adminApi.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setMessage({ type: 'error', text: 'Erro ao carregar estatísticas' });
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterType) params.append('filter_type', filterType);
      
      const data = await adminApi.get(`/admin/users?${params.toString()}`);
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
      setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (userId, action, extra = {}) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const data = await adminApi.post('/admin/user/action', {
        user_id: userId,
        action,
        ...extra
      });
      setMessage({ type: 'success', text: data.message });
      loadUsers();
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao executar ação' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }
    await performAction(passwordTarget.id, 'reset_password', { new_password: newPassword });
    setShowPasswordModal(false);
    setNewPassword('');
    setPasswordTarget(null);
  };

  const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
    <div 
      className="p-4 rounded-xl"
      style={{ background: '#111111', border: '1px solid #1f1f1f' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-[#9ca3af] text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && <div className="text-xs text-[#6b7280] mt-1">{subValue}</div>}
    </div>
  );

  const UserCard = ({ user }) => (
    <div 
      className="p-4 rounded-xl cursor-pointer transition-all hover:border-[#22c55e]/50"
      style={{ background: '#111111', border: '1px solid #1f1f1f' }}
      onClick={() => setSelectedUser(user)}
      data-testid={`user-card-${user.username}`}
    >
      <div className="flex items-center gap-3">
        {user.picture ? (
          <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
            <span className="text-[#22c55e] font-bold">
              {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate">{user.displayName || user.username}</span>
            {user.disabled && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                Desativado
              </span>
            )}
            {user.authProvider === 'google' && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                Google
              </span>
            )}
          </div>
          <div className="text-xs text-[#6b7280] truncate">
            {user.email || user.username}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-[#22c55e] font-medium">{user.stats?.totalXP || 0} XP</div>
          <div className="text-xs text-[#6b7280]">{user.stats?.habits || 0} hábitos</div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-[#6b7280]" />
      </div>
    </div>
  );

  // User Detail Modal
  const UserDetailModal = ({ user, onClose }) => {
    const features = [
      { id: 'habits', label: 'Hábitos', desc: 'Criar e gerenciar hábitos' },
      { id: 'events', label: 'Eventos', desc: 'Criar eventos e viagens' },
      { id: 'tars', label: 'TARS', desc: 'Assistente de IA' },
      { id: 'friends', label: 'Amigos', desc: 'Sistema de amigos' },
    ];

    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <div 
          className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl"
          style={{ background: '#0d0d0d', border: '1px solid #1f1f1f' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-[#1f1f1f]">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                  <span className="text-xl text-[#22c55e] font-bold">
                    {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="text-white font-bold">{user.displayName || user.username}</div>
                <div className="text-sm text-[#6b7280]">@{user.username}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1a1a1a]">
              <X className="w-5 h-5 text-[#6b7280]" />
            </button>
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#6b7280]">Email:</span>
                <div className="text-white">{user.email || 'N/A'}</div>
              </div>
              <div>
                <span className="text-[#6b7280]">Auth:</span>
                <div className="text-white">{user.authProvider === 'google' ? 'Google' : 'Senha'}</div>
              </div>
              <div>
                <span className="text-[#6b7280]">Criado em:</span>
                <div className="text-white">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[#6b7280]">Último login:</span>
                <div className="text-white">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 py-3 border-y border-[#1f1f1f]">
              <div className="text-center">
                <div className="text-lg font-bold text-[#22c55e]">{user.stats?.totalXP || 0}</div>
                <div className="text-xs text-[#6b7280]">XP</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{user.stats?.habits || 0}</div>
                <div className="text-xs text-[#6b7280]">Hábitos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{user.stats?.events || 0}</div>
                <div className="text-xs text-[#6b7280]">Eventos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{user.stats?.achievements || 0}</div>
                <div className="text-xs text-[#6b7280]">Medalhas</div>
              </div>
            </div>

            {/* Google ID */}
            {user.googleId && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="text-xs text-blue-400 mb-1">Google ID</div>
                <div className="text-white text-xs font-mono break-all">{user.googleId}</div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-3">
              <h4 className="text-sm font-medium text-white mb-2">Ações</h4>
              
              {/* Enable/Disable */}
              <button
                onClick={() => performAction(user.id, user.disabled ? 'enable' : 'disable')}
                disabled={actionLoading}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                  user.disabled 
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                }`}
                data-testid={user.disabled ? 'enable-user-btn' : 'disable-user-btn'}
              >
                {user.disabled ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                <span>{user.disabled ? 'Ativar Usuário' : 'Desativar Usuário'}</span>
              </button>

              {/* Reset Password */}
              <button
                onClick={() => {
                  setPasswordTarget(user);
                  setShowPasswordModal(true);
                }}
                disabled={actionLoading}
                className="w-full p-3 rounded-xl flex items-center gap-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
                data-testid="reset-password-btn"
              >
                <Key className="w-5 h-5" />
                <span>Resetar Senha</span>
              </button>
            </div>

            {/* Feature Toggles */}
            <div className="pt-3">
              <h4 className="text-sm font-medium text-white mb-2">Funcionalidades</h4>
              <div className="space-y-2">
                {features.map(feature => {
                  const isDisabled = user.disabledFeatures?.includes(feature.id);
                  return (
                    <button
                      key={feature.id}
                      onClick={() => performAction(user.id, 'toggle_feature', { feature: feature.id })}
                      disabled={actionLoading}
                      className="w-full p-3 rounded-xl flex items-center justify-between transition-all hover:bg-[#1a1a1a]"
                      style={{ background: '#111111', border: '1px solid #1f1f1f' }}
                      data-testid={`toggle-feature-${feature.id}`}
                    >
                      <div>
                        <div className="text-white text-sm">{feature.label}</div>
                        <div className="text-xs text-[#6b7280]">{feature.desc}</div>
                      </div>
                      {isDisabled ? (
                        <Lock className="w-5 h-5 text-red-400" />
                      ) : (
                        <Unlock className="w-5 h-5 text-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Password Reset Modal
  const PasswordModal = () => (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={() => setShowPasswordModal(false)}
    >
      <div 
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: '#0d0d0d', border: '1px solid #1f1f1f' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-white font-bold mb-4">Resetar Senha</h3>
        <p className="text-sm text-[#6b7280] mb-4">
          Nova senha para <span className="text-white">{passwordTarget?.username}</span>
        </p>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Nova senha (min 6 caracteres)"
          className="w-full p-3 rounded-xl bg-[#111111] border border-[#1f1f1f] text-white placeholder-[#6b7280] mb-4"
          data-testid="new-password-input"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowPasswordModal(false)}
            className="flex-1 p-3 rounded-xl bg-[#1a1a1a] text-[#9ca3af]"
          >
            Cancelar
          </button>
          <button
            onClick={handleResetPassword}
            disabled={actionLoading || !newPassword}
            className="flex-1 p-3 rounded-xl bg-[#22c55e] text-black font-medium disabled:opacity-50"
            data-testid="confirm-reset-password-btn"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-[#6b7280]">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  // Render Analytics view
  if (activeView === 'analytics') {
    return (
      <div className="space-y-6">
        {/* View Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('users')}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-[#111111] text-[#6b7280] border border-[#1f1f1f]"
            data-testid="switch-to-users"
          >
            <Users className="w-4 h-4 inline mr-2" />
            Usuários
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
            data-testid="switch-to-analytics"
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>
        
        <AdminAnalytics />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-panel">
      {/* View Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('users')}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
          data-testid="switch-to-users"
        >
          <Users className="w-4 h-4 inline mr-2" />
          Usuários
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-[#111111] text-[#6b7280] border border-[#1f1f1f]"
          data-testid="switch-to-analytics"
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#22c55e]/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-[#22c55e]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Painel Admin</h1>
          <p className="text-sm text-[#6b7280]">Gerencie usuários e monitore a plataforma</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div 
          className={`p-3 rounded-xl flex items-center gap-2 ${
            message.type === 'error' 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}
        >
          {message.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={Users} 
            label="Total Usuários" 
            value={stats.total_users} 
            color="#22c55e"
            subValue={`+${stats.new_users_today} hoje`}
          />
          <StatCard 
            icon={Activity} 
            label="Ativos (7 dias)" 
            value={stats.active_users} 
            color="#3b82f6"
            subValue={`${Math.round((stats.active_users / stats.total_users) * 100) || 0}% do total`}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Total Hábitos" 
            value={stats.total_habits} 
            color="#f59e0b"
          />
          <StatCard 
            icon={UserX} 
            label="Desativados" 
            value={stats.disabled_users} 
            color="#ef4444"
          />
        </div>
      )}

      {/* Auth Provider Stats */}
      {stats && (
        <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
          <div className="text-sm text-[#6b7280] mb-3">Tipo de Autenticação</div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm">Google</span>
                <span className="text-[#3b82f6] font-medium">{stats.google_users}</span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#3b82f6] rounded-full transition-all"
                  style={{ width: `${(stats.google_users / stats.total_users) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm">Senha</span>
                <span className="text-[#22c55e] font-medium">{stats.password_users}</span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#22c55e] rounded-full transition-all"
                  style={{ width: `${(stats.password_users / stats.total_users) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Usuários</h2>
          <span className="text-sm text-[#6b7280]">{users.length} encontrados</span>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111111] border border-[#1f1f1f] text-white placeholder-[#6b7280] text-sm"
              data-testid="admin-search-input"
            />
          </div>
          <select
            value={filterType || ''}
            onChange={e => setFilterType(e.target.value || null)}
            className="px-3 py-2 rounded-xl bg-[#111111] border border-[#1f1f1f] text-white text-sm"
            data-testid="admin-filter-select"
          >
            <option value="">Todos</option>
            <option value="google">Google</option>
            <option value="password">Senha</option>
            <option value="disabled">Desativados</option>
          </select>
        </div>

        {/* Users List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-[#6b7280]">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-[#6b7280]">Nenhum usuário encontrado</div>
          ) : (
            users.map(user => <UserCard key={user.id} user={user} />)
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && <PasswordModal />}
    </div>
  );
}

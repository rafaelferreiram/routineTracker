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
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Calendar,
  Target,
  MessageSquare,
  MapPin
} from 'lucide-react';

/**
 * Complete Admin Dashboard - Standalone view for administrators
 * No habits, no tracker - purely for monitoring and managing users
 */
export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [security, setSecurity] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [period, setPeriod] = useState('7d');

  // Features list for toggle
  const FEATURES = [
    { id: 'habits', label: 'Hábitos', icon: Target, desc: 'Criar e gerenciar hábitos' },
    { id: 'events', label: 'Eventos', icon: Calendar, desc: 'Criar eventos e viagens' },
    { id: 'tars', label: 'TARS', icon: MessageSquare, desc: 'Assistente de IA' },
    { id: 'friends', label: 'Amigos', icon: Users, desc: 'Sistema de amigos' },
    { id: 'maps', label: 'Mapas', icon: MapPin, desc: 'Google Maps e Places' },
  ];

  useEffect(() => {
    loadAllData();
  }, [period]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData, securityData] = await Promise.all([
        apiCall('GET', '/admin/stats'),
        apiCall('GET', `/admin/analytics?period=${period}`),
        apiCall('GET', '/admin/security'),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
      setSecurity(securityData);
      await loadUsers();
    } catch (err) {
      console.error('Failed to load data:', err);
      setMessage({ type: 'error', text: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterType) params.append('filter_type', filterType);
      const data = await apiCall('GET', `/admin/users?${params.toString()}`);
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const performAction = async (userId, action, extra = {}) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const data = await apiCall('POST', '/admin/user/action', { user_id: userId, action, ...extra });
      setMessage({ type: 'success', text: data.message });
      loadUsers();
      loadAllData();
      // Update selected user if open
      if (selectedUser?.id === userId) {
        const updated = users.find(u => u.id === userId);
        if (updated) {
          if (action === 'toggle_feature') {
            const features = updated.disabledFeatures || [];
            if (features.includes(extra.feature)) {
              setSelectedUser({ ...selectedUser, disabledFeatures: features.filter(f => f !== extra.feature) });
            } else {
              setSelectedUser({ ...selectedUser, disabledFeatures: [...features, extra.feature] });
            }
          } else if (action === 'disable') {
            setSelectedUser({ ...selectedUser, disabled: true });
          } else if (action === 'enable') {
            setSelectedUser({ ...selectedUser, disabled: false });
          }
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao executar ação' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async (ip) => {
    try {
      await apiCall('POST', '/admin/security/unblock', { ip });
      loadAllData();
      setMessage({ type: 'success', text: `IP ${ip} desbloqueado` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao desbloquear IP' });
    }
  };

  // Simple bar chart
  const MiniChart = ({ data, color = '#22c55e', height = 60 }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="flex items-end gap-0.5" style={{ height }}>
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full rounded-sm transition-all"
              style={{ 
                height: `${Math.max((item.value / max) * 100, 4)}%`,
                background: color,
                opacity: 0.7 + (i / data.length) * 0.3
              }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
        ))}
      </div>
    );
  };

  // Stat card component
  const StatCard = ({ icon: Icon, label, value, subValue, color, trend }) => (
    <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-[#6b7280]">{label}</div>
      {subValue && <div className="text-[10px] text-[#4b5563] mt-1">{subValue}</div>}
    </div>
  );

  // User row component
  const UserRow = ({ user }) => {
    const isDisabled = user.disabled;
    return (
      <div 
        className={`p-3 rounded-xl cursor-pointer transition-all border ${
          isDisabled ? 'bg-red-500/5 border-red-500/20' : 'bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#2a2a2a]'
        }`}
        onClick={() => setSelectedUser(user)}
      >
        <div className="flex items-center gap-3">
          {user.picture ? (
            <img src={user.picture} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 flex items-center justify-center">
              <span className="text-[#22c55e] font-bold text-sm">
                {(user.displayName || user.username)?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm truncate">{user.displayName || user.username}</span>
              {isDisabled && (
                <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              )}
            </div>
            <div className="text-xs text-[#6b7280] truncate">{user.email || `@${user.username}`}</div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-medium" style={{ color: '#22c55e' }}>{user.stats?.totalXP || 0} XP</div>
            <div className="text-[10px] text-[#6b7280]">{user.stats?.habits || 0} hábitos</div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#4b5563] flex-shrink-0" />
        </div>
        
        {/* Feature indicators */}
        <div className="flex gap-1 mt-2 pt-2 border-t border-[#1a1a1a]">
          {FEATURES.slice(0, 4).map(f => {
            const isFeatureDisabled = user.disabledFeatures?.includes(f.id);
            return (
              <div 
                key={f.id}
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  isFeatureDisabled 
                    ? 'bg-red-500/10 text-red-400' 
                    : 'bg-[#1a1a1a] text-[#6b7280]'
                }`}
                title={isFeatureDisabled ? `${f.label} desabilitado` : `${f.label} habilitado`}
              >
                {f.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // User detail modal
  const UserModal = () => {
    if (!selectedUser) return null;
    const user = selectedUser;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
        onClick={() => setSelectedUser(null)}
      >
        <div 
          className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 p-4 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center gap-3">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 flex items-center justify-center">
                <span className="text-[#22c55e] font-bold text-xl">
                  {(user.displayName || user.username)?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">{user.displayName || user.username}</h2>
              <p className="text-[#6b7280] text-sm">{user.email || `@${user.username}`}</p>
            </div>
            <button 
              onClick={() => setSelectedUser(null)}
              className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center"
            >
              <X className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Status badge */}
            <div className={`p-3 rounded-xl flex items-center gap-3 ${
              user.disabled ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'
            }`}>
              {user.disabled ? (
                <>
                  <Lock className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-red-400 font-medium text-sm">Conta Desativada</div>
                    <div className="text-red-400/60 text-xs">Usuário não pode fazer login</div>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-green-400 font-medium text-sm">Conta Ativa</div>
                    <div className="text-green-400/60 text-xs">Usuário pode acessar normalmente</div>
                  </div>
                </>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'XP', value: user.stats?.totalXP || 0, color: '#22c55e' },
                { label: 'Hábitos', value: user.stats?.habits || 0, color: '#3b82f6' },
                { label: 'Eventos', value: user.stats?.events || 0, color: '#f59e0b' },
                { label: 'Medalhas', value: user.stats?.achievements || 0, color: '#8b5cf6' },
              ].map((s, i) => (
                <div key={i} className="p-2 rounded-xl bg-[#111] text-center">
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-[#6b7280]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-xl bg-[#111]">
                <div className="text-[#6b7280] text-xs mb-1">Auth</div>
                <div className="text-white font-medium">
                  {user.authProvider === 'google' ? '🔵 Google' : '🔑 Senha'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#111]">
                <div className="text-[#6b7280] text-xs mb-1">Último login</div>
                <div className="text-white font-medium text-xs">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                </div>
              </div>
            </div>

            {/* Account action */}
            <button
              onClick={() => performAction(user.id, user.disabled ? 'enable' : 'disable')}
              disabled={actionLoading}
              className={`w-full p-4 rounded-xl flex items-center justify-center gap-3 font-medium transition-all ${
                user.disabled 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {user.disabled ? (
                <>
                  <UserCheck className="w-5 h-5" />
                  Ativar Conta
                </>
              ) : (
                <>
                  <UserX className="w-5 h-5" />
                  Desativar Conta
                </>
              )}
            </button>

            {/* Features */}
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#6b7280]" />
                Funcionalidades
              </h3>
              <div className="space-y-2">
                {FEATURES.map(feature => {
                  const isDisabled = user.disabledFeatures?.includes(feature.id);
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => performAction(user.id, 'toggle_feature', { feature: feature.id })}
                      disabled={actionLoading}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border ${
                        isDisabled 
                          ? 'bg-red-500/5 border-red-500/30 hover:bg-red-500/10' 
                          : 'bg-[#111] border-[#1a1a1a] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDisabled ? 'bg-red-500/20' : 'bg-[#1a1a1a]'
                      }`}>
                        <Icon className={`w-4 h-4 ${isDisabled ? 'text-red-400' : 'text-[#6b7280]'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium ${isDisabled ? 'text-red-400' : 'text-white'}`}>
                          {feature.label}
                        </div>
                        <div className="text-xs text-[#6b7280]">{feature.desc}</div>
                      </div>
                      {isDisabled ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20">
                          <EyeOff className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-xs text-red-400 font-medium">Bloqueado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/20">
                          <Eye className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs text-green-400 font-medium">Ativo</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset password */}
            <button
              onClick={() => {
                const newPwd = prompt('Nova senha (mín. 6 caracteres):');
                if (newPwd && newPwd.length >= 6) {
                  performAction(user.id, 'reset_password', { new_password: newPwd });
                } else if (newPwd) {
                  setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' });
                }
              }}
              disabled={actionLoading}
              className="w-full p-3 rounded-xl flex items-center justify-center gap-2 bg-[#111] border border-[#1a1a1a] text-[#9ca3af] hover:border-[#2a2a2a] transition-all"
            >
              <Key className="w-4 h-4" />
              <span className="text-sm">Resetar Senha</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 px-4 py-3 bg-[#050505]/80 backdrop-blur-xl border-b border-[#1a1a1a] safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Admin Panel</h1>
              <p className="text-[#6b7280] text-xs">RoutineTracker</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={loadAllData}
              disabled={loading}
              className="w-9 h-9 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 text-[#6b7280] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={logout}
              className="w-9 h-9 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>
        </div>
      </header>

      {/* Message toast */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
            message.type === 'error' 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {message.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-2">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <nav className="px-4 py-2 border-b border-[#1a1a1a] overflow-x-auto">
        <div className="max-w-6xl mx-auto flex gap-1">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'security', label: 'Segurança', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#22c55e]/20 text-[#22c55e]' 
                    : 'text-[#6b7280] hover:bg-[#111]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="px-4 py-6 max-w-6xl mx-auto safe-bottom">
        
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Period selector */}
            <div className="flex gap-2">
              {[
                { id: '24h', label: '24h' },
                { id: '7d', label: '7 dias' },
                { id: '30d', label: '30 dias' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === p.id 
                      ? 'bg-[#22c55e] text-black' 
                      : 'bg-[#111] text-[#6b7280] border border-[#1a1a1a]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Total Usuários" value={stats.total_users} color="#22c55e" subValue={`+${stats.new_users_today} hoje`} />
                <StatCard icon={Activity} label="Ativos (7d)" value={stats.active_users} color="#3b82f6" subValue={`${Math.round((stats.active_users / stats.total_users) * 100) || 0}%`} />
                <StatCard icon={Target} label="Total Hábitos" value={stats.total_habits} color="#f59e0b" />
                <StatCard icon={Lock} label="Bloqueados" value={stats.disabled_users} color="#ef4444" />
              </div>
            )}

            {/* Charts row */}
            {analytics && (
              <div className="grid lg:grid-cols-2 gap-4">
                {/* User growth */}
                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium text-sm">Crescimento de Usuários</h3>
                    <span className="text-xs text-[#6b7280]">Total: {analytics.engagement?.totalUsers}</span>
                  </div>
                  <MiniChart data={analytics.userGrowth || []} color="#22c55e" height={80} />
                  <div className="flex justify-between mt-2 text-[10px] text-[#4b5563]">
                    {analytics.userGrowth?.slice(0, 7).map((d, i) => (
                      <span key={i}>{d.label}</span>
                    ))}
                  </div>
                </div>

                {/* Login by hour */}
                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-[#3b82f6]" />
                    <h3 className="text-white font-medium text-sm">Horários de Pico</h3>
                  </div>
                  <MiniChart 
                    data={analytics.loginByHour?.map(h => ({ label: h.hour, value: h.count })) || []} 
                    color="#3b82f6" 
                    height={80}
                  />
                </div>
              </div>
            )}

            {/* Popular habits */}
            {analytics?.popularHabits?.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                <h3 className="text-white font-medium text-sm mb-4">Hábitos Mais Populares</h3>
                <div className="space-y-2">
                  {analytics.popularHabits.slice(0, 5).map((habit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded bg-[#1a1a1a] flex items-center justify-center text-[10px] text-[#6b7280]">{i + 1}</span>
                      <div className="flex-1">
                        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full"
                            style={{ width: `${(habit.count / (analytics.popularHabits[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-white truncate max-w-[100px]">{habit.name}</span>
                      <span className="text-[10px] text-[#22c55e]">{habit.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement */}
            {analytics?.engagement && (
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                <h3 className="text-white font-medium text-sm mb-4">Engajamento</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Adoção Hábitos', value: analytics.engagement.habitAdoptionRate, color: '#22c55e' },
                    { label: 'Adoção Eventos', value: analytics.engagement.eventAdoptionRate, color: '#3b82f6' },
                    { label: 'Taxa Conclusão', value: analytics.avgCompletionRate, color: '#f59e0b' },
                  ].map((m, i) => (
                    <div key={i} className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                          <circle 
                            cx="32" cy="32" r="28" fill="none" stroke={m.color} strokeWidth="6"
                            strokeDasharray={`${m.value * 1.76} 176`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{Math.round(m.value)}%</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#6b7280]">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            {/* Search and filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar usuário..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] text-white placeholder-[#4b5563] text-sm focus:outline-none focus:border-[#22c55e]/50"
                />
              </div>
              <select
                value={filterType || ''}
                onChange={e => setFilterType(e.target.value || null)}
                className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] text-white text-sm"
              >
                <option value="">Todos</option>
                <option value="google">Google</option>
                <option value="password">Senha</option>
                <option value="disabled">Desativados</option>
              </select>
            </div>

            {/* Users count */}
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280] text-sm">{users.length} usuários</span>
            </div>

            {/* Users list */}
            <div className="space-y-2">
              {users.map(user => <UserRow key={user.id} user={user} />)}
              {users.length === 0 && !loading && (
                <div className="text-center py-12 text-[#6b7280]">Nenhum usuário encontrado</div>
              )}
            </div>
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && security && (
          <div className="space-y-4">
            {/* Real-time stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Zap} label="Conexões Ativas" value={analytics?.realTimeMetrics?.activeConnections || 0} color="#f59e0b" />
              <StatCard icon={Activity} label="Req/Hora" value={analytics?.realTimeMetrics?.requestsLastHour || 0} color="#3b82f6" />
              <StatCard icon={Lock} label="IPs Bloqueados" value={security.totalBlocked} color="#ef4444" />
            </div>

            {/* Security config */}
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
              <h3 className="text-white font-medium text-sm mb-3">Configuração de Proteção</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: 'Rate Limit', value: `${security.config?.rateLimitMaxRequests} req/${security.config?.rateLimitWindow}s` },
                  { label: 'DDoS Threshold', value: `${security.config?.ddosThreshold} req/min` },
                  { label: 'Tempo Bloqueio', value: `${security.config?.blockDuration}s` },
                  { label: 'Violações', value: `${security.config?.suspiciousThreshold} para bloquear` },
                ].map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#111]">
                    <div className="text-[#6b7280] text-xs">{c.label}</div>
                    <div className="text-white font-medium">{c.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blocked IPs */}
            {security.blockedIPs?.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                <h3 className="text-white font-medium text-sm mb-3">IPs Bloqueados</h3>
                <div className="space-y-2">
                  {security.blockedIPs.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div>
                        <div className="text-white font-mono text-sm">{item.ip}</div>
                        <div className="text-xs text-red-400">
                          Desbloqueia em: {Math.floor(item.remaining_seconds / 60)}m {item.remaining_seconds % 60}s
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblock(item.ip)}
                        className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[#9ca3af] text-xs hover:bg-[#252525]"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent events */}
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
              <h3 className="text-white font-medium text-sm mb-3">Eventos Recentes</h3>
              {security.recentEvents?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {security.recentEvents.map((event, i) => (
                    <div key={i} className={`p-2 rounded-lg text-xs ${
                      event.type === 'ip_blocked' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        {event.type === 'ip_blocked' ? <Lock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{event.type === 'ip_blocked' ? 'IP Bloqueado' : 'Rate Limit'}</span>
                        <span className="ml-auto text-[#6b7280]">
                          {new Date(event.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-[#6b7280] text-sm">Nenhum evento recente</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* User modal */}
      <UserModal />
    </div>
  );
}

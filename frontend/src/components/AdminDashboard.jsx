import { useState, useEffect, useCallback } from 'react';
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
  MapPin,
  FileText,
  Globe,
  Database,
  Filter,
  ChevronLeft,
  ChevronDown,
  Hash,
  Wifi,
  WifiOff,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [securitySubTab, setSecuritySubTab] = useState('status');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [security, setSecurity] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState(null);
  const [logsPage, setLogsPage] = useState(0);
  const [logsType, setLogsType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [resetPwd, setResetPwd] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  // Platform / maintenance / announcements state
  const [platformConfig, setPlatformConfig] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [newAnn, setNewAnn] = useState({ message: '', type: 'info', expires_hours: '' });
  const [annCreating, setAnnCreating] = useState(false);

  // Overview data explorer
  const [overviewExpanded, setOverviewExpanded] = useState({ users: false, habits: false, events: false });
  const [overviewSearch, setOverviewSearch] = useState({ users: '', habits: '', events: '' });
  const [allHabits, setAllHabits] = useState(null);
  const [allEvents, setAllEvents] = useState(null);
  const [allHabitsPage, setAllHabitsPage] = useState(0);
  const [allEventsPage, setAllEventsPage] = useState(0);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  const FEATURES = [
    { id: 'habits', label: 'Hábitos', icon: Target, desc: 'Criar e gerenciar hábitos' },
    { id: 'events', label: 'Eventos', icon: Calendar, desc: 'Criar eventos e viagens' },
    { id: 'tars', label: 'TARS', icon: MessageSquare, desc: 'Assistente de IA' },
    { id: 'friends', label: 'Amigos', icon: Users, desc: 'Sistema de amigos' },
    { id: 'maps', label: 'Mapas', icon: MapPin, desc: 'Google Maps e Places' },
  ];

  useEffect(() => { loadAllData(); }, [period]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);

  useEffect(() => {
    if (activeSection === 'security' && securitySubTab === 'logs') {
      loadLogs();
    }
  }, [activeSection, securitySubTab, logsPage, logsType]);

  // Auto-dismiss message after 4s
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Reset reset-password form when modal closes
  useEffect(() => {
    if (!selectedUser) {
      setShowResetForm(false);
      setResetPwd('');
    }
  }, [selectedUser]);

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

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: logsPage, limit: 50 });
      if (logsType !== 'all') params.append('event_type', logsType);
      const data = await apiCall('GET', `/admin/logs?${params.toString()}`);
      setLogs(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao carregar logs' });
    } finally {
      setLogsLoading(false);
    }
  };

  const loadAllHabits = useCallback(async () => {
    if (!overviewExpanded.habits) return;
    setHabitsLoading(true);
    try {
      const params = new URLSearchParams({ skip: allHabitsPage * 50, limit: 50 });
      if (overviewSearch.habits) params.append('search', overviewSearch.habits);
      const data = await apiCall('GET', `/admin/all-habits?${params.toString()}`);
      setAllHabits(data);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setHabitsLoading(false);
    }
  }, [overviewExpanded.habits, allHabitsPage, overviewSearch.habits]);

  const loadAllEvents = useCallback(async () => {
    if (!overviewExpanded.events) return;
    setEventsLoading(true);
    try {
      const params = new URLSearchParams({ skip: allEventsPage * 50, limit: 50 });
      if (overviewSearch.events) params.append('search', overviewSearch.events);
      const data = await apiCall('GET', `/admin/all-events?${params.toString()}`);
      setAllEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [overviewExpanded.events, allEventsPage, overviewSearch.events]);

  useEffect(() => { loadAllHabits(); }, [loadAllHabits]);
  useEffect(() => { loadAllEvents(); }, [loadAllEvents]);

  // Load platform config + announcements on mount
  useEffect(() => {
    const load = async () => {
      setPlatformLoading(true);
      try {
        const [cfg, anns] = await Promise.all([
          apiCall('GET', '/admin/platform-config'),
          apiCall('GET', '/admin/announcements'),
        ]);
        setPlatformConfig(cfg);
        setAnnouncements(anns.announcements || []);
      } catch (err) {
        console.error('Failed to load platform data:', err);
      } finally {
        setPlatformLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setAllHabitsPage(0); loadAllHabits(); }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewSearch.habits]);

  useEffect(() => {
    const t = setTimeout(() => { setAllEventsPage(0); loadAllEvents(); }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewSearch.events]);

  const performAction = async (userId, action, extra = {}) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const data = await apiCall('POST', '/admin/user/action', { user_id: userId, action, ...extra });
      setMessage({ type: 'success', text: data.message });
      loadUsers();
      loadAllData();
      if (selectedUser?.id === userId) {
        if (action === 'toggle_feature') {
          const features = selectedUser.disabledFeatures || [];
          setSelectedUser({
            ...selectedUser,
            disabledFeatures: features.includes(extra.feature)
              ? features.filter(f => f !== extra.feature)
              : [...features, extra.feature],
          });
        } else if (action === 'disable') {
          setSelectedUser({ ...selectedUser, disabled: true });
        } else if (action === 'enable') {
          setSelectedUser({ ...selectedUser, disabled: false });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao executar ação' });
    } finally {
      setActionLoading(false);
    }
  };

  const updatePlatformConfig = async (patch) => {
    try {
      await apiCall('POST', '/admin/platform-config', patch);
      setPlatformConfig(prev => ({ ...prev, ...patch }));
      setMessage({ type: 'success', text: 'Configuração salva' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar configuração' });
    }
  };

  const createAnnouncement = async () => {
    if (!newAnn.message.trim()) return;
    setAnnCreating(true);
    try {
      const body = { message: newAnn.message, type: newAnn.type };
      if (newAnn.expires_hours) body.expires_hours = parseInt(newAnn.expires_hours);
      const res = await apiCall('POST', '/admin/announcements', body);
      const created = { id: res.id, ...body, active: true, created_at: new Date().toISOString() };
      setAnnouncements(prev => [created, ...prev]);
      setNewAnn({ message: '', type: 'info', expires_hours: '' });
      setMessage({ type: 'success', text: 'Anúncio criado' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao criar anúncio' });
    } finally {
      setAnnCreating(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await apiCall('DELETE', `/admin/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {
      setMessage({ type: 'error', text: 'Erro ao deletar anúncio' });
    }
  };

  const toggleAnnouncement = async (id) => {
    try {
      const res = await apiCall('PATCH', `/admin/announcements/${id}/toggle`);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: res.active } : a));
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar anúncio' });
    }
  };

  const handleUnblock = async (ip) => {
    try {
      await apiCall('POST', '/admin/security/unblock', { ip });
      loadAllData();
      setMessage({ type: 'success', text: `IP ${ip} desbloqueado` });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao desbloquear IP' });
    }
  };

  // ── Sub-components ──────────────────────────────────────────────────────────

  const MiniChart = ({ data, color = '#22c55e', height = 60, showLabels = false }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div>
        <div className="flex items-end gap-0.5" style={{ height }}>
          {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-full rounded-sm transition-all cursor-default"
                style={{
                  height: `${Math.max((item.value / max) * 100, 4)}%`,
                  background: color,
                  opacity: 0.5 + (i / data.length) * 0.5,
                }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {item.label}: {item.value}
              </div>
            </div>
          ))}
        </div>
        {showLabels && (
          <div className="flex justify-between mt-1.5">
            {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((d, i) => (
              <span key={i} className="text-[9px] text-[#4b5563]">{d.label}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color, trend, onClick }) => (
    <div
      className={`p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] ${onClick ? 'cursor-pointer hover:border-[#2a2a2a] transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value ?? '—'}</div>
      <div className="text-xs text-[#6b7280]">{label}</div>
      {subValue && <div className="text-[10px] text-[#4b5563] mt-0.5">{subValue}</div>}
    </div>
  );

  const UserRow = ({ user }) => {
    const isDisabled = user.disabled;
    return (
      <div
        className={`p-3 rounded-xl cursor-pointer transition-all border ${
          isDisabled ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/30' : 'bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#2a2a2a]'
        }`}
        onClick={() => setSelectedUser(user)}
      >
        <div className="flex items-center gap-3">
          {user.picture ? (
            <img src={user.picture} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 flex items-center justify-center flex-shrink-0">
              <span className="text-[#22c55e] font-bold text-sm">
                {(user.displayName || user.username)?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-medium text-sm truncate">{user.displayName || user.username}</span>
              {isDisabled && <Lock className="w-3 h-3 text-red-400 flex-shrink-0" />}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                user.authProvider === 'google' ? 'bg-blue-500/15 text-blue-400' : 'bg-[#1a1a1a] text-[#6b7280]'
              }`}>
                {user.authProvider === 'google' ? 'Google' : 'Senha'}
              </span>
            </div>
            <div className="text-[11px] text-[#6b7280] truncate">{user.email || `@${user.username}`}</div>
          </div>
          <div className="text-right flex-shrink-0 mr-1">
            <div className="text-sm font-medium" style={{ color: '#22c55e' }}>{user.stats?.totalXP || 0} XP</div>
            <div className="text-[10px] text-[#6b7280]">{user.stats?.habits || 0} hábitos</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#3a3a3a] flex-shrink-0" />
        </div>
        <div className="flex gap-1 mt-2 pt-2 border-t border-[#141414]">
          {FEATURES.slice(0, 5).map(f => {
            const disabled = user.disabledFeatures?.includes(f.id);
            return (
              <div
                key={f.id}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  disabled ? 'bg-red-500/10 text-red-400' : 'bg-[#141414] text-[#4b5563]'
                }`}
                title={disabled ? `${f.label} bloqueado` : `${f.label} ativo`}
              >
                {f.label}
              </div>
            );
          })}
          <div className="ml-auto text-[9px] text-[#3a3a3a]">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'nunca'}
          </div>
        </div>
      </div>
    );
  };

  const UserModal = () => {
    if (!selectedUser) return null;
    const user = selectedUser;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
        onClick={() => setSelectedUser(null)}
      >
        <div
          className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f]"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 p-4 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center gap-3 z-10">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 flex items-center justify-center flex-shrink-0">
                <span className="text-[#22c55e] font-bold text-xl">
                  {(user.displayName || user.username)?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold">{user.displayName || user.username}</h2>
              <p className="text-[#6b7280] text-xs truncate">{user.email || `@${user.username}`}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Status */}
            <div className={`p-3 rounded-xl flex items-center gap-3 ${
              user.disabled ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'
            }`}>
              {user.disabled
                ? <><Lock className="w-4 h-4 text-red-400 flex-shrink-0" /><div><div className="text-red-400 font-medium text-sm">Conta Desativada</div><div className="text-red-400/60 text-xs">Sem acesso ao sistema</div></div></>
                : <><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /><div><div className="text-green-400 font-medium text-sm">Conta Ativa</div><div className="text-green-400/60 text-xs">Acesso normal</div></div></>
              }
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'XP', value: user.stats?.totalXP || 0, color: '#22c55e' },
                { label: 'Hábitos', value: user.stats?.habits || 0, color: '#3b82f6' },
                { label: 'Eventos', value: user.stats?.events || 0, color: '#f59e0b' },
                { label: 'Medalhas', value: user.stats?.achievements || 0, color: '#8b5cf6' },
              ].map((s, i) => (
                <div key={i} className="p-2 rounded-xl bg-[#111] text-center">
                  <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[9px] text-[#6b7280]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-xl bg-[#111]">
                <div className="text-[#6b7280] text-[10px] mb-1">Autenticação</div>
                <div className="text-white font-medium text-sm">
                  {user.authProvider === 'google' ? '🔵 Google' : '🔑 Senha'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#111]">
                <div className="text-[#6b7280] text-[10px] mb-1">Último login</div>
                <div className="text-white text-sm">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#111]">
                <div className="text-[#6b7280] text-[10px] mb-1">Membro desde</div>
                <div className="text-white text-sm">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#111]">
                <div className="text-[#6b7280] text-[10px] mb-1">Username</div>
                <div className="text-white text-sm font-mono">@{user.username}</div>
              </div>
            </div>

            {/* Account action */}
            <button
              onClick={() => performAction(user.id, user.disabled ? 'enable' : 'disable')}
              disabled={actionLoading}
              className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all ${
                user.disabled
                  ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20'
                  : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
              }`}
            >
              {user.disabled ? <><UserCheck className="w-4 h-4" />Ativar Conta</> : <><UserX className="w-4 h-4" />Desativar Conta</>}
            </button>

            {/* Features */}
            <div>
              <h3 className="text-white text-sm font-medium mb-2 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-[#6b7280]" />
                Funcionalidades
              </h3>
              <div className="space-y-1.5">
                {FEATURES.map(feature => {
                  const isDisabled = user.disabledFeatures?.includes(feature.id);
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => performAction(user.id, 'toggle_feature', { feature: feature.id })}
                      disabled={actionLoading}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all border text-left ${
                        isDisabled
                          ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                          : 'bg-[#111] border-[#1a1a1a] hover:border-[#252525]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDisabled ? 'bg-red-500/15' : 'bg-[#1a1a1a]'}`}>
                        <Icon className={`w-3.5 h-3.5 ${isDisabled ? 'text-red-400' : 'text-[#6b7280]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${isDisabled ? 'text-red-400' : 'text-white'}`}>{feature.label}</div>
                        <div className="text-[10px] text-[#6b7280]">{feature.desc}</div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium flex-shrink-0 ${
                        isDisabled ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
                      }`}>
                        {isDisabled ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {isDisabled ? 'Bloqueado' : 'Ativo'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset password */}
            {showResetForm ? (
              <div className="space-y-2">
                <input
                  type="password"
                  value={resetPwd}
                  onChange={e => setResetPwd(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  className="w-full p-3 rounded-xl bg-[#111] border border-[#1a1a1a] text-white placeholder-[#4b5563] text-sm focus:outline-none focus:border-[#22c55e]/40"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowResetForm(false); setResetPwd(''); }}
                    className="flex-1 p-2.5 rounded-xl bg-[#111] border border-[#1a1a1a] text-[#6b7280] text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (resetPwd.length >= 6) {
                        performAction(user.id, 'reset_password', { new_password: resetPwd });
                        setShowResetForm(false);
                        setResetPwd('');
                      } else {
                        setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' });
                      }
                    }}
                    disabled={actionLoading}
                    className="flex-1 p-2.5 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/20 text-[#22c55e] text-sm font-medium"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetForm(true)}
                className="w-full p-2.5 rounded-xl flex items-center justify-center gap-2 bg-[#111] border border-[#1a1a1a] text-[#9ca3af] hover:border-[#252525] transition-all text-sm"
              >
                <Key className="w-4 h-4" />
                Resetar Senha
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Log entry helpers ────────────────────────────────────────────────────────
  const LOG_META = {
    ip_blocked:          { label: 'IP Bloqueado',       color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20',    icon: WifiOff },
    ip_unblocked:        { label: 'IP Desbloqueado',    color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Wifi },
    rate_limit_exceeded: { label: 'Rate Limit',         color: '#f59e0b', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Zap },
    page_view:           { label: 'Page View',          color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20',   icon: Globe },
  };

  const getLogMeta = (type) => LOG_META[type] || { label: type, color: '#9ca3af', bg: 'bg-[#1a1a1a]', border: 'border-[#2a2a2a]', icon: Hash };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString('pt-BR'),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  // ── Access guard ─────────────────────────────────────────────────────────────
  if (!currentUser?.isAdmin) return null;

  const activeUsers = stats?.active_users || 0;
  const totalUsers = stats?.total_users || 0;
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 bg-[#050505]/90 backdrop-blur-xl border-b border-[#1a1a1a] safe-top">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">Admin</h1>
              <p className="text-[#4b5563] text-[10px]">RoutineTracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[11px] text-[#6b7280]">{totalUsers} usuários</span>
              </div>
            )}
            <button
              onClick={loadAllData}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#6b7280] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6b7280]" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {message && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className={`px-3 py-2 rounded-xl flex items-center gap-2 shadow-xl ${
            message.type === 'error'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {message.type === 'error' ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span className="text-xs">{message.text}</span>
            <button onClick={() => setMessage(null)}><X className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="px-4 py-1.5 border-b border-[#1a1a1a] overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-0.5">
          {[
            { id: 'overview',  label: 'Visão Geral', icon: BarChart3 },
            { id: 'analytics', label: 'Analíticos',  icon: TrendingUp },
            { id: 'users',     label: 'Usuários',    icon: Users },
            { id: 'security',  label: 'Segurança',   icon: Shield },
            { id: 'platform',  label: 'Plataforma',  icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'text-[#6b7280] hover:bg-[#0a0a0a] hover:text-[#9ca3af]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="px-4 py-5 max-w-5xl mx-auto safe-bottom">

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div className="space-y-5">
            {/* 6-stat grid */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <StatCard icon={Users}    label="Total Usuários"  value={stats.total_users}    color="#22c55e" subValue={`+${stats.new_users_today} hoje`} />
                <StatCard icon={Activity} label="Ativos (7d)"     value={stats.active_users}   color="#3b82f6" subValue={`${activeRate}% da base`} />
                <StatCard icon={Target}   label="Hábitos Criados" value={stats.total_habits}   color="#f59e0b" />
                <StatCard icon={Calendar} label="Eventos Criados" value={stats.total_events}   color="#8b5cf6" />
                <StatCard icon={Globe}    label="Login Google"    value={stats.google_users}   color="#60a5fa" subValue={`${stats.password_users} via senha`} />
                <StatCard icon={Lock}     label="Bloqueados"      value={stats.disabled_users} color="#ef4444" />
              </div>
            )}

            {/* Daily logins sparkline + auth breakdown */}
            <div className="grid lg:grid-cols-2 gap-3">
              {stats?.daily_logins?.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#3b82f6]" />
                      <span className="text-white text-sm font-medium">Logins Diários (7d)</span>
                    </div>
                    <span className="text-[10px] text-[#4b5563]">
                      Total: {stats.daily_logins.reduce((s, d) => s + d.count, 0)}
                    </span>
                  </div>
                  <MiniChart
                    data={stats.daily_logins.map(d => ({ label: d.date?.slice(5), value: d.count }))}
                    color="#3b82f6"
                    height={64}
                    showLabels
                  />
                </div>
              )}

              {/* Auth + engagement summary */}
              {stats && analytics && (
                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
                  <span className="text-white text-sm font-medium">Plataforma</span>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Auth Google', value: stats.google_users, total: stats.total_users, color: '#60a5fa' },
                      { label: 'Auth Senha',  value: stats.password_users, total: stats.total_users, color: '#22c55e' },
                      { label: 'Com Hábitos', value: analytics.engagement?.usersWithHabits, total: stats.total_users, color: '#f59e0b' },
                      { label: 'Com Eventos', value: analytics.engagement?.usersWithEvents, total: stats.total_users, color: '#8b5cf6' },
                    ].map((row, i) => {
                      const pct = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-[#6b7280]">{row.label}</span>
                            <span className="text-white font-medium">{row.value} <span className="text-[#4b5563]">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: row.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick security + engagement pills */}
            {analytics && security && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Req/Hora',       value: analytics.realTimeMetrics?.requestsLastHour || 0, icon: Activity, color: '#3b82f6' },
                  { label: 'IPs Suspeitos',  value: security.totalSuspicious, icon: AlertTriangle, color: '#f59e0b' },
                  { label: 'IPs Bloqueados', value: security.totalBlocked, icon: WifiOff, color: '#ef4444' },
                  { label: 'Conclusão',      value: `${Math.round(analytics.avgCompletionRate || 0)}%`, icon: CheckCircle, color: '#22c55e' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-3 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{item.value}</div>
                        <div className="text-[10px] text-[#4b5563]">{item.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Data Explorer ── */}
            <div className="space-y-2">
              {/* Active Users panel */}
              <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#111] transition-all"
                  onClick={() => setOverviewExpanded(s => ({ ...s, users: !s.users }))}>
                  <div className="w-7 h-7 rounded-lg bg-[#22c55e]/15 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#22c55e]" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-white text-sm font-medium">Usuários Ativos</span>
                    {stats && <span className="text-[#4b5563] text-xs ml-2">{stats.total_users} total</span>}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#4b5563] transition-transform ${overviewExpanded.users ? 'rotate-180' : ''}`} />
                </button>
                {overviewExpanded.users && (
                  <div className="border-t border-[#141414]">
                    <div className="px-4 py-2 border-b border-[#141414]">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4b5563]" />
                        <input type="text" value={overviewSearch.users}
                          onChange={e => setOverviewSearch(s => ({ ...s, users: e.target.value }))}
                          placeholder="Buscar usuário..."
                          className="w-full pl-7 pr-3 py-1.5 bg-[#111] border border-[#1a1a1a] rounded-lg text-xs text-white placeholder-[#4b5563] focus:outline-none focus:border-[#2a2a2a]" />
                      </div>
                    </div>
                    <div className="divide-y divide-[#0f0f0f] max-h-80 overflow-y-auto">
                      {users.filter(u => {
                        const q = overviewSearch.users.toLowerCase();
                        return !q || (u.displayName || u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                      }).map(user => (
                        <div key={user.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#111] cursor-pointer transition-all"
                          onClick={() => setSelectedUser(user)}>
                          {user.picture ? (
                            <img src={user.picture} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                              <span className="text-[#22c55e] text-xs font-bold">{(user.displayName || user.username)?.[0]?.toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">{user.displayName || user.username}</div>
                            <div className="text-[#4b5563] text-[10px] truncate">{user.email || `@${user.username}`}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[#22c55e] text-xs font-medium">{user.stats?.totalXP || 0} XP</div>
                            <div className="text-[#4b5563] text-[10px]">{user.stats?.habits || 0}h · {user.stats?.events || 0}e</div>
                          </div>
                          {user.disabled && <Lock className="w-3 h-3 text-red-400 flex-shrink-0" />}
                        </div>
                      ))}
                      {users.length === 0 && <div className="px-4 py-6 text-center text-[#4b5563] text-xs">Nenhum usuário encontrado</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* All Habits panel */}
              <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#111] transition-all"
                  onClick={() => setOverviewExpanded(s => ({ ...s, habits: !s.habits }))}>
                  <div className="w-7 h-7 rounded-lg bg-[#f59e0b]/15 flex items-center justify-center flex-shrink-0">
                    <Target className="w-3.5 h-3.5 text-[#f59e0b]" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-white text-sm font-medium">Todos os Hábitos</span>
                    {stats && <span className="text-[#4b5563] text-xs ml-2">{stats.total_habits} total</span>}
                  </div>
                  {habitsLoading && <RefreshCw className="w-3 h-3 text-[#4b5563] animate-spin" />}
                  <ChevronDown className={`w-4 h-4 text-[#4b5563] transition-transform ${overviewExpanded.habits ? 'rotate-180' : ''}`} />
                </button>
                {overviewExpanded.habits && (
                  <div className="border-t border-[#141414]">
                    <div className="px-4 py-2 border-b border-[#141414]">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4b5563]" />
                        <input type="text" value={overviewSearch.habits}
                          onChange={e => setOverviewSearch(s => ({ ...s, habits: e.target.value }))}
                          placeholder="Buscar hábito ou categoria..."
                          className="w-full pl-7 pr-3 py-1.5 bg-[#111] border border-[#1a1a1a] rounded-lg text-xs text-white placeholder-[#4b5563] focus:outline-none focus:border-[#2a2a2a]" />
                      </div>
                    </div>
                    <div className="divide-y divide-[#0f0f0f] max-h-80 overflow-y-auto">
                      {allHabits?.habits?.map((habit, i) => (
                        <div key={habit.id || i} className="px-4 py-2.5 flex items-center gap-3">
                          <span className="text-base flex-shrink-0 w-6 text-center">{habit.emoji || '📋'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">{habit.name}</div>
                            <div className="text-[#4b5563] text-[10px]">{habit.category} · {habit.frequency}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[#f59e0b] text-xs font-medium">{habit.completionsCount}×</div>
                            <div className="text-[#4b5563] text-[10px] truncate max-w-[80px]">{habit.user?.displayName || habit.user?.username}</div>
                          </div>
                        </div>
                      ))}
                      {!habitsLoading && !allHabits?.habits?.length && (
                        <div className="px-4 py-6 text-center text-[#4b5563] text-xs">Nenhum hábito encontrado</div>
                      )}
                    </div>
                    {allHabits && allHabits.total > 50 && (
                      <div className="px-4 py-2 border-t border-[#141414] flex items-center justify-between">
                        <span className="text-[10px] text-[#4b5563]">{allHabits.skip + 1}–{Math.min(allHabits.skip + 50, allHabits.total)} de {allHabits.total}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setAllHabitsPage(p => Math.max(0, p - 1))} disabled={allHabitsPage === 0}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[#111] border border-[#1a1a1a] disabled:opacity-30">
                            <ChevronLeft className="w-3 h-3 text-[#6b7280]" />
                          </button>
                          <button onClick={() => setAllHabitsPage(p => p + 1)} disabled={(allHabitsPage + 1) * 50 >= allHabits.total}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[#111] border border-[#1a1a1a] disabled:opacity-30">
                            <ChevronRight className="w-3 h-3 text-[#6b7280]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* All Events panel */}
              <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#111] transition-all"
                  onClick={() => setOverviewExpanded(s => ({ ...s, events: !s.events }))}>
                  <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-[#8b5cf6]" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-white text-sm font-medium">Todos os Eventos</span>
                    {stats && <span className="text-[#4b5563] text-xs ml-2">{stats.total_events} total</span>}
                  </div>
                  {eventsLoading && <RefreshCw className="w-3 h-3 text-[#4b5563] animate-spin" />}
                  <ChevronDown className={`w-4 h-4 text-[#4b5563] transition-transform ${overviewExpanded.events ? 'rotate-180' : ''}`} />
                </button>
                {overviewExpanded.events && (
                  <div className="border-t border-[#141414]">
                    <div className="px-4 py-2 border-b border-[#141414]">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4b5563]" />
                        <input type="text" value={overviewSearch.events}
                          onChange={e => setOverviewSearch(s => ({ ...s, events: e.target.value }))}
                          placeholder="Buscar evento..."
                          className="w-full pl-7 pr-3 py-1.5 bg-[#111] border border-[#1a1a1a] rounded-lg text-xs text-white placeholder-[#4b5563] focus:outline-none focus:border-[#2a2a2a]" />
                      </div>
                    </div>
                    <div className="divide-y divide-[#0f0f0f] max-h-80 overflow-y-auto">
                      {allEvents?.events?.map((event, i) => (
                        <div key={event.id || i} className="px-4 py-2.5 flex items-center gap-3">
                          <span className="text-base flex-shrink-0 w-6 text-center">{event.emoji || '📅'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">{event.title}</div>
                            <div className="text-[#4b5563] text-[10px]">{event.date}{event.endDate && ` → ${event.endDate}`}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {event.color && <div className="w-2.5 h-2.5 rounded-full mx-auto mb-0.5" style={{ background: event.color }} />}
                            <div className="text-[#4b5563] text-[10px] truncate max-w-[80px]">{event.user?.displayName || event.user?.username}</div>
                          </div>
                        </div>
                      ))}
                      {!eventsLoading && !allEvents?.events?.length && (
                        <div className="px-4 py-6 text-center text-[#4b5563] text-xs">Nenhum evento encontrado</div>
                      )}
                    </div>
                    {allEvents && allEvents.total > 50 && (
                      <div className="px-4 py-2 border-t border-[#141414] flex items-center justify-between">
                        <span className="text-[10px] text-[#4b5563]">{allEvents.skip + 1}–{Math.min(allEvents.skip + 50, allEvents.total)} de {allEvents.total}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setAllEventsPage(p => Math.max(0, p - 1))} disabled={allEventsPage === 0}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[#111] border border-[#1a1a1a] disabled:opacity-30">
                            <ChevronLeft className="w-3 h-3 text-[#6b7280]" />
                          </button>
                          <button onClick={() => setAllEventsPage(p => p + 1)} disabled={(allEventsPage + 1) * 50 >= allEvents.total}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[#111] border border-[#1a1a1a] disabled:opacity-30">
                            <ChevronRight className="w-3 h-3 text-[#6b7280]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ─────────────────────────────────────────────────────── */}
        {activeSection === 'analytics' && (
          <div className="space-y-5">
            {/* Period selector */}
            <div className="flex gap-1.5">
              {[
                { id: '24h', label: '24h' },
                { id: '7d',  label: '7 dias' },
                { id: '30d', label: '30 dias' },
                { id: '90d', label: '90 dias' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === p.id ? 'bg-[#22c55e] text-black' : 'bg-[#0a0a0a] text-[#6b7280] border border-[#1a1a1a] hover:border-[#2a2a2a]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {analytics && (
              <>
                {/* Charts row */}
                <div className="grid lg:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-sm font-medium">Novos Usuários</span>
                      <span className="text-[10px] text-[#4b5563]">{period}</span>
                    </div>
                    <MiniChart data={analytics.userGrowth || []} color="#22c55e" height={80} showLabels />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-3.5 h-3.5 text-[#3b82f6]" />
                      <span className="text-white text-sm font-medium">Horários de Pico</span>
                    </div>
                    <MiniChart
                      data={(analytics.loginByHour || []).map(h => ({ label: h.hour?.slice(0, 2), value: h.count }))}
                      color="#3b82f6"
                      height={80}
                      showLabels
                    />
                  </div>
                </div>

                {/* Popular habits */}
                {analytics.popularHabits?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                    <span className="text-white text-sm font-medium block mb-3">Hábitos Mais Populares</span>
                    <div className="space-y-2">
                      {analytics.popularHabits.slice(0, 8).map((habit, i) => {
                        const pct = (habit.count / (analytics.popularHabits[0]?.count || 1)) * 100;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-4 text-[10px] text-[#4b5563] text-right flex-shrink-0">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs text-white truncate max-w-[180px]">{habit.name}</span>
                                <span className="text-[10px] text-[#22c55e] flex-shrink-0 ml-2">{habit.count}</span>
                              </div>
                              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category distribution + Engagement */}
                <div className="grid lg:grid-cols-2 gap-3">
                  {analytics.categoryDistribution?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                      <div className="flex items-center gap-2 mb-3">
                        <PieChart className="w-3.5 h-3.5 text-[#8b5cf6]" />
                        <span className="text-white text-sm font-medium">Categorias</span>
                      </div>
                      <div className="space-y-2">
                        {analytics.categoryDistribution.slice(0, 6).map((cat, i) => {
                          const total = analytics.categoryDistribution.reduce((s, c) => s + c.count, 0);
                          const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                          const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                              <span className="text-[11px] text-[#9ca3af] flex-1 truncate">{cat.category}</span>
                              <span className="text-[10px] text-[#6b7280]">{cat.count}</span>
                              <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                              </div>
                              <span className="text-[9px] text-[#4b5563] w-6 text-right">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {analytics.engagement && (
                    <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                      <span className="text-white text-sm font-medium block mb-4">Engajamento</span>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Adoção Hábitos', value: analytics.engagement.habitAdoptionRate, color: '#22c55e' },
                          { label: 'Adoção Eventos', value: analytics.engagement.eventAdoptionRate, color: '#3b82f6' },
                          { label: 'Conclusão',      value: analytics.avgCompletionRate, color: '#f59e0b' },
                        ].map((m, i) => (
                          <div key={i} className="text-center">
                            <div className="relative w-14 h-14 mx-auto mb-1.5">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="22" fill="none" stroke="#1a1a1a" strokeWidth="5" />
                                <circle
                                  cx="28" cy="28" r="22" fill="none" stroke={m.color} strokeWidth="5"
                                  strokeDasharray={`${(m.value / 100) * 138} 138`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{Math.round(m.value)}%</span>
                              </div>
                            </div>
                            <div className="text-[9px] text-[#6b7280] leading-tight">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── USERS ─────────────────────────────────────────────────────────── */}
        {activeSection === 'users' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4b5563]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar usuário, email..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] text-white placeholder-[#3a3a3a] text-sm focus:outline-none focus:border-[#22c55e]/40"
                />
              </div>
              <select
                value={filterType || ''}
                onChange={e => setFilterType(e.target.value || null)}
                className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] text-white text-sm focus:outline-none"
              >
                <option value="">Todos</option>
                <option value="google">Google</option>
                <option value="password">Senha</option>
                <option value="disabled">Desativados</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4b5563] text-xs">{users.length} usuário{users.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1.5">
              {users.map(user => <UserRow key={user.id} user={user} />)}
              {users.length === 0 && !loading && (
                <div className="text-center py-16 text-[#4b5563] text-sm">Nenhum usuário encontrado</div>
              )}
            </div>
          </div>
        )}

        {/* ── SECURITY ──────────────────────────────────────────────────────── */}
        {activeSection === 'security' && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl w-fit">
              {[
                { id: 'status', label: 'Status',  icon: Shield },
                { id: 'logs',   label: 'Logs',    icon: FileText },
              ].map(st => {
                const Icon = st.icon;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSecuritySubTab(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      securitySubTab === st.id ? 'bg-[#1a1a1a] text-white' : 'text-[#6b7280] hover:text-[#9ca3af]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* STATUS sub-tab */}
            {securitySubTab === 'status' && security && (
              <div className="space-y-3">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2.5">
                  <StatCard icon={Activity} label="Req/Hora"       value={analytics?.realTimeMetrics?.requestsLastHour || 0} color="#3b82f6" />
                  <StatCard icon={AlertTriangle} label="Suspeitos" value={security.totalSuspicious} color="#f59e0b" />
                  <StatCard icon={WifiOff} label="Bloqueados"      value={security.totalBlocked} color="#ef4444" />
                </div>

                {/* Config */}
                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                  <span className="text-white text-sm font-medium block mb-3">Proteção Configurada</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Rate Limit',       value: `${security.config?.rateLimitMaxRequests} req/${security.config?.rateLimitWindow}s` },
                      { label: 'DDoS Threshold',   value: `${security.config?.ddosThreshold} req/min` },
                      { label: 'Tempo Bloqueio',   value: `${Math.round(security.config?.blockDuration / 60)}min` },
                      { label: 'Violações → Block', value: `${security.config?.suspiciousThreshold} violações` },
                    ].map((c, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[#111]">
                        <div className="text-[10px] text-[#6b7280] mb-0.5">{c.label}</div>
                        <div className="text-white text-sm font-medium font-mono">{c.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suspicious IPs */}
                {security.suspiciousIPs?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                    <span className="text-white text-sm font-medium block mb-3">IPs Suspeitos</span>
                    <div className="space-y-1.5">
                      {security.suspiciousIPs.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
                          <div>
                            <div className="text-white font-mono text-xs">{item.ip}</div>
                            <div className="text-[10px] text-yellow-400">{item.violations} violações</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                            <span className="text-[10px] text-yellow-400">Monitorando</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocked IPs */}
                {security.blockedIPs?.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                    <span className="text-white text-sm font-medium block mb-3">IPs Bloqueados</span>
                    <div className="space-y-1.5">
                      {security.blockedIPs.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5 border border-red-500/20">
                          <div>
                            <div className="text-white font-mono text-xs">{item.ip}</div>
                            <div className="text-[10px] text-red-400">
                              {Math.floor(item.remaining_seconds / 60)}m {item.remaining_seconds % 60}s restantes
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblock(item.ip)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a1a1a] text-[#9ca3af] text-xs hover:bg-[#252525] transition-colors"
                          >
                            <Unlock className="w-3 h-3" />
                            Desbloquear
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] text-center py-8">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-[#6b7280] text-sm">Nenhum IP bloqueado</p>
                  </div>
                )}

                {/* Recent events */}
                {security.recentEvents?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a]">
                    <span className="text-white text-sm font-medium block mb-3">Eventos Recentes</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {security.recentEvents.map((event, i) => {
                        const meta = getLogMeta(event.type);
                        const { time } = formatTimestamp(event.timestamp);
                        return (
                          <div key={i} className={`p-2 rounded-lg text-xs flex items-center gap-2 ${meta.bg} border ${meta.border}`}>
                            <meta.icon className="w-3 h-3 flex-shrink-0" style={{ color: meta.color }} />
                            <span style={{ color: meta.color }}>{meta.label}</span>
                            {event.data?.ip && <span className="font-mono text-[#6b7280] text-[10px]">{event.data.ip}</span>}
                            <span className="ml-auto text-[#4b5563] text-[10px] flex-shrink-0">{time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LOGS sub-tab */}
            {securitySubTab === 'logs' && (
              <div className="space-y-3">
                {/* Type counts + filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'all',                 label: 'Todos' },
                    { id: 'ip_blocked',          label: 'Bloqueios' },
                    { id: 'rate_limit_exceeded', label: 'Rate Limit' },
                    { id: 'page_view',           label: 'Page Views' },
                    { id: 'ip_unblocked',        label: 'Desbloqueios' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setLogsType(t.id); setLogsPage(0); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        logsType === t.id ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/20' : 'bg-[#0a0a0a] border border-[#1a1a1a] text-[#6b7280] hover:text-[#9ca3af]'
                      }`}
                    >
                      {t.label}
                      {logs?.typeCounts?.[t.id] != null && t.id !== 'all' && (
                        <span className="text-[9px] opacity-60">{logs.typeCounts[t.id]}</span>
                      )}
                      {t.id === 'all' && logs?.total != null && (
                        <span className="text-[9px] opacity-60">{logs.total}</span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={loadLogs}
                    className="ml-auto w-7 h-7 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#6b7280] ${logsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Log entries */}
                <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
                  {logsLoading ? (
                    <div className="text-center py-12 text-[#4b5563] text-sm">Carregando logs...</div>
                  ) : logs?.logs?.length > 0 ? (
                    <div className="divide-y divide-[#111]">
                      {logs.logs.map((log, i) => {
                        const meta = getLogMeta(log.type);
                        const { date, time } = formatTimestamp(log.timestamp);
                        const Icon = meta.icon;
                        return (
                          <div key={i} className="px-4 py-2.5 flex items-start gap-3 hover:bg-[#0d0d0d] transition-colors">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${meta.color}15` }}>
                              <Icon className="w-3 h-3" style={{ color: meta.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
                                {log.data?.ip && (
                                  <span className="font-mono text-[10px] text-[#9ca3af] bg-[#141414] px-1.5 py-0.5 rounded">{log.data.ip}</span>
                                )}
                                {log.data?.endpoint && (
                                  <span className="text-[10px] text-[#6b7280] truncate max-w-[200px]">{log.data.endpoint}</span>
                                )}
                                {log.data?.admin && (
                                  <span className="text-[10px] text-[#22c55e]">por {log.data.admin}</span>
                                )}
                              </div>
                              {log.data?.duration && (
                                <div className="text-[10px] text-[#4b5563] mt-0.5">duração: {log.data.duration}s</div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-[10px] text-[#6b7280]">{time}</div>
                              <div className="text-[9px] text-[#3a3a3a]">{date}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-8 h-8 text-[#2a2a2a] mx-auto mb-2" />
                      <p className="text-[#4b5563] text-sm">Nenhum log encontrado</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {logs && logs.total > 50 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#4b5563]">
                      {logsPage * 50 + 1}–{Math.min((logsPage + 1) * 50, logs.total)} de {logs.total}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setLogsPage(p => Math.max(0, p - 1))}
                        disabled={logsPage === 0}
                        className="w-7 h-7 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center disabled:opacity-30"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-[#6b7280]" />
                      </button>
                      <button
                        onClick={() => setLogsPage(p => p + 1)}
                        disabled={(logsPage + 1) * 50 >= logs.total}
                        className="w-7 h-7 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center disabled:opacity-30"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#6b7280]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PLATFORM TAB ─────────────────────────────────────────────── */}
        {activeSection === 'platform' && (
          <div className="space-y-4">
            {platformLoading && (
              <div className="text-center py-8 text-[#4b5563] text-sm">Carregando...</div>
            )}

            {/* Maintenance mode */}
            {platformConfig && (
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${platformConfig.maintenance_mode ? 'bg-red-500/15' : 'bg-[#1a1a1a]'}`}>
                      <Settings className={`w-3.5 h-3.5 ${platformConfig.maintenance_mode ? 'text-red-400' : 'text-[#6b7280]'}`} />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">Modo Manutenção</div>
                      <div className="text-[10px] text-[#4b5563]">Bloqueia o acesso de todos os usuários</div>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePlatformConfig({ maintenance_mode: !platformConfig.maintenance_mode })}
                    className="relative flex-shrink-0 rounded-full transition-colors"
                    style={{ width: 40, height: 22, background: platformConfig.maintenance_mode ? '#ef4444' : '#2a2a2a' }}
                  >
                    <span className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                      style={{ width: 18, height: 18, transform: platformConfig.maintenance_mode ? 'translateX(19px)' : 'translateX(2px)' }} />
                  </button>
                </div>
                {platformConfig.maintenance_mode && (
                  <div className="flex gap-2">
                    <input
                      defaultValue={platformConfig.maintenance_message}
                      onBlur={e => updatePlatformConfig({ maintenance_message: e.target.value })}
                      placeholder="Mensagem de manutenção..."
                      className="flex-1 px-3 py-2 bg-[#111] border border-red-500/20 rounded-xl text-white text-xs placeholder-[#4b5563] focus:outline-none focus:border-red-500/40"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Global feature toggles */}
            {platformConfig && (
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] space-y-2">
                <div className="text-white text-sm font-medium mb-3">Funcionalidades Globais</div>
                {FEATURES.map(feature => {
                  const isDisabled = platformConfig.globally_disabled_features?.includes(feature.id);
                  const Icon = feature.icon;
                  return (
                    <div key={feature.id} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDisabled ? 'bg-red-500/15' : 'bg-[#1a1a1a]'}`}>
                        <Icon className={`w-3.5 h-3.5 ${isDisabled ? 'text-red-400' : 'text-[#6b7280]'}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-medium ${isDisabled ? 'text-red-400' : 'text-white'}`}>{feature.label}</div>
                        <div className="text-[10px] text-[#4b5563]">{feature.desc}</div>
                      </div>
                      <button
                        onClick={() => {
                          const current = platformConfig.globally_disabled_features || [];
                          const next = isDisabled
                            ? current.filter(f => f !== feature.id)
                            : [...current, feature.id];
                          updatePlatformConfig({ globally_disabled_features: next });
                        }}
                        className="relative flex-shrink-0 rounded-full transition-colors"
                        style={{ width: 40, height: 22, background: isDisabled ? '#ef4444' : '#2a2a2a' }}
                      >
                        <span
                          className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                          style={{ width: 18, height: 18, transform: isDisabled ? 'translateX(19px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Announcements */}
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-white text-sm font-medium">Anúncios</span>
              </div>

              {/* Create form */}
              <div className="space-y-2 p-3 rounded-xl bg-[#111] border border-[#1a1a1a]">
                <textarea
                  value={newAnn.message}
                  onChange={e => setNewAnn(s => ({ ...s, message: e.target.value }))}
                  placeholder="Mensagem para todos os usuários..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white text-xs placeholder-[#4b5563] focus:outline-none focus:border-[#2a2a2a] resize-none"
                />
                <div className="flex gap-2">
                  <select
                    value={newAnn.type}
                    onChange={e => setNewAnn(s => ({ ...s, type: e.target.value }))}
                    className="flex-1 px-2 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-white text-xs focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Aviso</option>
                    <option value="success">Sucesso</option>
                  </select>
                  <select
                    value={newAnn.expires_hours}
                    onChange={e => setNewAnn(s => ({ ...s, expires_hours: e.target.value }))}
                    className="flex-1 px-2 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-white text-xs focus:outline-none"
                  >
                    <option value="">Sem expiração</option>
                    <option value="1">1 hora</option>
                    <option value="6">6 horas</option>
                    <option value="24">24 horas</option>
                    <option value="72">3 dias</option>
                  </select>
                  <button
                    onClick={createAnnouncement}
                    disabled={annCreating || !newAnn.message.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/20 text-[#3b82f6] text-xs font-medium disabled:opacity-40"
                  >
                    Publicar
                  </button>
                </div>
              </div>

              {/* List */}
              {announcements.length === 0 ? (
                <div className="text-center py-4 text-[#4b5563] text-xs">Nenhum anúncio</div>
              ) : (
                <div className="space-y-1.5">
                  {announcements.map(ann => {
                    const typeColor = ann.type === 'warning' ? '#f59e0b' : ann.type === 'success' ? '#22c55e' : '#3b82f6';
                    return (
                      <div key={ann.id} className={`p-3 rounded-xl flex items-start gap-2.5 border ${ann.active ? 'border-[#1a1a1a] bg-[#111]' : 'border-[#111] bg-[#0a0a0a] opacity-50'}`}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: typeColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white leading-relaxed">{ann.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono" style={{ color: typeColor }}>{ann.type}</span>
                            {ann.expires_at && <span className="text-[9px] text-[#4b5563]">exp: {new Date(ann.expires_at).toLocaleDateString('pt-BR')}</span>}
                            <span className="text-[9px] text-[#3a3a3a]">{new Date(ann.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleAnnouncement(ann.id)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${ann.active ? 'bg-green-500/10 text-green-400' : 'bg-[#1a1a1a] text-[#4b5563]'}`}
                            title={ann.active ? 'Desativar' : 'Ativar'}
                          >
                            {ann.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => deleteAnnouncement(ann.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <UserModal />
    </div>
  );
}

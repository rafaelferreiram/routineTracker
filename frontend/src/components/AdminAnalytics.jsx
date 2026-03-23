import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { apiCall } from '../api/client';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Clock, 
  Users,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  RefreshCw,
  Calendar
} from 'lucide-react';

/**
 * Admin Analytics Panel
 * Shows platform metrics, user growth, security events
 */
export default function AdminAnalytics() {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [security, setSecurity] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'security'

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, securityData] = await Promise.all([
        apiCall('GET', `/admin/analytics?period=${period}`),
        apiCall('GET', '/admin/security'),
      ]);
      setAnalytics(analyticsData);
      setSecurity(securityData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (ip) => {
    try {
      await apiCall('POST', '/admin/security/unblock', { ip });
      loadData();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
    }
  };

  // Simple bar chart component
  const BarChart = ({ data, maxValue, color = '#22c55e', height = 100 }) => {
    const max = maxValue || Math.max(...data.map(d => d.value), 1);
    return (
      <div className="flex items-end gap-1 h-full" style={{ height }}>
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full rounded-t transition-all duration-300"
              style={{ 
                height: `${(item.value / max) * 100}%`,
                minHeight: item.value > 0 ? '4px' : '0',
                background: color,
                opacity: 0.8
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-[10px] text-[#6b7280] truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Progress bar component
  const ProgressBar = ({ value, max = 100, color = '#22c55e', label }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">{label}</span>
        <span className="text-white font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
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

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-[#22c55e] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-analytics">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Analytics & Segurança</h1>
            <p className="text-sm text-[#6b7280]">Métricas e proteção da plataforma</p>
          </div>
        </div>
        
        <button 
          onClick={loadData}
          className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] transition-all"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 text-[#9ca3af] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'overview' 
              ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30' 
              : 'bg-[#111111] text-[#6b7280] border border-[#1f1f1f]'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Métricas
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'security' 
              ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30' 
              : 'bg-[#111111] text-[#6b7280] border border-[#1f1f1f]'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Segurança
        </button>
      </div>

      {activeTab === 'overview' && analytics && (
        <>
          {/* Period Selector */}
          <div className="flex gap-2">
            {[
              { id: '24h', label: '24h' },
              { id: '7d', label: '7 dias' },
              { id: '30d', label: '30 dias' },
              { id: '90d', label: '90 dias' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.id 
                    ? 'bg-[#22c55e] text-black' 
                    : 'bg-[#1a1a1a] text-[#9ca3af] hover:bg-[#252525]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-[#6b7280]">Conexões Ativas</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {analytics.realTimeMetrics?.activeConnections || 0}
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs text-[#6b7280]">Req/Hora</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {analytics.realTimeMetrics?.requestsLastHour || 0}
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-red-500" />
                <span className="text-xs text-[#6b7280]">IPs Bloqueados</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {analytics.realTimeMetrics?.blockedIPs || 0}
              </div>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Crescimento de Usuários</h3>
              <span className="text-xs text-[#6b7280]">
                Total: {analytics.engagement?.totalUsers || 0}
              </span>
            </div>
            <div className="h-32">
              <BarChart 
                data={analytics.userGrowth || []} 
                color="#22c55e"
                height={120}
              />
            </div>
          </div>

          {/* Login by Hour */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#3b82f6]" />
              <h3 className="text-white font-medium">Horários de Pico (Logins)</h3>
            </div>
            <div className="h-24">
              <BarChart 
                data={analytics.loginByHour?.map(h => ({ label: h.hour.split(':')[0], value: h.count })) || []} 
                color="#3b82f6"
                height={80}
              />
            </div>
          </div>

          {/* Popular Habits */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
            <h3 className="text-white font-medium mb-4">Hábitos Mais Populares</h3>
            <div className="space-y-2">
              {analytics.popularHabits?.slice(0, 5).map((habit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[#6b7280] w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white truncate">{habit.name}</span>
                      <span className="text-xs text-[#22c55e]">{habit.count} usuários</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#22c55e] rounded-full"
                        style={{ 
                          width: `${(habit.count / (analytics.popularHabits[0]?.count || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!analytics.popularHabits || analytics.popularHabits.length === 0) && (
                <p className="text-sm text-[#6b7280] text-center py-4">Nenhum hábito encontrado</p>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
            <h3 className="text-white font-medium mb-4">Distribuição por Categoria</h3>
            <div className="grid grid-cols-2 gap-2">
              {analytics.categoryDistribution?.slice(0, 6).map((cat, i) => {
                const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#0d0d0d]">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ background: colors[i % colors.length] }}
                    />
                    <span className="text-xs text-[#9ca3af] flex-1 truncate">{cat.category}</span>
                    <span className="text-xs text-white font-medium">{cat.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
            <h3 className="text-white font-medium mb-4">Engajamento</h3>
            <div className="space-y-4">
              <ProgressBar 
                label="Usuários com Hábitos" 
                value={analytics.engagement?.habitAdoptionRate || 0}
                color="#22c55e"
              />
              <ProgressBar 
                label="Usuários com Eventos" 
                value={analytics.engagement?.eventAdoptionRate || 0}
                color="#3b82f6"
              />
              <ProgressBar 
                label="Taxa de Conclusão Média" 
                value={analytics.avgCompletionRate || 0}
                color="#f59e0b"
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'security' && security && (
        <>
          {/* Security Status */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="p-4 rounded-xl"
              style={{ 
                background: security.totalBlocked > 0 ? '#ef444420' : '#111111', 
                border: `1px solid ${security.totalBlocked > 0 ? '#ef444440' : '#1f1f1f'}` 
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-red-500" />
                <span className="text-sm text-[#9ca3af]">IPs Bloqueados</span>
              </div>
              <div className="text-3xl font-bold text-white">{security.totalBlocked}</div>
            </div>
            <div 
              className="p-4 rounded-xl"
              style={{ 
                background: security.totalSuspicious > 0 ? '#f59e0b20' : '#111111', 
                border: `1px solid ${security.totalSuspicious > 0 ? '#f59e0b40' : '#1f1f1f'}` 
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-[#9ca3af]">IPs Suspeitos</span>
              </div>
              <div className="text-3xl font-bold text-white">{security.totalSuspicious}</div>
            </div>
          </div>

          {/* Security Config */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
            <h3 className="text-white font-medium mb-3">Configuração de Proteção</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-[#0d0d0d]">
                <div className="text-[#6b7280]">Rate Limit</div>
                <div className="text-white font-medium">
                  {security.config?.rateLimitMaxRequests} req/{security.config?.rateLimitWindow}s
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0d0d0d]">
                <div className="text-[#6b7280]">DDoS Threshold</div>
                <div className="text-white font-medium">{security.config?.ddosThreshold} req/min</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0d0d0d]">
                <div className="text-[#6b7280]">Tempo de Bloqueio</div>
                <div className="text-white font-medium">{security.config?.blockDuration}s</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0d0d0d]">
                <div className="text-[#6b7280]">Violações p/ Bloquear</div>
                <div className="text-white font-medium">{security.config?.suspiciousThreshold}</div>
              </div>
            </div>
          </div>

          {/* Blocked IPs */}
          {security.blockedIPs?.length > 0 && (
            <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
              <h3 className="text-white font-medium mb-3">IPs Bloqueados</h3>
              <div className="space-y-2">
                {security.blockedIPs.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div>
                      <div className="text-white font-mono text-sm">{item.ip}</div>
                      <div className="text-xs text-red-400">
                        Desbloqueia em: {Math.floor(item.remaining_seconds / 60)}m {item.remaining_seconds % 60}s
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(item.ip)}
                      className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[#9ca3af] text-xs hover:bg-[#252525] transition-all"
                    >
                      <Unlock className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspicious IPs */}
          {security.suspiciousIPs?.length > 0 && (
            <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
              <h3 className="text-white font-medium mb-3">IPs Suspeitos</h3>
              <div className="space-y-2">
                {security.suspiciousIPs.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div>
                      <div className="text-white font-mono text-sm">{item.ip}</div>
                      <div className="text-xs text-yellow-400">
                        {item.violations} violações (bloqueio em {security.config?.suspiciousThreshold - item.violations})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Security Events */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
            <h3 className="text-white font-medium mb-3">Eventos de Segurança Recentes</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {security.recentEvents?.length > 0 ? (
                security.recentEvents.map((event, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg ${
                      event.type === 'ip_blocked' 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : 'bg-yellow-500/10 border border-yellow-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {event.type === 'ip_blocked' ? (
                        <Lock className="w-4 h-4 text-red-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-sm text-white">
                        {event.type === 'ip_blocked' ? 'IP Bloqueado' : 'Rate Limit Excedido'}
                      </span>
                      <span className="text-xs text-[#6b7280] ml-auto">
                        {new Date(event.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {event.data?.ip && (
                      <div className="text-xs text-[#6b7280] mt-1 font-mono">{event.data.ip}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-[#6b7280]">Nenhum evento de segurança recente</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

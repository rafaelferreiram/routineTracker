import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../store/useAuth.js';
import { useHabits } from '../hooks/useHabits.js';
import { getLevelColor } from '../utils/gamification.js';
import { api } from '../api/client.js';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export default function ProfilePanel() {
  const { currentUser, users, logout } = useAuth();
  const { profile, currentLevel, accentColor } = useHabits();
  const levelColor = getLevelColor(currentLevel);
  const fileInputRef = useRef(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileInfo, setProfileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Profile edit state
  const [displayName, setDisplayName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  // Fetch profile info on mount
  useEffect(() => {
    api.getProfile()
      .then(res => {
        setProfileInfo(res.user);
        setDisplayName(res.user.displayName || '');
      })
      .catch(console.error);
  }, []);

  const userPicture = profileInfo?.picture || currentUser?.picture;

  // Handle photo upload via URL (base64 conversion)
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setProfileError('Por favor, selecione uma imagem');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Imagem muito grande. Máximo 2MB');
      return;
    }

    setUploadingPhoto(true);
    setProfileError('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        setPhotoPreview(base64);

        // Upload to server
        const res = await api.updateProfile({ picture: base64 });
        setProfileInfo(prev => ({ ...prev, picture: base64 }));
        setProfileSuccess('Foto atualizada!');
        setTimeout(() => setProfileSuccess(''), 3000);
        setUploadingPhoto(false);
      };
      reader.onerror = () => {
        setProfileError('Erro ao ler imagem');
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setProfileError(err.message || 'Erro ao atualizar foto');
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisplayName = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (displayName.trim().length < 2) {
      setProfileError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateProfile({ display_name: displayName.trim() });
      setProfileInfo(prev => ({ ...prev, displayName: displayName.trim() }));
      setProfileSuccess('Nome atualizado!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message || 'Erro ao atualizar nome');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-white font-bold text-xl">Account</h2>
        <p className="text-[#4b5563] text-sm mt-0.5">Manage your profile and switch users</p>
      </div>

      {/* Current user card */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar with upload option */}
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                className="hidden"
              />
              {userPicture || photoPreview ? (
                <img
                  src={photoPreview || userPicture}
                  alt="Profile"
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: `2px solid rgba(${hexToRgb(levelColor)}, 0.5)` }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{
                    background: `rgba(${hexToRgb(levelColor)}, 0.15)`,
                    border: `2px solid rgba(${hexToRgb(levelColor)}, 0.5)`,
                    color: levelColor,
                  }}
                >
                  {(profile.name || currentUser?.displayName || '?')[0].toUpperCase()}
                </div>
              )}
              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploadingPhoto ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg leading-tight capitalize">{profileInfo?.displayName || profile.name || currentUser?.displayName}</p>
              <p className="text-[#4b5563] text-sm">@{currentUser?.username}</p>
              {profileInfo?.email && (
                <p className="text-[#4b5563] text-xs mt-0.5">{profileInfo.email}</p>
              )}
              <p className="text-sm font-semibold mt-1" style={{ color: levelColor }}>
                Level {currentLevel} · {(profile.totalXP || 0).toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* Success/Error messages */}
          {profileSuccess && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm">
              {profileError}
            </div>
          )}

          {/* Edit name section */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}>
            <form onSubmit={handleUpdateDisplayName} className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="flex-1 px-3 py-2 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-sm outline-none focus:border-[#374151] transition-colors"
              />
              <button
                type="submit"
                disabled={loading || displayName.trim() === profileInfo?.displayName}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: accentColor, color: '#000' }}
              >
                Salvar
              </button>
            </form>
            <p className="text-[#4b5563] text-xs mt-2">Clique na foto para alterar</p>
          </div>
        </div>
      </div>

      {/* Security section */}
      {profileInfo?.hasPassword && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}>
            <p className="text-white font-semibold text-sm">Security</p>
          </div>
          <div className="p-5">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}
            >
              <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-white">Alterar senha</span>
            </button>
          </div>
        </div>
      )}

      {/* Switch to another user */}
      {otherUsers.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--bg-border, #1f1f1f)' }}>
            <p className="text-white font-semibold text-sm">Switch Account</p>
          </div>
          <div className="p-3 space-y-1">
            {otherUsers.map(user => {
              const isRosa = user.username === 'gabriela';
              const accent = isRosa ? '#ec4899' : user.theme?.accentColor || '#22c55e';
              return (
                <button
                  key={user.id}
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-white/5 active:scale-98 text-left"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: `rgba(${hexToRgb(accent)}, 0.15)`,
                      border: `1.5px solid rgba(${hexToRgb(accent)}, 0.4)`,
                      color: accent,
                    }}
                  >
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium capitalize">{user.displayName}</p>
                    <p className="text-[#4b5563] text-xs">@{user.username}</p>
                  </div>
                  <span className="text-[#4b5563] text-sm">→</span>
                </button>
              );
            })}
            <p className="text-[#374151] text-[10px] px-3 pb-1">
              Switching takes you back to the login screen
            </p>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}>
        <div className="p-5">
          <button
            onClick={logout}
            data-testid="sign-out-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80 active:scale-95"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            <span className="text-base">↩</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          <div 
            className="relative w-full max-w-sm rounded-2xl border p-6"
            style={{ background: 'var(--bg-card, #111111)', borderColor: 'var(--bg-border, #1f1f1f)' }}
          >
            <h3 className="text-white font-bold text-lg mb-4">Alterar Senha</h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-sm outline-none focus:border-[#374151] transition-colors"
                />
              </div>
              
              <div>
                <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-sm outline-none focus:border-[#374151] transition-colors"
                />
                <div className="mt-2 space-y-1">
                  <p className={`text-xs flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                    <span>{newPassword.length >= 6 ? '✓' : '○'}</span> Mínimo 6 caracteres
                  </p>
                  <p className={`text-xs flex items-center gap-1.5 ${/[a-zA-Z]/.test(newPassword) ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                    <span>{/[a-zA-Z]/.test(newPassword) ? '✓' : '○'}</span> Pelo menos uma letra
                  </p>
                  <p className={`text-xs flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                    <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span> Pelo menos um número
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-white text-sm outline-none focus:border-[#374151] transition-colors"
                />
              </div>

              {passwordError && (
                <p className="text-[#f87171] text-xs bg-[#f871711a] border border-[#f8717133] rounded-xl px-3 py-2.5">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p className="text-[#22c55e] text-xs bg-[#22c55e1a] border border-[#22c55e33] rounded-xl px-3 py-2.5">
                  {passwordSuccess}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border transition-all hover:bg-white/5"
                  style={{ borderColor: 'var(--bg-border, #1f1f1f)', color: '#9ca3af' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: accentColor, color: '#000' }}
                >
                  {loading ? 'Alterando...' : 'Alterar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

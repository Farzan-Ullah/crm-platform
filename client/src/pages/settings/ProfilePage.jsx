import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  Building,
  Save,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useAuthStore } from '../../store/authStore.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { authApi } from '../../api/authApi.js';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/roles.js';
import toast from 'react-hot-toast';

const parseDevice = (userAgent = '') => {
  if (!userAgent) return { label: 'Web Browser', isMobile: false };
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return { label: 'Mobile Device', isMobile: true };
  }
  if (ua.includes('windows')) {
    return { label: 'Windows PC', isMobile: false };
  }
  if (ua.includes('macintosh') || ua.includes('mac os')) {
    return { label: 'Macintosh', isMobile: false };
  }
  if (ua.includes('linux')) {
    return { label: 'Linux PC', isMobile: false };
  }
  return { label: 'Web Browser', isMobile: false };
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const ProfilePage = () => {
  const { user, role, tenant } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab ('profile' | 'security')
  const initialTab = searchParams.get('tab') === 'security' ? 'security' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form States (Password Change)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sessions States
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingOther, setIsRevokingOther] = useState(false);

  // Keep form in sync when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Sync tab with URL query param
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch active sessions
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const res = await authApi.getSessions();
      if (res?.data?.sessions) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await authApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
      });

      if (res?.data?.user) {
        setUser({ ...user, ...res.data.user });
        toast.success('Profile details updated successfully');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(passwordForm.newPassword) || !/[0-9]/.test(passwordForm.newPassword)) {
      toast.error('Password must contain at least one uppercase letter and one number');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      fetchSessions();
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Revoke Single Session
  const handleRevokeSession = async (sessionId) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      toast.success('Session revoked');
    } catch (err) {
      toast.error(err.message || 'Failed to revoke session');
    }
  };

  // Handle Revoke All Other Sessions
  const handleRevokeAllOtherSessions = async () => {
    try {
      setIsRevokingOther(true);
      await authApi.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success('All other remote sessions have been revoked');
    } catch (err) {
      toast.error(err.message || 'Failed to revoke sessions');
    } finally {
      setIsRevokingOther(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Profile Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-2xl font-black text-white shadow-md">
              {user?.firstName?.[0] || 'U'}
              {user?.lastName?.[0] || ''}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                </h1>
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ROLE_LABELS[role] || role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email} • Organization: <span className="font-semibold text-slate-700 dark:text-slate-300">{tenant?.name || 'Workspace'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" dot size="sm">
              Account Active
            </Badge>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Account Profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Sessions</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Account Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Edit Profile Form */}
          <div className="md:col-span-2 space-y-6">
            <Card
              title="Personal Information"
              subtitle="Update your basic profile details and contact information"
            >
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, firstName: e.target.value })
                      }
                      placeholder="Jane"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, lastName: e.target.value })
                      }
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Email addresses are linked to your tenant login identity and managed by organization admins.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Direct Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSavingProfile}
                    className="flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Organization & Role Info Card */}
          <div className="space-y-6">
            <Card title="Organization & Access" subtitle="Assigned enterprise roles">
              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">Tenant Organization</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {tenant?.name || 'Enterprise SaaS'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">System Role</span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ROLE_LABELS[role] || role}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">Assigned Team</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {user?.teamId?.name || 'Inbound Enterprise Team'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Sessions */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Management */}
            <Card
              title="Change Password"
              subtitle="Ensure your account is using a strong, secure password"
            >
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="At least 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Must be 8+ characters, including at least one uppercase letter and one number.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Repeat new password"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isChangingPassword}
                    className="flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Security Posture Overview */}
            <Card
              title="Security & Session Policy"
              subtitle="Multi-tenant zero-trust token protection"
            >
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white">
                      Dual-Token Session Strategy
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Short-lived 15-minute access tokens with rotating 7-day cryptographic refresh tokens stored in HttpOnly SameSite=None cookies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white">
                      Cross-Origin CORS Protection
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      All API preflights and credential checks are strictly verified against designated domain headers with automated rate limiting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white">
                      Data Encryption at Rest
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Passwords hashed with Bcrypt (salt rounds 10) and sensitive secrets isolated per tenant.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Active Sessions List */}
          <Card
            title="Active Login Sessions & Devices"
            subtitle="Manage authorized browser sessions and connected devices"
            action={
              sessions.filter((s) => !s.isCurrent).length > 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRevokeAllOtherSessions}
                  disabled={isRevokingOther}
                  className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isRevokingOther ? 'Revoking...' : 'Revoke All Other Sessions'}</span>
                </Button>
              ) : null
            }
          >
            {isLoadingSessions ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Laptop className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No active session data available
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((session) => {
                  const device = parseDevice(session.userAgent);
                  return (
                    <div
                      key={session._id}
                      className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {device.isMobile ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
                              {device.label}
                            </h5>
                            {session.isCurrent && (
                              <Badge variant="success" size="sm" dot>
                                Current Session
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>IP: {session.ip}</span>
                            <span>•</span>
                            <span>Last Active: {formatDate(session.lastActive || session.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session._id)}
                          className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

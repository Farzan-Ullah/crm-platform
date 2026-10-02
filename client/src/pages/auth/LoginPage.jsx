import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertCircle, Shield, UserCheck, Users, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore.js';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email').trim(),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@crm.io',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    const res = await login(data);
    if (res.success) {
      toast.success('Welcome back! Logged in successfully.');
      navigate(from, { replace: true });
    } else {
      setServerError(res.message);
      toast.error(res.message || 'Login failed');
    }
  };

  const handleQuickFill = (email) => {
    setValue('email', email);
    setValue('password', 'Password123!');
    setServerError('');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter your corporate credentials or choose a pre-seeded test role below.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Email Address <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="email"
              {...register('email')}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 pl-9 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password <span className="text-rose-400">*</span>
            </label>
            <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 pl-9 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 shadow-lg shadow-indigo-600/30"
        >
          Sign In
        </Button>
      </form>

      {/* Quick Role Fill Demonstration Bar */}
      <div className="mt-6 pt-5 border-t border-slate-700/80">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
          1-Click Role Testing Switcher
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@crm.io')}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600/60 text-xs transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('manager@crm.io')}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600/60 text-xs transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Sales Manager</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('rep1@crm.io')}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600/60 text-xs transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Sales Exec (Rep 1)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('support@crm.io')}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600/60 text-xs transition-colors"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Support Agent</span>
          </button>
        </div>
      </div>
    </div>
  );
};

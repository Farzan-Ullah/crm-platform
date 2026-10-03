import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Briefcase,
  UserPlus,
  Clock,
  FileCheck,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  X,
} from 'lucide-react';
import { notificationsApi } from '../../api/notificationsApi.js';
import toast from 'react-hot-toast';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count & notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getNotifications({ limit: 20 });
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  // Poll for notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOpenDropdown = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success('Notification dismissed');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deal':
        return (
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Briefcase className="w-4 h-4" />
          </div>
        );
      case 'lead':
        return (
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'activity':
        return (
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'quote':
        return (
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <FileCheck className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleOpenDropdown}
        aria-label="Notifications"
        className={`relative rounded-lg p-2 transition-colors ${
          isOpen
            ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
        }`}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-2 text-xs font-semibold border-b-2 mr-4 transition-colors ${
                activeTab === 'all'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'unread'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500/80 mb-2" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activeTab === 'unread' ? 'No unread notifications' : "You're all caught up!"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeTab === 'unread'
                    ? 'All your activity and deal alerts have been reviewed.'
                    : 'New lead assignments and updates will appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer group transition-colors relative ${
                    notification.isRead
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                      : 'bg-indigo-50/30 hover:bg-indigo-50/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30'
                  }`}
                >
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="flex items-center gap-1.5">
                      <h4
                        className={`text-xs truncate ${
                          notification.isRead
                            ? 'font-medium text-slate-800 dark:text-slate-200'
                            : 'font-bold text-slate-900 dark:text-white'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span>{timeAgo(notification.createdAt)}</span>
                      {notification.link && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 font-medium">
                            View details
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions (Delete button) */}
                  <div className="absolute top-3.5 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification._id, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard');
                }}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                Go to Dashboard Overview
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

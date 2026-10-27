import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  onNavigate?: (url: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { userType } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data: any = await apiService.getUnreadNotificationCount();
      const count = typeof data === 'number' ? data : (data?.unread_count ?? data?.unreadCount ?? 0);
      setUnreadCount(Number(count) || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 0, append = false) => {
    setLoading(true);
    try {
      const data: any = await apiService.getNotifications({ page, size: 10 } as any);
      const list: Notification[] = Array.isArray(data)
        ? data
        : (data?.content || data?.results || []);

      if (append) {
        setNotifications(prev => [...prev, ...list]);
      } else {
        setNotifications(list);
      }

      const hasNext = data?.totalPages !== undefined
        ? page < data.totalPages - 1
        : Boolean(data?.next);

      setHasMore(hasNext);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling setup (every 30s)
  useEffect(() => {
    fetchUnreadCount();

    pollIntervalRef.current = setInterval(fetchUnreadCount, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(0);
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    const isRead = notification.is_read ?? notification.isRead ?? false;
    const actionUrl = notification.referenceUrl || notification.action_url;

    // Mark as read
    if (!isRead) {
      try {
        await apiService.markNotificationsAsRead([notification.id]);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate if action URL exists
    if (actionUrl) {
      if (onNavigate) {
        onNavigate(actionUrl);
      } else {
        navigate(actionUrl);
      }
      setIsOpen(false);
      return;
    }

    // Fallback navigation by notification type
    const nType = String(notification.type || notification.notification_type || '').toUpperCase();
    let targetUrl = '';

    if (nType.startsWith('TASK')) {
      targetUrl = '/progress/tasks';
    } else if (nType.startsWith('PROPOSAL')) {
      targetUrl = '/thesis/proposals';
    } else if (nType === 'ASSIGNMENT') {
      targetUrl = (userType === 'supervisor') ? '/supervisor/dashboard' : '/student/dashboard';
    } else if (nType === 'DEFENSE') {
      targetUrl = (userType === 'supervisor' || userType === 'committee_member') ? '/admin/defense-schedules' : '/student/dashboard';
    } else if (nType === 'ELIGIBILITY') {
      targetUrl = '/student/dashboard';
    }

    if (targetUrl) {
      if (onNavigate) {
        onNavigate(targetUrl);
      } else {
        navigate(targetUrl);
      }
      setIsOpen(false);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    try {
      await apiService.deleteNotification(notificationId);
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const wasUnread = !(deletedNotification?.is_read ?? deletedNotification?.isRead ?? true);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Load more notifications
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(currentPage + 1, true);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type?: string): string => {
    if (!type) return '🔔';
    const upper = type.toUpperCase();
    if (upper === 'TASK') return '📋';
    if (upper === 'TASK_SUBMISSION') return '📥';
    if (upper === 'TASK_REVIEW') return '📝';
    if (upper === 'PROPOSAL') return '📑';
    if (upper === 'ASSIGNMENT') return '🎯';
    if (upper === 'DEFENSE') return '📅';
    if (upper === 'ELIGIBILITY') return '⚖️';
    if (upper.includes('GROUP')) return '👥';
    if (upper.includes('SUPERVISOR')) return '👨‍🏫';
    if (upper.includes('CHAT')) return '💬';
    if (upper.includes('DOCUMENT')) return '📄';
    return '🔔';
  };

  // Get notification color based on type
  const getNotificationColor = (type?: string): string => {
    if (!type) return '#64748b';
    const upper = type.toUpperCase();
    if (upper === 'TASK') return '#3b82f6';
    if (upper === 'TASK_SUBMISSION') return '#06b6d4';
    if (upper === 'TASK_REVIEW') return '#10b981';
    if (upper === 'PROPOSAL') return '#8b5cf6';
    if (upper === 'ASSIGNMENT') return '#f59e0b';
    if (upper === 'DEFENSE') return '#ec4899';
    if (upper === 'ELIGIBILITY') return '#14b8a6';
    return '#64748b';
  };

  // Format time ago (Vietnamese)
  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Vừa xong';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div ref={dropdownRef} className="notification-container">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-bell-button"
        aria-label="Thông báo"
        title="Thông báo hệ thống"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <h3 className="notification-header-title">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="notification-mark-all-btn">
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="notification-list">
            {notifications.length === 0 && !loading ? (
              <div className="notification-empty-state">
                <span className="notification-empty-icon">🔔</span>
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const isRead = notification.is_read ?? notification.isRead ?? false;
                  const itemType = notification.type || notification.notification_type || 'SYSTEM';
                  const itemContent = notification.content || notification.message || '';
                  const itemTime = notification.createdAt || notification.created_at;
                  const itemUrl = notification.referenceUrl || notification.action_url;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`notification-item ${isRead ? 'notification-item-read' : 'notification-item-unread'} ${itemUrl || itemType ? 'notification-item-clickable' : ''}`}
                    >
                      <span
                        className="notification-icon"
                        style={{
                          backgroundColor: `${getNotificationColor(itemType)}18`,
                          borderRadius: '8px',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}
                      >
                        {getNotificationIcon(itemType)}
                      </span>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{itemContent}</div>
                        <div className="notification-time">
                          {formatTimeAgo(itemTime)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        className="notification-delete-btn"
                        aria-label="Xóa thông báo"
                        title="Xóa thông báo"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="notification-load-more-btn"
                  >
                    {loading ? 'Đang tải...' : 'Xem thêm thông báo'}
                  </button>
                )}
              </>
            )}

            {loading && notifications.length === 0 && (
              <div className="notification-loading-state">Đang tải thông báo...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

import React, { useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { formatCountdown, type TodoItem } from '../utils/homeMetrics';
import type { Notification } from '../../../types';

/* 1. Welcome Banner */
export interface HomeWelcomeBannerProps {
  icon?: string;
  title: string;
  roleBadge: string;
  roundBadge?: string;
  subtitle: React.ReactNode;
  actions?: React.ReactNode;
}

export const HomeWelcomeBanner: React.FC<HomeWelcomeBannerProps> = ({
  icon = '🎓',
  title,
  roleBadge,
  roundBadge,
  subtitle,
  actions,
}) => (
  <div className="utc-home-welcome">
    <div className="utc-home-welcome-main">
      <div className="utc-home-welcome-title-row">
        <span style={{ fontSize: '1.45rem' }}>{icon}</span>
        <h2 className="utc-home-welcome-title">{title}</h2>
        <span className="utc-home-role-pill">{roleBadge}</span>
        {roundBadge && <span className="utc-home-round-pill">{roundBadge}</span>}
      </div>
      <p className="utc-home-welcome-sub">{subtitle}</p>
    </div>
    {actions && <div className="utc-home-welcome-actions">{actions}</div>}
  </div>
);

/* 2. Stat Card */
export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  accentColor?: string;
  active?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accentColor = '#0a3273',
  active = false,
  onClick,
}) => (
  <div
    className={`utc-stat-card ${onClick ? 'clickable' : ''} ${active ? 'active-filter' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <div>
      <div className="utc-stat-label">{label}</div>
      <div className="utc-stat-value" style={{ color: accentColor }}>
        {value}
      </div>
      {subtitle && <div className="utc-stat-sub">{subtitle}</div>}
    </div>
    <div
      className="utc-stat-icon"
      style={{
        backgroundColor: `${accentColor}15`,
        color: accentColor,
      }}
    >
      {icon}
    </div>
  </div>
);

/* 3. Home Section Wrapper */
export interface HomeSectionProps {
  title: string;
  icon?: string;
  badgeCount?: number;
  headerRight?: React.ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  title,
  icon,
  badgeCount,
  headerRight,
  loading,
  error,
  onRetry,
  children,
}) => (
  <section className="utc-home-section">
    <div className="utc-home-section-header">
      <h3 className="utc-home-section-title">
        {icon && <span>{icon}</span>}
        <span>{title}</span>
        {typeof badgeCount === 'number' && (
          <span
            className="utc-tag utc-tag-primary"
            style={{ marginLeft: '4px' }}
          >
            {badgeCount}
          </span>
        )}
      </h3>
      {headerRight && <div>{headerRight}</div>}
    </div>
    <div className="utc-home-section-body">
      {loading ? (
        <div className="utc-home-empty">⏳ Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="utc-home-empty">
          <div style={{ color: '#dc2626', marginBottom: '8px' }}>⚠️ {error}</div>
          {onRetry && (
            <button
              type="button"
              className="utc-home-btn utc-home-btn-secondary"
              onClick={onRetry}
            >
              Thử lại
            </button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  </section>
);

/* 4. SVG Progress Ring */
export interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 86,
  strokeWidth = 8,
  color = '#0a3273',
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1.1,
        }}
      >
        <span style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
          {clamped}%
        </span>
        {label && (
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

/* 5. Todo / Action Queue List */
export interface TodoListProps {
  items: TodoItem[];
  emptyMessage?: string;
  onAction: (route: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  items,
  emptyMessage = '🎉 Tuyệt vời! Hiện không có công việc tồn đọng nào.',
  onAction,
}) => {
  if (!items.length) {
    return <div className="utc-home-empty">{emptyMessage}</div>;
  }

  return (
    <div className="utc-todo-list">
      {items.map((item) => {
        const countdown =
          item.daysLeft !== undefined ? formatCountdown(item.daysLeft) : null;
        return (
          <div key={item.id} className="utc-todo-item">
            <div className="utc-todo-info">
              <div className="utc-todo-title-row">
                <span className={`utc-tag utc-tag-${item.tagColor}`}>
                  {item.tag}
                </span>
                <span className="utc-todo-title">{item.title}</span>
              </div>
              <div className="utc-todo-sub">
                {item.subtitle}
                {countdown && (
                  <span
                    style={{
                      marginLeft: item.subtitle ? '8px' : 0,
                      fontWeight: 600,
                      color:
                        countdown.tone === 'danger'
                          ? '#dc2626'
                          : countdown.tone === 'warning'
                          ? '#d97706'
                          : '#475569',
                    }}
                  >
                    • ⏰ {countdown.text}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="utc-home-btn utc-home-btn-secondary"
              style={{ flexShrink: 0, padding: '7px 12px', fontSize: '0.8rem' }}
              onClick={() => onAction(item.actionRoute)}
            >
              {item.actionLabel} →
            </button>
          </div>
        );
      })}
    </div>
  );
};

/* 6. Quick Actions Grid */
export interface QuickActionItem {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  route?: string;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export const QuickActions: React.FC<{
  actions: QuickActionItem[];
  onNavigate: (route: string) => void;
}> = ({ actions, onNavigate }) => (
  <div className="utc-quick-grid">
    {actions.map((act) => (
      <button
        key={act.id}
        type="button"
        className="utc-quick-card"
        disabled={act.disabled}
        title={act.disabled ? act.disabledReason : act.label}
        onClick={() => {
          if (act.disabled) return;
          if (act.onClick) act.onClick();
          else if (act.route) onNavigate(act.route);
        }}
      >
        <span className="utc-quick-icon">{act.icon}</span>
        <div>
          <div className="utc-quick-label">{act.label}</div>
          {act.subtitle && <div className="utc-quick-sub">{act.subtitle}</div>}
        </div>
      </button>
    ))}
  </div>
);

/* 7. Recent Notifications Widget (light inline action: mark read) */
export const RecentNotificationsWidget: React.FC<{
  onNavigate: (route: string) => void;
}> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiService.getNotifications({ size: 5 });
      const list = Array.isArray(res) ? res : res?.results || [];
      setNotifications(list.slice(0, 5));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiService.markNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <HomeSection
      title="Thông báo mới nhất"
      icon="🔔"
      badgeCount={unreadCount > 0 ? unreadCount : undefined}
      loading={loading}
      headerRight={
        unreadCount > 0 ? (
          <button
            type="button"
            className="utc-home-btn utc-home-btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.76rem' }}
            onClick={handleMarkAllRead}
          >
            ✓ Đánh dấu đã đọc
          </button>
        ) : undefined
      }
    >
      {notifications.length === 0 ? (
        <div className="utc-home-empty">Chưa có thông báo mới trong đợt này.</div>
      ) : (
        <div className="utc-todo-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="utc-todo-item"
              style={{
                backgroundColor: n.is_read ? '#f8fafc' : '#eff6ff',
                borderColor: n.is_read ? '#e2e8f0' : '#bfdbfe',
                cursor: n.action_url ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (n.action_url) onNavigate(n.action_url);
              }}
            >
              <div className="utc-todo-info">
                <div className="utc-todo-title-row">
                  {!n.is_read && (
                    <span className="utc-tag utc-tag-primary">Mới</span>
                  )}
                  <span className="utc-todo-title">{n.title}</span>
                </div>
                <div className="utc-todo-sub">{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </HomeSection>
  );
};

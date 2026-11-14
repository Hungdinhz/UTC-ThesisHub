import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

export interface ModalAlertState {
  title?: string;
  message: string;
  type: ToastType;
  onClose?: () => void;
}

export interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, title?: string) => void;
  success: (message: string, duration?: number, title?: string) => void;
  error: (message: string, duration?: number, title?: string) => void;
  warning: (message: string, duration?: number, title?: string) => void;
  info: (message: string, duration?: number, title?: string) => void;
  modal: (message: string, title?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// ─── GLOBAL SINGLETON LISTENERS ──────────────────────────────────────
type ToastListener = (toast: Toast) => void;
type ModalListener = (modalState: ModalAlertState | null) => void;

let globalToastListener: ToastListener | null = null;
let globalModalListener: ModalListener | null = null;

/**
 * Global toast helper that can be called anywhere (inside or outside React components).
 */
export const toast = {
  show: (message: string, type: ToastType = 'info', duration: number = 4200, title?: string) => {
    if (globalToastListener) {
      globalToastListener({
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        message,
        type,
        duration,
        title,
      });
    } else {
      console.log(`[Toast ${type.toUpperCase()}]:`, message);
    }
  },
  success: (message: string, duration: number = 4200, title?: string) => {
    toast.show(message, 'success', duration, title || 'Thành công');
  },
  error: (message: string, duration: number = 6000, title?: string) => {
    toast.show(message, 'error', duration, title || 'Có lỗi xảy ra');
  },
  warning: (message: string, duration: number = 5000, title?: string) => {
    toast.show(message, 'warning', duration, title || 'Lưu ý học vụ');
  },
  info: (message: string, duration: number = 4200, title?: string) => {
    toast.show(message, 'info', duration, title || 'Thông báo');
  },
  modal: (message: string, title?: string, type: ToastType = 'info') => {
    if (globalModalListener) {
      globalModalListener({
        title: title || 'Thông báo hệ thống UTC',
        message,
        type,
      });
    } else {
      console.log(`[Modal ${type.toUpperCase()}]:`, message);
    }
  },
};

/**
 * Hook to use toast & modal alerts inside React components.
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * Main Toast & Alert Provider. Wraps the app to enable custom notifications and alerts.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalAlert, setModalAlert] = useState<ModalAlertState | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4200, title?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const newToast: Toast = { id, message, type, duration, title };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number, title?: string) => {
      showToast(message, 'success', duration ?? 4200, title || 'Thành công');
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number, title?: string) => {
      showToast(message, 'error', duration ?? 6000, title || 'Có lỗi xảy ra');
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number, title?: string) => {
      showToast(message, 'warning', duration ?? 5000, title || 'Lưu ý học vụ');
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number, title?: string) => {
      showToast(message, 'info', duration ?? 4200, title || 'Thông báo');
    },
    [showToast]
  );

  const modal = useCallback((message: string, title?: string, type: ToastType = 'info') => {
    setModalAlert({
      title: title || 'Thông báo hệ thống UTC',
      message,
      type,
    });
  }, []);

  // Connect global listeners and intercept window.alert
  useEffect(() => {
    globalToastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
    };
    globalModalListener = (modalState) => {
      setModalAlert(modalState);
    };

    // Intercept default browser alert()
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      const str = typeof message === 'object' ? JSON.stringify(message) : String(message ?? '');
      const lower = str.toLowerCase();

      let detectedType: ToastType = 'info';
      let defaultTitle = 'Thông báo';

      if (
        str.includes('🎉') ||
        str.includes('✅') ||
        str.includes('🚀') ||
        lower.includes('thành công') ||
        lower.includes('success')
      ) {
        detectedType = 'success';
        defaultTitle = 'Thành công';
      } else if (
        str.includes('❌') ||
        lower.includes('lỗi') ||
        lower.includes('error') ||
        lower.includes('thất bại') ||
        lower.includes('failed') ||
        lower.includes('không thể')
      ) {
        detectedType = 'error';
        defaultTitle = 'Thông báo lỗi';
      } else if (
        str.includes('⚠️') ||
        lower.includes('cảnh báo') ||
        lower.includes('warning') ||
        lower.includes('vui lòng') ||
        lower.includes('không đủ điều kiện') ||
        lower.includes('chưa') ||
        lower.includes('đã đóng') ||
        lower.includes('không thể thay đổi')
      ) {
        detectedType = 'warning';
        defaultTitle = 'Lưu ý học vụ';
      }

      // If message is multiline or longer than 110 characters, display as modern modal dialog; otherwise, display as toast
      if (str.includes('\n') || str.length > 110) {
        setModalAlert({
          title: defaultTitle,
          message: str,
          type: detectedType,
        });
      } else {
        toast.show(str, detectedType, 4500, defaultTitle);
      }
    };

    return () => {
      globalToastListener = null;
      globalModalListener = null;
      window.alert = originalAlert;
    };
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    success,
    error,
    warning,
    info,
    modal,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {modalAlert && <ModalAlertDialog alert={modalAlert} onClose={() => setModalAlert(null)} />}
    </ToastContext.Provider>
  );
};

// ─── TOAST CONTAINER COMPONENT ───────────────────────────────────────
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};

// ─── INDIVIDUAL TOAST CARD ───────────────────────────────────────────
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast: item, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingTimeRef = useRef<number>(item.duration ?? 4200);
  const startTimeRef = useRef<number>(Date.now());

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(item.id), 280);
  }, [item.id, onRemove]);

  useEffect(() => {
    if (!item.duration || item.duration <= 0) return;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        handleClose();
      }, remainingTimeRef.current);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(300, remainingTimeRef.current - elapsed);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, item.duration, handleClose]);

  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`toast-item toast-${item.type} ${isExiting ? 'toast-exit' : ''}`}
      role="status"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="toast-icon-wrap">{getIcon()}</div>
      <div className="toast-content">
        {item.title && <div className="toast-title">{item.title}</div>}
        <div className="toast-message">{item.message}</div>
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Close notification" title="Đóng thông báo">
        ✕
      </button>
      {item.duration && item.duration > 0 && (
        <div
          className="toast-progress"
          style={{
            animationDuration: `${item.duration}ms`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
      )}
    </div>
  );
};

// ─── MODAL ALERT DIALOG COMPONENT ────────────────────────────────────
interface ModalAlertDialogProps {
  alert: ModalAlertState;
  onClose: () => void;
}

const ModalAlertDialog: React.FC<ModalAlertDialogProps> = ({ alert: modalData, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getIcon = () => {
    switch (modalData.type) {
      case 'success':
        return '🎉';
      case 'error':
        return '⚠️';
      case 'warning':
        return '🔔';
      case 'info':
      default:
        return '🏛️';
    }
  };

  return (
    <div className="utc-modal-alert-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="utc-modal-alert-card" onClick={(e) => e.stopPropagation()}>
        <div className={`utc-modal-alert-stripe stripe-${modalData.type}`} />
        <div className="utc-modal-alert-header">
          <div className={`utc-modal-alert-icon-ring ring-${modalData.type}`}>{getIcon()}</div>
          <h3 className="utc-modal-alert-title">{modalData.title || 'Thông báo hệ thống UTC'}</h3>
        </div>
        <div className="utc-modal-alert-body">{modalData.message}</div>
        <div className="utc-modal-alert-footer">
          <button className="utc-modal-alert-btn" onClick={onClose} autoFocus>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastProvider;

import React from 'react';
import { Modal, Button } from '../../../components/ui';
import type { AuditLogItem } from '../types';
import '../pages/SecurityPages.css';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logItem: AuditLogItem | null;
}

function formatJsonBlock(raw?: string | null): string {
  if (!raw) return '— Không có dữ liệu ghi nhận —';
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  logItem,
}) => {
  if (!logItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết Nhật ký Kiểm toán #${logItem.id}`}
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
          }}
        >
          <div>
            <strong>Thời gian:</strong>{' '}
            {logItem.createdAt ? new Date(logItem.createdAt).toLocaleString('vi-VN') : '—'}
          </div>
          <div>
            <strong>Người thực hiện:</strong>{' '}
            <span style={{ color: '#0a3273', fontWeight: 700 }}>
              {logItem.actorUsername || 'anonymous'}
            </span>
            {logItem.actorFullName ? ` (${logItem.actorFullName})` : ''}
          </div>
          <div>
            <strong>Vai trò:</strong> {logItem.actorRole || '—'}
          </div>
          <div>
            <strong>Phân hệ:</strong> <code>{logItem.moduleName}</code>
          </div>
          <div>
            <strong>Hành động:</strong> <code>{logItem.actionType}</code>
          </div>
          <div>
            <strong>Mức độ / Trạng thái:</strong>{' '}
            <span className={`sec-badge sec-sev-${logItem.severity}`}>{logItem.severity}</span>{' '}
            <span className={`sec-badge sec-status-${logItem.status}`}>{logItem.status}</span>
          </div>
          <div>
            <strong>Địa chỉ IP:</strong> <code>{logItem.ipAddress || '—'}</code>
          </div>
          <div>
            <strong>Endpoint API:</strong>{' '}
            <code>
              {logItem.requestMethod || ''} {logItem.requestUri || '—'}
            </code>
          </div>
          <div>
            <strong>Thời gian xử lý:</strong>{' '}
            {logItem.executionTimeMs != null ? `${logItem.executionTimeMs} ms` : '—'}
          </div>
          <div>
            <strong>Đối tượng:</strong>{' '}
            {logItem.targetEntity ? `${logItem.targetEntity} #${logItem.targetId || ''}` : '—'}
          </div>
        </div>

        <div>
          <strong>Tóm tắt sự kiện:</strong>
          <div
            style={{
              marginTop: '4px',
              padding: '10px 12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              color: '#1e3a8a',
              fontWeight: 600,
            }}
          >
            {logItem.summary}
          </div>
        </div>

        {logItem.errorMessage && (
          <div>
            <strong style={{ color: '#b91c1c' }}>Thông báo lỗi / Chặn:</strong>
            <div
              style={{
                marginTop: '4px',
                padding: '8px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
              }}
            >
              {logItem.errorMessage}
            </div>
          </div>
        )}

        <div>
          <strong>So sánh Thay đổi Dữ liệu (JSON Diff — Trước &amp; Sau):</strong>
          <div className="sec-diff-grid">
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9f1239', marginBottom: '4px' }}>
                ◀ Dữ liệu Trước thay đổi (Old Values)
              </div>
              <pre className="sec-diff-panel sec-diff-old">{formatJsonBlock(logItem.oldValues)}</pre>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                ▶ Dữ liệu Sau thay đổi (New Values)
              </div>
              <pre className="sec-diff-panel sec-diff-new">{formatJsonBlock(logItem.newValues)}</pre>
            </div>
          </div>
        </div>

        {logItem.userAgent && (
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <strong>User-Agent:</strong> {logItem.userAgent}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

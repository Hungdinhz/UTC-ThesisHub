import React, { useState, useEffect } from 'react';
import { Button, Table, StatusBadge } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { ReservationReviewModal } from '../components/ReservationReviewModal';
import { ReservationSubmitModal } from '../components/ReservationSubmitModal';
import { eligibilityService } from '../services/eligibilityService';
import type { ReservationRequestItem } from '../types';
import './EligibilityPages.css';

export const ReservationManagementPage: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedForReview, setSelectedForReview] = useState<ReservationRequestItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadReservations();
  }, [statusFilter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await eligibilityService.getReservations({
        projectRoundId: 10,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setReservations(data);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Không thể tải danh sách đơn bảo lưu' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED', reviewNotes: string, reviewedBy: string) => {
    if (!selectedForReview) return;
    try {
      await eligibilityService.reviewReservation(selectedForReview.id, {
        status,
        reviewNotes,
        reviewedBy,
      });
      setNotification({
        type: 'success',
        message: `Đã ${status === 'APPROVED' ? 'chấp thuận' : 'từ chối'} đơn bảo lưu của sinh viên thành công`,
      });
      await loadReservations();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Thất bại khi xử lý đơn bảo lưu' });
    }
  };

  const handleSubmitNew = async (data: any) => {
    try {
      await eligibilityService.submitReservation(data);
      setNotification({ type: 'success', message: 'Nộp đơn xin bảo lưu thành công' });
      await loadReservations();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Thất bại khi nộp đơn' });
    }
  };

  const columns: Column<ReservationRequestItem>[] = [
    {
      key: 'id',
      title: 'Mã đơn',
      width: '90px',
      render: (val) => <span className="font-semibold">#{val}</span>,
    },
    {
      key: 'studentCode',
      title: 'Mã SV',
      width: '120px',
      render: (val, record) => (
        <div>
          <div className="font-semibold text-primary">{val || `SV${record.studentId}`}</div>
          <div className="text-muted text-sm">{record.studentName || 'Sinh viên'}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      title: 'Lý do xin bảo lưu',
      render: (val, record) => (
        <div>
          <div className="text-reason">{val}</div>
          {record.evidenceFileUrl && (
            <a
              href={record.evidenceFileUrl}
              target="_blank"
              rel="noreferrer"
              className="evidence-attachment-tag"
            >
              📎 Tệp minh chứng
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'submittedAt',
      title: 'Ngày nộp',
      width: '140px',
      render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : '—'),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      width: '140px',
      render: (val) => {
        let label = 'Chờ duyệt';
        if (val === 'APPROVED') label = 'Đã duyệt';
        if (val === 'REJECTED') label = 'Từ chối';
        return <StatusBadge status={val} label={label} />;
      },
    },
    {
      key: 'reviewNotes',
      title: 'Ý kiến phê duyệt',
      render: (val, record) =>
        val ? (
          <div>
            <div className="text-note">{val}</div>
            <div className="text-muted text-sm">Duyệt bởi: {record.reviewedBy}</div>
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'center',
      width: '140px',
      render: (_, record) => (
        <Button
          size="sm"
          variant={record.status === 'PENDING' ? 'primary' : 'outline'}
          onClick={() => setSelectedForReview(record)}
        >
          {record.status === 'PENDING' ? 'Xét duyệt' : 'Xem / Sửa'}
        </Button>
      ),
    },
  ];

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Quản lý và Phê duyệt Đơn bảo lưu</h1>
          <p className="feature-page-subtitle">
            Tiếp nhận, thẩm tra hồ sơ minh chứng và xử lý đơn xin bảo lưu đồ án tốt nghiệp của sinh viên.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="outline" onClick={() => setIsSubmitModalOpen(true)}>
            + Nộp đơn bảo lưu mới
          </Button>
          <Button variant="primary" onClick={loadReservations} loading={loading}>
            Tải lại
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tab-filters-bar">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            className={`tab-filter-btn ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st === 'ALL' && 'Tất cả đơn'}
            {st === 'PENDING' && '⏳ Đang chờ duyệt'}
            {st === 'APPROVED' && '✅ Đã chấp thuận'}
            {st === 'REJECTED' && '❌ Đã từ chối'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="feature-table-wrapper">
        <Table
          columns={columns}
          dataSource={reservations}
          rowKey="id"
          loading={loading}
          emptyText="Không có đơn bảo lưu nào trong danh mục này"
        />
      </div>

      {/* Modals */}
      <ReservationReviewModal
        isOpen={Boolean(selectedForReview)}
        onClose={() => setSelectedForReview(null)}
        reservation={selectedForReview}
        onConfirm={handleReview}
      />

      <ReservationSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitNew}
      />
    </div>
  );
};

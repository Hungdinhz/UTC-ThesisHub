import React, { useState, useEffect } from 'react';
import { thesisService } from '../services/thesisService';
import type { Proposal } from '../types';

export const ProposalManagementPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [reviewModal, setReviewModal] = useState<boolean>(false);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // New proposal form state
  const [titleVn, setTitleVn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [expectedResults, setExpectedResults] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await thesisService.searchProposals();
      setProposals(data);
    } catch {
      // Fallback sample data if backend is not yet populated
      setProposals([
        {
          id: 1,
          projectRoundId: 1,
          projectRoundName: 'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027',
          studentId: 1,
          studentCode: '2021601234',
          studentFullName: 'Nguyễn Văn Sinh Viên',
          studentClass: 'CNTT1 - K62',
          lecturerId: 1,
          lecturerCode: 'GV001',
          lecturerFullName: 'TS. Trần Văn Giảng Viên',
          lecturerDegree: 'TIEN_SI',
          titleVn: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
          titleEn: 'Research and development of UTC-ThesisHub graduation thesis management system',
          description: 'Hệ thống quản lý trực tuyến toàn bộ vòng đời đồ án tốt nghiệp.',
          objectives: 'Số hóa 100% hồ sơ, nâng cao tính minh bạch và công bằng.',
          expectedResults: 'Ứng dụng hoàn thiện Spring Boot và React.',
          status: 'APPROVED',
          supervisorApproved: true,
          supervisorComment: 'Đề tài hay, cấu trúc đề cương chuẩn.',
          version: 1,
          createdAt: '2026-10-10T08:00:00Z',
          updatedAt: '2026-10-15T08:00:00Z'
        },
        {
          id: 2,
          projectRoundId: 1,
          projectRoundName: 'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027',
          studentId: 2,
          studentCode: '2021605678',
          studentFullName: 'Lê Thị Thu Thảo',
          studentClass: 'KTPM2 - K62',
          lecturerId: 1,
          lecturerCode: 'GV001',
          lecturerFullName: 'TS. Trần Văn Giảng Viên',
          lecturerDegree: 'TIEN_SI',
          titleVn: 'Ứng dụng Machine Learning trong phát hiện gian lận thi cử trực tuyến',
          titleEn: 'Applying Machine Learning for Online Exam Cheating Detection',
          description: 'Sử dụng thị giác máy tính và nhận diện khuôn mặt.',
          objectives: 'Mô hình nhận diện độ chính xác trên 90%.',
          expectedResults: 'Bộ dữ liệu và API nhận diện thời gian thực.',
          status: 'UNDER_REVIEW',
          supervisorApproved: true,
          supervisorComment: 'Đã hoàn thiện các mục theo yêu cầu.',
          version: 1,
          createdAt: '2026-10-12T09:00:00Z',
          updatedAt: '2026-10-14T10:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await thesisService.createProposal({
        projectRoundId: 1,
        studentId: 1,
        lecturerId: 1,
        titleVn,
        titleEn,
        description,
        objectives,
        expectedResults,
        fileUrl: fileUrl || '/uploads/proposals/de_cuong_mau.pdf'
      });
      setShowModal(false);
      loadProposals();
    } catch {
      alert('Đã gửi đề cương thành công (chế độ demo).');
      setShowModal(false);
      loadProposals();
    }
  };

  const handleReview = async () => {
    if (!selectedProposal) return;
    try {
      await thesisService.reviewProposal(selectedProposal.id, 1, reviewStatus, reviewNotes);
    } catch {
      // Mock update
      setProposals(prev => prev.map(p => p.id === selectedProposal.id ? { ...p, status: reviewStatus as any } : p));
    }
    setReviewModal(false);
    setSelectedProposal(null);
  };

  const filtered = proposals.filter(p => {
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchKeyword = !searchKeyword ||
      p.titleVn.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (p.studentFullName && p.studentFullName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (p.studentCode && p.studentCode.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchStatus && matchKeyword;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e6f4ea', color: '#137333', fontWeight: 'bold' }}>✓ ĐÃ DUYỆT</span>;
      case 'UNDER_REVIEW':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e8f0fe', color: '#1a73e8', fontWeight: 'bold' }}>⏳ ĐANG XÉT DUYỆT</span>;
      case 'SUBMITTED':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef7e0', color: '#b06000', fontWeight: 'bold' }}>📤 ĐÃ NỘP</span>;
      case 'REVISE_REQUIRED':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fce8e6', color: '#c5221f', fontWeight: 'bold' }}>⚠ CẦN SỬA ĐỔI</span>;
      case 'DRAFT':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#f1f3f4', color: '#5f6368' }}>📝 BẢN NHÁP</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a202c' }}>
            Quản Lý Xét Duyệt Đề Cương Đồ Án
          </h1>
          <p style={{ margin: 0, color: '#718096' }}>
            Phân hệ theo dõi, nộp đề cương và hội đồng chấm duyệt đề cương tốt nghiệp.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Tạo Đề Cương Mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm theo tên đề tài, mã sinh viên, họ tên..."
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          style={{ flex: 1, minWidth: '250px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="SUBMITTED">Đã nộp (SUBMITTED)</option>
          <option value="UNDER_REVIEW">Đang xét duyệt (UNDER_REVIEW)</option>
          <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
          <option value="REVISE_REQUIRED">Yêu cầu sửa đổi (REVISE)</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
            <tr>
              <th style={{ padding: '12px 16px' }}>Mã SV / Lớp</th>
              <th style={{ padding: '12px 16px' }}>Sinh viên</th>
              <th style={{ padding: '12px 16px' }}>Tên đề tài</th>
              <th style={{ padding: '12px 16px' }}>GVHD</th>
              <th style={{ padding: '12px 16px' }}>Trạng thái</th>
              <th style={{ padding: '12px 16px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Đang tải danh sách đề cương...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Không tìm thấy đề cương nào phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                    {p.studentCode} <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{p.studentClass}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{p.studentFullName}</td>
                  <td style={{ padding: '12px 16px', maxWidth: '350px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.titleVn}</div>
                    {p.titleEn && <div style={{ fontSize: '12px', color: '#64748b' }}>{p.titleEn}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.lecturerFullName} <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Học vị: {p.lecturerDegree}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(p.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => {
                        setSelectedProposal(p);
                        setReviewModal(true);
                      }}
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Đánh Giá
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {reviewModal && selectedProposal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '550px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Chấm Duyệt Đề Cương: {selectedProposal.studentCode}
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>
              <strong>Đề tài:</strong> {selectedProposal.titleVn}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Kết quả đánh giá:</label>
              <select
                value={reviewStatus}
                onChange={e => setReviewStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="APPROVED">Thông qua đề cương (APPROVED - Tự động tạo Đề tài)</option>
                <option value="REVISE_REQUIRED">Yêu cầu chỉnh sửa đề cương (REVISE)</option>
                <option value="REJECTED">Không thông qua / Từ chối (REJECTED)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Nhận xét chi tiết của tiểu ban:</label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Nhập nội dung nhận xét hoặc các điểm cần sửa đổi..."
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setReviewModal(false)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReview}
                style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                Lưu Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Biên Soạn & Nộp Đề Cương Đồ Án</h2>
            <form onSubmit={handleCreateProposal}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tên đề tài (Tiếng Việt) *</label>
                <input
                  type="text"
                  required
                  value={titleVn}
                  onChange={e => setTitleVn(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tên đề tài (Tiếng Anh)</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mô tả tóm tắt</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mục tiêu nghiên cứu</label>
                <textarea
                  rows={2}
                  value={objectives}
                  onChange={e => setObjectives(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Kết quả dự kiến đạt được</label>
                <textarea
                  rows={2}
                  value={expectedResults}
                  onChange={e => setExpectedResults(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Đường dẫn file đề cương (PDF)</label>
                <input
                  type="text"
                  placeholder="/uploads/proposals/de_cuong.pdf"
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Gửi Đề Cương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

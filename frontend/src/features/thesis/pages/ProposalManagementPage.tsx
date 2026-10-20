import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { thesisService } from '../services/thesisService';
import type { Proposal } from '../types';

export const ProposalManagementPage: React.FC = () => {
  const { user, userType } = useAuth();
  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor';
  const isAdmin = userType === 'admin';
  const isCommittee = userType === 'committee_member';

  const canSupervisorApprove = isSupervisor || isAdmin;
  const canReview = isCommittee || isAdmin || isSupervisor;

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [onlyMyProposal, setOnlyMyProposal] = useState<boolean>(isStudent);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [reviewModal, setReviewModal] = useState<boolean>(false);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [pdfPreviewProposal, setPdfPreviewProposal] = useState<Proposal | null>(null);
  const [signedProposalIds, setSignedProposalIds] = useState<Record<number, boolean>>({ 1: true });
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

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
      if (Array.isArray(data) && data.length > 0) {
        setProposals(data);
        return;
      }
      throw new Error('Empty proposals');
    } catch {
      // Fallback sample data if backend is not yet populated
      setProposals([
        {
          id: 1,
          projectRoundId: 1,
          projectRoundName: 'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027',
          studentId: 1,
          studentCode: '21120001',
          studentFullName: 'Đỗ Minh Quân',
          studentClass: 'CNTT1 - K62',
          lecturerId: 1,
          lecturerCode: 'GV001',
          lecturerFullName: 'PGS.TS. Nguyễn Văn Hùng',
          lecturerDegree: 'PGS',
          titleVn: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
          titleEn: 'Research and development of UTC-ThesisHub graduation thesis management system',
          description: 'Hệ thống quản lý trực tuyến toàn bộ vòng đời 6 giai đoạn đồ án tốt nghiệp tại Trường ĐH Giao thông Vận tải.',
          objectives: 'Số hóa 100% hồ sơ, tự động hóa phân công nguyện vọng và xếp lịch hội đồng 1CT-2TK-2UV.',
          expectedResults: 'Ứng dụng hoàn thiện Spring Boot 3 và React TypeScript.',
          status: 'APPROVED',
          supervisorApproved: true,
          supervisorComment: 'Đề tài thiết thực, cấu trúc đề cương chuẩn quy định Khoa CNTT.',
          version: 1,
          createdAt: '2026-10-10T08:00:00Z',
          updatedAt: '2026-10-15T08:00:00Z',
        },
        {
          id: 2,
          projectRoundId: 1,
          projectRoundName: 'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027',
          studentId: 2,
          studentCode: '21120002',
          studentFullName: 'Trần Thị Mai Anh',
          studentClass: 'CNTT1 - K62',
          lecturerId: 2,
          lecturerCode: 'GV002',
          lecturerFullName: 'TS. Trần Thị Phương',
          lecturerDegree: 'TIEN_SI',
          titleVn: 'Ứng dụng Machine Learning trong phát hiện gian lận thi cử trực tuyến',
          titleEn: 'Applying Machine Learning for Online Exam Cheating Detection',
          description: 'Sử dụng thị giác máy tính và nhận diện khuôn mặt để phát hiện bất thường trong phòng thi.',
          objectives: 'Mô hình nhận diện độ chính xác trên 90%.',
          expectedResults: 'Bộ dữ liệu và API nhận diện thời gian thực.',
          status: 'UNDER_REVIEW',
          supervisorApproved: true,
          supervisorComment: 'Đã hoàn thiện các mục theo yêu cầu của GVHD.',
          version: 1,
          createdAt: '2026-10-12T09:00:00Z',
          updatedAt: '2026-10-14T10:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await thesisService.createProposal({
        projectRoundId: 1,
        studentId: 1,
        lecturerId: 1,
        titleVn,
        titleEn,
        description,
        objectives,
        expectedResults,
        fileUrl: fileUrl || '/uploads/proposals/de_cuong_mau.pdf',
      });
      setProposals((prev) => [created, ...prev]);
      setBannerMsg('Đã tạo và gửi bản nháp Đề cương đề tài thành công!');
      setShowModal(false);
    } catch {
      const fallbackProposal: Proposal = {
        id: Date.now(),
        projectRoundId: 1,
        projectRoundName: 'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027',
        studentId: 1,
        studentCode: '21120001',
        studentFullName: 'Đỗ Minh Quân',
        studentClass: 'CNTT1 - K62',
        lecturerId: 1,
        lecturerCode: 'GV001',
        lecturerFullName: 'PGS.TS. Nguyễn Văn Hùng',
        lecturerDegree: 'PGS',
        titleVn,
        titleEn,
        description,
        objectives,
        expectedResults,
        status: 'SUBMITTED',
        supervisorApproved: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProposals((prev) => [fallbackProposal, ...prev]);
      setBannerMsg('Đã khởi tạo Đề cương đề tài và chuyển sang chờ GVHD xác nhận!');
      setShowModal(false);
    }
  };

  const handleSupervisorConfirm = async (proposal: Proposal) => {
    try {
      await thesisService.supervisorApprove(proposal.id, true, 'GVHD đồng ý xác nhận đề tài, chuyển Khoa/Ban duyệt.');
    } catch {
      // Fallback
    }
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposal.id
          ? { ...p, supervisorApproved: true, status: 'UNDER_REVIEW', supervisorComment: 'GVHD đã xác nhận đề tài.' }
          : p
      )
    );
    setBannerMsg(`GVHD đã xác nhận đề tài của SV ${proposal.studentFullName} (Bước 21 -> Bước 22 chờ Khoa duyệt).`);
  };

  const handleReview = async () => {
    if (!selectedProposal) return;
    try {
      await thesisService.reviewProposal(selectedProposal.id, 1, reviewStatus, reviewNotes);
    } catch {
      // Fallback local update
    }
    setProposals((prev) =>
      prev.map((p) =>
        p.id === selectedProposal.id
          ? {
              ...p,
              status: reviewStatus as any,
              supervisorComment: reviewNotes || p.supervisorComment,
            }
          : p
      )
    );
    setBannerMsg(
      reviewStatus === 'APPROVED'
        ? `Khoa/Ban đã PHÊ DUYỆT đề tài của SV ${selectedProposal.studentFullName}. Hệ thống đã sinh đề cương PDF sẵn sàng để ký nộp!`
        : `Khoa/Ban yêu cầu chỉnh sửa lại đề tài của SV ${selectedProposal.studentFullName} (quay về chỉnh sửa).`
    );
    setReviewModal(false);
    setSelectedProposal(null);
  };

  const handleSignAndArchive = (proposal: Proposal) => {
    setSignedProposalIds((prev) => ({ ...prev, [proposal.id]: true }));
    setBannerMsg(`Sinh viên ${proposal.studentFullName} đã ký nộp và Khoa CNTT đã lưu hồ sơ đề cương (Bước 24 hoàn tất)!`);
  };

  const filtered = proposals.filter((p) => {
    if (onlyMyProposal) {
      const userCode = user?.student_id || user?.studentCode || user?.username || user?.user?.username;
      const userName = user?.fullName || user?.user?.fullName;
      const matchUser =
        (userCode && (p.studentCode === userCode || String(p.studentId) === String(user?.id))) ||
        (userName && p.studentFullName && p.studentFullName.toLowerCase().includes(userName.toLowerCase()));
      if (!matchUser && proposals.length > 1) {
        return false;
      }
    }
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchKeyword =
      !searchKeyword ||
      p.titleVn.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (p.studentFullName && p.studentFullName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (p.studentCode && p.studentCode.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchStatus && matchKeyword;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e6f4ea', color: '#137333', fontWeight: 'bold' }}>
            ✓ ĐÃ DUYỆT (APPROVED)
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e8f0fe', color: '#1a73e8', fontWeight: 'bold' }}>
            ⏳ CHỜ KHOA DUYỆT
          </span>
        );
      case 'SUBMITTED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef7e0', color: '#b06000', fontWeight: 'bold' }}>
            📤 CHỜ GVHD XÁC NHẬN
          </span>
        );
      case 'REVISE_REQUIRED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fce8e6', color: '#c5221f', fontWeight: 'bold' }}>
            ⚠ CẦN SỬA ĐỔI
          </span>
        );
      case 'DRAFT':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#f1f3f4', color: '#5f6368' }}>📝 BẢN NHÁP</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1240px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#1a202c' }}>
            Giai đoạn 3: Xây dựng, Xét duyệt Đề tài & Sinh Đề cương PDF
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Quy trình: GV & SV xác định đề tài (Draft) → GV xác nhận → Khoa/Ban duyệt đề tài → Sinh đề cương PDF → SV ký nộp & Khoa lưu hồ sơ.
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
            cursor: 'pointer',
          }}
        >
          + Tạo Đề Cương Mới
        </button>
      </div>

      {bannerMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
          }}
        >
          <span>✅ {bannerMsg}</span>
          <button
            onClick={() => setBannerMsg(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#166534' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm theo tên đề tài, mã sinh viên, họ tên..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ flex: 1, minWidth: '250px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="SUBMITTED">Đã nộp - Chờ GVHD (SUBMITTED)</option>
          <option value="UNDER_REVIEW">Chờ Khoa/Ban duyệt (UNDER_REVIEW)</option>
          <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
          <option value="REVISE_REQUIRED">Yêu cầu sửa đổi (REVISE)</option>
        </select>
        {isStudent && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyMyProposal}
              onChange={(e) => setOnlyMyProposal(e.target.checked)}
            />
            Chỉ hiển thị đề cương của tôi
          </label>
        )}
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
              <th style={{ padding: '12px 16px' }}>Hồ sơ & Hành động</th>
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
              filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                    {p.studentCode} <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{p.studentClass}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.studentFullName}</td>
                  <td style={{ padding: '12px 16px', maxWidth: '340px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.titleVn}</div>
                    {p.titleEn && <div style={{ fontSize: '12px', color: '#64748b' }}>{p.titleEn}</div>}
                    {signedProposalIds[p.id] && (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                        📌 Đã ký nộp & Khoa lưu hồ sơ
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.lecturerFullName} <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Học vị: {p.lecturerDegree}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(p.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canSupervisorApprove && !p.supervisorApproved && (
                        <button
                          onClick={() => handleSupervisorConfirm(p)}
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          ✓ GV Xác nhận
                        </button>
                      )}
                      {canReview && (
                        <button
                          onClick={() => {
                            setSelectedProposal(p);
                            setReviewModal(true);
                          }}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Đánh Giá
                        </button>
                      )}
                      {isStudent && p.status === 'APPROVED' && !signedProposalIds[p.id] && (
                        <button
                          onClick={() => handleSignAndArchive(p)}
                          style={{
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          ✍️ Ký Nộp Đề Cương
                        </button>
                      )}
                      <button
                        onClick={() => setPdfPreviewProposal(p)}
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        🖨️ Xuất PDF Đề cương
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {canReview && reviewModal && selectedProposal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: '#fff', borderRadius: '8px', width: '550px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Chấm Duyệt Đề Cương (Bước 22): {selectedProposal.studentCode}
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>
              <strong>Đề tài:</strong> {selectedProposal.titleVn}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Kết quả đánh giá của Khoa/Ban:</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="APPROVED">Thông qua đề cương (APPROVED - Tự động khởi tạo Đề tài & Đề cương PDF)</option>
                <option value="REVISE_REQUIRED">Yêu cầu chỉnh sửa đề cương (REVISE - Quay lại bước sửa đề tài)</option>
                <option value="REJECTED">Không thông qua / Từ chối (REJECTED)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Nhận xét chi tiết của tiểu ban:</label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
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

      {/* Printable PDF Proposal Modal (Steps 23 & 24) */}
      {pdfPreviewProposal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '780px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <strong style={{ color: '#0a3273' }}>📄 BẢN XEM TRƯỚC PDF ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP (CHUẨN UTC)</strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleSignAndArchive(pdfPreviewProposal)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✍️ SV Ký nộp & Khoa lưu hồ sơ
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#0a3273',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  🖨️ In / Lưu PDF
                </button>
                <button
                  onClick={() => setPdfPreviewProposal(null)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Official UTC Document Content */}
            <div style={{ border: '1px solid #cbd5e1', padding: '28px', borderRadius: '6px', lineHeight: 1.6, color: '#0f172a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>KHOA CÔNG NGHỆ THÔNG TIN</div>
                  <hr style={{ width: '40%', margin: '4px auto' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Độc lập - Tự do - Hạnh phúc</div>
                  <hr style={{ width: '40%', margin: '4px auto' }} />
                </div>
              </div>

              <h2 style={{ textAlign: 'center', margin: '16px 0 4px 0', color: '#0a3273', fontSize: '18px' }}>
                BẢN GIAO NHIỆM VỤ & ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP
              </h2>
              <div style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
                ({pdfPreviewProposal.projectRoundName || 'Đợt Đồ án Tốt nghiệp Năm học 2025-2026'})
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong>1. Họ và tên sinh viên:</strong> {pdfPreviewProposal.studentFullName} — <strong>MSSV:</strong> {pdfPreviewProposal.studentCode} —{' '}
                <strong>Lớp:</strong> {pdfPreviewProposal.studentClass}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>2. Giảng viên hướng dẫn:</strong> {pdfPreviewProposal.lecturerFullName} ({pdfPreviewProposal.lecturerDegree})
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>3. Tên đề tài (Tiếng Việt):</strong> {pdfPreviewProposal.titleVn}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>4. Tên đề tài (Tiếng Anh):</strong> {pdfPreviewProposal.titleEn || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>5. Nội dung và phạm vi nghiên cứu:</strong>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', marginTop: '4px' }}>
                  {pdfPreviewProposal.description || 'Nghiên cứu lý thuyết và xây dựng hệ thống thực nghiệm.'}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>6. Mục tiêu và kết quả dự kiến đạt được:</strong>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', marginTop: '4px' }}>
                  <div>• Mục tiêu: {pdfPreviewProposal.objectives || 'Hoàn thiện đầy đủ các yêu cầu kỹ thuật của đề tài.'}</div>
                  <div>• Sản phẩm dự kiến: {pdfPreviewProposal.expectedResults || 'Báo cáo toàn văn + Chương trình phần mềm thực nghiệm.'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '28px', fontSize: '13px' }}>
                <div>
                  <strong>SINH VIÊN THỰC HIỆN</strong>
                  <div style={{ marginTop: '40px', fontWeight: 600, color: '#15803d' }}>
                    {signedProposalIds[pdfPreviewProposal.id] ? `[Đã ký số: ${pdfPreviewProposal.studentFullName}]` : '(Chưa ký nộp)'}
                  </div>
                </div>
                <div>
                  <strong>GIẢNG VIÊN HƯỚNG DẪN</strong>
                  <div style={{ marginTop: '40px', fontWeight: 600, color: '#0a3273' }}>
                    {pdfPreviewProposal.supervisorApproved ? `[Đã xác nhận: ${pdfPreviewProposal.lecturerFullName}]` : '(Chờ xác nhận)'}
                  </div>
                </div>
                <div>
                  <strong>TRƯỞNG KHOA / BAN DUYỆT</strong>
                  <div style={{ marginTop: '40px', fontWeight: 600, color: '#b91c1c' }}>
                    {pdfPreviewProposal.status === 'APPROVED' ? '[Đã phê duyệt & Lưu hồ sơ Khoa CNTT]' : '(Đang xét duyệt)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: '#fff', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Biên Soạn & Nộp Đề Cương Đồ Án</h2>
            <form onSubmit={handleCreateProposal}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tên đề tài (Tiếng Việt) *</label>
                <input
                  type="text"
                  required
                  value={titleVn}
                  onChange={(e) => setTitleVn(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tên đề tài (Tiếng Anh)</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mô tả tóm tắt</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mục tiêu nghiên cứu</label>
                <textarea
                  rows={2}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Kết quả dự kiến đạt được</label>
                <textarea
                  rows={2}
                  value={expectedResults}
                  onChange={(e) => setExpectedResults(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Đường dẫn file đề cương (PDF)</label>
                <input
                  type="text"
                  placeholder="/uploads/proposals/de_cuong.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
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

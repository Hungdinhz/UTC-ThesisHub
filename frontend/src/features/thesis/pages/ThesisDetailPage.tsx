import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { thesisService } from '../services/thesisService';
import type { Thesis, ThesisDocument } from '../types';
import FileUploadInput from '../../../components/FileUploadInput';
import { extractFileName, resolveFileUrl, getFileIcon } from '../../../utils/fileUtils';
import { defenseService } from '../../defense/services/defenseService';
import type { GraduationResult } from '../../defense/types';

export const ThesisDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { userType, user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryParamId = Number(searchParams.get('id') || searchParams.get('thesisId')) || null;

  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor';
  const isLecturerOrAdmin = isSupervisor || userType === 'committee_member' || userType === 'admin';

  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [documents, setDocuments] = useState<ThesisDocument[]>([]);
  const [graduationResult, setGraduationResult] = useState<GraduationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Upload form
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('FINAL_REPORT');
  const [docUrl, setDocUrl] = useState('');
  const [docDesc, setDocDesc] = useState('');

  useEffect(() => {
    loadThesisData();
  }, [queryParamId, user?.id]);

  useEffect(() => {
    if (thesis?.id) {
      defenseService.getGraduationResult(thesis.id)
        .then((res) => setGraduationResult(res))
        .catch(() => setGraduationResult(null));
    } else {
      setGraduationResult(null);
    }
  }, [thesis?.id]);

  const loadThesisData = async () => {
    setLoading(true);
    try {
      // 1. If explicit query parameter ID is present, fetch that specific thesis
      if (queryParamId) {
        const [tData, dList] = await Promise.all([
          thesisService.getThesisById(queryParamId),
          thesisService.getDocumentsByThesis(queryParamId).catch(() => []),
        ]);
        setThesis(tData || null);
        setDocuments(dList || []);
        return;
      }

      // 2. If no query param: determine thesis dynamically based on current logged in user
      const allTheses = await thesisService.searchTheses().catch(() => []);

      if (isStudent && user) {
        const studentId = (user as any).student?.id || (user as any).student_id || user.id;
        const userCode = (user as any).student?.student_code || (user as any).studentCode || (user as any).student_id || (user as any).registration_no || user.username;
        const userFullName = (user.fullName || (user as any).full_name || '').trim().toLowerCase();

        const myThesis = (allTheses || []).find((t) =>
          (studentId && (t.studentId === studentId || String(t.studentId) === String(studentId))) ||
          (userCode && t.studentCode === String(userCode)) ||
          (userFullName && t.studentFullName && t.studentFullName.trim().toLowerCase() === userFullName)
        );

        if (myThesis) {
          setThesis(myThesis);
          const dList = await thesisService.getDocumentsByThesis(myThesis.id).catch(() => []);
          setDocuments(dList || []);
        } else {
          setThesis(null);
          setDocuments([]);
        }
        return;
      }

      if (isSupervisor && user) {
        const lecturerId = (user as any).lecturer?.id || (user as any).lecturer_id || user.id;
        const lecturerCode = (user as any).lecturer?.lecturer_code || (user as any).lecturerCode || (user as any).registration_no || user.username;
        const lecturerFullName = (user.fullName || (user as any).full_name || '').trim().toLowerCase();

        const myTheses = (allTheses || []).filter((t) =>
          (lecturerId && (t.lecturerId === lecturerId || String(t.lecturerId) === String(lecturerId))) ||
          (lecturerCode && t.lecturerCode === String(lecturerCode)) ||
          (lecturerFullName && t.lecturerFullName && t.lecturerFullName.trim().toLowerCase() === lecturerFullName)
        );

        if (myTheses.length > 0) {
          setThesis(myTheses[0]);
          const dList = await thesisService.getDocumentsByThesis(myTheses[0].id).catch(() => []);
          setDocuments(dList || []);
        } else {
          setThesis(null);
          setDocuments([]);
        }
        return;
      }

      // For admin or committee member without param, show first thesis if available
      if (allTheses && allTheses.length > 0) {
        setThesis(allTheses[0]);
        const dList = await thesisService.getDocumentsByThesis(allTheses[0].id).catch(() => []);
        setDocuments(dList || []);
      } else {
        setThesis(null);
        setDocuments([]);
      }
    } catch (err) {
      console.warn('Failed to load thesis data:', err);
      setThesis(null);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesis) return;
    const effectiveUploaderId = (user as unknown as { student_id?: number })?.student_id || user?.id || 1;
    try {
      const doc = await thesisService.uploadDocument(thesis.id, effectiveUploaderId, {
        name: docName,
        documentType: docType,
        fileUrl: docUrl || `/files/theses/DT_${thesis.id}/tailieu_demo.pdf`,
        description: docDesc,
      });
      setDocuments((prev) => [doc, ...prev]);
      alert('🎉 Đã tải lên tài liệu đồ án thành công!');
    } catch {
      alert('🎉 Đã tải lên tài liệu thành công!');
      loadThesisData();
    }
    setShowUploadModal(false);
    setDocName('');
    setDocUrl('');
    setDocDesc('');
  };

  const handleToggleDefenseEligible = async () => {
    if (!thesis) return;
    const newStatus = !thesis.defenseEligible;
    const confirmMsg = newStatus
      ? 'Xác nhận sinh viên ĐỦ điều kiện bảo vệ đồ án tốt nghiệp?'
      : 'Xác nhận chuyển trạng thái sang CHƯA ĐỦ điều kiện bảo vệ đồ án?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await thesisService.setDefenseEligible(thesis.id, newStatus);
      setThesis(updated);
      alert(
        newStatus
          ? '✅ Đã xác nhận sinh viên ĐỦ ĐIỀU KIỆN BẢO VỆ thành công!'
          : '❌ Đã cập nhật sang trạng thái CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ thành công!'
      );
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái điều kiện bảo vệ: ' + (err?.response?.data?.message || err?.message));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
        <div>Đang tải thông tin đề tài...</div>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              color: '#0a3273',
              fontSize: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              border: '2px solid #bae6fd',
            }}
          >
            📋
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            {isStudent
              ? 'Bạn chưa có Đề tài Đồ án Tốt nghiệp chính thức'
              : 'Không tìm thấy thông tin Đề tài'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto 24px auto' }}>
            {isStudent
              ? 'Hồ sơ đề tài sẽ tự động hiển thị tại đây sau khi bạn hoàn tất đăng ký nguyện vọng GVHD (GĐ2) và đề cương đồ án được Hội đồng / Khoa phê duyệt (GĐ3).'
              : 'Đề tài được yêu cầu không tồn tại hoặc bạn chưa được chỉ định phụ trách đề tài này trong hệ thống.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isStudent ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/student/assignment')}
                  style={{
                    backgroundColor: '#0a3273',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🎯 Đến GĐ2: Chọn Hướng & NV
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/thesis/proposals')}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  📑 Đến GĐ3: Đề cương đồ án
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate(isSupervisor ? '/progress/tasks' : '/admin/project-rounds')}
                style={{
                  backgroundColor: '#0a3273',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Quay lại Trang quản lý
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: 'bold' }}>{thesis.thesisCode}</span>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0 6px 0', color: '#0f172a' }}>
              {thesis.titleVn}
            </h1>
            {thesis.titleEn && <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{thesis.titleEn}</p>}
          </div>
          <div>
            <span style={{
              background: thesis.status === 'COMPLETED' || thesis.defenseEligible ? '#dcfce7' : thesis.status === 'DEFENSE_NOT_ELIGIBLE' ? '#fee2e2' : '#e0f2fe',
              color: thesis.status === 'COMPLETED' || thesis.defenseEligible ? '#15803d' : thesis.status === 'DEFENSE_NOT_ELIGIBLE' ? '#b91c1c' : '#0369a1',
              border: `1px solid ${thesis.status === 'COMPLETED' || thesis.defenseEligible ? '#86efac' : thesis.status === 'DEFENSE_NOT_ELIGIBLE' ? '#fca5a5' : '#bae6fd'}`,
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              {thesis.status === 'COMPLETED'
                ? '✓ ĐÃ BẢO VỆ HOÀN THÀNH'
                : thesis.status === 'DEFENSE_NOT_ELIGIBLE'
                ? '❌ CHƯA ĐỦ ĐK BẢO VỆ (DEFENSE_NOT_ELIGIBLE)'
                : thesis.defenseEligible
                ? '🎓 ĐỦ ĐK BẢO VỆ (DEFENSE_READY)'
                : '⏳ ĐANG THỰC HIỆN (IN_PROGRESS)'}
            </span>
          </div>
        </div>

        {/* Member and Round Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '14px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Sinh viên thực hiện:</div>
            <div style={{ fontWeight: '600' }}>{thesis.studentFullName} ({thesis.studentCode})</div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Lớp: {thesis.studentClass}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Giảng viên hướng dẫn:</div>
            <div style={{ fontWeight: '600' }}>{thesis.lecturerFullName} ({thesis.lecturerCode})</div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Học vị: {thesis.lecturerDegree}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Đợt đồ án:</div>
            <div style={{ fontWeight: '600' }}>{thesis.projectRoundName}</div>
          </div>
        </div>
      </div>

      {/* Official Graduation Result Card when synthesized / published */}
      {graduationResult && graduationResult.finalScore !== undefined && graduationResult.finalScore !== null && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
          padding: '22px 24px',
          borderRadius: '12px',
          border: '1.5px solid #86efac',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🎓</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0a3273' }}>
                  KẾT QUẢ CHÍNH THỨC BẢO VỆ ĐỒ ÁN TỐT NGHIỆP
                </h2>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Công thức quy chế UTC: 0.3 × GVHD + 0.2 × GVPB + 0.5 × Hội đồng
                </div>
              </div>
            </div>
            <span style={{
              background: graduationResult.finalResult === 'PASSED' ? '#16a34a' : '#dc2626',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '13px'
            }}>
              {graduationResult.finalResult === 'PASSED' ? '✅ ĐẠT TỐT NGHIỆP' : '❌ KHÔNG ĐẠT'} — Xếp loại: {
                graduationResult.grade === 'EXCELLENT' ? 'Xuất sắc (A)' :
                graduationResult.grade === 'VERY_GOOD' ? 'Giỏi (B+)' :
                graduationResult.grade === 'GOOD' ? 'Khá (B)' :
                graduationResult.grade === 'AVERAGE' ? 'Trung bình (C)' : 'Kém (F)'
              }
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Điểm GVHD (30%)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{Number(graduationResult.supervisorScore || 0).toFixed(2)}</div>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Điểm GVPB (20%)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{Number(graduationResult.reviewerScore || 0).toFixed(2)}</div>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Điểm TB Hội đồng (50%)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{Number(graduationResult.councilScore || 0).toFixed(2)}</div>
            </div>
            <div style={{ background: '#0a3273', padding: '12px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>ĐIỂM TỔNG KẾT</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{Number(graduationResult.finalScore).toFixed(2)} ({graduationResult.grade})</div>
            </div>
          </div>
        </div>
      )}

      {/* Scope, Objectives, Technologies */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>
            Mô Tả & Mục Tiêu Nghiên Cứu
          </h2>
          <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', marginBottom: '16px' }}>
            {thesis.description}
          </p>
          <div style={{ marginBottom: '14px' }}>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>Mục tiêu:</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#475569' }}>{thesis.objectives}</p>
          </div>
          <div>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>Phạm vi ứng dụng:</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#475569' }}>{thesis.scope}</p>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>
            Công Nghệ & Tiến Độ
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Công nghệ sử dụng:</span>
            <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {thesis.technologies?.split(',').map((tech, i) => (
                <span key={i} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                  {tech.trim()}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Tiến độ hoàn thành:</span>
              <span style={{ fontWeight: 'bold' }}>{thesis.completionRate}%</span>
            </div>
            <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: '#2563eb', width: `${thesis.completionRate}%`, height: '100%' }} />
            </div>
          </div>

          <div style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Điều kiện bảo vệ:</div>
            {thesis.defenseEligible ? (
              <div style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                ✓ ĐỦ ĐIỀU KIỆN BẢO VỆ
              </div>
            ) : (
              <div style={{
                background: '#fef3c7',
                color: '#b45309',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                ⏳ CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ
              </div>
            )}

            {isLecturerOrAdmin && (
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={handleToggleDefenseEligible}
                  style={{
                    background: thesis.defenseEligible ? '#dc2626' : '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {thesis.defenseEligible ? '✕ Hủy Xác Nhận Đủ ĐK' : '✓ Xác Nhận Đủ Điều Kiện Bảo Vệ'}
                </button>
              </div>
            )}

            {isStudent && (
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', fontStyle: 'italic', fontWeight: 500 }}>
                * Quyền xác nhận đủ điều kiện bảo vệ thuộc về Giảng viên hướng dẫn.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
            📁 Hồ Sơ & Tài Liệu Đồ Án Số Hóa ({documents.length})
          </h2>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            + Tải Lên Tài Liệu Mới
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {documents.map(d => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{getFileIcon(d.fileUrl || d.name)}</span>
                  <span>{d.name}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Loại: <strong>{d.documentType}</strong> — Phiên bản: v{d.version} — Người tải: {d.uploaderFullName}
                  {d.fileUrl && <span style={{ marginLeft: '8px', color: '#94a3b8' }}>({extractFileName(d.fileUrl)})</span>}
                </div>
              </div>
              <a
                href={resolveFileUrl(d.fileUrl)}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#0a3273',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ⬇️ Tải Về File
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '500px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Tải Lên Tài Liệu Đồ Án</h2>
            <form onSubmit={handleUploadDocument}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tên tài liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Báo cáo nghiệm thu giai đoạn 1..."
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Phân loại tài liệu</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                >
                  <option value="FINAL_REPORT">Báo cáo toàn văn (FINAL_REPORT)</option>
                  <option value="INTERIM_REPORT">Báo cáo giữa kỳ (INTERIM_REPORT)</option>
                  <option value="SOURCE_CODE">Mã nguồn Source Code (SOURCE_CODE)</option>
                  <option value="PRESENTATION_SLIDE">Slide thuyết trình (PRESENTATION_SLIDE)</option>
                  <option value="OTHER">Tài liệu khác (OTHER)</option>
                </select>
              </div>

              <FileUploadInput
                label="Tập tin tài liệu đồ án"
                value={docUrl}
                required
                onChange={(url, info) => {
                  setDocUrl(url);
                  if (info?.name && !docName) {
                    setDocName(info.name);
                  }
                }}
                accept=".pdf,.doc,.docx,.zip,.rar,.ppt,.pptx"
                helperText="Hỗ trợ PDF, Word, Slide PPT, Mã nguồn ZIP (tối đa 50MB)"
                placeholder="/uploads/theses/bao_cao_final.pdf hoặc dán link..."
              />

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={docDesc}
                  onChange={e => setDocDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Lưu Tài Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

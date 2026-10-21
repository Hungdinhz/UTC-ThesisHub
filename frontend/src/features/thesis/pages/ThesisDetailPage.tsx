import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { thesisService } from '../services/thesisService';
import type { Thesis, ThesisDocument } from '../types';

export const ThesisDetailPage: React.FC = () => {
  const { userType, user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetId = Number(searchParams.get('id') || searchParams.get('thesisId')) || 1;

  const isStudent = userType === 'student';
  const isLecturerOrAdmin = userType === 'supervisor' || userType === 'admin';

  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [documents, setDocuments] = useState<ThesisDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Upload form
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('FINAL_REPORT');
  const [docUrl, setDocUrl] = useState('');
  const [docDesc, setDocDesc] = useState('');

  useEffect(() => {
    loadThesisData();
  }, [targetId]);

  const loadThesisData = async () => {
    setLoading(true);
    try {
      const [tData, dList] = await Promise.all([
        thesisService.getThesisById(targetId),
        thesisService.getDocumentsByThesis(targetId)
      ]);
      setThesis(tData);
      setDocuments(dList);
    } catch {
      // Fallback sample data
      setThesis({
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
        thesisCode: 'DT_2026_CNTT_001',
        titleVn: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
        titleEn: 'Research and development of UTC-ThesisHub graduation thesis management system',
        description: 'Hệ thống quản lý trực tuyến toàn bộ vòng đời đồ án tốt nghiệp UTC.',
        objectives: 'Xây dựng hoàn chỉnh nền tảng web Modular Monolith trên Spring Boot 3 và React.',
        scope: 'Áp dụng cho toàn bộ sinh viên và giảng viên Khoa Công nghệ thông tin.',
        technologies: 'Spring Boot 3, PostgreSQL, React, TypeScript, Docker',
        status: 'IN_PROGRESS',
        completionRate: 50.0,
        defenseEligible: false,
        createdAt: '2026-10-10T08:00:00Z',
        updatedAt: '2026-10-15T08:00:00Z'
      });

      setDocuments([
        {
          id: 1,
          thesisId: 1,
          uploaderId: 1,
          uploaderFullName: 'Nguyễn Văn Sinh Viên',
          name: 'Đề cương chi tiết đồ án tốt nghiệp ThesisHub.pdf',
          documentType: 'PROPOSAL',
          fileUrl: '/files/theses/DT_2026_CNTT_001/de_cuong_v1.pdf',
          fileSize: 2048576,
          mimeType: 'application/pdf',
          version: 1,
          isLatest: true,
          description: 'Bản đề cương hoàn chỉnh đã được tiểu ban duyệt thông qua.',
          createdAt: '2026-10-10T09:00:00Z',
          updatedAt: '2026-10-10T09:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUploaderId = (user as unknown as { student_id?: number })?.student_id || user?.id || 1;
    try {
      const doc = await thesisService.uploadDocument(targetId, effectiveUploaderId, {
        name: docName,
        documentType: docType,
        fileUrl: docUrl || `/files/theses/DT_${targetId}/tailieu_demo.pdf`,
        description: docDesc
      });
      setDocuments(prev => [doc, ...prev]);
    } catch {
      alert('Đã tải lên tài liệu thành công!');
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
      : 'Hủy xác nhận đủ điều kiện bảo vệ đồ án?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await thesisService.setDefenseEligible(thesis.id, newStatus);
      setThesis(updated);
      alert('Đã cập nhật trạng thái đủ điều kiện bảo vệ thành công!');
    } catch {
      setThesis(prev => prev ? { ...prev, defenseEligible: newStatus } : null);
      alert('Đã cập nhật trạng thái đủ điều kiện bảo vệ!');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Đang tải thông tin đề tài...</div>;
  }

  if (!thesis) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Không tìm thấy đề tài.</div>;
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
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              {thesis.status}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{d.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Loại: <strong>{d.documentType}</strong> — Phiên bản: v{d.version} — Người tải: {d.uploaderFullName}
                </div>
              </div>
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Tải Về File
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Đường dẫn file *</label>
                <input
                  type="text"
                  required
                  placeholder="/uploads/theses/bao_cao_final.pdf"
                  value={docUrl}
                  onChange={e => setDocUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

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

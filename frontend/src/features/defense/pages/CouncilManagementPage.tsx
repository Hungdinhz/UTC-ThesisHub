import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui';
import { CouncilMemberCard } from '../components/CouncilMemberCard';
import { CouncilGenerateModal } from '../components/CouncilGenerateModal';
import { defenseService } from '../services/defenseService';
import { apiService } from '../../../services/api';
import type { DefenseCouncil, LecturerOption, CouncilGenerationRequest } from '../types';
import './DefensePages.css';

export const CouncilManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number>(16);

  const [councils, setCouncils] = useState<DefenseCouncil[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalizingLoading, setFinalizingLoading] = useState(false);
  const [savingMembers, setSavingMembers] = useState(false);
  const mutationInFlight = useRef(false);
  const busy = loading || finalizingLoading || savingMembers;
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);


  useEffect(() => {
    initRoundsAndData();
  }, []);

  const initRoundsAndData = async () => {
    try {
      setLoading(true);
      const rList = await apiService.getProjectRounds();
      setRounds(rList || []);

      const queryRoundId = searchParams.get('roundId');
      let targetRoundId = 16;
      if (queryRoundId && !isNaN(Number(queryRoundId))) {
        targetRoundId = Number(queryRoundId);
      } else if (rList && rList.length > 0) {
        // Pick IN_PROGRESS round or latest
        const active: any = rList.find((r: any) => r.status === 'IN_PROGRESS');
        const last: any = rList[rList.length - 1];
        targetRoundId = active ? (active.roundId || active.id) : (last?.roundId || last?.id);
      }
      setSelectedRoundId(targetRoundId);
      await loadDataForRound(targetRoundId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi khởi tạo danh sách đợt đồ án' });
    } finally {
      setLoading(false);
    }
  };

  const loadDataForRound = async (roundId: number) => {
    if (mutationInFlight.current) return;
    try {
      setLoading(true);
      const [cList, lList] = await Promise.all([
        defenseService.getCouncils(roundId),
        defenseService.getLecturers().catch((err: any) => {
          setNotification({ type: 'error', message: err?.message || 'Không thể tải danh sách giảng viên' });
          return [];
        }),
      ]);
      setCouncils(cList);
      setLecturers(lList);
      if (cList.length > 0) {
        setSelectedCouncilId(cList[0].id);
      } else {
        setSelectedCouncilId(null);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải danh sách Hội đồng' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoundChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (busy || mutationInFlight.current) return;
    const newRoundId = Number(e.target.value);
    setSelectedRoundId(newRoundId);
    await loadDataForRound(newRoundId);
  };

  const handleGenerate = async (req: CouncilGenerationRequest) => {
    if (busy || mutationInFlight.current) return;
    mutationInFlight.current = true;
    try {
      setLoading(true);
      const payload: CouncilGenerationRequest = {
        ...req,
        projectRoundId: selectedRoundId,
        maxStudentsPerCouncil: req.maxStudentsPerCouncil || 50,
      };
      const result = await defenseService.generateCouncils(payload);
      setCouncils(result);
      setNotification({
        type: 'success',
        message: 'Đã sinh Hội đồng tự động (1CT - 1TK - 1PB1 - 1PB2 - 1UV). Hội đồng ACTIVE có thể đổi giảng viên thủ công trước khi chốt; FINALIZED sẽ khóa thành viên.',
      });
      setSelectedCouncilId(result[0]?.id ?? null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi sinh Hội đồng' });
    } finally {
      mutationInFlight.current = false;
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedCouncil || selectedCouncil.status === 'FINALIZED' || busy || mutationInFlight.current) return;
    mutationInFlight.current = true;
    try {
      setFinalizingLoading(true);
      const updated = await defenseService.finalizeCouncil(selectedCouncil.id);
      setCouncils((current) => current.map((c) => (c.id === updated.id ? updated : c)));
      setNotification({
        type: 'success',
        message: '🔒 ĐÃ CHỐT HỘI ĐỒNG THÀNH CÔNG! Danh sách 5 thành viên đã được khóa an toàn. Bạn hãy chuyển sang bước Xếp lịch bảo vệ.',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi chốt hội đồng' });
    } finally {
      mutationInFlight.current = false;
      setFinalizingLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!selectedCouncil || selectedCouncil.status !== 'FINALIZED' || busy || mutationInFlight.current) return;
    mutationInFlight.current = true;
    try {
      setLoading(true);
      const updated = await defenseService.reopenCouncil(selectedCouncil.id);
      setCouncils((current) => current.map((c) => (c.id === updated.id ? updated : c)));
      setNotification({
        type: 'success',
        message: '🔓 ĐÃ MỞ KHÓA HỘI ĐỒNG! Bây giờ bạn có thể chỉnh sửa thủ công danh sách thành viên trước khi chốt lại.',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi khi mở khóa hội đồng' });
    } finally {
      mutationInFlight.current = false;
      setLoading(false);
    }
  };

  const handleMemberChange = async (memberId: number, newLecturerId: number) => {
    if (!selectedCouncil || busy || mutationInFlight.current) return;

    if (selectedCouncil.status === 'FINALIZED') {
      setNotification({
        type: 'error',
        message: 'Hội đồng này đã được CHỐT (FINALIZED) và khóa thành viên! Không thể chỉnh sửa thêm.',
      });
      return;
    }

    const member = selectedCouncil.members.find((m) => m.id === memberId);
    const newLecturer = lecturers.find((l) => l.lecturerId === newLecturerId);
    if (!member || !newLecturer || member.lecturerId === newLecturerId) return;
    const eligible = member.role === 'PRESIDENT' ? newLecturer.canBePresident
      : member.role === 'SECRETARY' ? newLecturer.canBeSecretary : newLecturer.canBeMember;
    if (!eligible) {
      setNotification({ type: 'error', message: 'Giảng viên không đủ điều kiện đảm nhiệm vai trò này.' });
      return;
    }

    // Check if new lecturer is GVHD of any student in this council (Hard constraint)
    const assigned = selectedCouncil.assignedStudents || [];
    const conflictStudent = assigned.find((s) => Number(s.advisorId) === Number(newLecturerId));

    if (conflictStudent) {
      setNotification({
        type: 'error',
        message: `Ràng buộc cứng vi phạm: ${newLecturer.fullName} là GVHD của sinh viên ${conflictStudent.studentName} (${conflictStudent.studentCode})! Tuyệt đối không được ngồi trong Hội đồng này.`,
      });
      return;
    }

    // Check if already in this council
    const alreadyInCouncil = selectedCouncil.members.some(
      (m) => m.id !== memberId && Number(m.lecturerId) === Number(newLecturerId)
    );
    if (alreadyInCouncil) {
      setNotification({
        type: 'error',
        message: `Giảng viên ${newLecturer.fullName} đã có trong Hội đồng này rồi!`,
      });
      return;
    }

    const updatedMembers = selectedCouncil.members.map((m) =>
      m.id === memberId
        ? { ...m, lecturerId: newLecturerId, lecturerName: newLecturer.fullName }
        : m
    );

    mutationInFlight.current = true;
    setSavingMembers(true);
    try {
      const updatedCouncil = await defenseService.updateCouncilMembers(selectedCouncil.id, updatedMembers);
      setCouncils((current) => current.map((c) => (c.id === updatedCouncil.id ? updatedCouncil : c)));
      setNotification({
        type: 'success',
        message: `Đã thay đổi thành viên Hội đồng thành công sang: ${newLecturer.fullName}`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Lỗi cập nhật thành viên' });
    } finally {
      mutationInFlight.current = false;
      setSavingMembers(false);
    }
  };

  const selectedCouncil = councils.find((c) => c.id === selectedCouncilId);

  const excludedAdvisorIds = Array.from(new Set(
    (selectedCouncil?.assignedStudents || []).map((s) => Number(s.advisorId)).filter(Boolean)
  ));

  const isFinalized = selectedCouncil?.status === 'FINALIZED';

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">GĐ5: Thành Lập Hội Đồng Bảo Vệ Đồ Án</h1>
          <p className="feature-page-subtitle">
            Cơ cấu: 1 Chủ tịch, 1 Thư ký, 2 Phản biện, 1 Ủy viên.
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Round Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
            <label htmlFor="roundSelectTop" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              📁 Đợt đồ án:
            </label>
            <select
              id="roundSelectTop"
              value={selectedRoundId}
              onChange={handleRoundChange}
              disabled={busy}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0a3273',
                background: '#fff',
              }}
            >
              {rounds.map((r: any) => {
                const rid = r.roundId || r.id;
                return (
                  <option key={rid} value={rid}>
                    {r.name} ({r.roundCode || `ID: ${rid}`}) — [{r.status}]
                  </option>
                );
              })}
            </select>
          </div>

          <Button variant="primary" onClick={() => setIsGenerateModalOpen(true)} disabled={busy || isFinalized}>
            ⚡ Phân công 1 Hội đồng (CSP)
          </Button>

          {selectedCouncil && !isFinalized && (
            <Button
              variant="success"
              onClick={handleFinalize}
              loading={finalizingLoading}
              disabled={busy}
              style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
            >
              🔒 Chốt Hội Đồng
            </Button>
          )}

          {isFinalized && (
            <>
              <Button
                variant="outline"
                onClick={handleReopen}
                disabled={busy}
                style={{ borderColor: '#d97706', color: '#d97706', fontWeight: 600 }}
              >
                🔓 Mở Khóa Chỉnh Sửa
              </Button>
              <Button
                variant="success"
                onClick={() => navigate(`/admin/defense-schedules?roundId=${selectedRoundId}`)}
                style={{ background: '#0284c7', borderColor: '#0284c7', color: '#fff', fontWeight: 700 }}
              >
                📅 Chuyển sang Xếp Lịch Bảo Vệ &gt;&gt;
              </Button>
            </>
          )}

          <Button variant="outline" onClick={() => loadDataForRound(selectedRoundId)} loading={loading} disabled={busy}>
            Làm mới
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* Requirement Banner */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
              Quy chế GĐ5: 1 Hội đồng (1CT - 1TK - 1PB1 - 1PB2 - 1UV)
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
              Hội đồng sinh tự động ở trạng thái ACTIVE có thể đổi giảng viên thủ công bằng các ô chọn bên dưới trước khi chốt. Sau khi chốt (FINALIZED), thành viên bị khóa và có thể chuyển sang Xếp lịch bảo vệ.
            </div>
          </div>
        </div>
        {selectedCouncil && (
          <div>
            {isFinalized ? (
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                border: '1px solid #86efac',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🔒 ĐÃ CHỐT HỘI ĐỒNG (KHÓA THÀNH VIÊN)
              </span>
            ) : (
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⏳ CHƯA CHỐT HỘI ĐỒNG
              </span>
            )}
          </div>
        )}
      </div>

      {/* Councils Grid / Tabs */}
      <div className="councils-layout-grid">
        {/* Left Side: Councils List */}
        <div className="councils-sidebar">
          <h3>Hội đồng đợt này ({councils.length})</h3>
          <div className="council-nav-list">
            {councils.map((c) => {
              const isSelected = c.id === selectedCouncilId;
              const isCouncilFinalized = c.status === 'FINALIZED';
              return (
                <div
                  key={c.id}
                  className={`council-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => { if (!busy) setSelectedCouncilId(c.id); }}
                >
                  <div className="council-item-header">
                    <span className="code-badge">{c.code}</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: isCouncilFinalized ? '#dcfce7' : '#e0f2fe',
                      color: isCouncilFinalized ? '#15803d' : '#0369a1',
                      border: `1px solid ${isCouncilFinalized ? '#86efac' : '#bae6fd'}`
                    }}>
                      {isCouncilFinalized ? '🔒 ĐÃ CHỐT' : 'ĐANG THIẾT LẬP'}
                    </span>
                  </div>
                  <div className="council-item-name">{c.name}</div>
                  <div className="council-item-meta">
                    👥 5 Thành viên | 🎓 {c.assignedStudents?.length || c.studentIds?.length || 0} Sinh viên
                  </div>
                </div>
              );
            })}
            {councils.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Đợt này chưa có Hội đồng chấm thi.</p>
                <Button variant="primary" size="sm" onClick={() => setIsGenerateModalOpen(true)} disabled={busy}>
                  + Phân công 1 Hội đồng
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail & 5 Members (1CT - 1TK - 1PB1 - 1PB2 - 1UV) */}
        <div className="council-detail-panel">
          {selectedCouncil ? (
            <>
              <div className="council-detail-header">
                <div>
                  <h2>{selectedCouncil.name} ({selectedCouncil.code})</h2>
                  <p className="council-desc">{selectedCouncil.description}</p>
                </div>
                <div className="council-header-badge" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="structure-pill">Cơ cấu chuẩn: 1CT - 1TK - 1PB1 - 1PB2 - 1UV</span>
                  {isFinalized ? (
                    <>
                      <button
                        onClick={handleReopen}
                        disabled={busy}
                        style={{
                          background: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        🔓 Mở Khóa
                      </button>
                      <button
                        onClick={() => navigate(`/admin/defense-schedules?roundId=${selectedRoundId}`)}
                        style={{
                          background: '#0a3273',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        📅 Sang Xếp lịch &gt;&gt;
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleFinalize}
                      disabled={busy}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      🔒 Chốt Hội Đồng Này
                    </button>
                  )}
                </div>
              </div>

              {/* Hard Constraint Alert */}
              <div className="hard-constraint-banner">
                <span className="constraint-icon">🛡️</span>
                <div className="constraint-text">
                  <strong>Ràng buộc cứng bắt buộc:</strong> Giảng viên hướng dẫn (GVHD) tuyệt đối không ngồi trong Hội đồng chấm chính sinh viên của mình.
                  {excludedAdvisorIds.length > 0 && (
                    <span className="excluded-list">
                      (Đã khóa GVHD: {excludedAdvisorIds.map((id) => lecturers.find((l) => l.lecturerId === id)?.fullName || `GV #${id}`).join(', ')})
                    </span>
                  )}
                </div>
              </div>

              {/* 5 Members Grid */}
              <h3 className="section-title">
                Thành viên Hội đồng (Đúng 5 Giảng viên: 1CT - 1TK - 1PB1 - 1PB2 - 1UV):
                {isFinalized && <span style={{ color: '#16a34a', fontSize: '13px', marginLeft: '10px' }}>(Đã khóa)</span>}
              </h3>
              {savingMembers && <p role="status">Đang lưu thay đổi thành viên…</p>}
              {!loading && lecturers.length === 0 && !isFinalized && (
                <p role="alert">Chưa có danh sách giảng viên để đổi thành viên. Vui lòng bấm Làm mới để tải lại.</p>
              )}
              <div className="members-grid-5" aria-busy={savingMembers}>
                {selectedCouncil.members.map((member) => (
                  <CouncilMemberCard
                    key={member.id}
                    member={member}
                    allLecturers={lecturers}
                    onLecturerChange={handleMemberChange}
                    excludedAdvisorIds={excludedAdvisorIds}
                    otherMemberLecturerIds={selectedCouncil.members.filter((m) => m.id !== member.id).map((m) => m.lecturerId)}
                    disabled={isFinalized || busy || lecturers.length === 0}
                  />
                ))}
              </div>

              {/* Assigned Students */}
              <div className="assigned-students-box" style={{ marginTop: '24px' }}>
                <h3 className="section-title">Danh sách sinh viên bảo vệ trong Hội đồng này:</h3>
                <div className="students-chips-list">
                  {selectedCouncil.assignedStudents && selectedCouncil.assignedStudents.length > 0 ? (
                    selectedCouncil.assignedStudents.map((s) => (
                      <div key={s.studentId} className="student-chip" style={{ minWidth: '320px', padding: '10px 14px' }}>
                        <span className="student-icon">🎓</span>
                        <div className="student-chip-info">
                          <strong>{s.studentName}</strong> ({s.studentCode})
                          <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>
                            Đề tài: {s.thesisTitle}
                          </div>
                          <span className="advisor-name" style={{ color: '#dc2626', fontWeight: 600 }}>
                            GVHD: {s.advisorName || `GV #${s.advisorId}`} (Không ngồi trong HĐ)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : selectedCouncil.studentIds && selectedCouncil.studentIds.length > 0 ? (
                    selectedCouncil.studentIds.map((sId) => (
                      <div key={sId} className="student-chip">
                        <span className="student-icon">🎓</span>
                        <div className="student-chip-info">
                          <strong>Sinh viên #{sId}</strong>
                          <span className="advisor-name">
                            GVHD: Chưa có dữ liệu
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted">Chưa có sinh viên nào được gán vào hội đồng này.</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-council-selected">Vui lòng chọn hoặc chạy phân công Hội đồng từ nút ở trên</div>
          )}
        </div>
      </div>

      {/* Auto-generate Modal */}
      <CouncilGenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerate}
        rounds={rounds}
        currentRoundId={selectedRoundId}
      />
    </div>
  );
};

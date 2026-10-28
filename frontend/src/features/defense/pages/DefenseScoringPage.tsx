import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, Table, StatusBadge } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { ScoreEntryForm } from '../components/ScoreEntryForm';
import { ResultSynthesisModal } from '../components/ResultSynthesisModal';
import { defenseService } from '../services/defenseService';
import { apiService } from '../../../services/api';
import type {
  ScoreItem,
  ScoreType,
  MyScoringThesis,
  MinutesSignatureItem,
  GraduationResult,
  SynthesizeResultRequest,
} from '../types';
import './DefensePages.css';

export const DefenseScoringPage: React.FC = () => {
  const { user, userType } = useAuth();
  const isAdmin = userType === 'admin';

  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | undefined>(undefined);

  const [scoringTheses, setScoringTheses] = useState<MyScoringThesis[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<number>(0);

  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [graduationResult, setGraduationResult] = useState<GraduationResult | null>(null);
  const [minutesSignatures, setMinutesSignatures] = useState<MinutesSignatureItem[]>([]);
  const [signingMinutes, setSigningMinutes] = useState(false);

  const [roundExportResults, setRoundExportResults] = useState<Array<{ thesis: MyScoringThesis; result: GraduationResult | null }>>([]);
  const [publishingRound, setPublishingRound] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSynthModalOpen, setIsSynthModalOpen] = useState(false);
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [showFinalExportModal, setShowFinalExportModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5500);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      setLoading(true);
      const rList = await apiService.getProjectRounds().catch(() => []);
      setRounds(rList || []);

      let initialRoundId: number | undefined = undefined;
      if (rList && rList.length > 0) {
        const active: any = rList.find((r: any) => r.status === 'IN_PROGRESS' || r.status === 'OPEN');
        const last: any = rList[rList.length - 1];
        initialRoundId = active ? (active.roundId || active.id) : (last?.roundId || last?.id);
      }
      setSelectedRoundId(initialRoundId);
      await loadScoringTheses(initialRoundId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể khởi tạo trang chấm điểm' });
    } finally {
      setLoading(false);
    }
  };

  const loadScoringTheses = async (roundId?: number) => {
    try {
      setLoading(true);
      const list = await defenseService.getMyScoringTheses(roundId);
      setScoringTheses(list);
      if (list.length > 0) {
        const keepCurrent = list.some((t) => t.thesisId === selectedThesisId);
        const nextThesisId = keepCurrent ? selectedThesisId : list[0].thesisId;
        setSelectedThesisId(nextThesisId);
        await loadThesisScoringDetails(nextThesisId);
      } else {
        setSelectedThesisId(0);
        setScores([]);
        setGraduationResult(null);
        setMinutesSignatures([]);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải danh sách đề tài chấm điểm' });
    } finally {
      setLoading(false);
    }
  };

  const loadThesisScoringDetails = async (thesisId: number) => {
    if (!thesisId) return;
    try {
      setLoading(true);
      const [sList, rData, sigList] = await Promise.all([
        defenseService.getScores(thesisId),
        defenseService.getGraduationResult(thesisId),
        defenseService.getMinutesSignatures(thesisId),
      ]);
      setScores(sList);
      setGraduationResult(rData);
      setMinutesSignatures(sigList);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tải dữ liệu điểm của đề tài' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoundChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setSelectedRoundId(val);
    await loadScoringTheses(val);
  };

  const handleThesisChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tid = Number(e.target.value);
    setSelectedThesisId(tid);
    await loadThesisScoringDetails(tid);
  };

  const handleScoreSubmit = async (data: any) => {
    await defenseService.submitScore(data);
    setNotification({ type: 'success', message: 'Đã lưu phiếu chấm điểm và nhận xét thành công!' });
    await loadThesisScoringDetails(selectedThesisId);
  };

  const handleSynthesize = async (data: SynthesizeResultRequest) => {
    try {
      const res = await defenseService.synthesizeResult(data);
      setGraduationResult(res);
      setNotification({
        type: 'success',
        message: `Tổng hợp điểm thành công! Điểm tổng kết: ${res.finalScore.toFixed(2)} — Xếp loại: ${res.grade}`,
      });
      await loadThesisScoringDetails(selectedThesisId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Thất bại khi tổng hợp điểm' });
      throw err;
    }
  };

  const handleSignMinutes = async () => {
    if (!selectedThesisId) return;
    try {
      setSigningMinutes(true);
      const updatedSigs = await defenseService.signDefenseMinutes(selectedThesisId);
      setMinutesSignatures(updatedSigs);
      setNotification({
        type: 'success',
        message: '✍️ Bạn đã ký số xác nhận Biên bản bảo vệ Đồ án Tốt nghiệp thành công!',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể ký xác nhận biên bản' });
    } finally {
      setSigningMinutes(false);
    }
  };

  const handleOpenFinalExportModal = async () => {
    setShowFinalExportModal(true);
    const items = await Promise.all(
      scoringTheses.map(async (t) => {
        const res = await defenseService.getGraduationResult(t.thesisId).catch(() => null);
        return { thesis: t, result: res };
      })
    );
    setRoundExportResults(items);
  };

  const handleFinalizeAndPublishRound = async () => {
    if (!selectedRoundId) {
      setNotification({ type: 'error', message: 'Vui lòng chọn Đợt đồ án cần công bố kết quả và hoàn tất!' });
      return;
    }
    if (!window.confirm('Xác nhận Ký xuất Dữ liệu cuối kỳ, công bố kết quả chính thức về tài khoản của tất cả Sinh viên và Đóng hoàn tất Đợt đồ án này?')) {
      return;
    }
    try {
      setPublishingRound(true);
      await defenseService.finalizeAndPublishRound(selectedRoundId);
      setShowFinalExportModal(false);
      setNotification({
        type: 'success',
        message: '🎓 Đã công bố kết quả bảo vệ chính thức tới toàn bộ Sinh viên và hoàn tất đóng Đợt đồ án!',
      });
      await initPage();
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể hoàn tất và công bố kết quả đợt đồ án' });
    } finally {
      setPublishingRound(false);
    }
  };

  const selectedThesis = useMemo(
    () => scoringTheses.find((t) => t.thesisId === selectedThesisId) || null,
    [scoringTheses, selectedThesisId]
  );

  const allowedScoreTypes = useMemo<ScoreType[]>(() => {
    if (!selectedThesis || isAdmin) return [];
    const list: ScoreType[] = [];
    if (selectedThesis.canScoreCouncil) list.push('COUNCIL');
    if (selectedThesis.canScoreReviewer) list.push('REVIEWER');
    if (selectedThesis.canScoreSupervisor) list.push('SUPERVISOR');
    return list;
  }, [selectedThesis, isAdmin]);

  const supervisorScoreItem = scores.find((s) => s.scoreType === 'SUPERVISOR');
  const reviewerScoreItem = scores.find((s) => s.scoreType === 'REVIEWER');
  const councilScoreItems = scores.filter((s) => s.scoreType === 'COUNCIL');
  const liveCouncilAvg =
    councilScoreItems.length > 0
      ? councilScoreItems.reduce((sum, s) => sum + Number(s.score || 0), 0) / councilScoreItems.length
      : null;

  const signedCount = minutesSignatures.filter((s) => s.signed).length;
  const mySignatureItem = selectedThesis?.myLecturerId
    ? minutesSignatures.find((s) => s.lecturerId === selectedThesis.myLecturerId)
    : undefined;

  const scoreColumns: Column<ScoreItem>[] = [
    {
      key: 'scoreType',
      title: 'Tư cách chấm',
      width: '150px',
      render: (val: string) => {
        let label = 'Hội đồng';
        let variant: any = 'info';
        if (val === 'SUPERVISOR') {
          label = 'GV Hướng dẫn';
          variant = 'warning';
        } else if (val === 'REVIEWER') {
          label = 'GV Phản biện';
          variant = 'neutral';
        }
        return <StatusBadge status={val} label={label} variant={variant} />;
      },
    },
    {
      key: 'graderName',
      title: 'Người chấm',
      width: '220px',
      render: (val, record) => val || `Giảng viên #${record.graderId}`,
    },
    {
      key: 'score',
      title: 'Điểm số',
      align: 'center',
      width: '100px',
      render: (val: number) => (
        <span className="font-semibold text-primary" style={{ fontSize: '1.05rem' }}>
          {Number(val).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'feedback',
      title: 'Nhận xét & Đánh giá',
      render: (val: string) => <span className="text-feedback">{val}</span>,
    },
    {
      key: 'gradedAt',
      title: 'Thời gian chấm',
      width: '140px',
      render: (val: string) => (val ? new Date(val).toLocaleDateString('vi-VN') : '—'),
    },
  ];

  const displayStudentName = graduationResult?.studentName || selectedThesis?.studentName || '—';
  const displayStudentCode = graduationResult?.studentCode || selectedThesis?.studentCode || '—';
  const displayThesisTitle = graduationResult?.thesisTitle || selectedThesis?.titleVn || '—';

  return (
    <div className="feature-page-container">
      <div className="feature-page-header">
        <div>
          <h1 className="feature-page-title">Chấm điểm và Tổng hợp Kết quả Tốt nghiệp</h1>
          <p className="feature-page-subtitle">
            Cơ cấu điểm chuẩn UTC: GVHD (30%), GVPB (20%), Hội đồng 5 thành viên (50% - 1CT-2TK-2UV). Phân quyền nghiêm ngặt theo vai trò được giao.
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {rounds.length > 0 && (
            <select
              value={selectedRoundId || ''}
              onChange={handleRoundChange}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontWeight: 600,
                fontSize: '13px',
                color: '#0a3273',
                background: '#fff',
              }}
            >
              {rounds.map((r: any) => {
                const rid = r.roundId || r.id;
                return (
                  <option key={rid} value={rid}>
                    📁 {r.name} ({r.roundCode || rid})
                  </option>
                );
              })}
            </select>
          )}

          {isAdmin && selectedThesis && (
            <Button variant="success" onClick={() => setIsSynthModalOpen(true)}>
              🎯 Tổng hợp kết quả tốt nghiệp
            </Button>
          )}

          {/* ONLY the 5 Council Members of this thesis can view/sign Defense Minutes PDF (#22) */}
          {!isAdmin && selectedThesis?.isCouncilMember && (
            <Button variant="primary" onClick={() => setShowMinutesModal(true)}>
              🖨️ Xuất Biên bản PDF &amp; Ký ({signedCount}/5)
            </Button>
          )}

          {isAdmin && (
            <Button variant="outline" onClick={handleOpenFinalExportModal}>
              📦 Xuất Dữ liệu Cuối kỳ &amp; Hoàn tất Đợt
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => (selectedThesisId ? loadThesisScoringDetails(selectedThesisId) : loadScoringTheses(selectedRoundId))}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {notification && (
        <div className={`page-alert ${notification.type}`}>
          <span>{notification.message}</span>
          <button className="page-alert-close" onClick={() => setNotification(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Empty state if lecturer has 0 assigned theses in this round (#17) */}
      {scoringTheses.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '44px 24px',
            textAlign: 'center',
            marginTop: '12px',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
          <h3 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>
            {isAdmin
              ? 'Chưa có đề tài nào đủ điều kiện bảo vệ trong đợt đồ án này'
              : 'Bạn chưa được phân công chấm điểm đề tài nào trong đợt đồ án này'}
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            {isAdmin
              ? 'Danh sách đề tài tại GĐ5 sẽ hiển thị ngay khi Giảng viên hướng dẫn xác nhận sinh viên Đủ điều kiện bảo vệ ở GĐ4.'
              : 'Hệ thống chỉ hiển thị những đề tài mà bạn là Giảng viên hướng dẫn, Giảng viên phản biện hoặc nằm trong 5 thành viên Hội đồng chấm bảo vệ.'}
          </p>
        </div>
      ) : (
        <>
          {/* Select Thesis Bar — Strictly real assigned theses, NO mock options (#17) */}
          <div className="select-thesis-bar">
            <label htmlFor="thesisSelector">
              {isAdmin ? 'Chọn đề tài cần theo dõi / tổng hợp:' : 'Đề tài bạn được phân công:'}
            </label>
            <select
              id="thesisSelector"
              className="form-control thesis-dropdown"
              value={selectedThesisId}
              onChange={handleThesisChange}
            >
              {scoringTheses.map((t) => {
                const roleTags: string[] = [];
                if (t.canScoreCouncil || t.isCouncilMember) roleTags.push('Hội đồng');
                if (t.canScoreReviewer) roleTags.push('GVPB');
                if (t.canScoreSupervisor) roleTags.push('GVHD');
                const suffix = roleTags.length > 0 ? ` — [Vai trò: ${roleTags.join(', ')}]` : '';
                return (
                  <option key={t.thesisId} value={t.thesisId}>
                    [{t.thesisCode || `DT-${t.thesisId}`}] {t.titleVn} (SV: {t.studentName} - {t.studentCode}){suffix}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Synthesized Graduation Result Card OR Real Unsynthesized Thesis Info Card (#24) */}
          {graduationResult ? (
            <div className="graduation-summary-card">
              <div className="summary-left">
                <span className="summary-badge">KẾT QUẢ TỐT NGHIỆP TỔNG HỢP</span>
                <h2>
                  {displayStudentName} ({displayStudentCode})
                </h2>
                <p className="summary-thesis-title">{displayThesisTitle}</p>
                <div className="scores-breakdown-row">
                  <div className="sub-score-item">
                    <span className="sub-score-lbl">Điểm GVHD (30%):</span>
                    <span className="sub-score-val">{Number(graduationResult.supervisorScore || 0).toFixed(2)}</span>
                  </div>
                  <div className="sub-score-item">
                    <span className="sub-score-lbl">Điểm GVPB (20%):</span>
                    <span className="sub-score-val">{Number(graduationResult.reviewerScore || 0).toFixed(2)}</span>
                  </div>
                  <div className="sub-score-item">
                    <span className="sub-score-lbl">TB Hội đồng (50%):</span>
                    <span className="sub-score-val">{Number(graduationResult.councilScore || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="summary-right">
                <div className="final-score-display">
                  <span className="final-score-lbl">ĐIỂM TỔNG KẾT</span>
                  <span className="final-score-num">{Number(graduationResult.finalScore).toFixed(2)}</span>
                </div>
                <div className="final-grade-box">
                  <span className={`grade-tag grade-${graduationResult.grade?.toLowerCase()}`}>
                    Xếp loại: {graduationResult.grade}
                  </span>
                  <StatusBadge
                    status={graduationResult.finalResult}
                    label={graduationResult.finalResult === 'PASSED' ? 'ĐẠT TỐT NGHIỆP' : 'KHÔNG ĐẠT'}
                    size="md"
                  />
                </div>
              </div>
            </div>
          ) : selectedThesis && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '18px 22px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                    }}
                  >
                    ⏳ CHƯA TỔNG HỢP ĐIỂM CUỐI KỲ
                  </span>
                  {selectedThesis.councilCode && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0a3273' }}>
                      Hội đồng: {selectedThesis.councilCode}
                    </span>
                  )}
                </div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
                  {selectedThesis.studentName} ({selectedThesis.studentCode})
                </h2>
                <div style={{ fontSize: '14px', color: '#334155', fontWeight: 600 }}>
                  [{selectedThesis.thesisCode}] {selectedThesis.titleVn}
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px' }}>
                  GVHD: <strong>{selectedThesis.advisorName || '—'}</strong> &nbsp;|&nbsp; GVPB:{' '}
                  <strong>{selectedThesis.reviewerName || 'Chưa phân công'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>GVHD (30%)</div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    {supervisorScoreItem ? supervisorScoreItem.score.toFixed(2) : 'Chưa chấm'}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>GVPB (20%)</div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    {reviewerScoreItem ? reviewerScoreItem.score.toFixed(2) : 'Chưa chấm'}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>TB Hội đồng ({councilScoreItems.length}/5)</div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    {liveCouncilAvg !== null ? liveCouncilAvg.toFixed(2) : 'Chưa chấm'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content: Left = Role-Aware Form or Permission Notice, Right = Real Scores Table */}
          <div className="scoring-grid-layout">
            <div className="scoring-col-form">
              {isAdmin ? (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1.5px solid #93c5fd',
                    borderRadius: '10px',
                    padding: '22px',
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', color: '#1e3a8a', fontSize: '16px' }}>
                    🛡️ Tài khoản Quản trị Khoa / Bộ môn (Chế độ Giám sát &amp; Tổng hợp)
                  </h3>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#1e40af', lineHeight: 1.6 }}>
                    Theo quy định phân quyền đào tạo, <strong>Admin không trực tiếp nhập điểm chấm hoặc ký biên bản Hội đồng</strong>.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#1e3a8a', lineHeight: 1.7 }}>
                    <li>Điểm GVHD (30%), GVPB (20%) và 5 thành viên Hội đồng (50%) do từng giảng viên đăng nhập bằng tài khoản cá nhân để chấm.</li>
                    <li>Sau khi đủ 3 đầu điểm, Admin bấm <strong>"🎯 Tổng hợp kết quả tốt nghiệp"</strong> hoặc <strong>"📦 Xuất Dữ liệu Cuối kỳ &amp; Hoàn tất Đợt"</strong> để công bố điểm cho sinh viên.</li>
                  </ul>
                </div>
              ) : allowedScoreTypes.length > 0 && selectedThesis ? (
                <ScoreEntryForm
                  thesisId={selectedThesis.thesisId}
                  fixedGraderId={selectedThesis.myLecturerId || 0}
                  fixedGraderName={selectedThesis.myLecturerName || user?.fullName}
                  fixedGraderDegree={selectedThesis.myLecturerDegree}
                  allowedScoreTypes={allowedScoreTypes}
                  onSubmit={handleScoreSubmit}
                />
              ) : (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '22px',
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '15px' }}>
                    🔒 Phiếu chấm điểm đã khóa
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    Đợt đồ án này đã kết thúc khóa sổ điểm hoặc đề tài hiện chưa ở trạng thái mở chấm điểm cho vai trò của bạn.
                  </p>
                </div>
              )}
            </div>

            <div className="scoring-col-table">
              <div className="scores-table-header">
                <h3>📋 Danh sách phiếu điểm thực tế đã nộp ({scores.length})</h3>
              </div>
              <Table
                columns={scoreColumns}
                dataSource={scores}
                rowKey="id"
                loading={loading}
                emptyText="Chưa có giảng viên nào nộp phiếu chấm điểm cho đề tài này"
              />
            </div>
          </div>
        </>
      )}

      {/* Synthesis Modal */}
      {isAdmin && selectedThesisId > 0 && (
        <ResultSynthesisModal
          isOpen={isSynthModalOpen}
          onClose={() => setIsSynthModalOpen(false)}
          thesisId={selectedThesisId}
          onSynthesize={handleSynthesize}
        />
      )}

      {/* Printable Defense Minutes PDF Modal with 5 Council Member Signatures (#22, #23) */}
      {showMinutesModal && selectedThesis && selectedThesis.isCouncilMember && (
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
              maxWidth: '880px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '28px 32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
              }}
            >
              <div>
                <strong style={{ color: '#0a3273', fontSize: '15px' }}>
                  📄 BIÊN BẢN HỘI ĐỒNG CHẤM ĐỒ ÁN TỐT NGHIỆP
                </strong>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                  Tiến độ ký số của 5 thành viên Hội đồng: <strong>{signedCount}/5 thành viên đã ký xác nhận</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSignMinutes}
                  disabled={signingMinutes}
                  style={{
                    backgroundColor: mySignatureItem?.signed ? '#0f766e' : '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    cursor: signingMinutes ? 'wait' : 'pointer',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {signingMinutes
                    ? 'Đang ký số...'
                    : mySignatureItem?.signed
                    ? `✓ Đã ký (${mySignatureItem.slotLabel})`
                    : `✍️ Ký xác nhận biên bản (${mySignatureItem?.slotLabel || 'Thành viên HĐ'})`}
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#0a3273',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  🖨️ In / Lưu PDF
                </button>
                <button
                  onClick={() => setShowMinutesModal(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '26px', borderRadius: '6px', lineHeight: 1.6, color: '#0f172a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>
                    {selectedThesis.councilName?.toUpperCase() || 'HỘI ĐỒNG CHẤM ĐỒ ÁN TỐT NGHIỆP'}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Độc lập - Tự do - Hạnh phúc</div>
                </div>
              </div>

              <h2 style={{ textAlign: 'center', color: '#0a3273', fontSize: '18px', margin: '16px 0' }}>
                BIÊN BẢN BẢO VỆ ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC
              </h2>

              <p style={{ margin: '6px 0' }}>
                <strong>1. Sinh viên bảo vệ:</strong> {displayStudentName} — <strong>Mã SV:</strong> {displayStudentCode}
                {selectedThesis.studentClass ? ` — Lớp: ${selectedThesis.studentClass}` : ''}
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>2. Tên đề tài:</strong> [{selectedThesis.thesisCode}] {displayThesisTitle}
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>3. Giảng viên hướng dẫn:</strong> {selectedThesis.advisorName || '—'}
              </p>
              <p style={{ margin: '10px 0 6px 0' }}>
                <strong>4. Kết quả chấm điểm của GVHD, GVPB và Hội đồng (1 Chủ tịch - 2 Thư ký - 2 Ủy viên):</strong>
              </p>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse', margin: '8px 0 14px 0', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Thành phần chấm</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Người chấm</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Điểm số</th>
                      <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '12px', textAlign: 'center', border: '1px solid #cbd5e1', color: '#64748b' }}>
                          Chưa có phiếu điểm nào được nộp.
                        </td>
                      </tr>
                    ) : (
                      scores.map((s) => (
                        <tr key={s.id}>
                          <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>
                            {s.scoreType === 'SUPERVISOR' ? 'GV Hướng dẫn' : s.scoreType === 'REVIEWER' ? 'GV Phản biện' : 'Thành viên Hội đồng'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>{s.graderName}</td>
                          <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}>
                            {Number(s.score).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{s.feedback}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '6px', margin: '12px 0 20px 0', fontWeight: 600, fontSize: '13.5px' }}>
                {graduationResult ? (
                  <>
                    Điểm GVHD (30%): {Number(graduationResult.supervisorScore).toFixed(2)} | Điểm GVPB (20%):{' '}
                    {Number(graduationResult.reviewerScore).toFixed(2)} | TB Hội đồng (50%):{' '}
                    {Number(graduationResult.councilScore).toFixed(2)} ⇒ ĐIỂM TỔNG KẾT:{' '}
                    {Number(graduationResult.finalScore).toFixed(2)} ({graduationResult.grade} -{' '}
                    {graduationResult.finalResult === 'PASSED' ? 'ĐẠT' : 'KHÔNG ĐẠT'})
                  </>
                ) : (
                  <>
                    Điểm GVHD (30%): {supervisorScoreItem ? supervisorScoreItem.score.toFixed(2) : '—'} | Điểm GVPB (20%):{' '}
                    {reviewerScoreItem ? reviewerScoreItem.score.toFixed(2) : '—'} | TB Hội đồng hiện tại:{' '}
                    {liveCouncilAvg !== null ? liveCouncilAvg.toFixed(2) : '—'} (Đang chờ tổng hợp cuối kỳ)
                  </>
                )}
              </div>

              {/* 5 Council Members Digital Signature Boxes (#23) */}
              <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '10px', color: '#0f172a' }}>
                5. Xác nhận chữ ký số của đủ 5 thành viên Hội đồng ({signedCount}/5):
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginTop: '8px',
                }}
              >
                {minutesSignatures.map((sig) => (
                  <div
                    key={sig.memberId || sig.lecturerId}
                    style={{
                      border: `1.5px solid ${sig.signed ? '#86efac' : '#cbd5e1'}`,
                      background: sig.signed ? '#f0fdf4' : '#f8fafc',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0a3273', textTransform: 'uppercase' }}>
                      {sig.slotLabel}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a', margin: '6px 0' }}>
                      {sig.lecturerName}
                    </div>
                    {sig.signed ? (
                      <div style={{ color: '#15803d', fontWeight: 700, fontSize: '12px', marginTop: '10px' }}>
                        ✓ Đã ký số xác nhận
                        {sig.signedAt && (
                          <div style={{ fontWeight: 500, fontSize: '11px', color: '#166534' }}>
                            {new Date(sig.signedAt).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px', marginTop: '12px' }}>
                        [Chưa ký xác nhận]
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Term Data Export & Round Completion Modal (#25, #27 — No Reservation Mock Row!) */}
      {showFinalExportModal && isAdmin && (
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
          <div style={{ background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0a3273' }}>
              📦 Bảng Tổng hợp Dữ liệu Cuối kỳ &amp; Công bố Kết quả Đợt đồ án
            </h3>
            <p style={{ color: '#475569', fontSize: '13.5px', marginBottom: '16px' }}>
              Khi bấm <strong>"Ký xuất Dữ liệu &amp; Hoàn tất Đợt đồ án"</strong>, hệ thống sẽ tự động tổng hợp điểm cuối kỳ cho các đề tài đủ đầu điểm, đóng đợt đồ án và gửi thông báo kết quả chính thức tới từng Sinh viên.
            </p>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>MSSV</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Họ và tên SV</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Đề tài</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Điểm tổng kết</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>Xếp loại / Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {roundExportResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '14px', textAlign: 'center', border: '1px solid #cbd5e1', color: '#64748b' }}>
                        Chưa có sinh viên nào đủ điều kiện bảo vệ trong đợt này.
                      </td>
                    </tr>
                  ) : (
                    roundExportResults.map(({ thesis, result }) => (
                      <tr key={thesis.thesisId}>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0a3273' }}>
                          {thesis.studentCode}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                          {thesis.studentName}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{thesis.titleVn}</td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}>
                          {result ? Number(result.finalScore).toFixed(2) : 'Chờ tổng hợp'}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>
                          {result ? (
                            <span style={{ color: result.finalResult === 'PASSED' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                              {result.grade} ({result.finalResult === 'PASSED' ? 'ĐẠT' : 'KHÔNG ĐẠT'})
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Chưa tổng hợp</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowFinalExportModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                🖨️ In Bảng tổng hợp Cuối kỳ (PDF)
              </button>
              <button
                onClick={handleFinalizeAndPublishRound}
                disabled={publishingRound}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: publishingRound ? 'wait' : 'pointer',
                }}
              >
                {publishingRound ? 'Đang công bố & đóng đợt...' : '✅ Ký xuất Dữ liệu & Hoàn tất Đợt đồ án'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

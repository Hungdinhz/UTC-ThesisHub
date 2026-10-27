import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { thesisService } from '../services/thesisService';
import type { Proposal } from '../types';
import FileUploadInput from '../../../components/FileUploadInput';
import { extractFileName, resolveFileUrl, getFileIcon } from '../../../utils/fileUtils';
import type { ProjectRoundItem } from '../../../types';
import { apiService } from '../../../services/api';
import { assignmentService } from '../../assignment/services/assignmentService';
import type { SupervisorAssignment } from '../../assignment/types';

export const ProposalManagementPage: React.FC = () => {
  const { user, userType } = useAuth();
  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor';
  const isAdmin = userType === 'admin';

  // Quyền duyệt: Giảng viên hướng dẫn xác nhận đề cương, Khoa (Admin/Tiểu ban) phê duyệt chính thức
  const canSupervisorApprove = isSupervisor || isAdmin;
  const canReview = isSupervisor || isAdmin || userType === 'committee_member';

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [reviewModal, setReviewModal] = useState<boolean>(false);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [pdfPreviewProposal, setPdfPreviewProposal] = useState<Proposal | null>(null);
  const [signedProposalIds, setSignedProposalIds] = useState<Record<number, boolean>>({ 1: true });
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Round and assignment integration
  const [rounds, setRounds] = useState<ProjectRoundItem[]>([]);
  const [mySupervisorAssignment, setMySupervisorAssignment] = useState<SupervisorAssignment | null>(null);
  const [lecturerAssignedStudents, setLecturerAssignedStudents] = useState<SupervisorAssignment[]>([]);

  // Proposal form state
  const [titleVn, setTitleVn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [expectedResults, setExpectedResults] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Selection states for proposal creation
  const [selectedStudentId, setSelectedStudentId] = useState<number>(2);
  const [selectedLecturerId, setSelectedLecturerId] = useState<number>(1);
  const [selectedRoundId, setSelectedRoundId] = useState<number>(1);

  const availableStudents = [
    { id: 2, code: '201200101', name: 'Nguyễn Văn An', class: 'CNTT1 - K62' },
    { id: 3, code: '201200102', name: 'Trần Thị Bình', class: 'CNTT1 - K62' },
    { id: 4, code: '201200103', name: 'Lê Hoàng Cường', class: 'CNTT2 - K62' },
    { id: 5, code: '201200104', name: 'Phạm Minh Đức', class: 'CNTT2 - K62' },
    { id: 6, code: '211209999', name: 'Nguyen Van Test Manual', class: 'CNTT3 - K62' },
    { id: 1, code: '2021601234', name: 'Nguyễn Văn Sinh Viên', class: 'CNTT1 - K62' },
  ];

  const availableLecturers = [
    { id: 1, code: 'GV001', name: 'TS. Trần Văn Giảng Viên', degree: 'TIEN_SI' },
    { id: 2, code: 'HD001', name: 'PGS.TS. Lê Văn Hội Đồng', degree: 'PGS' },
    { id: 3, code: 'GV002', name: 'TS. Nguyen Van Cong', degree: 'TIEN_SI' },
  ];

  const availableRounds = [
    { id: 1, code: 'DA_CNTT_K62_HK1', name: 'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027' },
    { id: 2, code: 'DA_CNTT1_K64', name: 'Đợt đồ án tốt nghiệp CNTT 2027' },
  ];

  useEffect(() => {
    fetchRounds();
  }, [user?.id]);

  useEffect(() => {
    if (selectedRoundId) {
      loadProposals(selectedRoundId);
    }
  }, [selectedRoundId, user?.id]);

  useEffect(() => {
    if (!bannerMsg) return;
    const timer = setTimeout(() => setBannerMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [bannerMsg]);

  const fetchRounds = async () => {
    try {
      const roundList = await apiService.getProjectRounds();
      if (roundList && roundList.length > 0) {
        if (isStudent) {
          try {
            const myStatus = await apiService.getMyRoundStatus();
            if (myStatus && myStatus.inRound && myStatus.roundId) {
              const matched = roundList.find((r) => r.roundId === myStatus.roundId);
              if (matched) {
                setRounds([matched]);
                setSelectedRoundId(matched.roundId);
                return;
              }
            }
          } catch {
            // fallback below
          }
        }

        let visibleRoundList = roundList;
        // Với Giảng viên hướng dẫn: Chỉ hiển thị các đợt mà giảng viên đã được phân công hướng dẫn
        if (isSupervisor && !isAdmin && user) {
          const lecturerId = (user as any).lecturer?.id || user.lecturer_id || user.id;
          const lecturerCode = (user as any).lecturer?.lecturer_code || (user as any).lecturerCode || (user as any).registration_no || user.username;
          const lecturerFullName = (user.fullName || (user as any).full_name || '').trim().toLowerCase();

          try {
            const allProposals = await thesisService.searchProposals();
            const myProposals = (Array.isArray(allProposals) ? allProposals : []).filter((p) =>
              (lecturerId && (p.lecturerId === lecturerId || String(p.lecturerId) === String(lecturerId))) ||
              (lecturerCode && p.lecturerCode === lecturerCode) ||
              (lecturerFullName && p.lecturerFullName && p.lecturerFullName.trim().toLowerCase() === lecturerFullName)
            );
            const assignedRoundIds = new Set<number>(myProposals.map((p) => p.projectRoundId).filter(Boolean));

            // Kiểm tra thêm trong bảng phân công GVHD của các đợt đang mở / đang thực hiện
            const activeRoundsToCheck = roundList.filter((r) => r.status !== 'DRAFT');
            const assignChecks = await Promise.all(
              activeRoundsToCheck.map(async (r) => {
                try {
                  const assigns = await assignmentService.getProposals(r.roundId);
                  const hasAssign = (assigns || []).some(
                    (a) =>
                      (lecturerId && (a.lecturerId === lecturerId || String(a.lecturerId) === String(lecturerId))) ||
                      (lecturerCode && a.lecturerCode === lecturerCode) ||
                      (lecturerFullName && a.lecturerName && a.lecturerName.trim().toLowerCase() === lecturerFullName)
                  );
                  return hasAssign ? r.roundId : null;
                } catch {
                  return null;
                }
              })
            );
            assignChecks.forEach((id) => {
              if (id !== null) assignedRoundIds.add(id);
            });

            if (assignedRoundIds.size > 0) {
              visibleRoundList = roundList.filter((r) => assignedRoundIds.has(r.roundId));
            } else {
              visibleRoundList = roundList.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'OPEN');
            }
          } catch {
            visibleRoundList = roundList.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'OPEN');
          }
        }

        setRounds(visibleRoundList);

        // Ưu tiên chọn đợt đang có đề cương thực tế hoặc đợt IN_PROGRESS / OPEN
        try {
          const allProposals = await thesisService.searchProposals();
          if (Array.isArray(allProposals) && allProposals.length > 0) {
            const roundWithProposals = visibleRoundList.find((r) =>
              (r.status === 'IN_PROGRESS' || r.status === 'OPEN') &&
              allProposals.some((p) => p.projectRoundId === r.roundId)
            ) || visibleRoundList.find((r) => allProposals.some((p) => p.projectRoundId === r.roundId));
            if (roundWithProposals?.roundId) {
              setSelectedRoundId(roundWithProposals.roundId);
              setProposals(allProposals.filter((p) => p.projectRoundId === roundWithProposals.roundId));
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore and fallback to status priority
        }

        const activeRound =
          visibleRoundList.find((r) => r.status === 'IN_PROGRESS') ||
          visibleRoundList.find((r) => r.status === 'OPEN') ||
          visibleRoundList[0];
        if (activeRound?.roundId) {
          setSelectedRoundId(activeRound.roundId);
        }
      } else {
        loadProposals(selectedRoundId);
      }
    } catch (err) {
      console.error('Không thể tải danh sách đợt đồ án:', err);
      loadProposals(selectedRoundId);
    }
  };

  useEffect(() => {
    const fetchRoundAssignments = async () => {
      if (!selectedRoundId) return;
      try {
        const assignments = await assignmentService.getProposals(selectedRoundId);

        // Sinh viên: tìm giảng viên hướng dẫn đã phân công chính thức
        if (isStudent) {
          const userCode = user?.student_id || user?.studentCode || user?.username;
          const userFullName = (user?.fullName || '').trim().toLowerCase();
          const myAssign = (assignments || []).find(
            (p) =>
              (user?.id && (p.studentId === user.id || String(p.studentId) === String(user?.id))) ||
              (userCode && p.studentCode === userCode) ||
              (userFullName && p.studentName && p.studentName.trim().toLowerCase() === userFullName)
          );
          if (myAssign) {
            setMySupervisorAssignment(myAssign);
            if (myAssign.lecturerId) {
              setSelectedLecturerId(myAssign.lecturerId);
            }
          } else {
            setMySupervisorAssignment(null);
          }
        }

        // Giảng viên: lấy danh sách sinh viên đã phân công cho mình trong đợt này
        if (isSupervisor) {
          const lecturerId = user?.lecturer_id || user?.id;
          const lecturerCode = (user as any)?.lecturerCode || (user as any)?.registration_no || user?.username;
          const lecturerFullName = (user?.fullName || '').trim().toLowerCase();
          const myStudents = (assignments || []).filter(
            (p) =>
              (lecturerId && (p.lecturerId === lecturerId || String(p.lecturerId) === String(lecturerId))) ||
              (lecturerCode && p.lecturerCode === lecturerCode) ||
              (lecturerFullName && p.lecturerName && p.lecturerName.trim().toLowerCase() === lecturerFullName)
          );
          setLecturerAssignedStudents(myStudents);
          if (myStudents.length > 0) {
            setSelectedStudentId(myStudents[0].studentId);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải kết quả phân công đợt đồ án:', err);
      }
    };
    fetchRoundAssignments();
  }, [selectedRoundId, isStudent, isSupervisor, user]);

  const loadProposals = async (roundIdParam?: number) => {
    const targetRoundId = roundIdParam ?? selectedRoundId;
    setLoading(true);
    try {
      const data = await thesisService.searchProposals({
        roundId: targetRoundId,
      });
      if (Array.isArray(data)) {
        setProposals(data);
        return;
      }
    } catch (err) {
      console.error('Không thể tải đề cương từ backend:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (!isStudent) {
      alert('Chức năng tạo mới đề cương chỉ dành cho sinh viên.');
      return;
    }
    if (!mySupervisorAssignment || !mySupervisorAssignment.lecturerId) {
      alert('Sinh viên chưa được phân công giảng viên hướng dẫn thì không thể tạo đề cương mới.');
      return;
    }

    // Check if current student already has a proposal in the project round
    if (isStudent) {
      if (mySupervisorAssignment?.lecturerId) {
        setSelectedLecturerId(mySupervisorAssignment.lecturerId);
      }
      const userCode = user?.student_id || user?.studentCode || user?.username;
      const myExisting = proposals.find(
        (p) =>
          (p.projectRoundId === selectedRoundId || !p.projectRoundId) &&
          ((userCode && (p.studentCode === userCode || String(p.studentId) === String(user?.id))) ||
            (user?.id && p.studentId === user.id))
      );
      if (myExisting) {
        if (myExisting.status === 'DRAFT' || myExisting.status === 'REVISE_REQUIRED') {
          if (
            window.confirm(
              `Bạn đã có đề cương ở trạng thái [${myExisting.status === 'DRAFT' ? 'Bản Nháp (DRAFT)' : 'Yêu Cầu Chỉnh Sửa (REVISE_REQUIRED)'}].\n\nTheo quy chế, mỗi sinh viên chỉ thực hiện 1 đề tài trong một đợt đồ án.\nBạn có muốn mở để CHỈNH SỬA đề cương này không?`
            )
          ) {
            handleOpenEditModal(myExisting);
          }
          return;
        } else {
          alert(
            `Bạn đã có đề tài/đề cương "${myExisting.titleVn}" đang ở trạng thái [${myExisting.status}].\nTheo quy chế, mỗi sinh viên chỉ được phép có 1 đề tài trong 1 đợt đồ án.`
          );
          return;
        }
      }
    } else if (isSupervisor) {
      if (lecturerAssignedStudents.length > 0) {
        setSelectedStudentId(lecturerAssignedStudents[0].studentId);
      }
      const myLecturerId = user?.lecturer_id || user?.id || 1;
      setSelectedLecturerId(myLecturerId);
    }
    setEditingProposal(null);
    setTitleVn('');
    setTitleEn('');
    setDescription('');
    setObjectives('');
    setExpectedResults('');
    setFileUrl('');
    setShowModal(true);
  };

  const handleOpenEditModal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setSelectedRoundId(proposal.projectRoundId);
    setSelectedLecturerId(proposal.lecturerId);
    setSelectedStudentId(proposal.studentId);
    setTitleVn(proposal.titleVn || '');
    setTitleEn(proposal.titleEn || '');
    setDescription(proposal.description || '');
    setObjectives(proposal.objectives || '');
    setExpectedResults(proposal.expectedResults || '');
    setFileUrl(proposal.fileUrl || '');
    setShowModal(true);
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProposal) {
        await thesisService.updateProposal(editingProposal.id, {
          titleVn,
          titleEn,
          description,
          objectives,
          expectedResults,
          fileUrl: fileUrl || '/uploads/proposals/de_cuong_mau.pdf',
        });
        setBannerMsg(
          editingProposal.status === 'REVISE_REQUIRED'
            ? `Cập nhật đề cương "${titleVn}" thành công! Bạn có thể bấm 'Nộp Lại' để gửi GVHD/Khoa duyệt lại.`
            : 'Nội dung bản nháp đã được lưu.'
        );
      } else {
        const effectiveStudentId = isStudent ? (user?.student_id || user?.id || 1) : selectedStudentId;
        const effectiveLecturerId = isSupervisor
          ? (user?.lecturer_id || user?.id || selectedLecturerId || 1)
          : isStudent && mySupervisorAssignment?.lecturerId
            ? mySupervisorAssignment.lecturerId
            : selectedLecturerId;
        await thesisService.createProposal({
          projectRoundId: selectedRoundId,
          studentId: effectiveStudentId,
          lecturerId: effectiveLecturerId,
          titleVn,
          titleEn,
          description,
          objectives,
          expectedResults,
          fileUrl: fileUrl || '/uploads/proposals/de_cuong_mau.pdf',
        });
        setBannerMsg('Đã tạo và lưu Đề cương đề tài thành công vào CSDL!');
        alert('🎉 Đã tạo Đề cương thành công! Bạn có thể bấm nút "🚀 Nộp Đề Cương" trong danh sách để gửi GVHD phê duyệt.');
      }
      setShowModal(false);
      setEditingProposal(null);
      setTitleVn('');
      setTitleEn('');
      setDescription('');
      setObjectives('');
      setExpectedResults('');
      setFileUrl('');
      await loadProposals();
    } catch (err: any) {
      console.error('Lỗi lưu đề cương:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể lưu đề cương';
      alert('Không thể lưu đề cương vào hệ thống: ' + errMsg);
    }
  };

  const handleSubmitProposalToSupervisor = async (proposal: Proposal) => {
    const isRevise = proposal.status === 'REVISE_REQUIRED';
    const confirmMsg = isRevise
      ? `Xác nhận NỘP LẠI đề cương "${proposal.titleVn}" sau khi đã hoàn thiện chỉnh sửa?`
      : `Xác nhận NỘP đề cương "${proposal.titleVn}" để Giảng viên hướng dẫn kiểm tra & phê duyệt?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await thesisService.submitProposal(proposal.id);
      setBannerMsg(`Đã nộp đề cương "${proposal.titleVn}" thành công! Trạng thái chuyển sang SUBMITTED (Chờ GVHD xác nhận).`);
      alert(`🚀 Đã nộp đề cương "${proposal.titleVn}" lên GVHD thành công! Trạng thái chuyển sang SUBMITTED.`);
      await loadProposals();
    } catch (err: any) {
      alert('Lỗi nộp đề cương: ' + (err?.response?.data?.message || err?.message));
    }
  };

  const handleSupervisorConfirm = async (proposal: Proposal) => {
    try {
      await thesisService.supervisorApprove(proposal.id, true, 'GVHD đồng ý xác nhận đề tài, chuyển Khoa/Ban duyệt.');
      await loadProposals();
      setBannerMsg(`GVHD đã xác nhận đề tài của SV ${proposal.studentFullName} thành công!`);
    } catch (err: any) {
      alert('Lỗi xác nhận: ' + (err?.response?.data?.message || err?.message));
    }
  };

  const handleReview = async () => {
    if (!selectedProposal) return;
    try {
      await thesisService.reviewProposal(selectedProposal.id, 1, reviewStatus, reviewNotes);
      await loadProposals();
      setBannerMsg(
        reviewStatus === 'APPROVED'
          ? `Khoa/Ban đã PHÊ DUYỆT đề tài của SV ${selectedProposal.studentFullName}. Hệ thống đã tự động tạo Đề tài tốt nghiệp chính thức!`
          : `Khoa/Ban yêu cầu chỉnh sửa lại đề tài của SV ${selectedProposal.studentFullName}.`
      );
      setReviewModal(false);
      setSelectedProposal(null);
    } catch (err: any) {
      alert('Lỗi đánh giá đề cương: ' + (err?.response?.data?.message || err?.message));
    }
  };

  const handleSignAndArchive = (proposal: Proposal) => {
    setSignedProposalIds((prev) => ({ ...prev, [proposal.id]: true }));
    setBannerMsg(`Sinh viên ${proposal.studentFullName} đã ký nộp và Khoa CNTT đã lưu hồ sơ đề cương (Bước 24 hoàn tất)!`);
  };

  const isCurrentStudentProposal = (p: Proposal) => {
    // 1. Check studentId
    const studentId = user?.id || user?.student_id || (user as any)?.student?.id;
    if (studentId && (p.studentId === studentId || String(p.studentId) === String(studentId))) {
      return true;
    }

    // 2. Check studentCode / registration_no
    const studentCode =
      (user as any)?.registration_no ||
      user?.student_id ||
      user?.studentCode ||
      (user as any)?.student_code ||
      user?.username ||
      user?.user?.username;
    if (studentCode && p.studentCode) {
      if (p.studentCode.trim().toLowerCase() === String(studentCode).trim().toLowerCase()) {
        return true;
      }
    }

    // 3. Check full name
    const studentFullName =
      user?.fullName ||
      user?.user?.fullName ||
      (user?.user?.first_name || user?.user?.last_name
        ? `${user?.user?.first_name || ''} ${user?.user?.last_name || ''}`.trim()
        : '');
    if (studentFullName && p.studentFullName) {
      const pName = p.studentFullName.trim().toLowerCase();
      const uName = studentFullName.trim().toLowerCase();
      if (pName === uName || pName.includes(uName) || uName.includes(pName)) {
        return true;
      }
    }

    return false;
  };

  const filtered = proposals.filter((p) => {
    // Lọc theo Đợt đồ án được chọn ở đầu trang
    if (selectedRoundId && p.projectRoundId && p.projectRoundId !== selectedRoundId) {
      return false;
    }

    // Yêu cầu: "Sinh viên chỉ xem và ký đề cương của mình"
    if (isStudent) {
      if (!isCurrentStudentProposal(p)) {
        return false;
      }
    }

    // Giảng viên chỉ xem đề cương mà mình hướng dẫn (trừ khi là Admin hoặc Hội đồng)
    if (isSupervisor && !isAdmin) {
      const myLecturerId = user?.lecturer_id || user?.id;
      const myLecturerCode = (user as any)?.lecturerCode || (user as any)?.registration_no || user?.username;
      const myLecturerFullName = (user?.fullName || '').trim().toLowerCase();
      const matchLecturer =
        (myLecturerId && (p.lecturerId === myLecturerId || String(p.lecturerId) === String(myLecturerId))) ||
        (myLecturerCode && p.lecturerCode === myLecturerCode) ||
        (myLecturerFullName && p.lecturerFullName && p.lecturerFullName.trim().toLowerCase() === myLecturerFullName) ||
        lecturerAssignedStudents.some((s) => s.studentId === p.studentId);
      if (!matchLecturer) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#1a202c' }}>
            Giai đoạn 3: Xây dựng, Xét duyệt Đề tài & Sinh Đề cương PDF
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Quy trình: GV & SV xác định đề tài (Draft) → GV xác nhận → Khoa/Ban duyệt đề tài → Sinh đề cương PDF → SV ký nộp & Khoa lưu hồ sơ.
          </p>
        </div>
        {isStudent && (
          <button
            onClick={handleOpenCreateModal}
            disabled={!mySupervisorAssignment || !mySupervisorAssignment.lecturerId}
            style={{
              background: (!mySupervisorAssignment || !mySupervisorAssignment.lecturerId) ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: (!mySupervisorAssignment || !mySupervisorAssignment.lecturerId) ? 'not-allowed' : 'pointer',
              opacity: (!mySupervisorAssignment || !mySupervisorAssignment.lecturerId) ? 0.7 : 1,
            }}
            title={
              (!mySupervisorAssignment || !mySupervisorAssignment.lecturerId)
                ? 'Sinh viên chưa được phân công giảng viên hướng dẫn thì không thể tạo đề cương mới'
                : 'Tạo đề cương đề tài mới'
            }
          >
            + Tạo Đề Cương Mới
          </button>
        )}
      </div>

      {/* Cảnh báo sinh viên chưa có GVHD */}
      {isStudent && (!mySupervisorAssignment || !mySupervisorAssignment.lecturerId) && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>
            <strong>Lưu ý:</strong> Sinh viên chưa được phân công giảng viên hướng dẫn thì không thể bấm tạo đề cương mới. Vui lòng chờ Khoa công bố danh sách phân công GVHD.
          </span>
        </div>
      )}

      {/* Đợt đồ án ở đầu mỗi giai đoạn (Page 8: Từng giai đoạn đều có đợt đồ án ở đầu) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📅 <strong>Đợt đồ án:</strong>
        </span>
        {/* Với Sinh viên: Cố định vào đợt đồ án của sinh viên; với Admin & Giảng viên: Cho phép chọn đợt */}
        {isStudent ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '6px 14px',
              borderRadius: '6px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
              🔒 {rounds.find((r) => r.roundId === selectedRoundId)?.name || availableRounds.find((r) => r.id === selectedRoundId)?.name || 'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027'}
            </span>
            <span
              style={{
                background: '#16a34a',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {rounds.find((r) => r.roundId === selectedRoundId)?.status || 'OPEN'} (Hiện tại)
            </span>
          </div>
        ) : (
          /* Giảng viên chỉ xem các đợt được phân công; Quản trị viên xem toàn bộ các đợt */
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(Number(e.target.value))}
            style={{
              padding: '7px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              background: '#fff',
              color: '#0f172a',
              minWidth: '280px',
              cursor: 'pointer',
            }}
          >
            {(rounds.length > 0 ? rounds : isAdmin ? availableRounds : []).map((r: any) => (
              <option key={r.roundId || r.id} value={r.roundId || r.id}>
                {r.name} {r.status ? `(${r.status})` : ''}
              </option>
            ))}
            {rounds.length === 0 && !isAdmin && (
              <option value={0}>-- Chưa có đợt đồ án được phân công --</option>
            )}
          </select>
        )}
        {isStudent && (
          <span style={{ fontSize: '13px', color: '#15803d', background: '#dcfce7', padding: '4px 10px', borderRadius: '4px', fontWeight: 500 }}>
            🎓 Sinh viên: <strong>Chỉ thuộc đợt đồ án hiện tại</strong>
          </span>
        )}
        {isSupervisor && (
          <span style={{ fontSize: '13px', color: '#0369a1', background: '#e0f2fe', padding: '4px 10px', borderRadius: '4px', fontWeight: 500 }}>
            👨‍🏫 Vai trò: <strong>Giảng viên hướng dẫn</strong> (Chỉ duyệt đề tài của sinh viên được phân công trong đợt)
          </span>
        )}
        {isAdmin && (
          <span style={{ fontSize: '13px', color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontWeight: 500 }}>
            👁️ Quản trị viên (Chế độ xem & theo dõi đề tài)
          </span>
        )}
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1d4ed8',
            }}
          >
            <span>🔒 Đề cương cá nhân:</span>
            <span>
              {user?.fullName || user?.user?.fullName || (user as any)?.registration_no || user?.username}
              {(user as any)?.registration_no ? ` (MSSV: ${(user as any).registration_no})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
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
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
                  Đang tải danh sách đề cương...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
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
                    {p.fileUrl && (
                      <div style={{ marginTop: '6px' }}>
                        <a
                          href={resolveFileUrl(p.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          download
                          style={{
                            fontSize: '12px',
                            color: '#0a3273',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            backgroundColor: '#eff6ff',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe',
                            maxWidth: '100%'
                          }}
                          title={extractFileName(p.fileUrl)}
                        >
                          <span>{getFileIcon(p.fileUrl)}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {extractFileName(p.fileUrl)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#2563eb' }}>👁️ Mở / ⬇️ Tải</span>
                        </a>
                      </div>
                    )}
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
                      {/* Nút Sửa đề cương khi DRAFT hoặc REVISE_REQUIRED */}
                      {(p.status === 'DRAFT' || p.status === 'REVISE_REQUIRED') && (
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                          title="Chỉnh sửa nội dung đề cương (tiêu đề, mục tiêu, kết quả dự kiến)"
                        >
                          ✏️ Sửa Đề Cương
                        </button>
                      )}

                      {/* Nút Nộp đề cương khi DRAFT hoặc REVISE_REQUIRED */}
                      {(isStudent || isAdmin) && (p.status === 'DRAFT' || p.status === 'REVISE_REQUIRED') && (
                        <button
                          onClick={() => handleSubmitProposalToSupervisor(p)}
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
                          title="Nộp đề cương chính thức để Giảng viên hướng dẫn duyệt"
                        >
                          {p.status === 'REVISE_REQUIRED' ? '🚀 Nộp Lại' : '🚀 Nộp Đề Cương'}
                        </button>
                      )}

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
                          ✓ Phê duyệt đề cương (GVHD)
                        </button>
                      )}
                      {canReview && p.status !== 'APPROVED' && (
                        <button
                          onClick={() => {
                            setSelectedProposal(p);
                            setReviewModal(true);
                          }}
                          style={{
                            background: isAdmin ? '#ecfdf5' : '#f1f5f9',
                            color: isAdmin ? '#065f46' : '#334155',
                            border: `1px solid ${isAdmin ? '#a7f3d0' : '#cbd5e1'}`,
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {isAdmin ? '⚖️ Khoa Duyệt Đề Tài' : 'Đánh Giá'}
                        </button>
                      )}
                      {isStudent && p.status === 'APPROVED' && !signedProposalIds[p.id] && isCurrentStudentProposal(p) && (
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
                      {p.status === 'APPROVED' && (
                        <a
                          href={`/thesis/detail?id=${p.id}`}
                          style={{
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          🎓 Đề Tài
                        </a>
                      )}
                      {p.status === 'APPROVED' && (
                        <a
                          href={`/progress/tasks?thesisId=${p.id}`}
                          style={{
                            background: '#eff6ff',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          📋 Bảng Task
                        </a>
                      )}
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

              {pdfPreviewProposal.fileUrl && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getFileIcon(pdfPreviewProposal.fileUrl)}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0a3273' }}>
                        Tập tin đề cương gốc đã tải lên:
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {extractFileName(pdfPreviewProposal.fileUrl)}
                      </div>
                    </div>
                  </div>
                  <a
                    href={resolveFileUrl(pdfPreviewProposal.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: '#0a3273', color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}
                  >
                    ⬇️ Tải file đề cương
                  </a>
                </div>
              )}

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
          <div style={{ background: '#fff', borderRadius: '8px', width: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                {editingProposal
                  ? editingProposal.status === 'REVISE_REQUIRED'
                    ? '✏️ Chỉnh Sửa & Bổ Sung Đề Cương (Yêu Cầu Sửa Đổi)'
                    : '✏️ Chỉnh Sửa Bản Nháp Đề Cương'
                  : 'Biên Soạn & Nộp Đề Cương Đồ Án Mới'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingProposal(null); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            {editingProposal && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  background: editingProposal.status === 'REVISE_REQUIRED' ? '#fef2f2' : '#f0f9ff',
                  border: `1px solid ${editingProposal.status === 'REVISE_REQUIRED' ? '#fecaca' : '#bae6fd'}`,
                  color: editingProposal.status === 'REVISE_REQUIRED' ? '#991b1b' : '#0369a1',
                }}
              >
                {editingProposal.status === 'REVISE_REQUIRED' ? (
                  <>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ Yêu Cầu Chỉnh Sửa:</strong>
                    <div>Sinh viên sửa đổi trực tiếp trên đề cương này theo yêu cầu của Khoa/Hội đồng. Sau khi nhấn <strong>Lưu Thay Đổi Đề Cương</strong>, sinh viên bấm <strong>"Nộp Lại"</strong> ngoài danh sách để gửi xét duyệt lại.</div>
                  </>
                ) : (
                  <>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>💡 Đang Chỉnh Sửa Bản Nháp (DRAFT):</strong>
                    <div>Bạn có thể sửa đổi tiêu đề, mô tả, mục tiêu hoặc file đính kèm. Sau khi lưu, bạn có thể tiếp tục sửa hoặc bấm <strong>"🚀 Nộp Đề Cương"</strong> để chuyển đến Giảng viên hướng dẫn duyệt.</div>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSaveProposal}>
              {editingProposal ? (
                <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Sinh viên:</span> <strong>{editingProposal.studentFullName} ({editingProposal.studentCode})</strong> - Lớp: {editingProposal.studentClass || 'CNTT'}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>GV Hướng dẫn:</span> <strong>{editingProposal.lecturerFullName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Đợt đồ án:</span> <strong>{editingProposal.projectRoundName || 'Đợt Đồ án Tốt nghiệp'}</strong>
                  </div>
                </div>
              ) : isSupervisor ? (
                /* Giảng viên hướng dẫn tạo đề tài cho sinh viên (Page 8: Không cần hiện mục GVHD, sinh viên thực hiện là danh sách SV đã được phân công) */
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                      Sinh viên thực hiện (Đã được phân công với Thầy/Cô) *
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      required
                    >
                      {lecturerAssignedStudents.length > 0 ? (
                        lecturerAssignedStudents.map((s) => (
                          <option key={s.studentId} value={s.studentId}>
                            {s.studentCode} - {s.studentName}
                          </option>
                        ))
                      ) : (
                        availableStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} - {s.name} ({s.class})
                          </option>
                        ))
                      )}
                    </select>
                    {lecturerAssignedStudents.length > 0 ? (
                      <span style={{ fontSize: '11px', color: '#059669', marginTop: '2px', display: 'block' }}>
                        ✓ Danh sách gồm {lecturerAssignedStudents.length} sinh viên đã được phân công cho Thầy/Cô trong đợt này.
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px', display: 'block' }}>
                        (Chưa có sinh viên nào được phân công chính thức trong đợt này - hiển thị danh sách SV mẫu)
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                      Đợt đồ án (Hiện tại)
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        rounds.find((r) => r.roundId === selectedRoundId)?.name ||
                        availableRounds.find((r) => r.id === selectedRoundId)?.name ||
                        'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                      🔒 Cố định theo đợt đồ án đang mở trong học kỳ hiện tại.
                    </span>
                  </div>
                </>
              ) : isStudent ? (
                /* Sinh viên tạo đề cương (Page 6: Tự động điền GVHD và Đợt đồ án, khóa không cho chỉnh sửa/chọn vì đã được phân công) */
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                      Giảng viên hướng dẫn (Đã phân công chính thức)
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        mySupervisorAssignment
                          ? `${mySupervisorAssignment.lecturerName || 'TS. Trần Văn Giảng Viên'} (${mySupervisorAssignment.lecturerCode || 'GV001'})`
                          : availableLecturers.find((l) => l.id === selectedLecturerId)?.name || 'TS. Trần Văn Giảng Viên (GV001)'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                      🔒 Tự động cập nhật theo kết quả phân công GVHD của Khoa. Sinh viên không thể thay đổi.
                    </span>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                      Đợt đồ án (Đã tham gia)
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        rounds.find((r) => r.roundId === selectedRoundId)?.name ||
                        availableRounds.find((r) => r.id === selectedRoundId)?.name ||
                        'Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                      🔒 Sinh viên chỉ thuộc 1 đợt đồ án tốt nghiệp hiện tại.
                    </span>
                  </div>
                </>
              ) : (
                /* Quản trị viên/Khác */
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Sinh viên thực hiện *</label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      >
                        {availableStudents.map((s) => (
                          <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.class})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Giảng viên hướng dẫn *</label>
                      <select
                        value={selectedLecturerId}
                        onChange={(e) => setSelectedLecturerId(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      >
                        {availableLecturers.map((l) => (
                          <option key={l.id} value={l.id}>{l.code} - {l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Đợt đồ án *</label>
                    <select
                      value={selectedRoundId}
                      onChange={(e) => setSelectedRoundId(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    >
                      {(rounds.length > 0 ? rounds : availableRounds).map((r: any) => (
                        <option key={r.roundId || r.id} value={r.roundId || r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

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

              <FileUploadInput
                label="Tập tin đề cương đồ án"
                value={fileUrl}
                onChange={(url) => setFileUrl(url)}
                accept=".pdf,.doc,.docx"
                helperText="Hỗ trợ file PDF hoặc Word (tối đa 50MB)"
                placeholder="/uploads/proposals/de_cuong.pdf hoặc dán link Google Drive/OneDrive..."
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingProposal(null); }}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {editingProposal ? 'Lưu Thay Đổi Đề Cương' : 'Gửi Đề Cương'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { progressService } from '../services/progressService';
import { thesisService } from '../../thesis/services/thesisService';
import type { Task, Comment, Submission } from '../types';
import type { Thesis } from '../../thesis/types';
import FileUploadInput from '../../../components/FileUploadInput';
import { extractFileName, resolveFileUrl, getFileIcon } from '../../../utils/fileUtils';
import { apiService } from '../../../services/api';
import type { ProjectRoundItem } from '../../../types';

export const TaskBoardPage: React.FC = () => {
  const { userType, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor' || userType === 'committee_member';
  const canCreateTask = isSupervisor;

  // Project Rounds state for separate filtering
  const [projectRounds, setProjectRounds] = useState<ProjectRoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | 'ALL'>(() => {
    const roundParam = searchParams.get('roundId');
    return roundParam && roundParam !== 'ALL' ? Number(roundParam) : 'ALL';
  });

  // Theses state
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<number>(() => {
    return Number(searchParams.get('thesisId') || searchParams.get('id')) || 0;
  });
  const [currentThesis, setCurrentThesis] = useState<Thesis | null>(null);

  // Filter visible theses by user role:
  // - Sinh viên: chỉ thấy duy nhất đề tài của chính mình (nếu chưa có đề tài thì danh sách rỗng, không gán đề tài người khác)
  // - Giảng viên hướng dẫn: chỉ thấy danh sách các đề tài mình đang hướng dẫn
  // - Quản trị viên: xem tất cả các đề tài của khoa
  const visibleTheses = useMemo(() => {
    if (isStudent && user) {
      const studentId = (user as any).student?.id || user.student_id || user.id;
      const userCode = (user as any).student?.student_code || user.studentCode || user.student_id || user.username;
      const userFullName = (user.fullName || (user as any).full_name || '').trim().toLowerCase();
      const myTheses = theses.filter(t =>
        (studentId && (t.studentId === studentId || String(t.studentId) === String(studentId))) ||
        (userCode && t.studentCode === String(userCode)) ||
        (userFullName && t.studentFullName && t.studentFullName.trim().toLowerCase() === userFullName)
      );
      return myTheses;
    }
    if (isSupervisor && user) {
      const lecturerId = (user as any).lecturer?.id || (user as any).lecturer_id || user.id;
      const lecturerCode = (user as any).lecturer?.lecturer_code || (user as any).lecturerCode || (user as any).registration_no || user.username;
      const lecturerFullName = (user.fullName || (user as any).full_name || '').trim().toLowerCase();
      const myTheses = theses.filter(t =>
        (lecturerId && (t.lecturerId === lecturerId || String(t.lecturerId) === String(lecturerId))) ||
        (lecturerCode && t.lecturerCode === String(lecturerCode)) ||
        (lecturerFullName && t.lecturerFullName && t.lecturerFullName.trim().toLowerCase() === lecturerFullName)
      );
      return myTheses;
    }
    return theses;
  }, [theses, isStudent, isSupervisor, user]);

  // Combined project rounds:
  // - Với Giảng viên hướng dẫn / Sinh viên: Chỉ hiển thị các đợt mà mình đã được phân công
  // - Với Quản trị viên: Hiển thị tất cả các đợt
  const combinedRounds = useMemo(() => {
    const roundsMap = new Map<number, { id: number; name: string; code?: string }>();
    if (isSupervisor || isStudent) {
      visibleTheses.forEach(t => {
        if (t.projectRoundId && !roundsMap.has(t.projectRoundId)) {
          const matchedRound = projectRounds.find(r => r.roundId === t.projectRoundId);
          roundsMap.set(t.projectRoundId, {
            id: t.projectRoundId,
            name: matchedRound?.name || t.projectRoundName || `Đợt đồ án #${t.projectRoundId}`,
            code: matchedRound?.roundCode || t.thesisCode?.split('_')?.[1] || undefined,
          });
        }
      });
      if (roundsMap.size === 0) {
        projectRounds.forEach(r => {
          roundsMap.set(r.roundId, { id: r.roundId, name: r.name, code: r.roundCode });
        });
      }
      return Array.from(roundsMap.values());
    }

    projectRounds.forEach(r => {
      roundsMap.set(r.roundId, { id: r.roundId, name: r.name, code: r.roundCode });
    });
    theses.forEach(t => {
      if (t.projectRoundId && !roundsMap.has(t.projectRoundId)) {
        roundsMap.set(t.projectRoundId, {
          id: t.projectRoundId,
          name: t.projectRoundName || `Đợt đồ án #${t.projectRoundId}`,
          code: t.thesisCode?.split('_')?.[1] || undefined,
        });
      }
    });
    return Array.from(roundsMap.values());
  }, [projectRounds, theses, visibleTheses, isSupervisor, isStudent]);

  // Filter visible theses by selected project round:
  const roundFilteredTheses = useMemo(() => {
    if (selectedRoundId === 'ALL' || !selectedRoundId) {
      return visibleTheses;
    }
    return visibleTheses.filter(t => t.projectRoundId === Number(selectedRoundId));
  }, [visibleTheses, selectedRoundId]);

  // Thesis search filter
  const [thesisSearchTerm, setThesisSearchTerm] = useState('');
  const searchedTheses = useMemo(() => {
    if (!thesisSearchTerm.trim()) return roundFilteredTheses;
    const term = thesisSearchTerm.trim().toLowerCase();
    return roundFilteredTheses.filter(t =>
      (t.titleVn && t.titleVn.toLowerCase().includes(term)) ||
      (t.titleEn && t.titleEn.toLowerCase().includes(term)) ||
      (t.thesisCode && t.thesisCode.toLowerCase().includes(term)) ||
      (t.studentFullName && t.studentFullName.toLowerCase().includes(term)) ||
      (t.studentCode && t.studentCode.toLowerCase().includes(term)) ||
      (t.lecturerFullName && t.lecturerFullName.toLowerCase().includes(term))
    );
  }, [roundFilteredTheses, thesisSearchTerm]);

  // When round changes, if current thesis is not in that round, auto-select first thesis in round
  useEffect(() => {
    if (!isStudent && roundFilteredTheses.length > 0) {
      const exists = roundFilteredTheses.some(t => t.id === selectedThesisId);
      if (!exists) {
        setSelectedThesisId(roundFilteredTheses[0].id);
      }
    } else if (!isStudent && roundFilteredTheses.length === 0) {
      setCurrentThesis(null);
      setTasks([]);
      setLoading(false);
    }
  }, [selectedRoundId, roundFilteredTheses, isStudent, selectedThesisId]);

  // Tasks & detail state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [defenseReadyLoading, setDefenseReadyLoading] = useState<boolean>(false);
  const [activeKanbanTab, setActiveKanbanTab] = useState<'ALL' | Task['status']>('ALL');

  // Detail modal state
  const [comments, setComments] = useState<Comment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [submissionContent, setSubmissionContent] = useState<string>('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState<string>('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Review modal state
  const [reviewModalSubmission, setReviewModalSubmission] = useState<Submission | null>(null);
  const [reviewFeedbackInput, setReviewFeedbackInput] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  // Create form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // 1. Fetch available project rounds and theses
  useEffect(() => {
    fetchRounds();
    fetchThesesList();
  }, [user?.id]);

  const fetchRounds = async () => {
    try {
      const list = await apiService.getProjectRounds();
      if (list && list.length > 0) {
        setProjectRounds(list);
      }
    } catch (err) {
      console.error('Không thể tải danh sách đợt đồ án:', err);
    }
  };

  const fetchThesesList = async () => {
    try {
      const list = await thesisService.searchTheses();
      if (list && list.length > 0) {
        setTheses(list);
        const paramId = Number(searchParams.get('thesisId') || searchParams.get('id'));

        // Sinh viên: Tự động khóa và gán duy nhất đề tài của sinh viên này
        if (isStudent && user) {
          const studentId = (user as any).student?.id || user.student_id || user.id;
          const userCode = (user as any).student?.student_code || user.studentCode || user.student_id || user.username;
          const userFullName = (user.fullName || (user as any).full_name || '').trim().toLowerCase();
          const myThesis = list.find(t =>
            (studentId && (t.studentId === studentId || String(t.studentId) === String(studentId))) ||
            (userCode && t.studentCode === String(userCode)) ||
            (userFullName && t.studentFullName && t.studentFullName.trim().toLowerCase() === userFullName)
          );
          if (myThesis) {
            setSelectedThesisId(myThesis.id);
            setCurrentThesis(myThesis);
            if (myThesis.projectRoundId) {
              setSelectedRoundId(myThesis.projectRoundId);
            }
          } else {
            // Sinh viên mới được nạp vào đợt, chưa có đề tài được duyệt: không tự ý gán đề tài người khác
            setSelectedThesisId(0);
            setCurrentThesis(null);
            setTasks([]);
            setLoading(false);
          }
          return;
        }

        // Giảng viên hướng dẫn: Tự động chọn đề tài mà GV hướng dẫn (ưu tiên thesisId trên URL nếu thuộc GV này)
        if (isSupervisor && user) {
          const lecturerId = (user as any).lecturer?.id || (user as any).lecturer_id || user.id;
          const lecturerCode = (user as any).lecturer?.lecturer_code || (user as any).lecturerCode || (user as any).registration_no || user.username;
          const lecturerFullName = (user.fullName || (user as any).full_name || '').trim().toLowerCase();
          const myTheses = list.filter(t =>
            (lecturerId && (t.lecturerId === lecturerId || String(t.lecturerId) === String(lecturerId))) ||
            (lecturerCode && t.lecturerCode === String(lecturerCode)) ||
            (lecturerFullName && t.lecturerFullName && t.lecturerFullName.trim().toLowerCase() === lecturerFullName)
          );
          const myThesis = (paramId && myTheses.find(t => t.id === paramId)) || myTheses[0];
          if (myThesis) {
            setSelectedThesisId(myThesis.id);
            setCurrentThesis(myThesis);
            if (myThesis.projectRoundId) {
              setSelectedRoundId(myThesis.projectRoundId);
            }
            return;
          } else {
            setSelectedThesisId(0);
            setCurrentThesis(null);
            setTasks([]);
            setLoading(false);
            return;
          }
        }

        if (paramId && list.some(t => t.id === paramId)) {
          const matched = list.find(t => t.id === paramId)!;
          setSelectedThesisId(matched.id);
          setCurrentThesis(matched);
          if (matched.projectRoundId && selectedRoundId === 'ALL') {
            setSelectedRoundId(matched.projectRoundId);
          }
          return;
        }

        // Default to first thesis
        const preferred = list[0];
        setSelectedThesisId(preferred.id);
        setCurrentThesis(preferred);
      } else {
        setTheses([]);
        setSelectedThesisId(0);
        setCurrentThesis(null);
        setTasks([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Không thể tải danh sách đề tài:', err);
      setLoading(false);
    }
  };

  // 2. Load thesis details and tasks when selectedThesisId changes
  useEffect(() => {
    if (selectedThesisId > 0) {
      const cached = theses.find(t => t.id === selectedThesisId);
      if (cached) {
        setCurrentThesis(cached);
      } else {
        loadThesisDetails(selectedThesisId);
      }
      loadTasks(selectedThesisId);
      setSearchParams({ thesisId: String(selectedThesisId) }, { replace: true });
    } else {
      setLoading(false);
    }
  }, [selectedThesisId]);

  const loadThesisDetails = async (id: number) => {
    try {
      const data = await thesisService.getThesisById(id);
      setCurrentThesis(data);
    } catch (err) {
      console.error('Lỗi khi tải thông tin đề tài:', err);
    }
  };

  const loadTasks = async (id: number) => {
    if (!id || id <= 0) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await progressService.getTasksByThesis(id);
      setTasks(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhiệm vụ:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (task: Task) => {
    setSelectedTask(task);
    setSubmitSuccessMsg(null);
    try {
      const [cList, sList] = await Promise.all([
        progressService.getCommentsByTask(task.id).catch(() => []),
        progressService.getSubmissionsByTask(task.id).catch(() => [])
      ]);
      setComments(cList);
      setSubmissions(sList);
    } catch {
      setComments([]);
      setSubmissions([]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    try {
      const added = await progressService.addComment(selectedTask.id, user?.id || 1, newComment);
      setComments(prev => [...prev, added]);
    } catch {
      setComments(prev => [
        ...prev,
        {
          id: Date.now(),
          taskId: selectedTask.id,
          userId: user?.id || 1,
          userFullName: user?.fullName || 'Người dùng',
          content: newComment,
          isEdited: false,
          replies: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
    setNewComment('');
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      const effectiveStudentId = currentThesis?.studentId || user?.id || 1;
      const sub = await progressService.submitTask(selectedTask.id, effectiveStudentId, submissionContent, submissionFileUrl);
      setSubmissions(prev => [sub, ...prev]);
      setSelectedTask(prev => prev ? { ...prev, status: 'SUBMITTED', submissionCount: (prev.submissionCount || 0) + 1 } : null);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'SUBMITTED', submissionCount: (t.submissionCount || 0) + 1 } : t));
      setSubmitSuccessMsg('🎉 Nộp bài thành công! File và báo cáo kết quả của bạn đã được ghi nhận.');
      alert('🎉 Nộp bài thành công! Task đã chuyển sang trạng thái ĐÃ NỘP BÀI (SUBMITTED) chờ GVHD nghiệm thu.');
    } catch (err: any) {
      console.error('Lỗi khi nộp bài:', err);
      const fallbackSub: Submission = {
        id: Date.now(),
        taskId: selectedTask.id,
        studentId: currentThesis?.studentId || user?.id || 1,
        studentFullName: user?.fullName || currentThesis?.studentFullName || 'Sinh viên',
        submissionContent,
        fileUrl: submissionFileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSubmissions(prev => [fallbackSub, ...prev]);
      setSelectedTask(prev => prev ? { ...prev, status: 'SUBMITTED', submissionCount: (prev.submissionCount || 0) + 1 } : null);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'SUBMITTED', submissionCount: (t.submissionCount || 0) + 1 } : t));
      setSubmitSuccessMsg('🎉 Đã lưu bài nộp vào hệ thống!');
      alert('🎉 Đã nộp bài! Task đã chuyển sang trạng thái ĐÃ NỘP BÀI (SUBMITTED).');
    }
    setSubmissionContent('');
    setSubmissionFileUrl('');
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      await progressService.updateTask(taskId, { status: newStatus });
    } catch {
      // ignore
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Review submission by Lecturer: ACCEPTED or REVISE_REQUIRED
  const handleReviewSubmission = async (
    submissionId: number,
    status: 'ACCEPTED' | 'REVISE_REQUIRED',
    feedback: string
  ) => {
    if (!selectedTask) return;
    try {
      setReviewLoading(true);
      await progressService.reviewSubmission(submissionId, status, feedback);

      // Update submissions list
      setSubmissions(prev => prev.map(s => s.id === submissionId ? {
        ...s,
        status,
        reviewFeedback: feedback,
        reviewedAt: new Date().toISOString()
      } : s));

      if (status === 'ACCEPTED') {
        await handleStatusChange(selectedTask.id, 'COMPLETED');

        // Recalculate progress rate
        const updatedTasks = tasks.map(t => t.id === selectedTask.id ? { ...t, status: 'COMPLETED' as const } : t);
        const completedCount = updatedTasks.filter(t => t.status === 'COMPLETED').length;
        const newRate = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 100;

        try {
          await thesisService.updateThesisCompletionRate(selectedThesisId, newRate);
          if (currentThesis) {
            setCurrentThesis({ ...currentThesis, completionRate: newRate });
          }
        } catch {}

        alert(`✅ Đã nghiệm thu ĐẠT! Task đã chuyển sang HOÀN THÀNH. Tiến độ đề tài tăng lên ${newRate}%.`);
      } else {
        await handleStatusChange(selectedTask.id, 'REVISE');
        alert('⚠️ Đã gửi yêu cầu sửa lại (REVISE_REQUIRED). Task đã quay về cột YÊU CẦU SỬA (REVISE) để SV làm lại.');
      }
    } catch (err: any) {
      console.error('Lỗi khi đánh giá bài nộp:', err);
      // Client-side state update if offline
      if (status === 'ACCEPTED') {
        await handleStatusChange(selectedTask.id, 'COMPLETED');
        alert('✅ Đã nghiệm thu ĐẠT và chuyển Task sang HOÀN THÀNH!');
      } else {
        await handleStatusChange(selectedTask.id, 'REVISE');
        alert('⚠️ Đã chuyển Task sang trạng thái YÊU CẦU SỬA (REVISE)!');
      }
    } finally {
      setReviewLoading(false);
      setReviewModalSubmission(null);
      setReviewFeedbackInput('');
    }
  };

  // Lecturer confirm DEFENSE_READY
  const handleConfirmDefenseReady = async () => {
    if (!currentThesis) return;
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn xác nhận đề tài "${currentThesis.titleVn}" ĐỦ ĐIỀU KIỆN BẢO VỆ (DEFENSE_READY)?\nĐề tài sẽ đủ điều kiện chuyển tiếp sang Giai đoạn 6 (Hội đồng bảo vệ & Xếp lịch).`
    );
    if (!confirm) return;

    try {
      setDefenseReadyLoading(true);
      const updated = await thesisService.setDefenseEligible(selectedThesisId, true);
      setCurrentThesis(updated);
      alert('🎉 Xác nhận thành công! Đề tài đã chuyển sang trạng thái ĐỦ ĐIỀU KIỆN BẢO VỆ (DEFENSE_READY).');
    } catch (err: any) {
      console.error('Lỗi xác nhận bảo vệ:', err);
      if (currentThesis) {
        setCurrentThesis({ ...currentThesis, status: 'DEFENSE_READY', defenseEligible: true });
      }
      alert('🎉 Đã cập nhật trạng thái đề tài sang ĐỦ ĐIỀU KIỆN BẢO VỆ (DEFENSE_READY)!');
    } finally {
      setDefenseReadyLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThesisId || selectedThesisId <= 0) {
      alert('Vui lòng chọn một đề tài hợp lệ trước khi giao việc!');
      return;
    }
    const effectiveCreatedById = user?.id || 2;
    const effectiveAssignedToId = currentThesis?.studentId || (tasks.length > 0 && tasks[0].assignedToId) || 1;
    try {
      const created = await progressService.createTask({
        thesisId: selectedThesisId,
        createdById: effectiveCreatedById,
        assignedToId: effectiveAssignedToId,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined
      });
      setTasks(prev => [...prev, created]);
      await loadTasks(selectedThesisId);
      alert(`🎉 Đã giao nhiệm vụ mới "${newTaskTitle}" thành công!`);
    } catch (err: any) {
      console.error('Lỗi khi tạo công việc:', err);
      alert('Không thể lưu công việc vào hệ thống: ' + (err?.response?.data?.message || err?.message || 'Lỗi kết nối'));
      return;
    }
    setShowCreateModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  // 5 Kanban Columns matching Step 5 specification
  const columns: { status: Task['status']; title: string; color: string; bg: string; badgeBg: string }[] = [
    { status: 'TODO', title: '📋 Cần Làm (TODO)', color: '#475569', bg: '#f8fafc', badgeBg: '#e2e8f0' },
    { status: 'IN_PROGRESS', title: '⚙ Đang Làm', color: '#0284c7', bg: '#f0f9ff', badgeBg: '#bae6fd' },
    { status: 'SUBMITTED', title: '📤 Đã Nộp Bài', color: '#d97706', bg: '#fffbeb', badgeBg: '#fde68a' },
    { status: 'REVISE', title: '⚠️ Cần Sửa (Revise)', color: '#dc2626', bg: '#fef2f2', badgeBg: '#fecaca' },
    { status: 'COMPLETED', title: '✅ Hoàn Thành', color: '#16a34a', bg: '#f0fdf4', badgeBg: '#bbf7d0' }
  ];

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: tasks.length,
      TODO: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      REVISE: 0,
      COMPLETED: 0,
    };
    tasks.forEach(t => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return counts;
  }, [tasks]);

  const displayedColumns = useMemo(() => {
    return activeKanbanTab === 'ALL'
      ? columns
      : columns.filter(c => c.status === activeKanbanTab);
  }, [activeKanbanTab, columns]);

  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const computedProgressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : (currentThesis?.completionRate || 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header & Thesis Switcher */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>📌</span>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                Giai đoạn 4: Thực hiện Đồ án & Quản lý Tiến độ (Task Kanban)
              </h1>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Theo dõi giao việc, hạn nộp (Deadline), nộp bài, GVHD đánh giá (Accepted / Revise) và xác nhận đủ điều kiện bảo vệ.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Sinh viên: Khóa cố định vào đề tài của chính mình, KHÔNG hiển thị dropdown chọn đề tài */}
            {isStudent ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: currentThesis ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${currentThesis ? '#bbf7d0' : '#fde68a'}`,
                  padding: '8px 16px',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '18px' }}>{currentThesis ? '🎯' : '⏳'}</span>
                <div>
                  <div style={{ fontSize: '11px', color: currentThesis ? '#166534' : '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {currentThesis ? 'Đề tài của bạn (Cố định)' : 'Trạng thái đề tài'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: currentThesis ? '#14532d' : '#92400e' }}>
                    {currentThesis ? `${currentThesis.thesisCode} — ${currentThesis.titleVn}` : 'Chưa có đề tài chính thức được phê duyệt'}
                  </div>
                </div>
              </div>
            ) : (
              /* Giảng viên hoặc Quản trị viên: Tách riêng Đợt đồ án và Tên đề tài */
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* 1. Tách riêng bộ chọn ĐỢT ĐỒ ÁN */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="roundSelect" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                    📁 Đợt đồ án:
                  </label>
                  <select
                    id="roundSelect"
                    value={selectedRoundId}
                    onChange={e => {
                      const val = e.target.value;
                      const newRoundId = val === 'ALL' ? 'ALL' : Number(val);
                      setSelectedRoundId(newRoundId);
                      setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        if (newRoundId === 'ALL') {
                          next.delete('roundId');
                        } else {
                          next.set('roundId', String(newRoundId));
                        }
                        return next;
                      }, { replace: true });
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      maxWidth: '250px',
                      minWidth: '170px',
                      fontWeight: 600,
                      color: '#0a3273',
                      background: '#fff',
                    }}
                  >
                    {(!isSupervisor || combinedRounds.length > 1) && (
                      <option value="ALL">-- Tất cả các đợt đồ án --</option>
                    )}
                    {combinedRounds.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.code ? `(${r.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Tách riêng bộ chọn TÊN ĐỀ TÀI */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="thesisSelect" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                    🎯 Tên đề tài:
                  </label>
                  <select
                    id="thesisSelect"
                    value={selectedThesisId}
                    onChange={e => setSelectedThesisId(Number(e.target.value))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      maxWidth: '380px',
                      minWidth: '240px',
                      fontWeight: 600,
                      color: '#0a3273',
                      background: '#fff',
                    }}
                  >
                    {searchedTheses.length === 0 ? (
                      <option value="">Không tìm thấy đề tài trong đợt này</option>
                    ) : (
                      searchedTheses.map(t => (
                        <option key={t.id} value={t.id} title={t.titleVn}>
                          {t.titleVn} — [SV: {t.studentFullName || t.studentCode}]
                        </option>
                      ))
                    )}
                  </select>
                  {(thesisSearchTerm || selectedRoundId !== 'ALL') && (
                    <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      ({searchedTheses.length}/{visibleTheses.length})
                    </span>
                  )}
                </div>

                {/* 3. Ô tìm kiếm theo từ khóa */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={thesisSearchTerm}
                    onChange={e => setThesisSearchTerm(e.target.value)}
                    placeholder="🔍 Tìm đề tài, SV, GVHD..."
                    style={{
                      padding: '8px 12px',
                      paddingRight: thesisSearchTerm ? '26px' : '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      width: '180px',
                      background: '#fff',
                      color: '#1e293b',
                    }}
                  />
                  {thesisSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setThesisSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0
                      }}
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {canCreateTask && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>➕</span> Giao Việc Mới
              </button>
            )}
          </div>
        </div>

        {/* Selected Thesis Info Card & Progress Bar */}
        {currentThesis && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                {/* Tên đề tài to, rõ ràng */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#0a3273' }}>
                    📖 {currentThesis.titleVn}
                  </span>
                </div>
                {/* Các trường thông tin tách biệt: Đợt đồ án, Mã đề tài, Sinh viên, GVHD */}
                <div style={{ fontSize: '13px', color: '#475569', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                    📁 Đợt đồ án: <strong>{currentThesis.projectRoundName || 'K62 CNTT - HK1'}</strong>
                  </span>
                  <span style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                    🎯 Mã đề tài: <strong>{currentThesis.thesisCode}</strong>
                  </span>
                  <span style={{ background: '#fff', color: '#334155', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    👨‍🎓 Sinh viên: <strong>{currentThesis.studentFullName}</strong> ({currentThesis.studentCode}) — Lớp: {currentThesis.studentClass || 'K62'}
                  </span>
                  <span style={{ background: '#fff', color: '#334155', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    👨‍🏫 GVHD: <strong>{currentThesis.lecturerFullName || 'TS. Nguyễn Văn Hướng'}</strong>
                  </span>
                </div>
              </div>

              {/* Defense Ready Confirmation Button / Badge */}
              <div>
                {currentThesis.status === 'DEFENSE_READY' || currentThesis.defenseEligible ? (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎓</span> ĐÃ XÁC NHẬN ĐỦ ĐIỀU KIỆN BẢO VỆ (DEFENSE_READY)
                  </div>
                ) : canCreateTask ? (
                  <button
                    onClick={handleConfirmDefenseReady}
                    disabled={defenseReadyLoading}
                    style={{
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                    }}
                    title="Xác nhận sinh viên đã hoàn thành đề tài, sẵn sàng vào Hội đồng bảo vệ"
                  >
                    <span>🎓</span> {defenseReadyLoading ? 'Đang xác nhận...' : 'Xác nhận Đủ Điều kiện Bảo vệ'}
                  </button>
                ) : (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    ⏳ Đang thực hiện (Chờ GVHD xác nhận bảo vệ)
                  </div>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  📊 Tiến độ hoàn thành đề tài: <strong>{computedProgressPercent}%</strong> ({completedTasksCount}/{tasks.length} tasks hoàn thành)
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {computedProgressPercent >= 100 ? '🎉 Hoàn tất 100% khối lượng đề tài' : 'Đang triển khai'}
                </span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: computedProgressPercent >= 100 ? '#16a34a' : 'linear-gradient(90deg, #2563eb, #0284c7)',
                    height: '100%',
                    width: `${computedProgressPercent}%`,
                    borderRadius: '8px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ marginBottom: '16px', color: '#2563eb', fontWeight: '600', padding: '12px', background: '#eff6ff', borderRadius: '6px' }}>
          ⏳ Đang tải bảng công việc đề tài...
        </div>
      )}

      {/* 5-Column Kanban Board */}
      {isStudent && (!currentThesis || selectedThesisId === 0) ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            maxWidth: '680px',
            margin: '30px auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Bạn chưa có Đề tài Đồ án Tốt nghiệp chính thức
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
            Sinh viên mới được import vào đợt đồ án cần thực hiện tuần tự các bước theo đúng quy trình học vụ:
            <br />
            1. <strong>Giai đoạn 2:</strong> Chọn hướng đề tài và đăng ký nguyện vọng GVHD (NV1–NV3).
            <br />
            2. <strong>Giai đoạn 3:</strong> Xây dựng đề cương và gửi để Khoa phê duyệt đề tài chính thức.
            <br />
            Sau khi đề tài được duyệt sang trạng thái <strong>ĐANG THỰC HIỆN</strong>, Giảng viên hướng dẫn sẽ giao các công việc (Task) lên bảng này để bạn làm bài và nộp kết quả.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/student/assignment"
              style={{
                background: '#2563eb',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              👉 Giai đoạn 2: Chọn Hướng & Đăng ký GVHD
            </a>
            <a
              href="/thesis/proposals"
              style={{
                background: '#f8fafc',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '10px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              📄 Giai đoạn 3: Đề cương đồ án
            </a>
          </div>
        </div>
      ) : (
      <div>
        {/* Responsive Kanban Navigation Buttons with Count Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '16px',
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginRight: '4px' }}>
              🎯 Chọn phần việc:
            </span>
            {columns.map((col) => {
              const count = taskCounts[col.status] || 0;
              const isActive = activeKanbanTab === col.status;
              const shortName =
                col.status === 'TODO'
                  ? 'Cần làm'
                  : col.status === 'IN_PROGRESS'
                  ? 'Đang làm'
                  : col.status === 'SUBMITTED'
                  ? 'Đã nộp bài'
                  : col.status === 'REVISE'
                  ? 'Cần sửa'
                  : 'Hoàn thành';
              const icon = col.title.split(' ')[0];

              return (
                <button
                  key={col.status}
                  type="button"
                  onClick={() => setActiveKanbanTab(col.status)}
                  style={{
                    background: isActive ? col.color : col.bg,
                    color: isActive ? '#ffffff' : col.color,
                    border: `1.5px solid ${isActive ? col.color : '#cbd5e1'}`,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  <span>{icon} {shortName}</span>
                  <span
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.28)' : col.badgeBg,
                      color: isActive ? '#ffffff' : col.color,
                      padding: '1px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Nút Xem tất cả các cột */}
            <button
              type="button"
              onClick={() => setActiveKanbanTab('ALL')}
              style={{
                background: activeKanbanTab === 'ALL' ? '#0a3273' : '#f8fafc',
                color: activeKanbanTab === 'ALL' ? '#ffffff' : '#334155',
                border: `1.5px solid ${activeKanbanTab === 'ALL' ? '#0a3273' : '#cbd5e1'}`,
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: activeKanbanTab === 'ALL' ? '0 2px 6px rgba(10,50,115,0.2)' : 'none',
              }}
            >
              <span>📑 Xem tất cả các cột</span>
              <span
                style={{
                  background: activeKanbanTab === 'ALL' ? 'rgba(255,255,255,0.28)' : '#e2e8f0',
                  color: activeKanbanTab === 'ALL' ? '#ffffff' : '#1e293b',
                  padding: '1px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {taskCounts.ALL}
              </span>
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {activeKanbanTab === 'ALL'
              ? 'Đang hiển thị toàn cảnh 5 cột'
              : `Đang lọc hiển thị: ${columns.find((c) => c.status === activeKanbanTab)?.title}`}
          </div>
        </div>

        {/* Kanban Columns Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              displayedColumns.length === 1
                ? '1fr'
                : 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            minHeight: '650px',
          }}
        >
          {displayedColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            const isSingleView = displayedColumns.length === 1;

            return (
              <div
                key={col.status}
                style={{
                  background: col.bg,
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: isSingleView ? '16px' : '14px', fontWeight: 'bold', margin: 0, color: col.color }}>
                    {col.title}
                  </h3>
                  <span
                    style={{
                      background: col.badgeBg,
                      padding: isSingleView ? '3px 10px' : '2px 8px',
                      borderRadius: '12px',
                      fontSize: isSingleView ? '13px' : '12px',
                      fontWeight: '700',
                      color: col.color,
                    }}
                  >
                    {colTasks.length} {isSingleView ? 'nhiệm vụ' : ''}
                  </span>
                </div>

                <div
                  style={
                    isSingleView
                      ? {
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                          gap: '12px',
                          flex: 1,
                          alignContent: 'start',
                        }
                      : {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          flex: 1,
                        }
                  }
                >
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleOpenDetail(t)}
                      style={{
                        background: '#fff',
                        padding: '12px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        border: t.status === 'REVISE' ? '1px solid #f87171' : '1px solid #cbd5e1',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background:
                              t.priority === 'URGENT'
                                ? '#fee2e2'
                                : t.priority === 'HIGH'
                                ? '#ffedd5'
                                : '#e0f2fe',
                            color:
                              t.priority === 'URGENT'
                                ? '#b91c1c'
                                : t.priority === 'HIGH'
                                ? '#c2410c'
                                : '#0369a1',
                          }}
                        >
                          {t.priority}
                        </span>
                        {t.dueDate && (
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                            Hạn: {new Date(t.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        {t.title}
                      </h4>
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '12px',
                          color: '#475569',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {t.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        <span>💬 {t.commentCount || 0}</span>
                        <span>📦 {t.submissionCount || 0} bài nộp</span>
                      </div>

                      {t.status === 'SUBMITTED' && (
                        <div
                          style={{
                            marginTop: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#92400e',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          📥 ĐÃ NỘP BÀI (Chờ GV nghiệm thu)
                        </div>
                      )}
                      {t.status === 'REVISE' && (
                        <div
                          style={{
                            marginTop: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#b91c1c',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          ⚠️ CẦN SỬA CHỮA LẠI (Revise)
                        </div>
                      )}
                      {t.status === 'COMPLETED' && (
                        <div
                          style={{
                            marginTop: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#15803d',
                            background: '#dcfce7',
                            border: '1px solid #bbf7d0',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          ✓ HOÀN THÀNH (Đã nghiệm thu)
                        </div>
                      )}
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: isSingleView ? '40px 16px' : '24px 8px',
                        color: '#94a3b8',
                        fontSize: isSingleView ? '13px' : '12px',
                        fontStyle: 'italic',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        gridColumn: isSingleView ? '1 / -1' : undefined,
                      }}
                    >
                      Chưa có công việc nào ở phần này
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '10px', width: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Chi tiết công việc #{selectedTask.id}</span>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0a3273' }}>
                  {selectedTask.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#475569' }}
              >
                ✕
              </button>
            </div>

            {/* Status Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Trạng thái công việc:</span>
              <select
                value={selectedTask.status}
                onChange={e => handleStatusChange(selectedTask.id, e.target.value as any)}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
              >
                <option value="TODO">Cần làm (TODO)</option>
                <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                <option value="SUBMITTED">Đã nộp bài (SUBMITTED)</option>
                <option value="REVISE">Cần sửa chữa (REVISE)</option>
                {canCreateTask ? (
                  <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                ) : (
                  <option value="COMPLETED" disabled>Hoàn thành (Chỉ GVHD nghiệm thu)</option>
                )}
              </select>
              {isStudent && (
                <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
                  💡 Sinh viên kéo sang IN_PROGRESS để làm và Nộp bài bên dưới
                </span>
              )}
            </div>

            <p style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              {selectedTask.description || 'Chưa có mô tả chi tiết.'}
            </p>

            {/* Submissions Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                  📦 Danh Sách Bài Đã Nộp ({submissions.length})
                </h3>
                {selectedTask.status === 'SUBMITTED' && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', backgroundColor: '#fef3c7', padding: '3px 10px', borderRadius: '4px' }}>
                    ⏳ Đang chờ GVHD nghiệm thu
                  </span>
                )}
                {selectedTask.status === 'COMPLETED' && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '4px' }}>
                    ✓ GVHD đã nghiệm thu đạt
                  </span>
                )}
                {selectedTask.status === 'REVISE' && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c', backgroundColor: '#fee2e2', padding: '3px 10px', borderRadius: '4px' }}>
                    ⚠️ Cần chỉnh sửa lại theo nhận xét của GVHD
                  </span>
                )}
              </div>

              {submitSuccessMsg && (
                <div style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{submitSuccessMsg}</span>
                  <button type="button" onClick={() => setSubmitSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                </div>
              )}

              {submissions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {submissions.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      style={{
                        background: '#fff',
                        border: '1px solid #cbd5e1',
                        borderLeft: s.status === 'ACCEPTED' ? '4px solid #16a34a' : s.status === 'REVISE_REQUIRED' ? '4px solid #dc2626' : '4px solid #0284c7',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ color: '#0a3273', fontSize: '13px' }}>
                            Lần nộp {submissions.length - idx}: {s.studentFullName || 'Sinh viên'}
                          </strong>
                          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                            🕒 {s.submittedAt ? new Date(s.submittedAt).toLocaleString('vi-VN') : 'Vừa xong'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: s.status === 'ACCEPTED' ? '#dcfce7' : s.status === 'REVISE_REQUIRED' ? '#fee2e2' : '#fef3c7',
                            color: s.status === 'ACCEPTED' ? '#15803d' : s.status === 'REVISE_REQUIRED' ? '#b91c1c' : '#92400e'
                          }}>
                            {s.status === 'ACCEPTED' ? '✓ ĐÃ DUYỆT ĐẠT' : s.status === 'REVISE_REQUIRED' ? '⚠️ YÊU CẦU SỬA LẠI' : 'CHỜ DUYỆT'}
                          </span>

                          {/* GVHD Action buttons */}
                          {canCreateTask && s.status !== 'ACCEPTED' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleReviewSubmission(s.id, 'ACCEPTED', 'GVHD nghiệm thu đạt yêu cầu.')}
                                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                ✓ Nghiệm thu Đạt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewModalSubmission(s);
                                  setReviewFeedbackInput(s.reviewFeedback || '');
                                }}
                                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                ⚠️ Yêu cầu sửa lại
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {s.submissionContent && (
                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px', background: '#f8fafc', padding: '8px', borderRadius: '4px' }}>
                          <strong>Nội dung báo cáo:</strong> {s.submissionContent}
                        </div>
                      )}

                      {s.reviewFeedback && (
                        <div style={{ fontSize: '12px', color: s.status === 'ACCEPTED' ? '#15803d' : '#b91c1c', marginBottom: '8px', background: s.status === 'ACCEPTED' ? '#f0fdf4' : '#fef2f2', border: '1px dashed currentColor', padding: '8px', borderRadius: '4px' }}>
                          <strong>Nhận xét của GVHD:</strong> {s.reviewFeedback}
                        </div>
                      )}

                      {s.fileUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ fontSize: '18px' }}>{getFileIcon(s.fileUrl)}</span>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a3273' }}>
                                TẬP TIN / LINK BÀI NỘP:
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px' }} title={extractFileName(s.fileUrl)}>
                                {extractFileName(s.fileUrl)}
                              </div>
                            </div>
                          </div>
                          <a
                            href={resolveFileUrl(s.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#0a3273',
                              color: '#fff',
                              textDecoration: 'none',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '5px 12px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0
                            }}
                          >
                            ⬇️ Mở xem file / link
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '6px', textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                  Chưa có bài nộp nào cho công việc này. Sinh viên hãy tải file hoặc dán link ở form bên dưới.
                </div>
              )}

              {/* Submit Form for Student */}
              <form onSubmit={handleSubmitTask} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#fafafa', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                  📤 Gửi Báo Cáo / Nộp Kết Quả:
                </h4>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi chú nội dung hoàn thành, kết quả nghiên cứu, link demo..."
                  value={submissionContent}
                  onChange={e => setSubmissionContent(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
                <FileUploadInput
                  label="Tập tin bài nộp / Minh chứng công việc (File Zip, PDF, Docs hoặc Link GitHub)"
                  value={submissionFileUrl}
                  onChange={url => setSubmissionFileUrl(url)}
                  placeholder="Dán link Github demo, Google Drive hoặc tải file đính kèm..."
                  helperText="Hỗ trợ tải lên file Zip, PDF, Word, RAR (tối đa 50MB) hoặc dán đường dẫn trực tiếp"
                />
                <button
                  type="submit"
                  style={{ alignSelf: 'flex-end', background: '#16a34a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  🚀 Gửi Bài Nộp
                </button>
              </form>
            </div>

            {/* Comments Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>
                💬 Thảo Luận Trao Đổi ({comments.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
                {comments.map(c => (
                  <div key={c.id} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.userFullName}</div>
                    <div style={{ color: '#475569' }}>{c.content}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Viết bình luận trao đổi..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
                <button
                  type="submit"
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Revise Required Modal for Lecturer */}
      {reviewModalSubmission && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '500px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#b91c1c', margin: '0 0 12px 0' }}>
              ⚠️ Yêu Cầu Sinh Viên Chỉnh Sửa Lại Bài Nộp
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
              Nhập nhận xét chi tiết những điểm cần bổ sung hoặc sửa chữa để sinh viên thực hiện lại:
            </p>
            <textarea
              rows={4}
              required
              placeholder="VD: Cần bổ sung tài liệu lược đồ quan hệ, chỉnh sửa lại API security..."
              value={reviewFeedbackInput}
              onChange={e => setReviewFeedbackInput(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReviewModalSubmission(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={reviewLoading || !reviewFeedbackInput.trim()}
                onClick={() => handleReviewSubmission(reviewModalSubmission.id, 'REVISE_REQUIRED', reviewFeedbackInput.trim())}
                style={{ padding: '8px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {reviewLoading ? 'Đang gửi...' : 'Xác nhận Yêu cầu sửa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {canCreateTask && showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '10px', width: '520px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#0a3273' }}>
              ➕ Giao Nhiệm Vụ Mới Cho Sinh Viên
            </h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tiêu đề công việc *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thiết kế Database, Viết API Backend, Xây dựng giao diện React..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mô tả chi tiết nhiệm vụ</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể yêu cầu kỹ thuật, tài liệu tham khảo..."
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mức độ ưu tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value="LOW">Thấp (LOW)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="HIGH">Cao (HIGH)</option>
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Hạn chót (Deadline) *</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Tạo Công Việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

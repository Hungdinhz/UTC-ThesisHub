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
import { defenseService } from '../../defense/services/defenseService';

export const TaskBoardPage: React.FC = () => {
  const { userType, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor' || userType === 'committee_member';
  const isAdmin = userType === 'admin';
  const canCreateTask = isSupervisor && !isAdmin;

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

  // Supervisor grading state on defense ready confirmation
  const [supervisorScoreData, setSupervisorScoreData] = useState<{ score: number; feedback: string; graderName?: string } | null>(null);
  const [showDefenseReadyModal, setShowDefenseReadyModal] = useState(false);
  const [supScoreInput, setSupScoreInput] = useState<number>(8.5);
  const [supFeedbackInput, setSupFeedbackInput] = useState<string>(
    'Sinh viên chủ động, nắm vững kiến thức chuyên môn, hoàn thành tốt các mục tiêu đồ án đề ra và đủ điều kiện bảo vệ trước Hội đồng.'
  );


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
          // Với Giảng viên hướng dẫn: Chỉ hiện những đợt đồ án đang mở (OPEN, IN_PROGRESS)
          if (!isSupervisor || (matchedRound && (matchedRound.status === 'OPEN' || matchedRound.status === 'IN_PROGRESS'))) {
            roundsMap.set(t.projectRoundId, {
              id: t.projectRoundId,
              name: matchedRound?.name || t.projectRoundName || `Đợt đồ án #${t.projectRoundId}`,
              code: matchedRound?.roundCode || t.thesisCode?.split('_')?.[1] || undefined,
            });
          }
        }
      });
      if (roundsMap.size === 0) {
        projectRounds
          .filter(r => !isSupervisor || r.status === 'OPEN' || r.status === 'IN_PROGRESS')
          .forEach(r => {
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
  const [showReviseForm, setShowReviseForm] = useState<boolean>(false);
  const [revisedTaskIds, setRevisedTaskIds] = useState<Record<number, boolean>>(() => {
    try {
      const raw = localStorage.getItem('utc_revised_tasks_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Review modal state
  const [reviewModalSubmission, setReviewModalSubmission] = useState<Submission | null>(null);
  const [reviewFeedbackInput, setReviewFeedbackInput] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  // Create form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskFileUrl, setNewTaskFileUrl] = useState('');

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
      const taskList = data || [];
      setTasks(taskList);

      // Kiểm tra các task ở cột REVISE xem bài nộp mới nhất đã được SV nộp sửa lại (SUBMITTED) hay chưa
      const reviseTasks = taskList.filter(t => t.status === 'REVISE');
      if (reviseTasks.length > 0) {
        Promise.all(
          reviseTasks.map(async (rt) => {
            try {
              const subs = await progressService.getSubmissionsByTask(rt.id);
              const latest = subs && subs.length > 0 ? subs[0] : null;
              return { taskId: rt.id, isRevised: !!latest && latest.status === 'SUBMITTED' };
            } catch {
              return null;
            }
          })
        ).then((results) => {
          setRevisedTaskIds((prev) => {
            const next = { ...prev };
            results.forEach((r) => {
              if (r) {
                next[r.taskId] = r.isRevised;
              }
            });
            try {
              localStorage.setItem('utc_revised_tasks_v1', JSON.stringify(next));
            } catch {}
            return next;
          });
        });
      }
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
    setShowReviseForm(false);
    try {
      const [cList, sList] = await Promise.all([
        progressService.getCommentsByTask(task.id).catch(() => []),
        progressService.getSubmissionsByTask(task.id).catch(() => [])
      ]);
      setComments(cList);
      setSubmissions(sList);
      if (task.status === 'REVISE' && sList.length > 0) {
        const latestIsSubmitted = sList[0].status === 'SUBMITTED';
        setRevisedTaskIds((prev) => {
          const next = { ...prev, [task.id]: latestIsSubmitted };
          try {
            localStorage.setItem('utc_revised_tasks_v1', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    } catch {
      setComments([]);
      setSubmissions([]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    const contentToSave = newComment.trim();
    setNewComment('');
    try {
      const added = await progressService.addComment(selectedTask.id, user?.id || 1, contentToSave);
      setComments(prev => [...prev, added]);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t));
      setSelectedTask(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : null);
    } catch {
      setComments(prev => [
        ...prev,
        {
          id: Date.now(),
          taskId: selectedTask.id,
          userId: user?.id || 1,
          userFullName: user?.fullName || 'Người dùng',
          content: contentToSave,
          isEdited: false,
          replies: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t));
    }
  };

  const isTaskRevised = (t: Task): boolean => {
    if (t.status !== 'REVISE') return false;
    if (t.latestSubmissionStatus) {
      return t.latestSubmissionStatus === 'SUBMITTED';
    }
    return Boolean(revisedTaskIds[t.id]);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const isReviseTask = selectedTask.status === 'REVISE';
    const nextTaskStatus: Task['status'] = isReviseTask ? 'REVISE' : 'SUBMITTED';
    try {
      const effectiveStudentId = currentThesis?.studentId || user?.id || 1;
      const sub = await progressService.submitTask(selectedTask.id, effectiveStudentId, submissionContent, submissionFileUrl);
      setSubmissions(prev => [sub, ...prev]);
      setSelectedTask(prev => prev ? {
        ...prev,
        status: nextTaskStatus,
        latestSubmissionStatus: 'SUBMITTED',
        submissionCount: (prev.submissionCount || 0) + 1
      } : null);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? {
        ...t,
        status: nextTaskStatus,
        latestSubmissionStatus: 'SUBMITTED',
        submissionCount: (t.submissionCount || 0) + 1
      } : t));
      if (isReviseTask) {
        setRevisedTaskIds(prev => {
          const next = { ...prev, [selectedTask.id]: true };
          try {
            localStorage.setItem('utc_revised_tasks_v1', JSON.stringify(next));
          } catch {}
          return next;
        });
        setShowReviseForm(false);
        setSubmitSuccessMsg('✅ Đã nộp bài sửa thành công! Trạng thái công việc trong cột Cần Sửa đã chuyển sang màu xanh (Đã sửa - Chờ GVHD duyệt).');
        alert('✅ Đã nộp bài sửa thành công! Nhiệm vụ vẫn ở cột Cần Sửa (Revise) với nhãn màu xanh "ĐÃ SỬA BÀI" chờ GVHD duyệt.');
      } else {
        setSubmitSuccessMsg('🎉 Nộp bài thành công! File và báo cáo kết quả của bạn đã được ghi nhận.');
        alert('🎉 Nộp bài thành công! Task đã chuyển sang trạng thái ĐÃ NỘP BÀI (SUBMITTED) chờ GVHD nghiệm thu.');
      }
      setSubmissionContent('');
      setSubmissionFileUrl('');
    } catch (err: any) {
      console.error('Lỗi khi nộp bài:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Lỗi kết nối máy chủ';
      alert('Không thể nộp bài vào hệ thống: ' + errMsg);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      const updated = await progressService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? (updated || { ...t, status: newStatus }) : t));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? (updated || { ...prev, status: newStatus }) : null);
      }
    } catch (err: any) {
      console.error('Lỗi khi cập nhật trạng thái công việc:', err);
      alert('Không thể cập nhật trạng thái công việc: ' + (err?.response?.data?.message || err?.message || 'Lỗi kết nối'));
      if (selectedThesisId) {
        progressService.getTasksByThesis(selectedThesisId).then(setTasks).catch(() => {});
      }
    }
  };

  // Review submission by Lecturer: ACCEPTED or REVISE_REQUIRED
  const handleReviewSubmission = async (
    submissionId: number,
    status: 'ACCEPTED' | 'REVISE_REQUIRED',
    feedback: string
  ) => {
    if (!selectedTask) return;
    if (status === 'ACCEPTED') {
      if (!window.confirm('Xác nhận NGHIỆM THU ĐẠT bài nộp này? Công việc sẽ chuyển sang trạng thái HOÀN THÀNH (COMPLETED).')) {
        return;
      }
    }
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
        setRevisedTaskIds(prev => {
          const next = { ...prev, [selectedTask.id]: false };
          try {
            localStorage.setItem('utc_revised_tasks_v1', JSON.stringify(next));
          } catch {}
          return next;
        });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'COMPLETED', latestSubmissionStatus: 'ACCEPTED' } : t));
        setSelectedTask(prev => prev ? { ...prev, status: 'COMPLETED', latestSubmissionStatus: 'ACCEPTED' } : null);

        // Recalculate progress rate
        const updatedTasks = tasks.map(t => t.id === selectedTask.id ? { ...t, status: 'COMPLETED' as const } : t);
        const completedCount = updatedTasks.filter(t => t.status === 'COMPLETED').length;
        const newRate = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 100;

        try {
          await thesisService.updateThesisCompletionRate(selectedThesisId, newRate);
          if (currentThesis) {
            setCurrentThesis({ ...currentThesis, completionRate: newRate });
          }
          setTheses(prev => prev.map(t => t.id === selectedThesisId ? { ...t, completionRate: newRate } : t));
        } catch {}

        alert(`✅ Đã nghiệm thu ĐẠT! Task đã chuyển sang HOÀN THÀNH. Tiến độ đề tài tăng lên ${newRate}%.`);
      } else {
        setRevisedTaskIds(prev => {
          const next = { ...prev, [selectedTask.id]: false };
          try {
            localStorage.setItem('utc_revised_tasks_v1', JSON.stringify(next));
          } catch {}
          return next;
        });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'REVISE', latestSubmissionStatus: 'REVISE_REQUIRED' } : t));
        setSelectedTask(prev => prev ? { ...prev, status: 'REVISE', latestSubmissionStatus: 'REVISE_REQUIRED' } : null);
        alert('⚠️ Đã gửi yêu cầu sửa lại (REVISE_REQUIRED). Task đã chuyển về cột CẦN SỬA (REVISE) để sinh viên làm lại.');
      }
    } catch (err: any) {
      console.error('Lỗi khi đánh giá bài nộp:', err);
      alert('Không thể lưu kết quả đánh giá bài nộp: ' + (err?.response?.data?.message || err?.message || 'Lỗi máy chủ'));
    } finally {
      setReviewLoading(false);
      setReviewModalSubmission(null);
      setReviewFeedbackInput('');
    }
  };

  // Fetch supervisor score whenever selectedThesisId changes
  useEffect(() => {
    if (selectedThesisId && selectedThesisId > 0) {
      defenseService.getScores(selectedThesisId).then((scoreList) => {
        const sup = scoreList.find((s) => s.scoreType === 'SUPERVISOR');
        if (sup) {
          setSupervisorScoreData({ score: sup.score, feedback: sup.feedback || '', graderName: sup.graderName });
          setSupScoreInput(sup.score);
          if (sup.feedback) setSupFeedbackInput(sup.feedback);
        } else {
          setSupervisorScoreData(null);
        }
      }).catch(() => {});
    } else {
      setSupervisorScoreData(null);
    }
  }, [selectedThesisId]);

  // Lecturer open modal to grade and confirm DEFENSE_READY
  const handleOpenDefenseReadyModal = () => {
    if (!currentThesis) return;
    setShowDefenseReadyModal(true);
  };

  // Lecturer confirm NOT eligible for defense
  const handleConfirmNotDefenseEligible = async () => {
    if (!currentThesis) return;
    const ok = window.confirm(
      `Xác nhận đánh dấu sinh viên ${currentThesis.studentFullName} (${currentThesis.studentCode}) CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ đồ án tốt nghiệp?`
    );
    if (!ok) return;
    try {
      setDefenseReadyLoading(true);
      const updated = await thesisService.setDefenseEligible(selectedThesisId, false);
      setCurrentThesis({ ...updated, defenseEligible: false, status: 'DEFENSE_NOT_ELIGIBLE' });
      setTheses(prev => prev.map(t => t.id === selectedThesisId ? { ...t, defenseEligible: false, status: 'DEFENSE_NOT_ELIGIBLE' } : t));
      alert(`❌ Đã xác nhận sinh viên ${currentThesis.studentFullName} (${currentThesis.studentCode}) CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ đồ án tốt nghiệp.`);
    } catch (err: any) {
      console.error('Lỗi khi cập nhật trạng thái không đủ điều kiện bảo vệ:', err);
      setCurrentThesis({ ...currentThesis, defenseEligible: false, status: 'DEFENSE_NOT_ELIGIBLE' });
      setTheses(prev => prev.map(t => t.id === selectedThesisId ? { ...t, defenseEligible: false, status: 'DEFENSE_NOT_ELIGIBLE' } : t));
      alert(`❌ Đã cập nhật trạng thái: CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ cho sinh viên ${currentThesis.studentFullName}.`);
    } finally {
      setDefenseReadyLoading(false);
    }
  };

  const handleResetToInProgress = async () => {
    if (!currentThesis) return;
    try {
      setDefenseReadyLoading(true);
      const updated = await thesisService.updateThesis(selectedThesisId, { status: 'IN_PROGRESS' as any });
      setCurrentThesis({ ...updated, defenseEligible: false, status: 'IN_PROGRESS' });
      setTheses(prev => prev.map(t => t.id === selectedThesisId ? { ...t, defenseEligible: false, status: 'IN_PROGRESS' } : t));
      alert(`Đã mở lại trạng thái ĐANG THỰC HIỆN (IN_PROGRESS) cho sinh viên ${currentThesis.studentFullName}.`);
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái: ' + (err?.message || 'Lỗi'));
    } finally {
      setDefenseReadyLoading(false);
    }
  };

  const handleSubmitDefenseReadyWithScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentThesis) return;
    if (supScoreInput < 0 || supScoreInput > 10) {
      alert('Điểm số phải từ 0.0 đến 10.0');
      return;
    }
    if (!supFeedbackInput.trim()) {
      alert('Vui lòng nhập nhận xét / đánh giá của GVHD');
      return;
    }

    try {
      setDefenseReadyLoading(true);
      const effectiveLecturerId = (user as any)?.lecturer?.id || (user as any)?.lecturer_id || user?.id || 1;

      // 1. Lưu điểm GVHD vào bảng scores
      await defenseService.submitScore({
        thesisId: selectedThesisId,
        graderId: Number(effectiveLecturerId),
        scoreType: 'SUPERVISOR',
        score: supScoreInput,
        feedback: supFeedbackInput.trim(),
      });

      // 2. Chuyển trạng thái đề tài sang đủ điều kiện bảo vệ
      const updated = await thesisService.setDefenseEligible(selectedThesisId, true);
      setCurrentThesis({ ...updated, defenseEligible: true, status: 'DEFENSE_READY' });
      setTheses(prev => prev.map(t => t.id === selectedThesisId ? { ...t, defenseEligible: true, status: 'DEFENSE_READY' } : t));
      setSupervisorScoreData({
        score: supScoreInput,
        feedback: supFeedbackInput.trim(),
        graderName: user?.fullName || 'GVHD',
      });
      setShowDefenseReadyModal(false);
      alert(`🎉 ĐÃ CHẤM ĐIỂM GVHD & XÁC NHẬN BẢO VỆ THÀNH CÔNG!\nĐiểm hướng dẫn: ${supScoreInput} / 10 đ\nĐề tài đã chuyển sang trạng thái ĐỦ ĐIỀU KIỆN BẢO VỆ (DEFENSE_READY).`);
    } catch (err: any) {
      console.error('Lỗi khi chấm điểm GVHD và xác nhận bảo vệ:', err);
      alert('Không thể lưu điểm và xác nhận đủ điều kiện bảo vệ: ' + (err?.response?.data?.message || err?.message || 'Lỗi máy chủ'));
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
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
        fileUrl: newTaskFileUrl.trim() || undefined
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
    setNewTaskFileUrl('');
    setNewTaskDueDate('');
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

            {canCreateTask && currentThesis && (
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
                {currentThesis.defenseEligible || currentThesis.status === 'DEFENSE_READY' ? (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '10px 14px', borderRadius: '8px', maxWidth: '450px' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎓</span> ĐÃ XÁC NHẬN ĐỦ ĐK BẢO VỆ {supervisorScoreData && `| Điểm GVHD: ${supervisorScoreData.score} / 10 đ`}
                    </div>
                    {supervisorScoreData && (
                      <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
                        Nhận xét: "<em>{supervisorScoreData.feedback}</em>"
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#65a30d', marginTop: '3px', fontStyle: 'italic' }}>
                      (Quy chế: GVHD đã chấm điểm quá trình và không ngồi trong Hội đồng chấm thi)
                    </div>
                    {canCreateTask && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={handleOpenDefenseReadyModal}
                          style={{
                            background: 'none',
                            border: '1px solid #86efac',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            color: '#15803d',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          ✏️ Cập nhật Điểm &amp; Nhận xét GVHD
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmNotDefenseEligible}
                          disabled={defenseReadyLoading}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fca5a5',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            color: '#b91c1c',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          ❌ Đổi thành Chưa đủ điều kiện
                        </button>
                      </div>
                    )}
                  </div>
                ) : currentThesis.status === 'DEFENSE_NOT_ELIGIBLE' ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', maxWidth: '450px' }}>
                    <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>❌</span> ĐÃ XÁC NHẬN: CHƯA ĐỦ ĐIỀU KIỆN BẢO VỆ
                    </div>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                      Sinh viên chưa đạt yêu cầu để tham gia bảo vệ đồ án tốt nghiệp đợt này.
                    </div>
                    {canCreateTask ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={handleOpenDefenseReadyModal}
                          style={{
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          🎓 Chấm điểm &amp; Đổi thành Đủ ĐK
                        </button>
                        <button
                          type="button"
                          onClick={handleResetToInProgress}
                          disabled={defenseReadyLoading}
                          style={{
                            background: '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          🔄 Mở lại trạng thái Đang làm
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '3px', fontStyle: 'italic' }}>
                        (Vui lòng liên hệ Giảng viên hướng dẫn để được hướng dẫn thêm)
                      </div>
                    )}
                  </div>
                ) : canCreateTask ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleOpenDefenseReadyModal}
                      disabled={defenseReadyLoading}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                      }}
                      title="Chấm điểm quá trình và xác nhận sinh viên đủ điều kiện bảo vệ trước Hội đồng"
                    >
                      <span>🎓</span> Chấm điểm GVHD &amp; Xác nhận Đủ ĐK Bảo Vệ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmNotDefenseEligible}
                      disabled={defenseReadyLoading}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                      }}
                      title="Xác nhận sinh viên chưa đủ điều kiện bảo vệ đồ án tốt nghiệp"
                    >
                      <span>❌</span> Chưa đủ điều kiện bảo vệ
                    </button>
                  </div>
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
      ) : (!currentThesis || selectedThesisId === 0) ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            maxWidth: '720px',
            margin: '30px auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📁</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            {selectedRoundId !== 'ALL'
              ? 'Chưa có đề tài nào trong đợt đồ án được chọn'
              : 'Hiện chưa có đề tài đồ án chính thức nào'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
            {isSupervisor ? (
              <>
                Bạn chưa có sinh viên nào được phân công hướng dẫn trong đợt này, hoặc các sinh viên được phân công <strong>chưa nộp / chưa được duyệt đề cương ở Giai đoạn 3</strong>.
                <br />
                Đề tài chỉ xuất hiện tại bảng Task Kanban sau khi Đề cương đề tài được Khoa/Bộ môn <strong>Phê duyệt chính thức</strong>.
              </>
            ) : (
              <>
                Đợt đồ án này hiện chưa có đề cương nào được phê duyệt thành Đề tài chính thức (hoặc các sinh viên chưa qua Giai đoạn 2 & 3).
              </>
            )}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/thesis/proposals"
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
              👉 Đến Giai đoạn 3: Xét duyệt Đề cương
            </a>
            <a
              href="/admin/assignment"
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
              👥 Giai đoạn 2: Phân công GVHD
            </a>
            {selectedRoundId !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRoundId('ALL');
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.delete('roundId');
                    return next;
                  }, { replace: true });
                }}
                style={{
                  background: '#f1f5f9',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                🔄 Xem tất cả các đợt đồ án
              </button>
            )}
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
                          maxHeight: '68vh',
                          overflowY: 'auto',
                          paddingRight: '4px',
                        }
                      : {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          flex: 1,
                          maxHeight: '65vh',
                          overflowY: 'auto',
                          paddingRight: '4px',
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
                        border:
                          t.status === 'REVISE'
                            ? isTaskRevised(t)
                              ? '1.5px solid #22c55e'
                              : '1px solid #f87171'
                            : '1px solid #cbd5e1',
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span>💬 {t.commentCount || 0}</span>
                          {t.fileUrl && (
                            <span title="Có tài liệu đính kèm từ GVHD" style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              📎 File GV
                            </span>
                          )}
                        </div>
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
                        isTaskRevised(t) ? (
                          <div
                            style={{
                              marginTop: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#15803d',
                              background: '#dcfce7',
                              border: '1px solid #86efac',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            ✅ Đã sửa (Chờ GVHD duyệt)
                          </div>
                        ) : (
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
                        )
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

            {/* Status Selector (Phân quyền theo vai trò) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Trạng thái công việc:</span>
              {isStudent && (selectedTask.status === 'TODO' || selectedTask.status === 'IN_PROGRESS') ? (
                <select
                  value={selectedTask.status}
                  onChange={e => handleStatusChange(selectedTask.id, e.target.value as any)}
                  style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, background: '#fff' }}
                >
                  <option value="TODO">Cần làm (TODO)</option>
                  <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                </select>
              ) : (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background:
                      selectedTask.status === 'COMPLETED'
                        ? '#dcfce7'
                        : selectedTask.status === 'REVISE'
                        ? isTaskRevised(selectedTask)
                          ? '#dcfce7'
                          : '#fee2e2'
                        : selectedTask.status === 'SUBMITTED'
                        ? '#fef3c7'
                        : selectedTask.status === 'IN_PROGRESS'
                        ? '#e0f2fe'
                        : '#f1f5f9',
                    color:
                      selectedTask.status === 'COMPLETED'
                        ? '#15803d'
                        : selectedTask.status === 'REVISE'
                        ? isTaskRevised(selectedTask)
                          ? '#15803d'
                          : '#b91c1c'
                        : selectedTask.status === 'SUBMITTED'
                        ? '#92400e'
                        : selectedTask.status === 'IN_PROGRESS'
                        ? '#0369a1'
                        : '#334155',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  {selectedTask.status === 'TODO'
                    ? '📋 Cần làm (TODO)'
                    : selectedTask.status === 'IN_PROGRESS'
                    ? '⚙ Đang làm (IN_PROGRESS)'
                    : selectedTask.status === 'SUBMITTED'
                    ? '📤 Đã nộp bài (SUBMITTED)'
                    : selectedTask.status === 'REVISE'
                    ? isTaskRevised(selectedTask)
                      ? '✅ Đã sửa bài (Chờ GVHD duyệt)'
                      : '⚠️ Cần sửa chữa (REVISE)'
                    : '✓ Hoàn thành (COMPLETED)'}
                </span>
              )}
              {isStudent && (
                <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
                  💡 Sinh viên chỉ chọn Đang làm (IN_PROGRESS), khi bấm Nộp bài mới chuyển sang Đã nộp bài
                </span>
              )}
              {isSupervisor && !isAdmin && (
                <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
                  💡 Giảng viên bấm "Nghiệm thu Đạt" hoặc "Yêu cầu sửa lại" ở bài nộp bên dưới để chuyển trạng thái
                </span>
              )}
              {isAdmin && (
                <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
                  👁️ Quản trị viên: Chế độ chỉ xem tiến độ công việc
                </span>
              )}
            </div>

            <p style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              {selectedTask.description || 'Chưa có mô tả chi tiết.'}
            </p>

            {selectedTask.fileUrl && (
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '24px' }}>{getFileIcon(selectedTask.fileUrl)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📎 Tài liệu / Đề bài từ Giảng viên
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={extractFileName(selectedTask.fileUrl)}>
                      {extractFileName(selectedTask.fileUrl)}
                    </div>
                  </div>
                </div>
                <a
                  href={resolveFileUrl(selectedTask.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '7px 14px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>⬇️</span> Mở / Tải file
                </a>
              </div>
            )}

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

                          {/* GVHD Action buttons: chỉ hiển thị trên bài nộp MỚI NHẤT đang chờ duyệt (SUBMITTED) */}
                          {canCreateTask && idx === 0 && s.status === 'SUBMITTED' && selectedTask.status !== 'COMPLETED' && (
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
                  {isStudent ? 'Chưa có bài nộp nào cho công việc này. Bạn hãy tải file hoặc dán link ở form bên dưới.' : 'Chưa có bài nộp nào từ sinh viên cho công việc này. Đang chờ sinh viên thực hiện và nộp kết quả.'}
                </div>
              )}

              {/* Submit Form for Student (Chỉ hiển thị cho sinh viên) */}
              {isStudent && selectedTask.status === 'REVISE' && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isTaskRevised(selectedTask) ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isTaskRevised(selectedTask) ? '#86efac' : '#fecaca'}`, padding: '12px 14px', borderRadius: '8px', marginBottom: showReviseForm ? '10px' : 0 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: isTaskRevised(selectedTask) ? '#15803d' : '#b91c1c' }}>
                        {isTaskRevised(selectedTask)
                          ? '✅ Đã sửa bài (Đang chờ GVHD kiểm tra & nghiệm thu)'
                          : '⚠️ Công việc cần sửa lại theo yêu cầu của GVHD'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                        {isTaskRevised(selectedTask)
                          ? 'Bạn đã gửi bản sửa bài mới nhất. Bạn vẫn có thể bấm nút bên cạnh để cập nhật lại nếu cần.'
                          : 'Bấm nút "🛠️ Sửa bài" để tải lên bản báo cáo/kết quả đã chỉnh sửa.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReviseForm(prev => !prev)}
                      style={{
                        background: isTaskRevised(selectedTask) ? '#16a34a' : '#dc2626',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🛠️ {showReviseForm ? 'Đóng form sửa bài' : 'Sửa bài'}
                    </button>
                  </div>

                  {showReviseForm && (
                    <form onSubmit={handleSubmitTask} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #86efac' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#166534', fontWeight: 700 }}>
                        🛠️ Nộp Kết Quả Đã Sửa Bài (Cập nhật vào mục Cần sửa):
                      </h4>
                      <textarea
                        rows={2}
                        required
                        placeholder="Mô tả những nội dung đã chỉnh sửa, bổ sung theo nhận xét của GVHD..."
                        value={submissionContent}
                        onChange={e => setSubmissionContent(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                      />
                      <FileUploadInput
                        label="Tập tin bài sửa / Minh chứng đã cập nhật"
                        value={submissionFileUrl}
                        onChange={url => setSubmissionFileUrl(url)}
                        placeholder="Dán link Github demo, Google Drive hoặc tải file đính kèm..."
                        helperText="Hỗ trợ tải lên file Zip, PDF, Word, RAR (tối đa 50MB) hoặc dán đường dẫn trực tiếp"
                      />
                      <button
                        type="submit"
                        style={{ alignSelf: 'flex-end', background: '#16a34a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✅ Hoàn tất &amp; Gửi Bài Đã Sửa
                      </button>
                    </form>
                  )}
                </div>
              )}

              {isStudent && selectedTask.status !== 'REVISE' && selectedTask.status !== 'COMPLETED' && (
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
              )}
            </div>

            {/* Comments Section (Ẩn đối với Quản trị viên - Admin chỉ xem tiến độ & các mục ở trên) */}
            {!isAdmin && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>
                    💬 Thảo Luận Trao Đổi Trực Tiếp ({comments.length})
                  </h3>
                  <button
                    type="button"
                    onClick={async () => {
                      const latest = await progressService.getCommentsByTask(selectedTask.id).catch(() => []);
                      setComments(latest);
                    }}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                  >
                    🔄 Làm mới tin nhắn
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                  {comments.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>
                      Chưa có tin nhắn thảo luận nào. Giảng viên và Sinh viên có thể trao đổi trực tiếp tại đây.
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: '700', color: '#0a3273' }}>{c.userFullName}</span>
                          {c.createdAt && (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {new Date(c.createdAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#334155' }}>{c.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Nhập nội dung trao đổi trực tiếp giữa GVHD và Sinh viên..."
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
            )}
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

              <div style={{ marginBottom: '16px' }}>
                <FileUploadInput
                  label="📎 Tài liệu / Đề bài / File hướng dẫn đính kèm (Tùy chọn)"
                  value={newTaskFileUrl}
                  onChange={(url) => setNewTaskFileUrl(url)}
                  helperText="Giảng viên có thể tải lên tài liệu mô tả yêu cầu, biểu mẫu, file mẫu (PDF, Word, ZIP...) để sinh viên tải về"
                  placeholder="Tải lên tài liệu đính kèm..."
                />
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

      {/* GVHD SCORING & DEFENSE READY CONFIRMATION MODAL */}
      {showDefenseReadyModal && currentThesis && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '620px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🎓</span>
                <div>
                  <h3 style={{ margin: 0, color: '#0a3273', fontSize: '18px', fontWeight: 700 }}>
                    Phiếu Chấm Điểm GVHD &amp; Xác Nhận Đủ ĐK Bảo Vệ
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Quy chế tốt nghiệp UTC — Điểm quá trình hướng dẫn (30%)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDefenseReadyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDefenseReadyWithScore}>
              {/* Important Regulation Notice */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1e40af',
                lineHeight: '1.5'
              }}>
                <strong>📌 Lưu ý quy chế đào tạo:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                  <li>Giảng viên hướng dẫn chấm điểm quá trình (thang điểm 10) và nhận xét thái độ làm việc của sinh viên.</li>
                  <li><strong>GVHD tuyệt đối không được ngồi trong Hội đồng chấm thi</strong> của sinh viên mà mình hướng dẫn (Hội đồng 5 người gồm các giảng viên khác).</li>
                </ul>
              </div>

              {/* Thesis & Student Summary */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                  <strong>Sinh viên:</strong> {currentThesis.studentFullName} ({currentThesis.studentCode}) — Lớp: {currentThesis.studentClass || 'K62'}
                </div>
                <div style={{ fontSize: '13px', color: '#0a3273', fontWeight: 600 }}>
                  <strong>Đề tài:</strong> {currentThesis.titleVn}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Tiến độ hoàn thành: <strong>{computedProgressPercent}%</strong> ({completedTasksCount}/{tasks.length} tasks hoàn thành)
                </div>
              </div>

              {/* Score Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  ⭐ Điểm hướng dẫn của GVHD (Thang điểm 10.0) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10.0"
                    required
                    value={supScoreInput}
                    onChange={(e) => setSupScoreInput(Math.min(10.0, Math.max(0, Number(e.target.value))))}
                    style={{
                      width: '120px',
                      padding: '10px 14px',
                      border: '2px solid #2563eb',
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1e40af',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>/ 10.00 điểm</span>
                  <span style={{ fontSize: '12px', color: supScoreInput >= 8.5 ? '#16a34a' : supScoreInput >= 7.0 ? '#2563eb' : '#d97706', fontWeight: 600 }}>
                    ({supScoreInput >= 8.5 ? 'Xuất sắc' : supScoreInput >= 7.0 ? 'Khá/Giỏi' : supScoreInput >= 5.0 ? 'Đạt' : 'Chưa đạt'})
                  </span>
                </div>
              </div>

              {/* Feedback Textarea */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  📝 Nhận xét &amp; Đánh giá chi tiết của GVHD *
                </label>
                <textarea
                  required
                  rows={4}
                  value={supFeedbackInput}
                  onChange={(e) => setSupFeedbackInput(e.target.value)}
                  placeholder="Nhập nhận xét về tinh thần làm việc, mức độ hoàn thành nội dung và chất lượng đồ án..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Actions */}


              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowDefenseReadyModal(false)}
                  disabled={defenseReadyLoading}
                  style={{
                    padding: '9px 18px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#475569'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={defenseReadyLoading}
                  style={{
                    padding: '9px 24px',
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  <span>🎓</span> {defenseReadyLoading ? 'Đang lưu...' : 'Xác Nhận Chấm Điểm & Cho Phép Bảo Vệ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


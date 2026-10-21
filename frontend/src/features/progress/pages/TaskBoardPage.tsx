import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { progressService } from '../services/progressService';
import type { Task, Comment, Submission } from '../types';

export const TaskBoardPage: React.FC = () => {
  const { userType, user } = useAuth();
  const [searchParams] = useSearchParams();
  const currentThesisId = Number(searchParams.get('thesisId') || searchParams.get('id')) || 1;

  const isStudent = userType === 'student';
  const isSupervisor = userType === 'supervisor';
  const isAdmin = userType === 'admin';
  const canCreateTask = isSupervisor || isAdmin;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Detail modal state
  const [comments, setComments] = useState<Comment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [submissionContent, setSubmissionContent] = useState<string>('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState<string>('');

  // Create form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  useEffect(() => {
    loadTasks();
  }, [currentThesisId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await progressService.getTasksByThesis(currentThesisId);
      setTasks(data);
    } catch {
      // Fallback sample tasks
      setTasks([
        {
          id: 1,
          thesisId: 1,
          thesisTitle: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
          createdById: 2,
          createdByFullName: 'TS. Trần Văn Giảng Viên',
          assignedToId: 1,
          assignedToFullName: 'Nguyễn Văn Sinh Viên',
          title: 'Thiết kế và chuẩn hóa lược đồ CSDL quan hệ 37 bảng',
          description: 'Thiết kế các thực thể, thuộc tính, khóa chính và kịch bản Flyway migration V301 - V303.',
          priority: 'HIGH',
          status: 'COMPLETED',
          dueDate: '2026-10-10T17:00:00Z',
          completedAt: '2026-10-09T15:30:00Z',
          submissionCount: 1,
          commentCount: 2,
          createdAt: '2026-10-05T08:00:00Z',
          updatedAt: '2026-10-09T15:30:00Z'
        },
        {
          id: 2,
          thesisId: 1,
          thesisTitle: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
          createdById: 2,
          createdByFullName: 'TS. Trần Văn Giảng Viên',
          assignedToId: 1,
          assignedToFullName: 'Nguyễn Văn Sinh Viên',
          title: 'Phát triển tầng Service và Rest Controller cho module Thesis & Progress',
          description: 'Triển khai API tạo đề cương, giao task, nộp bài tập và tổng hợp tiến độ phục vụ Module 4.',
          priority: 'URGENT',
          status: 'IN_PROGRESS',
          dueDate: '2026-10-22T17:00:00Z',
          submissionCount: 0,
          commentCount: 1,
          createdAt: '2026-10-10T08:00:00Z',
          updatedAt: '2026-10-15T08:00:00Z'
        },
        {
          id: 3,
          thesisId: 1,
          thesisTitle: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
          createdById: 2,
          createdByFullName: 'TS. Trần Văn Giảng Viên',
          assignedToId: 1,
          assignedToFullName: 'Nguyễn Văn Sinh Viên',
          title: 'Thiết kế giao diện bảng Kanban và khung thảo luận Task',
          description: 'Xây dựng giao diện trực quan hỗ trợ kéo thả trạng thái và khung comment trực tiếp.',
          priority: 'MEDIUM',
          status: 'TODO',
          dueDate: '2026-10-29T17:00:00Z',
          submissionCount: 0,
          commentCount: 0,
          createdAt: '2026-10-12T08:00:00Z',
          updatedAt: '2026-10-12T08:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (task: Task) => {
    setSelectedTask(task);
    try {
      const [cList, sList] = await Promise.all([
        progressService.getCommentsByTask(task.id),
        progressService.getSubmissionsByTask(task.id)
      ]);
      setComments(cList);
      setSubmissions(sList);
    } catch {
      setComments([
        {
          id: 1,
          taskId: task.id,
          userId: 2,
          userFullName: 'TS. Trần Văn Giảng Viên',
          content: 'Em chú ý bám sát đúng quy định mã lỗi API của đồ án nhé.',
          isEdited: false,
          replies: [],
          createdAt: '2026-10-13T10:00:00Z',
          updatedAt: '2026-10-13T10:00:00Z'
        }
      ]);
      setSubmissions([]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    try {
      const added = await progressService.addComment(selectedTask.id, 1, newComment);
      setComments(prev => [...prev, added]);
    } catch {
      setComments(prev => [
        ...prev,
        {
          id: Date.now(),
          taskId: selectedTask.id,
          userId: 1,
          userFullName: 'Nguyễn Văn Sinh Viên',
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
      const sub = await progressService.submitTask(selectedTask.id, 1, submissionContent, submissionFileUrl);
      setSubmissions(prev => [sub, ...prev]);
    } catch {
      setSubmissions(prev => [
        {
          id: Date.now(),
          taskId: selectedTask.id,
          studentId: 1,
          studentFullName: 'Nguyễn Văn Sinh Viên',
          submissionContent,
          fileUrl: submissionFileUrl,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...prev
      ]);
      // Update selected task in state
      setSelectedTask(prev => prev ? { ...prev, status: 'SUBMITTED' } : null);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'SUBMITTED' } : t));
    }
    setSubmissionContent('');
    setSubmissionFileUrl('');
    alert('Đã gửi bài nộp công việc thành công!');
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCreatedById = user?.id || 2;
    const effectiveAssignedToId = (tasks.length > 0 && tasks[0].assignedToId) ? tasks[0].assignedToId : 1;
    try {
      const created = await progressService.createTask({
        thesisId: currentThesisId,
        createdById: effectiveCreatedById,
        assignedToId: effectiveAssignedToId,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined
      });
      setTasks(prev => [...prev, created]);
    } catch {
      setTasks(prev => [
        ...prev,
        {
          id: Date.now(),
          thesisId: 1,
          thesisTitle: 'Nghiên cứu và xây dựng hệ thống quản lý đồ án tốt nghiệp UTC-ThesisHub',
          createdById: 2,
          createdByFullName: 'TS. Trần Văn Giảng Viên',
          assignedToId: 1,
          assignedToFullName: 'Nguyễn Văn Sinh Viên',
          title: newTaskTitle,
          description: newTaskDesc,
          priority: newTaskPriority as any,
          status: 'TODO',
          dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
          submissionCount: 0,
          commentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
    setShowCreateModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const columns: { status: Task['status']; title: string; color: string }[] = [
    { status: 'TODO', title: '📋 Cần Làm (TODO)', color: '#64748b' },
    { status: 'IN_PROGRESS', title: '⚙ Đang Thực Hiện', color: '#0284c7' },
    { status: 'SUBMITTED', title: '📤 Đã Nộp Bài', color: '#d97706' },
    { status: 'COMPLETED', title: '✅ Đã Hoàn Thành', color: '#16a34a' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#0f172a' }}>
            Bảng Quản Lý Công Việc & Nhiệm Vụ Đồ Án (Kanban)
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>
            Theo dõi phân công, hạn nộp, nộp sản phẩm và trao đổi giữa Giảng viên hướng dẫn & Sinh viên.
          </p>
        </div>
        {canCreateTask && (
          <button
            onClick={() => setShowCreateModal(true)}
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
            + Giao Việc Mới
          </button>
        )}
      </div>

      {loading && (
        <div style={{ marginBottom: '16px', color: '#2563eb', fontWeight: '500' }}>
          Đang tải danh sách công việc...
        </div>
      )}

      {/* Kanban Board Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', minHeight: '650px' }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: col.color }}>
                  {col.title}
                </h3>
                <span style={{
                  background: '#e2e8f0',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569'
                }}>
                  {colTasks.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {colTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenDetail(t)}
                    style={{
                      background: '#fff',
                      padding: '14px',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: t.priority === 'URGENT' ? '#fee2e2' : t.priority === 'HIGH' ? '#ffedd5' : '#e0f2fe',
                        color: t.priority === 'URGENT' ? '#b91c1c' : t.priority === 'HIGH' ? '#c2410c' : '#0369a1'
                      }}>
                        {t.priority}
                      </span>
                      {t.dueDate && (
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                          Hạn: {new Date(t.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                      {t.title}
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#475569', lineClamp: 2 }}>
                      {t.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                      <span>💬 {t.commentCount || 0}</span>
                      <span>📁 {t.submissionCount || 0} nộp</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Chi tiết công việc #{selectedTask.id}</span>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{selectedTask.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#475569' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>Trạng thái:</span>
              <select
                value={selectedTask.status}
                onChange={e => handleStatusChange(selectedTask.id, e.target.value as any)}
                style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="TODO">Cần làm (TODO)</option>
                <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                <option value="SUBMITTED">Đã nộp bài (SUBMITTED)</option>
                {canCreateTask ? (
                  <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                ) : (
                  <option value="COMPLETED" disabled>Hoàn thành (Chỉ GVHD nghiệm thu)</option>
                )}
              </select>
              {isStudent && (
                <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                  (Sinh viên nộp sản phẩm để chuyển trạng thái, GVHD sẽ nghiệm thu hoàn thành)
                </span>
              )}
            </div>

            <p style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '14px', color: '#334155' }}>
              {selectedTask.description || 'Chưa có mô tả chi tiết.'}
            </p>

            {/* Submissions Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>
                📦 Nộp Sản Phẩm / Kết Quả Công Việc
              </h3>
              {submissions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {submissions.map(s => (
                    <div key={s.id} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '4px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600' }}>{s.title || 'Bài nộp'} - Trạng thái: {s.status}</span>
                        {canCreateTask && s.status !== 'ACCEPTED' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await progressService.reviewSubmission(s.id, 'ACCEPTED', 'GVHD nghiệm thu đạt yêu cầu.');
                              } catch {}
                              setSubmissions(prev => prev.map(item => item.id === s.id ? { ...item, status: 'ACCEPTED' } : item));
                              handleStatusChange(selectedTask.id, 'COMPLETED');
                              alert('Đã nghiệm thu bài nộp và chuyển Task sang HOÀN THÀNH!');
                            }}
                            style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            ✓ Nghiệm thu Đạt
                          </button>
                        )}
                      </div>
                      <div style={{ marginTop: '4px' }}>{s.submissionContent}</div>
                      {s.fileUrl && <a href={s.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', display: 'inline-block', marginTop: '4px' }}>Tải file đính kèm</a>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Chưa có bài nộp nào cho công việc này.</p>
              )}

              {/* Submit Form */}
              <form onSubmit={handleSubmitTask} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#fafafa', padding: '12px', borderRadius: '6px' }}>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi chú báo cáo nộp kết quả..."
                  value={submissionContent}
                  onChange={e => setSubmissionContent(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Đường dẫn file bài nộp hoặc link Github demo..."
                  value={submissionFileUrl}
                  onChange={e => setSubmissionFileUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                />
                <button
                  type="submit"
                  style={{ alignSelf: 'flex-end', background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Nộp Bài
                </button>
              </form>
            </div>

            {/* Comments Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>
                💬 Thảo Luận Trao Đổi ({comments.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
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

      {/* Create Task Modal */}
      {canCreateTask && showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '500px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Giao Nhiệm Vụ Mới</h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tiêu đề công việc *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Mức độ ưu tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  >
                    <option value="LOW">Thấp (LOW)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="HIGH">Cao (HIGH)</option>
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Hạn chót (Deadline)</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
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

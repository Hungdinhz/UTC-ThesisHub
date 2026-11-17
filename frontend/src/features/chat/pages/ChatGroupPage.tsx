import React, { useState, useEffect, useRef, useMemo } from 'react';
import { chatService } from '../services/chatService';
import type { ChatRoom, ChatRoomMember, ChatMessageItem } from '../services/chatService';
import { fileUploadService } from '../../../services/fileUploadService';
import { resolveFileUrl, getFileIcon } from '../../../utils/fileUtils';
import { useAuth } from '../../../contexts/AuthContext';
import './ChatGroupPage.css';

const AVATAR_PALETTE = [
  '#0a3273',
  '#0284c7',
  '#059669',
  '#7c3aed',
  '#db2777',
  '#0f766e',
  '#4338ca',
  '#b45309',
];

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatDegreeShort(degree?: string): string {
  if (!degree) return '';
  const d = degree.trim().toUpperCase();
  if (d === 'GS' || d.includes('GIAO_SU')) return 'GS.';
  if (d === 'PGS' || d.includes('PHO_GIAO_SU')) return 'PGS.TS.';
  if (d === 'TIEN_SI' || d === 'TS' || d === 'DOCTOR') return 'TS.';
  if (d === 'THAC_SI' || d === 'THS' || d === 'MASTER') return 'ThS.';
  return degree;
}

function formatDegreeFull(degree?: string): string {
  if (!degree) return '';
  const d = degree.trim().toUpperCase();
  if (d === 'GS') return 'Giáo sư';
  if (d === 'PGS') return 'Phó Giáo sư - Tiến sĩ';
  if (d === 'TIEN_SI' || d === 'TS') return 'Tiến sĩ';
  if (d === 'THAC_SI' || d === 'THS') return 'Thạc sĩ';
  return degree;
}

function formatLecturerDisplayName(name?: string, degree?: string): string {
  const safeName = (name || '').trim();
  if (!safeName) return 'Giảng viên hướng dẫn';
  const upper = safeName.toUpperCase();
  if (
    upper.startsWith('GS.') ||
    upper.startsWith('PGS.') ||
    upper.startsWith('TS.') ||
    upper.startsWith('THS.')
  ) {
    return safeName;
  }
  const prefix = formatDegreeShort(degree);
  return prefix ? `${prefix} ${safeName}` : safeName;
}

function formatRoundStatus(status?: string): string {
  switch ((status || '').toUpperCase()) {
    case 'IN_PROGRESS':
      return 'Đang thực hiện';
    case 'OPEN':
      return 'Đang mở';
    case 'CLOSED':
      return 'Đã đóng';
    case 'ARCHIVED':
      return 'Lưu trữ';
    case 'DRAFT':
      return 'Nháp';
    default:
      return status || 'Đang mở';
  }
}

function formatAssignmentStatus(status?: string): string {
  switch ((status || '').toUpperCase()) {
    case 'FINALIZED':
    case 'CONFIRMED':
    case 'APPROVED':
      return 'Đã chốt GVHD';
    case 'OVERRIDDEN':
      return 'Điều chỉnh Khoa';
    case 'PROPOSED':
      return 'Dự kiến phân công';
    case 'IN_PROGRESS':
      return 'Đang làm đề tài';
    case 'SUBMITTED':
      return 'Đã nộp đề cương';
    case 'UNDER_REVIEW':
      return 'Đang duyệt đề cương';
    default:
      return status || 'Đã phân công';
  }
}

function isImageAttachment(nameOrUrl?: string): boolean {
  if (!nameOrUrl) return false;
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(nameOrUrl);
}

function getLocalDateKey(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDivider(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const todayKey = getLocalDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday.toISOString());
  const targetKey = getLocalDateKey(iso);
  if (targetKey === todayKey) return 'Hôm nay';
  if (targetKey === yesterdayKey) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTimeShort(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatRoomTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const todayKey = getLocalDateKey(new Date().toISOString());
  if (getLocalDateKey(iso) === todayKey) {
    return formatTimeShort(iso);
  }
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const LECTURER_PROMPTS = [
  {
    label: '📢 Lịch họp nhóm',
    text: 'Chào các em, thầy/cô thông báo lịch họp nhóm đồ án vào lúc ... tại ... nhé.',
  },
  {
    label: '📑 Nhắc nộp đề cương',
    text: 'Các em kiểm tra tiến độ và hoàn thiện đề cương đồ án đúng hạn để thầy/cô xem xét duyệt nhé.',
  },
  {
    label: '📋 Nhắc báo cáo tuần',
    text: 'Tuần này các em nhớ cập nhật tiến độ công việc và nộp báo cáo định kỳ lên hệ thống nhé.',
  },
  {
    label: '✅ Nhận xét tài liệu',
    text: 'Thầy/cô đã xem tài liệu em gửi. Lưu ý rà soát và bổ sung thêm phần ... nhé.',
  },
];

const STUDENT_PROMPTS = [
  {
    label: '🙋 Em xin hỏi thầy/cô...',
    text: 'Em chào thầy/cô ạ, em xin phép hỏi thầy/cô về vấn đề: ',
  },
  {
    label: '📄 Nộp báo cáo tuần',
    text: 'Em chào thầy/cô ạ, em xin gửi báo cáo tiến độ tuần này để thầy/cô xem và góp ý giúp em ạ.',
  },
  {
    label: '📑 Gửi bản nháp đề cương',
    text: 'Em chào thầy/cô ạ, em đã hoàn thiện bản nháp đề cương, kính nhờ thầy/cô xem xét góp ý giúp em ạ.',
  },
  {
    label: '📅 Xin lịch hẹn gặp',
    text: 'Em chào thầy/cô ạ, cho em xin lịch hẹn trao đổi trực tiếp với thầy/cô trong tuần này ạ.',
  },
];

export const ChatGroupPage: React.FC = () => {
  const { user, userType } = useAuth();
  const isStudent = userType === 'student';

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomKey, setSelectedRoomKey] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [memberSearch, setMemberSearch] = useState<string>('');
  const [messageSearch, setMessageSearch] = useState<string>('');
  const [onlyAttachments, setOnlyAttachments] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'chat' | 'members'>('chat');

  const [draftText, setDraftText] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [newMessagesBelowCount, setNewMessagesBelowCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const activeRoomKeyRef = useRef<string>('');
  const messagesRef = useRef<ChatMessageItem[]>([]);

  useEffect(() => {
    activeRoomKeyRef.current = selectedRoomKey;
  }, [selectedRoomKey]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const selectedRoom = rooms.find((r) => r.roomKey === selectedRoomKey) || null;

  const isMeMember = (m: ChatRoomMember): boolean => {
    const myUserId = (user as any)?.user?.id || (user as any)?.user_id;
    if (m.userId && myUserId && Number(m.userId) === Number(myUserId)) return true;

    const myCode =
      (user as any)?.studentCode ||
      (user as any)?.registration_no ||
      (user as any)?.lecturerCode ||
      (user as any)?.supervisor_id;
    if (m.code && myCode && m.code.toLowerCase() === String(myCode).toLowerCase()) return true;

    if (m.role === 'STUDENT' && isStudent) {
      const myStuId = (user as any)?.studentId || (user as any)?.student_id || (user as any)?.id;
      if (m.profileId && myStuId && Number(m.profileId) === Number(myStuId)) return true;
    }
    if (m.role === 'SUPERVISOR' && !isStudent) {
      const myLecId = (user as any)?.lecturerId || (user as any)?.lecturer_id || (user as any)?.id;
      if (m.profileId && myLecId && Number(m.profileId) === Number(myLecId)) return true;
    }
    return false;
  };

  const isRoomSupervisor = useMemo(() => {
    if (!selectedRoom || isStudent) return false;
    const sup = selectedRoom.members.find((m) => m.role === 'SUPERVISOR');
    return sup ? isMeMember(sup) : false;
  }, [selectedRoom, isStudent, user]);

  const scrollToBottom = (smooth: boolean = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    isNearBottomRef.current = true;
    setNewMessagesBelowCount(0);
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 100;
    isNearBottomRef.current = nearBottom;
    if (nearBottom && newMessagesBelowCount > 0) {
      setNewMessagesBelowCount(0);
    }
  };

  useEffect(() => {
    loadRooms(true);
  }, []);

  const loadRooms = async (initial: boolean = false) => {
    try {
      if (initial) setLoadingRooms(true);
      const list = await chatService.getMyRooms();
      setRooms(list);
      if (list.length > 0) {
        setSelectedRoomKey((prevKey) =>
          prevKey && list.some((r) => r.roomKey === prevKey) ? prevKey : list[0].roomKey
        );
      } else {
        setSelectedRoomKey('');
      }
    } catch (err: any) {
      if (initial) {
        setErrorMsg(
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách nhóm hướng dẫn'
        );
      }
    } finally {
      if (initial) setLoadingRooms(false);
    }
  };

  const fetchMessages = async (room: ChatRoom, showSpinner: boolean = false) => {
    try {
      if (showSpinner) {
        setLoadingMessages(true);
        setErrorMsg(null);
        setMessages([]);
        isNearBottomRef.current = true;
        setNewMessagesBelowCount(0);
      }
      const list = await chatService.getRoomMessages(room.projectRoundId, room.lecturerId);
      if (activeRoomKeyRef.current && activeRoomKeyRef.current !== room.roomKey) {
        return;
      }

      const prev = messagesRef.current;
      const changed =
        prev.length !== list.length ||
        prev[prev.length - 1]?.id !== list[list.length - 1]?.id ||
        prev[0]?.id !== list[0]?.id;

      setMessages(list);
      messagesRef.current = list;

      if (showSpinner) {
        requestAnimationFrame(() => scrollToBottom(false));
      } else if (changed) {
        const prevLastId = prev[prev.length - 1]?.id ?? 0;
        const addedCount = list.filter((m) => m.id > prevLastId).length;
        if (isNearBottomRef.current) {
          requestAnimationFrame(() => scrollToBottom(true));
        } else if (addedCount > 0) {
          setNewMessagesBelowCount((c) => c + addedCount);
        }
      }
    } catch (err: any) {
      if (showSpinner && (!activeRoomKeyRef.current || activeRoomKeyRef.current === room.roomKey)) {
        setErrorMsg(
          err?.response?.data?.message || err?.message || 'Không thể tải tin nhắn của nhóm'
        );
      }
    } finally {
      if (showSpinner) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedRoom) return;
    fetchMessages(selectedRoom, true);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages(selectedRoom, false);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedRoomKey]);

  const handleManualRefresh = async () => {
    if (!selectedRoom || refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([loadRooms(false), fetchMessages(selectedRoom, false)]);
    } finally {
      setRefreshing(false);
    }
  };

  const uploadAttachmentFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Kích thước tệp đính kèm không được vượt quá 50MB!');
      return;
    }
    try {
      setErrorMsg(null);
      setUploadingFile(true);
      const uploaded = await fileUploadService.uploadFile(file);
      setAttachmentUrl(uploaded.fileDownloadUri || uploaded.fileName);
      setAttachmentName(file.name);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Tải tệp đính kèm thất bại!');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAttachmentFile(file);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await uploadAttachmentFile(file);
          break;
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await uploadAttachmentFile(file);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRoom || sending || uploadingFile) return;
    if (!draftText.trim() && !attachmentUrl) return;

    try {
      setSending(true);
      setErrorMsg(null);
      const sent = await chatService.sendMessage(
        selectedRoom.projectRoundId,
        selectedRoom.lecturerId,
        {
          content: draftText.trim(),
          attachmentUrl: attachmentUrl || undefined,
          attachmentName: attachmentName || undefined,
        }
      );
      setMessages((prev) => [...prev, sent]);
      setDraftText('');
      setAttachmentUrl('');
      setAttachmentName('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      requestAnimationFrame(() => scrollToBottom(true));
      loadRooms(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Gửi tin nhắn thất bại!');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!selectedRoom) return;
    try {
      setErrorMsg(null);
      await chatService.deleteMessage(selectedRoom.projectRoundId, selectedRoom.lecturerId, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setConfirmDeleteId(null);
      loadRooms(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể thu hồi tin nhắn!');
      setConfirmDeleteId(null);
    }
  };

  const insertTextIntoDraft = (textToInsert: string, replaceIfEmpty: boolean = false) => {
    setDraftText((prev) => {
      if (replaceIfEmpty && !prev.trim()) return textToInsert;
      const spacer = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
      return `${prev}${spacer}${textToInsert}`;
    });
    setMobileView('chat');
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
      }
    }, 30);
  };

  const filteredMembers = useMemo(() => {
    if (!selectedRoom) return [];
    const q = memberSearch.trim().toLowerCase();
    if (!q) return selectedRoom.members;
    return selectedRoom.members.filter((m) => {
      if (m.role === 'SUPERVISOR') return true;
      return (
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.code || '').toLowerCase().includes(q) ||
        (m.className || '').toLowerCase().includes(q) ||
        (m.thesisTitle || '').toLowerCase().includes(q) ||
        (m.directionName || '').toLowerCase().includes(q)
      );
    });
  }, [selectedRoom, memberSearch]);

  const attachmentCount = useMemo(
    () => messages.filter((m) => Boolean(m.attachmentUrl)).length,
    [messages]
  );

  const visibleMessages = useMemo(() => {
    let list = messages;
    if (onlyAttachments) {
      list = list.filter((m) => Boolean(m.attachmentUrl));
    }
    const q = messageSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          (m.content || '').toLowerCase().includes(q) ||
          (m.senderName || '').toLowerCase().includes(q) ||
          (m.senderCode || '').toLowerCase().includes(q) ||
          (m.attachmentName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, onlyAttachments, messageSearch]);

  const renderHighlightedText = (text: string) => {
    const q = messageSearch.trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={idx} className="utc-chat-highlight">
          {part}
        </mark>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
  };

  if (loadingRooms) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
        ⏳ Đang tải Nhóm Chat Hướng Dẫn Đồ Án...
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="utc-chat-empty-state">
        <div style={{ fontSize: '46px', marginBottom: '12px' }}>💬</div>
        <h2 style={{ margin: '0 0 10px 0', color: '#0a3273', fontSize: '20px', fontWeight: 800 }}>
          Chưa có Nhóm Chat Hướng Dẫn nào được tạo
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.65 }}>
          {isStudent
            ? 'Nhóm chat giữa Giảng viên hướng dẫn và các sinh viên được gán cùng GVHD sẽ tự động kích hoạt ngay sau khi bạn được phân công giảng viên hướng dẫn trong đợt đồ án.'
            : 'Nhóm chat hướng dẫn theo từng đợt đồ án sẽ tự động xuất hiện ngay khi bạn có sinh viên được phân công hướng dẫn trong đợt.'}
        </p>
      </div>
    );
  }

  const quickPrompts = isStudent ? STUDENT_PROMPTS : LECTURER_PROMPTS;

  return (
    <div>
      {/* Mobile View Switcher */}
      <div className="utc-chat-mobile-tabs">
        <button
          type="button"
          className={`utc-chat-mobile-tab-btn ${mobileView === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileView('chat')}
        >
          💬 Hội thoại nhóm
        </button>
        <button
          type="button"
          className={`utc-chat-mobile-tab-btn ${mobileView === 'members' ? 'active' : ''}`}
          onClick={() => setMobileView('members')}
        >
          👥 Nhóm &amp; Thành viên ({selectedRoom?.members.length ?? 0})
        </button>
      </div>

      <div className="utc-chat-shell">
        {/* Left Sidebar: Rooms + Group Members */}
        <aside
          className={`utc-chat-panel ${mobileView !== 'members' ? 'mobile-hidden' : ''}`}
          aria-label="Danh sách nhóm hướng dẫn và thành viên"
        >
          <div className="utc-chat-sidebar-header">
            <span className="utc-chat-sidebar-title">
              <span>💬</span>
              <span>Nhóm Hướng Dẫn</span>
            </span>
            <span className="utc-chat-count-pill">{rooms.length} nhóm</span>
          </div>

          {/* Room Switcher */}
          <div className="utc-chat-rooms-list">
            {rooms.map((room) => {
              const active = room.roomKey === selectedRoomKey;
              const isClosed = room.roundStatus === 'CLOSED' || room.roundStatus === 'ARCHIVED';
              return (
                <div
                  key={room.roomKey}
                  className={`utc-chat-room-item ${active ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedRoomKey(room.roomKey);
                    setMemberSearch('');
                    setMessageSearch('');
                    setOnlyAttachments(false);
                    setConfirmDeleteId(null);
                    setMobileView('chat');
                  }}
                >
                  <div className="utc-chat-room-top">
                    <div className="utc-chat-room-name">
                      Nhóm GVHD: {formatLecturerDisplayName(room.lecturerName, room.lecturerDegree)}
                    </div>
                    <span className={`utc-chat-room-badge ${isClosed ? 'closed' : 'open'}`}>
                      {room.studentCount} SV
                    </span>
                  </div>

                  <div className="utc-chat-room-round">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📁 {room.roundName} ({room.roundCode})
                    </span>
                    <span className="utc-chat-room-round-status">
                      {formatRoundStatus(room.roundStatus)}
                    </span>
                  </div>

                  {room.lastMessagePreview ? (
                    <div className="utc-chat-room-preview">
                      <span className="utc-chat-room-preview-text">
                        {room.lastSenderName ? `${room.lastSenderName}: ` : ''}
                        {room.lastMessagePreview}
                      </span>
                      {room.lastMessageAt && (
                        <span className="utc-chat-room-time">{formatRoomTime(room.lastMessageAt)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="utc-chat-room-preview">
                      <span className="utc-chat-room-preview-text" style={{ fontStyle: 'italic' }}>
                        Chưa có tin nhắn nào
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Group Members List */}
          {selectedRoom && (
            <div className="utc-chat-members-section">
              <div className="utc-chat-members-header">
                <div className="utc-chat-members-label">
                  <span>👥 Thành viên nhóm ({selectedRoom.members.length})</span>
                  <span style={{ fontWeight: 600, color: '#0a3273' }}>
                    1 GVHD • {selectedRoom.studentCount} SV
                  </span>
                </div>
                {selectedRoom.studentCount > 3 && (
                  <input
                    type="search"
                    className="utc-chat-member-search"
                    placeholder="Tìm tên SV, MSSV, lớp, đề tài..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                )}
              </div>

              <div className="utc-chat-members-list">
                {filteredMembers.map((m, idx) => {
                  const isSup = m.role === 'SUPERVISOR';
                  const isSelf = isMeMember(m);
                  const avatarColor = isSup ? undefined : getAvatarColor(m.code || m.fullName);

                  return (
                    <div
                      key={`${m.role}-${m.profileId || idx}`}
                      className={`utc-chat-member-card ${isSup ? 'supervisor' : ''} ${
                        isSelf ? 'is-self' : ''
                      }`}
                    >
                      <div
                        className={`utc-chat-avatar ${isSup ? 'supervisor' : ''}`}
                        style={avatarColor ? { background: avatarColor } : undefined}
                      >
                        {isSup ? '👨‍🏫' : getInitials(m.fullName)}
                      </div>

                      <div className="utc-chat-member-info">
                        <div className="utc-chat-member-name-row">
                          <span className="utc-chat-member-name" title={m.fullName}>
                            {isSup ? formatLecturerDisplayName(m.fullName, m.className) : m.fullName}
                          </span>
                          {isSelf && <span className="utc-chat-self-tag">Bạn</span>}
                        </div>

                        <div className="utc-chat-member-meta">
                          {isSup ? (
                            <>
                              <div>
                                Giảng viên hướng dẫn
                                {m.className ? ` • ${formatDegreeFull(m.className)}` : ''}
                              </div>
                              <div>
                                Mã GV: <strong>{m.code || '—'}</strong>
                                {selectedRoom.departmentName
                                  ? ` • ${selectedRoom.departmentName}`
                                  : ''}
                              </div>
                              {(m.email || m.phone) && (
                                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {m.email ? `📧 ${m.email}` : ''}
                                  {m.email && m.phone ? ' • ' : ''}
                                  {m.phone ? `📞 ${m.phone}` : ''}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div>
                                MSSV: <strong>{m.code || '—'}</strong>
                                {m.className ? ` • ${m.className}` : ''}
                              </div>
                              {m.assignmentStatus && (
                                <div style={{ fontSize: '10.5px', color: '#0369a1', marginTop: '1px' }}>
                                  {formatAssignmentStatus(m.assignmentStatus)}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {!isSup && (m.thesisTitle || m.directionName) && (
                          <div
                            className="utc-chat-member-topic"
                            title={m.thesisTitle || m.directionName}
                          >
                            {m.thesisTitle
                              ? `📘 Đề tài: ${m.thesisTitle}`
                              : `🧭 Hướng: ${m.directionName}`}
                          </div>
                        )}
                      </div>

                      {!isSelf && (
                        <button
                          type="button"
                          className="utc-chat-mention-btn"
                          title={`Nhắc tên ${m.fullName} trong tin nhắn`}
                          onClick={() => insertTextIntoDraft(`@${m.fullName} `)}
                        >
                          @Nhắc
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column: Conversation Panel */}
        <section
          className={`utc-chat-panel utc-chat-main ${mobileView !== 'chat' ? 'mobile-hidden' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDraggingOver) setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDraggingOver(false);
            }
          }}
          onDrop={handleDrop}
        >
          {isDraggingOver && (
            <div className="utc-chat-drop-overlay">
              <div style={{ fontSize: '36px' }}>📎</div>
              <div>Thả tệp vào đây để đính kèm vào nhóm chat</div>
            </div>
          )}

          {/* Header */}
          {selectedRoom && (
            <div className="utc-chat-header">
              <div>
                <h3 className="utc-chat-header-title">
                  <span>
                    Nhóm Hướng Dẫn — GVHD:{' '}
                    {formatLecturerDisplayName(
                      selectedRoom.lecturerName,
                      selectedRoom.lecturerDegree
                    )}
                  </span>
                </h3>
                <div className="utc-chat-header-sub">
                  <span>
                    Đợt: <strong>{selectedRoom.roundName}</strong> ({selectedRoom.roundCode})
                  </span>
                  <span>•</span>
                  <span>1 GVHD &amp; {selectedRoom.studentCount} sinh viên được phân công</span>
                </div>
              </div>

              <div className="utc-chat-header-tools">
                <div className="utc-chat-search-box">
                  <input
                    type="text"
                    className="utc-chat-search-input"
                    placeholder="🔍 Tìm tin nhắn..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                  />
                  {messageSearch && (
                    <button
                      type="button"
                      className="utc-chat-search-clear"
                      onClick={() => setMessageSearch('')}
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={`utc-chat-tool-btn ${onlyAttachments ? 'active' : ''}`}
                  onClick={() => setOnlyAttachments((v) => !v)}
                  title="Lọc các tin nhắn có tệp đính kèm"
                >
                  📎 Tệp ({attachmentCount})
                </button>

                <button
                  type="button"
                  className="utc-chat-tool-btn"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  title="Làm mới tin nhắn"
                >
                  {refreshing ? '⏳ Đang tải' : '🔄 Làm mới'}
                </button>

                <span className="utc-chat-live-pill" title="Tự động đồng bộ tin nhắn mới mỗi 4 giây">
                  <span className="utc-chat-live-dot" />
                  Trực tuyến
                </span>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="utc-chat-messages-wrap">
            <div
              ref={messagesContainerRef}
              className="utc-chat-messages"
              onScroll={handleMessagesScroll}
            >
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0', fontWeight: 600 }}>
                  ⏳ Đang tải lịch sử trao đổi của nhóm...
                </div>
              ) : visibleMessages.length === 0 ? (
                <div
                  style={{
                    margin: 'auto',
                    textAlign: 'center',
                    background: '#ffffff',
                    padding: '30px 34px',
                    borderRadius: '14px',
                    border: '1px dashed #cbd5e1',
                    maxWidth: '470px',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div style={{ fontSize: '34px', marginBottom: '8px' }}>
                    {messageSearch || onlyAttachments ? '🔎' : '👋'}
                  </div>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>
                    {messageSearch || onlyAttachments
                      ? 'Không tìm thấy tin nhắn phù hợp'
                      : 'Chào mừng đến với Nhóm Chat Hướng Dẫn!'}
                  </strong>
                  <p style={{ margin: '7px 0 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.55 }}>
                    {messageSearch || onlyAttachments
                      ? 'Thử xóa bộ lọc tìm kiếm hoặc chuyển sang chế độ xem toàn bộ hội thoại.'
                      : 'Giảng viên hướng dẫn và các sinh viên được phân công trong nhóm có thể trao đổi thông báo, giải đáp chuyên môn và chia sẻ tài liệu PDF/Word/Ảnh/ZIP tại đây.'}
                  </p>
                </div>
              ) : (
                visibleMessages.map((msg, index) => {
                  const mine = Boolean(msg.isMine);
                  const fromSupervisor = msg.senderRole === 'SUPERVISOR';
                  const currentDateKey = getLocalDateKey(msg.createdAt);
                  const prevDateKey =
                    index > 0 ? getLocalDateKey(visibleMessages[index - 1].createdAt) : '';
                  const showDateDivider = currentDateKey && currentDateKey !== prevDateKey;
                  const canDelete = mine || isRoomSupervisor;
                  const isImg = Boolean(
                    msg.attachmentUrl && isImageAttachment(msg.attachmentName || msg.attachmentUrl)
                  );

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateDivider && (
                        <div className="utc-chat-date-divider">
                          <span>{formatDateDivider(msg.createdAt)}</span>
                        </div>
                      )}

                      <div className={`utc-chat-msg-row ${mine ? 'mine' : 'incoming'}`}>
                        {!mine && (
                          <div
                            className={`utc-chat-avatar ${fromSupervisor ? 'supervisor' : ''}`}
                            style={
                              fromSupervisor
                                ? undefined
                                : { background: getAvatarColor(msg.senderCode || msg.senderName) }
                            }
                            title={msg.senderName}
                          >
                            {fromSupervisor ? '👨‍🏫' : getInitials(msg.senderName)}
                          </div>
                        )}

                        <div className="utc-chat-msg-col">
                          <div className="utc-chat-msg-meta">
                            <strong style={{ color: fromSupervisor ? '#b45309' : '#0f172a' }}>
                              {mine ? 'Bạn' : msg.senderName}
                            </strong>
                            <span
                              className={`utc-chat-msg-role-badge ${
                                fromSupervisor ? 'supervisor' : 'student'
                              }`}
                            >
                              {fromSupervisor
                                ? `👨‍🏫 GVHD${
                                    msg.senderSubtitle
                                      ? ` • ${formatDegreeShort(msg.senderSubtitle)}`
                                      : ''
                                  }`
                                : `🎓 ${msg.senderCode || 'SV'}${
                                    msg.senderSubtitle ? ` • ${msg.senderSubtitle}` : ''
                                  }`}
                            </span>
                            <span style={{ color: '#64748b' }}>
                              {formatTimeShort(msg.createdAt)}
                            </span>
                          </div>

                          <div className="utc-chat-bubble-wrap">
                            <div
                              className={`utc-chat-bubble ${
                                mine ? 'mine' : fromSupervisor ? 'supervisor' : 'student'
                              }`}
                            >
                              {msg.content && <div>{renderHighlightedText(msg.content)}</div>}

                              {msg.attachmentUrl && isImg && (
                                <div className={`utc-chat-image-wrap ${!msg.content ? 'no-text' : ''}`}>
                                  <a
                                    href={resolveFileUrl(msg.attachmentUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Bấm để xem ảnh kích thước đầy đủ"
                                  >
                                    <img
                                      src={resolveFileUrl(msg.attachmentUrl)}
                                      alt={msg.attachmentName || 'Ảnh đính kèm'}
                                      className="utc-chat-image-preview"
                                    />
                                  </a>
                                  <a
                                    href={resolveFileUrl(msg.attachmentUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="utc-chat-file-link"
                                    style={{ fontSize: '11.5px' }}
                                  >
                                    🖼️ {msg.attachmentName || 'Xem ảnh'}
                                  </a>
                                </div>
                              )}

                              {msg.attachmentUrl && !isImg && (
                                <div className={`utc-chat-file-card ${!msg.content ? 'no-text' : ''}`}>
                                  <span style={{ fontSize: '18px' }}>
                                    {getFileIcon(msg.attachmentName || msg.attachmentUrl)}
                                  </span>
                                  <a
                                    href={resolveFileUrl(msg.attachmentUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="utc-chat-file-link"
                                  >
                                    {msg.attachmentName || 'Mở tệp đính kèm'}
                                  </a>
                                </div>
                              )}
                            </div>

                            {canDelete && (
                              <div
                                className={`utc-chat-msg-actions ${
                                  confirmDeleteId === msg.id ? 'confirming' : ''
                                }`}
                              >
                                {confirmDeleteId === msg.id ? (
                                  <>
                                    <button
                                      type="button"
                                      className="utc-chat-delete-btn danger"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                    >
                                      Thu hồi
                                    </button>
                                    <button
                                      type="button"
                                      className="utc-chat-delete-btn"
                                      onClick={() => setConfirmDeleteId(null)}
                                    >
                                      Hủy
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="utc-chat-delete-btn"
                                    title="Thu hồi tin nhắn"
                                    onClick={() => setConfirmDeleteId(msg.id)}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {newMessagesBelowCount > 0 && (
              <button
                type="button"
                className="utc-chat-scroll-btn"
                onClick={() => scrollToBottom(true)}
              >
                ⬇ {newMessagesBelowCount} tin nhắn mới
              </button>
            )}
          </div>

          {/* Error & Staged Attachment Bars */}
          {errorMsg && (
            <div className="utc-chat-error-bar">
              <span>⚠️ {errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {attachmentUrl && (
            <div className="utc-chat-attachment-bar">
              <span>
                📎 Đính kèm: <strong>{attachmentName}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAttachmentUrl('');
                  setAttachmentName('');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕ Gỡ tệp
              </button>
            </div>
          )}

          {/* Quick Prompts */}
          <div className="utc-chat-quick-prompts">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
              Gợi ý nhanh:
            </span>
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                type="button"
                className="utc-chat-prompt-chip"
                onClick={() => insertTextIntoDraft(p.text, true)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <form className="utc-chat-composer" onSubmit={handleSend}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg,.webp,.txt"
              onChange={handleSelectAttachment}
            />
            <button
              type="button"
              className="utc-chat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile || sending}
              title="Đính kèm tài liệu hoặc ảnh (có thể kéo thả hoặc Ctrl+V)"
            >
              {uploadingFile ? '⏳ Đang tải...' : '📎 Đính kèm'}
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              className="utc-chat-textarea"
              placeholder="Nhập tin nhắn trao đổi với nhóm hướng dẫn (Enter để gửi, Shift+Enter xuống dòng, có thể dán ảnh)..."
              value={draftText}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              onPaste={handlePaste}
              disabled={sending}
            />

            <button
              type="submit"
              className="utc-chat-send-btn"
              disabled={sending || uploadingFile || (!draftText.trim() && !attachmentUrl)}
            >
              {sending ? 'Đang gửi...' : 'Gửi ➤'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ChatGroupPage;

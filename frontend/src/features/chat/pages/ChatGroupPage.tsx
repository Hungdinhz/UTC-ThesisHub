import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import type { ChatRoom, ChatMessageItem } from '../services/chatService';
import { fileUploadService } from '../../../services/fileUploadService';
import { resolveFileUrl, getFileIcon } from '../../../utils/fileUtils';
import { useAuth } from '../../../contexts/AuthContext';

export const ChatGroupPage: React.FC = () => {
  const { userType } = useAuth();
  const isStudent = userType === 'student';

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomKey, setSelectedRoomKey] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  const [draftText, setDraftText] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedRoom = rooms.find((r) => r.roomKey === selectedRoomKey) || null;

  useEffect(() => {
    loadRooms(true);
  }, []);

  const loadRooms = async (initial: boolean = false) => {
    try {
      if (initial) setLoadingRooms(true);
      const list = await chatService.getMyRooms();
      setRooms(list);
      if (list.length > 0 && (!selectedRoomKey || !list.some((r) => r.roomKey === selectedRoomKey))) {
        setSelectedRoomKey(list[0].roomKey);
      }
    } catch (err: any) {
      if (initial) {
        setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể tải danh sách nhóm hướng dẫn');
      }
    } finally {
      if (initial) setLoadingRooms(false);
    }
  };

  const fetchMessages = async (room: ChatRoom, showSpinner: boolean = false) => {
    try {
      if (showSpinner) setLoadingMessages(true);
      const list = await chatService.getRoomMessages(room.projectRoundId, room.lecturerId);
      setMessages((prev) => {
        if (prev.length !== list.length || prev[prev.length - 1]?.id !== list[list.length - 1]?.id) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
        }
        return list;
      });
    } catch (err: any) {
      if (showSpinner) {
        setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể tải tin nhắn của nhóm');
      }
    } finally {
      if (showSpinner) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedRoom) return;
    fetchMessages(selectedRoom, true);

    const interval = setInterval(() => {
      fetchMessages(selectedRoom, false);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedRoomKey, rooms.length]);

  const handleSelectAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRoom || sending || uploadingFile) return;
    if (!draftText.trim() && !attachmentUrl) return;

    try {
      setSending(true);
      setErrorMsg(null);
      const sent = await chatService.sendMessage(selectedRoom.projectRoundId, selectedRoom.lecturerId, {
        content: draftText.trim(),
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
      });
      setMessages((prev) => [...prev, sent]);
      setDraftText('');
      setAttachmentUrl('');
      setAttachmentName('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      loadRooms(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Gửi tin nhắn thất bại!');
    } finally {
      setSending(false);
    }
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
      <div
        style={{
          maxWidth: '720px',
          margin: '36px auto',
          background: '#fff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '44px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ fontSize: '42px', marginBottom: '12px' }}>💬</div>
        <h2 style={{ margin: '0 0 8px 0', color: '#0a3273', fontSize: '20px' }}>
          Chưa có Nhóm Chat Hướng Dẫn nào được tạo
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
          {isStudent
            ? 'Nhóm chat giữa Giảng viên hướng dẫn và các bạn sinh viên cùng nhóm sẽ tự động kích hoạt ngay sau khi Khoa chốt kết quả phân công GVHD tại Giai đoạn 2.'
            : 'Nhóm chat hướng dẫn theo từng đợt đồ án sẽ tự động xuất hiện ngay khi bạn có danh sách sinh viên được phân công hướng dẫn chính thức.'}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '330px 1fr',
        gap: '18px',
        height: 'calc(100vh - 165px)',
        minHeight: '560px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Left Sidebar: Rooms + Group Members */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            background: '#0a3273',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>💬 Nhóm Hướng Dẫn ({rooms.length})</span>
        </div>

        {/* Room Switcher */}
        <div style={{ maxHeight: '210px', overflowY: 'auto', borderBottom: '1px solid #e2e8f0' }}>
          {rooms.map((room) => {
            const active = room.roomKey === selectedRoomKey;
            return (
              <div
                key={room.roomKey}
                onClick={() => setSelectedRoomKey(room.roomKey)}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  background: active ? '#eff6ff' : '#fff',
                  borderLeft: active ? '4px solid #0a3273' : '4px solid transparent',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                    Nhóm GVHD: {room.lecturerName}
                  </strong>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: room.roundStatus === 'CLOSED' ? '#f1f5f9' : '#dcfce7',
                      color: room.roundStatus === 'CLOSED' ? '#64748b' : '#15803d',
                    }}
                  >
                    {room.studentCount} SV
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                  📁 {room.roundName} ({room.roundCode})
                </div>
                {room.lastMessagePreview && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginTop: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {room.lastSenderName ? `${room.lastSenderName}: ` : ''}
                    {room.lastMessagePreview}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Group Member List */}
        {selectedRoom && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
              👥 Thành viên trong nhóm ({selectedRoom.members.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedRoom.members.map((m, idx) => {
                const isSup = m.role === 'SUPERVISOR';
                return (
                  <div
                    key={`${m.role}-${m.profileId || idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isSup ? '#fef3c7' : '#f8fafc',
                      border: `1px solid ${isSup ? '#fde68a' : '#e2e8f0'}`,
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isSup ? '#d97706' : '#0a3273',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        flexShrink: 0,
                      }}
                    >
                      {isSup ? '👨‍🏫' : (m.fullName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.fullName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: isSup ? '#92400e' : '#64748b' }}>
                        {isSup
                          ? `Giảng viên hướng dẫn ${m.className ? `(${m.className})` : ''}`
                          : `MSSV: ${m.code || '—'}${m.className ? ` • ${m.className}` : ''}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Conversation Panel */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Chat Header */}
        {selectedRoom && (
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0a3273', fontWeight: 800 }}>
                Nhóm Hướng Dẫn Đồ Án — GVHD: {selectedRoom.lecturerName}
              </h3>
              <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                Đợt đồ án: <strong>{selectedRoom.roundName}</strong> ({selectedRoom.roundCode}) • Gồm 1 GVHD &amp;{' '}
                {selectedRoom.studentCount} sinh viên cùng nhóm
              </div>
            </div>
            <span
              style={{
                fontSize: '12px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              🔄 Tự động cập nhật trực tuyến
            </span>
          </div>
        )}

        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            background: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {loadingMessages ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
              Đang tải lịch sử trao đổi...
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                background: '#fff',
                padding: '28px 32px',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                maxWidth: '460px',
              }}
            >
              <div style={{ fontSize: '30px', marginBottom: '8px' }}>👋</div>
              <strong style={{ color: '#0f172a', fontSize: '14.5px' }}>
                Chào mừng đến với Nhóm Chat Hướng Dẫn!
              </strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Giảng viên hướng dẫn và toàn bộ sinh viên trong nhóm có thể trao đổi thông báo chung, hỏi đáp chuyên môn và gửi tài liệu PDF/Word/ZIP ngay tại đây.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const mine = Boolean(msg.isMine);
              const fromSupervisor = msg.senderRole === 'SUPERVISOR';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: mine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: '#475569',
                      marginBottom: '3px',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <strong style={{ color: fromSupervisor ? '#b45309' : '#0f172a' }}>
                      {mine ? 'Bạn' : msg.senderName}
                    </strong>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: fromSupervisor ? '#fef3c7' : '#e2e8f0',
                        color: fromSupervisor ? '#b45309' : '#334155',
                      }}
                    >
                      {fromSupervisor ? '👨‍🏫 GVHD' : '🎓 Sinh viên'}
                    </span>
                    <span>
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <div
                    style={{
                      maxWidth: '72%',
                      padding: '10px 14px',
                      borderRadius: mine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: mine ? '#0a3273' : fromSupervisor ? '#fffbeb' : '#fff',
                      color: mine ? '#fff' : '#0f172a',
                      border: mine ? 'none' : fromSupervisor ? '1.5px solid #fcd34d' : '1px solid #cbd5e1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content && <div>{msg.content}</div>}

                    {msg.attachmentUrl && (
                      <div
                        style={{
                          marginTop: msg.content ? '8px' : 0,
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: mine ? 'rgba(255,255,255,0.14)' : '#f8fafc',
                          border: mine ? '1px solid rgba(255,255,255,0.25)' : '1px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{getFileIcon(msg.attachmentName || msg.attachmentUrl)}</span>
                        <a
                          href={resolveFileUrl(msg.attachmentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: mine ? '#bae6fd' : '#2563eb',
                            fontWeight: 600,
                            fontSize: '12.5px',
                            textDecoration: 'underline',
                          }}
                        >
                          {msg.attachmentName || 'Mở tệp đính kèm'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Preview & Error */}
        {errorMsg && (
          <div style={{ padding: '6px 16px', background: '#fef2f2', color: '#dc2626', fontSize: '12.5px', borderTop: '1px solid #fecaca' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {attachmentUrl && (
          <div
            style={{
              padding: '8px 16px',
              background: '#eff6ff',
              borderTop: '1px solid #bfdbfe',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12.5px',
            }}
          >
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

        {/* Composer */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            background: '#fff',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
            onChange={handleSelectAttachment}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile || sending}
            title="Đính kèm tài liệu (PDF, Word, Excel, Ảnh, ZIP...)"
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 600,
              fontSize: '13px',
              cursor: uploadingFile ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {uploadingFile ? '⏳ Đang tải...' : '📎 Đính kèm'}
          </button>

          <input
            type="text"
            placeholder="Nhập tin nhắn trao đổi với nhóm hướng dẫn (Nhấn Enter để gửi)..."
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            disabled={sending}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={sending || uploadingFile || (!draftText.trim() && !attachmentUrl)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: sending || (!draftText.trim() && !attachmentUrl) ? '#94a3b8' : '#0a3273',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: sending || (!draftText.trim() && !attachmentUrl) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {sending ? 'Đang gửi...' : 'Gửi ➤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatGroupPage;

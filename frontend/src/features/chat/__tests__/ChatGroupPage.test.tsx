import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChatGroupPage } from '../pages/ChatGroupPage';
import { chatService } from '../services/chatService';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 10,
      user: { id: 201 },
      studentId: 10,
      studentCode: '221200001',
      fullName: 'Nguyễn Văn An',
    },
    userType: 'student',
    loading: false,
  }),
}));

vi.mock('../services/chatService', () => ({
  chatService: {
    getMyRooms: vi.fn(),
    getRoomMessages: vi.fn(),
    sendMessage: vi.fn(),
    deleteMessage: vi.fn(),
  },
}));

vi.mock('../../../services/fileUploadService', () => ({
  fileUploadService: {
    uploadFile: vi.fn(),
  },
}));

describe('ChatGroupPage', () => {
  const sampleRooms = [
    {
      roomKey: '1-5',
      projectRoundId: 1,
      roundCode: 'DA_K63_HK1',
      roundName: 'Đợt Đồ án K63 HK1',
      roundStatus: 'IN_PROGRESS',
      lecturerId: 5,
      lecturerName: 'Nguyễn Văn Giảng',
      lecturerDegree: 'TIEN_SI',
      lecturerCode: 'GV005',
      lecturerEmail: 'giang@utc.edu.vn',
      departmentName: 'Bộ môn CNPM',
      studentCount: 2,
      members: [
        {
          userId: 105,
          profileId: 5,
          fullName: 'Nguyễn Văn Giảng',
          code: 'GV005',
          className: 'TIEN_SI',
          role: 'SUPERVISOR',
          email: 'giang@utc.edu.vn',
        },
        {
          userId: 201,
          profileId: 10,
          fullName: 'Nguyễn Văn An',
          code: '221200001',
          className: 'CNTT1-K63',
          role: 'STUDENT',
          thesisTitle: 'Hệ thống quản lý đồ án',
          assignmentStatus: 'FINALIZED',
        },
        {
          userId: 202,
          profileId: 11,
          fullName: 'Trần Thị Bình',
          code: '221200002',
          className: 'CNTT2-K63',
          role: 'STUDENT',
          directionName: 'Trí tuệ nhân tạo',
          assignmentStatus: 'OVERRIDDEN',
        },
      ],
    },
  ];

  const sampleMessages = [
    {
      id: 1,
      projectRoundId: 1,
      lecturerId: 5,
      senderUserId: 105,
      senderName: 'TS. Nguyễn Văn Giảng',
      senderRole: 'SUPERVISOR',
      senderCode: 'GV005',
      senderSubtitle: 'TIEN_SI',
      content: 'Chào các em, thứ 5 nhóm mình họp nhé.',
      createdAt: new Date().toISOString(),
      isMine: false,
    },
    {
      id: 2,
      projectRoundId: 1,
      lecturerId: 5,
      senderUserId: 201,
      senderName: 'Nguyễn Văn An',
      senderRole: 'STUDENT',
      senderCode: '221200001',
      senderSubtitle: 'CNTT1-K63',
      content: 'Dạ vâng thầy ạ.',
      attachmentUrl: '/api/v1/files/download/decuong.pdf',
      attachmentName: 'decuong.pdf',
      createdAt: new Date().toISOString(),
      isMine: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollTo = vi.fn() as any;
    (chatService.getMyRooms as any).mockResolvedValue(sampleRooms);
    (chatService.getRoomMessages as any).mockResolvedValue(sampleMessages);
  });

  it('renders room members, supervisor badge, and messages without error', async () => {
    render(<ChatGroupPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nhóm Hướng Dẫn — GVHD: TS\. Nguyễn Văn Giảng/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1 GVHD & 2 sinh viên được phân công/i)).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
    expect(screen.getByText(/221200002/)).toBeInTheDocument();
    expect(await screen.findByText(/Chào các em, thứ 5 nhóm mình họp nhé\./)).toBeInTheDocument();
    expect(screen.getByText('decuong.pdf')).toBeInTheDocument();
  });

  it('filters messages by search and attachment toggle, and sends a new message', async () => {
    (chatService.sendMessage as any).mockResolvedValue({
      id: 3,
      projectRoundId: 1,
      lecturerId: 5,
      senderUserId: 201,
      senderName: 'Nguyễn Văn An',
      senderRole: 'STUDENT',
      senderCode: '221200001',
      senderSubtitle: 'CNTT1-K63',
      content: 'Em đã nộp file mới ạ',
      createdAt: new Date().toISOString(),
      isMine: true,
    });

    render(<ChatGroupPage />);

    await waitFor(() => {
      expect(screen.getByText(/Chào các em, thứ 5 nhóm mình họp nhé\./)).toBeInTheDocument();
    });

    // Attachment filter button shows count 1
    const attachFilterBtn = screen.getByRole('button', { name: /Tệp \(1\)/i });
    fireEvent.click(attachFilterBtn);

    expect(screen.queryByText(/Chào các em, thứ 5 nhóm mình họp nhé\./)).not.toBeInTheDocument();
    expect(screen.getByText('decuong.pdf')).toBeInTheDocument();

    // Turn off attachment filter
    fireEvent.click(attachFilterBtn);
    expect(screen.getByText(/Chào các em, thứ 5 nhóm mình họp nhé\./)).toBeInTheDocument();

    // Send a new message
    const textarea = screen.getByPlaceholderText(/Nhập tin nhắn trao đổi/i);
    fireEvent.change(textarea, { target: { value: 'Em đã nộp file mới ạ' } });
    fireEvent.click(screen.getByRole('button', { name: /Gửi ➤/i }));

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalledWith(1, 5, {
        content: 'Em đã nộp file mới ạ',
        attachmentUrl: undefined,
        attachmentName: undefined,
      });
    });

    expect(screen.getByText('Em đã nộp file mới ạ')).toBeInTheDocument();
  });

  it('shows empty state when user has no assigned supervisor group rooms', async () => {
    (chatService.getMyRooms as any).mockResolvedValue([]);
    render(<ChatGroupPage />);

    await waitFor(() => {
      expect(screen.getByText(/Chưa có Nhóm Chat Hướng Dẫn nào được tạo/i)).toBeInTheDocument();
    });
  });
});

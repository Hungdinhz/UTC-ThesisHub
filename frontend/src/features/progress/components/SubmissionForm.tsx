import React, { useState } from 'react';

interface Props {
  taskId: number;
  onSubmitSuccess: () => void;
}

export const SubmissionForm: React.FC<Props> = ({ taskId, onSubmitSuccess }) => {
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mô phỏng call API
    setTimeout(() => {
      setIsSubmitting(false);
      setContent('');
      setFileUrl('');
      onSubmitSuccess();
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">Nộp bài / Báo cáo kết quả Task</h4>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả công việc đã làm</label>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Liệt kê những việc đã hoàn thành..."
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">Đính kèm link tài liệu (Google Drive, Github...)</label>
        <input 
          type="url" 
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://..."
        />
      </div>
      <div className="flex justify-end">
        <button 
          type="submit"
          disabled={isSubmitting || !content}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isSubmitting ? 'Đang gửi...' : 'Nộp bài'}
        </button>
      </div>
    </form>
  );
};

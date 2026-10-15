import React, { useState } from 'react';

interface Props {
  onSubmit: (result: string, feedback: string) => void;
  onCancel: () => void;
}

export const ProposalReviewForm: React.FC<Props> = ({ onSubmit, onCancel }) => {
  const [result, setResult] = useState<string>('APPROVED');
  const [feedback, setFeedback] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(result, feedback);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-medium mb-4">Đánh giá đề cương</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả</label>
          <select 
            value={result} 
            onChange={(e) => setResult(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="APPROVED">Duyệt</option>
            <option value="REVISION_REQUIRED">Yêu cầu sửa lại</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét chi tiết</label>
          <textarea 
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập nhận xét hoặc yêu cầu chỉnh sửa..."
            required={result === 'REVISION_REQUIRED' || result === 'REJECTED'}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Lưu đánh giá
          </button>
        </div>
      </form>
    </div>
  );
};

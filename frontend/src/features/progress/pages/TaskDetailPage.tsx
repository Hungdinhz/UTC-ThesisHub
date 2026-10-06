import React from 'react';
// File giữ chỗ cho TaskDetailPage

export const TaskDetailPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Chi tiết Công việc</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-gray-500 italic">Component hiển thị chi tiết 1 Task. Gồm mô tả task, trạng thái, Form nộp bài (SubmissionForm) và Form nhận xét.</p>
      </div>
      
      {/* Nơi nhúng CommentSection Component */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 italic">Khu vực CommentSection (Thảo luận về task).</p>
      </div>
    </div>
  );
};

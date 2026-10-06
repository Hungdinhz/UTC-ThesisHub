import React from 'react';
import { ProgressFeedback } from '../types/progress.types';

interface Props {
  feedbacks: ProgressFeedback[];
}

export const ProgressTimeline: React.FC<Props> = ({ feedbacks }) => {
  return (
    <div className="relative border-l-2 border-gray-200 ml-3 mt-4 mb-2">
      {feedbacks.map((fb, idx) => (
        <div key={idx} className="mb-6 ml-6 relative">
          <span className={`absolute -left-8 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${fb.isSatisfactory ? 'bg-green-500' : 'bg-red-500'}`}>
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {fb.isSatisfactory 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              }
            </svg>
          </span>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-semibold text-gray-900">{fb.lecturerName}</h4>
              <time className="text-xs text-gray-500">{new Date(fb.createdAt).toLocaleDateString()}</time>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{fb.feedback}</p>
            <div className="mt-2 text-xs font-medium">
              Đánh giá: 
              <span className={`ml-1 px-2 py-0.5 rounded-full ${fb.isSatisfactory ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {fb.isSatisfactory ? 'Đạt' : 'Cần cố gắng'}
              </span>
            </div>
          </div>
        </div>
      ))}
      {feedbacks.length === 0 && (
        <div className="text-sm text-gray-500 italic ml-6">Chưa có đánh giá nào.</div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import type {  Comment  } from '../types/progress.types';

interface Props {
  comments: Comment[];
  onAddComment: (content: string) => void;
}

export const CommentSection: React.FC<Props> = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        Thảo luận ({comments.length})
      </h3>
      
      <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
        {comments.map((comment, idx) => (
          <div key={idx} className="flex space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {comment.authorName.charAt(0)}
              </div>
            </div>
            <div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">{comment.authorName}</span>
                <span className="text-gray-500 text-xs ml-2">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                {comment.content}
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-sm text-gray-500 italic py-2 text-center">Chưa có bình luận nào.</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận..."
          className="flex-1 text-sm p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <button 
          type="submit"
          disabled={!newComment.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          Gửi
        </button>
      </form>
    </div>
  );
};

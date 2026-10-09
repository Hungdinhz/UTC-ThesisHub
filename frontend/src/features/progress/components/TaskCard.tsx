import React from 'react';
import type {  Task  } from '../types/progress.types';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<Props> = ({ task, onClick }) => {
  const getBorderColor = () => {
    switch (task.status) {
      case 'TODO': return 'border-l-gray-400';
      case 'IN_PROGRESS': return 'border-l-blue-400';
      case 'SUBMITTED': return 'border-l-yellow-400';
      case 'REVISION_REQUIRED': return 'border-l-red-400';
      case 'COMPLETED': return 'border-l-green-400';
      default: return 'border-l-gray-200';
    }
  };

  return (
    <div 
      className={`bg-white rounded shadow p-3 mb-2 cursor-pointer hover:shadow-md border-l-4 ${getBorderColor()} transition-shadow duration-200`}
      onClick={() => onClick(task)}
    >
      <div className="font-medium text-sm text-gray-800 truncate mb-1">{task.title}</div>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{task.assigneeName}</span>
        {task.dueDate && (
          <span className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

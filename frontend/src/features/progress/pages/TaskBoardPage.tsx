import React, { useEffect, useState } from 'react';
import { progressApi } from '../services/progressApi';
import { Task } from '../types/progress.types';
import { TaskCard } from '../components/TaskCard';

export const TaskBoardPage: React.FC<{ thesisId: number }> = ({ thesisId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [thesisId]);

  const fetchTasks = async () => {
    try {
      const data = await progressApi.getTasks(thesisId);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'SUBMITTED' || t.status === 'REVISION_REQUIRED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const handleTaskClick = (task: Task) => {
    // Navigate to task detail (simulated)
    console.log('Navigate to task:', task.id);
    window.location.href = `/tasks/${task.id}`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bảng tiến độ công việc</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          + Giao việc mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Cột TODO */}
          <div className="bg-gray-100 p-4 rounded-lg min-h-[500px]">
            <h3 className="font-bold text-gray-700 mb-4 flex justify-between">
              Cần làm <span className="bg-gray-200 text-gray-600 px-2 rounded-full text-sm">{todoTasks.length}</span>
            </h3>
            {todoTasks.map(t => <TaskCard key={t.id} task={t} onClick={handleTaskClick} />)}
          </div>

          {/* Cột IN PROGRESS / ĐANG XỬ LÝ */}
          <div className="bg-blue-50 p-4 rounded-lg min-h-[500px]">
            <h3 className="font-bold text-blue-700 mb-4 flex justify-between">
              Đang thực hiện <span className="bg-blue-200 text-blue-800 px-2 rounded-full text-sm">{inProgressTasks.length}</span>
            </h3>
            {inProgressTasks.map(t => <TaskCard key={t.id} task={t} onClick={handleTaskClick} />)}
          </div>

          {/* Cột COMPLETED */}
          <div className="bg-green-50 p-4 rounded-lg min-h-[500px]">
            <h3 className="font-bold text-green-700 mb-4 flex justify-between">
              Hoàn thành <span className="bg-green-200 text-green-800 px-2 rounded-full text-sm">{completedTasks.length}</span>
            </h3>
            {completedTasks.map(t => <TaskCard key={t.id} task={t} onClick={handleTaskClick} />)}
          </div>
        </div>
      )}
    </div>
  );
};

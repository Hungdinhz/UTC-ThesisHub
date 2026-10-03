import React, { useState, useEffect } from 'react';
import { SupervisorAssignment } from '../types/assignment.types';
import { assignmentApi } from '../services/assignmentApi';
import { AssignmentProposalList } from '../components/AssignmentProposalList';

export const AssignmentProposalPage: React.FC = () => {
  const [projectRoundId] = useState(201); // Mocked for now
  const [proposals, setProposals] = useState<SupervisorAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
  }, [projectRoundId]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentApi.getProposals(projectRoundId);
      setProposals(data);
    } catch (err: any) {
      setError('Lỗi tải danh sách: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn chạy thuật toán? Các đề xuất cũ chưa chốt sẽ bị ghi đè.')) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      const data = await assignmentApi.generateAssignments(projectRoundId);
      setProposals(data);
      setSuccessMsg('Đã chạy xong thuật toán phân công thành công.');
    } catch (err: any) {
      setError('Lỗi khi chạy thuật toán: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn CHỐT danh sách phân công? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);
      await assignmentApi.finalizeAssignments(projectRoundId);
      setSuccessMsg('Đã chốt danh sách phân công thành công.');
      loadProposals(); // Reload to show FINAL status
    } catch (err: any) {
      setError('Lỗi khi chốt danh sách: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const hasProposals = proposals.length > 0;
  const isFinalized = hasProposals && proposals.every(p => p.status === 'FINAL');

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">Kết quả phân công giảng viên</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleGenerate}
              disabled={actionLoading || isFinalized}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
            >
              {actionLoading ? 'Đang xử lý...' : 'Chạy thuật toán'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={actionLoading || !hasProposals || isFinalized}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-green-300"
            >
              Chốt danh sách
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <AssignmentProposalList 
          proposals={proposals} 
          loading={loading} 
          onRefreshNeeded={loadProposals} 
        />
        
      </div>
    </div>
  );
};

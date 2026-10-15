import React, { useState } from 'react';
import type { SupervisorAssignment } from '../types/assignment.types';
import { OverrideModal } from './OverrideModal';

interface Props {
  proposals: SupervisorAssignment[];
  loading: boolean;
  onRefreshNeeded: () => void;
}

export const AssignmentProposalList: React.FC<Props> = ({ proposals, loading, onRefreshNeeded }) => {
  const [overridingAssignment, setOverridingAssignment] = useState<SupervisorAssignment | null>(null);

  if (loading) {
    return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  }

  if (proposals.length === 0) {
    return <div className="text-center py-10 text-gray-500">Chưa có dữ liệu phân công. Vui lòng chạy thuật toán.</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên (ID)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảng viên (ID)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hướng đồ án</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguyện vọng trúng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm số</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proposals.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.studentId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.lecturerId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.projectDirectionId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.preferenceOrder ? `NV${item.preferenceOrder}` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.score}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.status === 'PROPOSED' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Đề xuất
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Đã chốt
                    </span>
                  )}
                  {item.reason && item.reason.includes('Overridden') && (
                    <div className="text-xs text-red-500 mt-1" title={item.reason}>(Có chỉnh sửa)</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {item.status === 'PROPOSED' && (
                    <button
                      onClick={() => setOverridingAssignment(item)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Điều chỉnh
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overridingAssignment && (
        <OverrideModal
          assignment={overridingAssignment}
          onClose={() => setOverridingAssignment(null)}
          onSuccess={() => {
            setOverridingAssignment(null);
            onRefreshNeeded();
          }}
        />
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import type { LecturerCapacityResponse } from '../types/assignment.types';
import { assignmentApi } from '../services/assignmentApi';

interface Props {
  projectRoundId: number;
  onEdit: (capacity: LecturerCapacityResponse) => void;
}

export const LecturerCapacityList: React.FC<Props> = ({ projectRoundId, onEdit }) => {
  const [capacities, setCapacities] = useState<LecturerCapacityResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCapacities();
  }, [projectRoundId]);

  const loadCapacities = async () => {
    try {
      setLoading(true);
      const data = await assignmentApi.getCapacitiesByProjectRound(projectRoundId);
      setCapacities(data);
    } catch (error) {
      console.error('Failed to load capacities', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảng viên ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chỉ tiêu (Base)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hệ số</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity hiệu dụng</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã phân công</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Còn khả năng nhận</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr><td colSpan={7} className="px-6 py-4 text-center">Đang tải...</td></tr>
          ) : capacities.length === 0 ? (
            <tr><td colSpan={7} className="px-6 py-4 text-center">Chưa có dữ liệu</td></tr>
          ) : (
            capacities.map((cap) => (
              <tr key={cap.id}>
                <td className="px-6 py-4 whitespace-nowrap">{cap.lecturerId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{cap.baseQuota}</td>
                <td className="px-6 py-4 whitespace-nowrap">{cap.capacityCoefficient}</td>
                <td className="px-6 py-4 whitespace-nowrap">{cap.effectiveCapacity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{cap.assignedCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cap.remainingCapacity > 0 ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Còn chỗ ({cap.remainingCapacity})
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Đã đầy
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(cap)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { assignmentApi } from '../services/assignmentApi';
import { LecturerCapacityResponse } from '../types/assignment.types';

interface DashboardStats {
  totalStudentsRegistered: number;
  totalStudentsAssigned: number;
  totalStudentsUnassigned: number;
  lecturersFullCapacity: number;
}

interface Props {
  projectRoundId: number;
}

export const CapacityDashboard: React.FC<Props> = ({ projectRoundId }) => {
  const [capacities, setCapacities] = useState<LecturerCapacityResponse[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudentsRegistered: 0,
    totalStudentsAssigned: 0,
    totalStudentsUnassigned: 0,
    lecturersFullCapacity: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [projectRoundId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch capacities
      const capData = await assignmentApi.getCapacitiesByProjectRound(projectRoundId);
      setCapacities(capData);

      // In a real app, we might have a specific API endpoint for these stats
      // Mocking stats for now based on capacities and some dummy data
      const fullLecturers = capData.filter(c => c.remainingCapacity <= 0).length;
      const totalAssigned = capData.reduce((sum, c) => sum + c.assignedCount, 0);
      
      setStats({
        totalStudentsRegistered: totalAssigned + 45, // Mocked unassigned students
        totalStudentsAssigned: totalAssigned,
        totalStudentsUnassigned: 45,
        lecturersFullCapacity: fullLecturers,
      });

    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Đang tải bảng điều khiển...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Dashboard Tải Phân Công</h2>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Tổng SV đăng ký</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalStudentsRegistered}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Tổng SV đã phân công</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">{stats.totalStudentsAssigned}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Tổng SV chưa có GV</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.totalStudentsUnassigned}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">GV đã đầy chỉ tiêu</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.lecturersFullCapacity}</dd>
          </div>
        </div>
      </div>

      {/* Progress Bars for Lecturers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mức độ tải của giảng viên</h3>
        <div className="space-y-4">
          {capacities.map(cap => {
            const percent = cap.effectiveCapacity > 0 
              ? Math.min(100, Math.round((cap.assignedCount / cap.effectiveCapacity) * 100))
              : 0;
            
            let colorClass = "bg-green-500";
            if (percent > 90) colorClass = "bg-red-500";
            else if (percent > 70) colorClass = "bg-yellow-500";

            return (
              <div key={cap.id}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>GV ID: {cap.lecturerId}</span>
                  <span>{cap.assignedCount} / {cap.effectiveCapacity} ({percent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            );
          })}
          {capacities.length === 0 && <p className="text-gray-500 text-sm">Chưa có dữ liệu chỉ tiêu giảng viên.</p>}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { RegistrationResponse } from '../types/assignment.types';
// import { assignmentApi } from '../services/assignmentApi';
import { AssignmentFilterBar } from './AssignmentFilterBar';

interface Props {
  projectRoundId: number;
}

export const StudentRegistrationList: React.FC<Props> = ({ projectRoundId }) => {
  const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedReg, setSelectedReg] = useState<RegistrationResponse | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, [projectRoundId]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      // Mocking fetch all registrations. The actual backend would need to support this.
      // const data = await assignmentApi.getAllRegistrations(projectRoundId);
      // setRegistrations(data);
      
      // Mock Data
      setTimeout(() => {
        setRegistrations([
          {
            id: 1,
            studentId: 20201234,
            projectDirectionId: 1,
            status: 'PENDING',
            preferences: [
              { lecturerId: 101, priorityOrder: 1 },
              { lecturerId: 102, priorityOrder: 2 },
            ],
            extraCriteria: 'Mong muốn làm về React'
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load registrations', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    // In a real app, you would fetch data with the new filters or filter the local state
  };

  return (
    <div>
      <AssignmentFilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã SV</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hướng đồ án</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số NV</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Đang tải...</td></tr>
            ) : registrations.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Chưa có dữ liệu</td></tr>
            ) : (
              registrations.map((reg) => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{reg.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{reg.projectDirectionId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reg.status === 'PENDING' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Chờ duyệt
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Hợp lệ
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{reg.preferences?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setSelectedReg(reg)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chi tiết nguyện vọng */}
      {selectedReg && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedReg(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Chi tiết nguyện vọng của SV {selectedReg.studentId}</h3>
              <div className="space-y-3">
                {selectedReg.preferences.map(p => (
                  <div key={p.priorityOrder} className="bg-gray-50 p-3 rounded-md">
                    <span className="font-semibold text-gray-700">NV{p.priorityOrder}:</span> Giảng viên ID {p.lecturerId}
                  </div>
                ))}
                {selectedReg.extraCriteria && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-500">Tiêu chí phụ:</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedReg.extraCriteria}</p>
                  </div>
                )}
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedReg(null)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

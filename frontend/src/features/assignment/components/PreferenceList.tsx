import React, { useState, useEffect } from 'react';
import type { RegistrationResponse } from '../types/assignment.types';
// import { assignmentApi } from '../services/assignmentApi';

interface Props {
  projectRoundId: number;
}

export const PreferenceList: React.FC<Props> = ({ projectRoundId }) => {
  // We mock a fetch for all preferences. The actual API would be GET /assignments/preferences?projectRoundId=...
  const [preferences, setPreferences] = useState<RegistrationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // For demonstration, we'll fetch 'my' preferences and pretend it's a list, or just show empty/mock state
    // In a full implementation, you'd call an admin endpoint to get all preferences
    setLoading(true);
    setTimeout(() => {
      setPreferences([
        {
          id: 1,
          studentId: 101,
          projectDirectionId: 1,
          status: 'PENDING',
          preferences: [
            { lecturerId: 201, priorityOrder: 1 },
            { lecturerId: 202, priorityOrder: 2 },
            { lecturerId: 203, priorityOrder: 3 }
          ],
          extraCriteria: 'Muốn làm về AI'
        }
      ]);
      setLoading(false);
    }, 500);
  }, [projectRoundId]);

  if (loading) return <div>Đang tải danh sách nguyện vọng...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã SV</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hướng ĐA</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NV1 (GV ID)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NV2 (GV ID)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NV3 (GV ID)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu chí phụ</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {preferences.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Không có dữ liệu</td></tr>
          ) : (
            preferences.map(pref => {
              const nv1 = pref.preferences.find(p => p.priorityOrder === 1)?.lecturerId || '-';
              const nv2 = pref.preferences.find(p => p.priorityOrder === 2)?.lecturerId || '-';
              const nv3 = pref.preferences.find(p => p.priorityOrder === 3)?.lecturerId || '-';
              
              return (
                <tr key={pref.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{pref.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{pref.projectDirectionId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{nv1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{nv2}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{nv3}</td>
                  <td className="px-6 py-4 truncate max-w-xs" title={pref.extraCriteria}>{pref.extraCriteria || '-'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

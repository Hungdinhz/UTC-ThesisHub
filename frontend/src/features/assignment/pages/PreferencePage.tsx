import React, { useState } from 'react';
import { PreferenceList } from '../components/PreferenceList';
import { AssignmentFilterBar } from '../components/AssignmentFilterBar';

export const PreferencePage: React.FC = () => {
  const [projectRoundId] = useState(201); // Mocked for now
  const [filters, setFilters] = useState({});

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Danh sách nguyện vọng</h1>
          <p className="text-sm text-gray-500">Xem chi tiết các nguyện vọng đăng ký của sinh viên, hỗ trợ phân tích trước khi chạy thuật toán.</p>
        </div>

        <AssignmentFilterBar 
          filters={filters} 
          onFilterChange={setFilters} 
          showLecturer={true}
        />

        <PreferenceList projectRoundId={projectRoundId} />
      </div>
    </div>
  );
};

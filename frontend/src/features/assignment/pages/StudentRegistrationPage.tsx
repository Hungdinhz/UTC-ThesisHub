import React, { useState } from 'react';
import { StudentRegistrationList } from '../components/StudentRegistrationList';

export const StudentRegistrationPage: React.FC = () => {
  const [projectRoundId] = useState(201); // Mocked for now

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Danh sách sinh viên đăng ký hướng đồ án</h1>
          <p className="text-sm text-gray-500">Xem và quản lý nguyện vọng đăng ký của sinh viên trong đợt.</p>
        </div>

        <StudentRegistrationList projectRoundId={projectRoundId} />
      </div>
    </div>
  );
};

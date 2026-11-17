import React from 'react';
import OrganizationManagementPage from './OrganizationManagementPage';

const StudentManagementPage: React.FC = () => {
  return <OrganizationManagementPage mode="students" defaultTab="students" />;
};

export default StudentManagementPage;

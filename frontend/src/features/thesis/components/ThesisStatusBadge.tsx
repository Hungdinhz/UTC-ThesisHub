import React from 'react';

interface Props {
  status: string;
}

export const ThesisStatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeColor = () => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REVISION_REQUIRED': return 'bg-orange-100 text-orange-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'CANCELED': return 'bg-gray-400 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'PENDING_APPROVAL': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'REVISION_REQUIRED': return 'Yêu cầu sửa';
      case 'REJECTED': return 'Từ chối';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor()}`}>
      {getStatusText()}
    </span>
  );
};

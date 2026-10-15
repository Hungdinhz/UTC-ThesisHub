import React, { useEffect, useState } from 'react';
import { thesisApi } from '../services/thesisApi';
import type {  ReviewGroup  } from '../types/thesis.types';

export const ReviewGroupPage: React.FC = () => {
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await thesisApi.getReviewGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching review groups', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Hội đồng xét duyệt</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          + Tạo hội đồng mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{group.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Thành viên ({group.members?.length || 0})</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {group.members?.map(m => (
                    <li key={m.id} className="flex justify-between">
                      <span>{m.lecturerName}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{m.role}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <span className={`text-xs px-2 py-1 rounded-full ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {group.status}
                </span>
                <button className="text-blue-600 text-sm font-medium hover:underline">Chi tiết & Phân công</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { thesisApi } from '../services/thesisApi';
import type {  Thesis  } from '../types/thesis.types';
import { ThesisStatusBadge } from '../components/ThesisStatusBadge';

export const ThesisListPage: React.FC = () => {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheses();
  }, []);

  const fetchTheses = async () => {
    try {
      const data = await thesisApi.getTheses();
      setTheses(data);
    } catch (error) {
      console.error('Error fetching theses', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách Đồ án</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
          + Đăng ký đồ án mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đề tài</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảng viên HD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {theses.map((thesis) => (
                <tr key={thesis.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2" title={thesis.title}>
                      {thesis.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{thesis.studentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{thesis.lecturerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ThesisStatusBadge status={thesis.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/theses/${thesis.id}`} className="text-blue-600 hover:text-blue-900">Chi tiết</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {theses.length === 0 && (
            <div className="p-6 text-center text-gray-500">Chưa có đồ án nào.</div>
          )}
        </div>
      )}
    </div>
  );
};

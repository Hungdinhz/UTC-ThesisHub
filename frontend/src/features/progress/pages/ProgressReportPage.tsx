import React, { useEffect, useState } from 'react';
import { progressApi } from '../services/progressApi';
import { ProgressReport } from '../types/progress.types';
import { ProgressTimeline } from '../components/ProgressTimeline';

export const ProgressReportPage: React.FC<{ thesisId: number }> = ({ thesisId }) => {
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [thesisId]);

  const fetchReports = async () => {
    try {
      const data = await progressApi.getReports(thesisId);
      setReports(data);
    } catch (error) {
      console.error('Error fetching progress reports', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo tiến độ định kỳ</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          + Nộp báo cáo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{report.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${report.status === 'REVIEWED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {report.status === 'REVIEWED' ? 'Đã nhận xét' : 'Đã nộp'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-3 flex gap-4">
                  <span>Người nộp: <strong className="text-gray-700">{report.studentName}</strong></span>
                  <span>Ngày: <strong className="text-gray-700">{new Date(report.reportDate).toLocaleDateString()}</strong></span>
                </div>
                <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                  {report.content}
                </div>
                {report.fileUrl && (
                  <div className="mt-3">
                    <a href={report.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                      File đính kèm
                    </a>
                  </div>
                )}
              </div>
              
              <div className="p-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Nhận xét từ Giảng viên</h4>
                <ProgressTimeline feedbacks={report.feedbacks || []} />
                
                {/* Form thêm nhận xét dành cho GV */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="text-sm text-blue-600 font-medium hover:underline">
                    + Thêm nhận xét / Đánh giá
                  </button>
                </div>
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="p-10 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
              Chưa có báo cáo tiến độ nào được nộp.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { thesisApi } from '../services/thesisApi';
import { Proposal } from '../types/thesis.types';
import { ThesisStatusBadge } from '../components/ThesisStatusBadge';
import { ProposalReviewForm } from '../components/ProposalReviewForm';

export const ProposalListPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const data = await thesisApi.getProposals();
      setProposals(data);
    } catch (error) {
      console.error('Error fetching proposals', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: number, result: string, feedback: string) => {
    try {
      // Hardcode reviewerId for demo
      await thesisApi.reviewProposal(id, result, feedback, 101);
      setReviewingId(null);
      fetchProposals();
      alert('Lưu đánh giá thành công!');
    } catch (error) {
      console.error('Error reviewing proposal', error);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Xét duyệt đề cương</h1>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đề tài</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nộp</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.map((prop) => (
                <React.Fragment key={prop.id}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{prop.title}</div>
                      <div className="text-sm text-gray-500">
                        {prop.fileUrl ? (
                          <a href={prop.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                            Xem file đính kèm
                          </a>
                        ) : 'Chưa có file'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ThesisStatusBadge status={prop.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prop.submittedAt ? new Date(prop.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setReviewingId(reviewingId === prop.id ? null : prop.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Đánh giá
                      </button>
                    </td>
                  </tr>
                  {reviewingId === prop.id && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 bg-gray-50">
                        <ProposalReviewForm 
                          onSubmit={(res, fb) => handleReview(prop.id, res, fb)}
                          onCancel={() => setReviewingId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {proposals.length === 0 && (
            <div className="p-6 text-center text-gray-500">Không có đề cương nào cần duyệt.</div>
          )}
        </div>
      )}
    </div>
  );
};

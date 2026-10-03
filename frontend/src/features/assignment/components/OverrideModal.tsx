import React, { useState } from 'react';
import { SupervisorAssignment } from '../types/assignment.types';
import { assignmentApi } from '../services/assignmentApi';

interface Props {
  assignment: SupervisorAssignment;
  onClose: () => void;
  onSuccess: () => void;
}

export const OverrideModal: React.FC<Props> = ({ assignment, onClose, onSuccess }) => {
  const [newLecturerId, setNewLecturerId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLecturerId || !reason) {
      setError('Vui lòng nhập đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      await assignmentApi.overrideAssignment(assignment.id, Number(newLecturerId), reason);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Điều chỉnh phân công thủ công
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Sinh viên ID: <strong>{assignment.studentId}</strong></p>
                  <p>Giảng viên hiện tại ID: <strong>{assignment.lecturerId}</strong></p>
                </div>

                {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Giảng viên mới (ID)</label>
                  <input
                    type="number"
                    required
                    value={newLecturerId}
                    onChange={(e) => setNewLecturerId(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Lý do điều chỉnh</label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nhập lý do thay đổi..."
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
              >
                {loading ? 'Đang lưu...' : 'Lưu điều chỉnh'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

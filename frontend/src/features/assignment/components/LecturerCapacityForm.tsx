import React, { useState, useEffect } from 'react';
import type { LecturerCapacityRequest, LecturerCapacityResponse } from '../types/assignment.types';
import { assignmentApi } from '../services/assignmentApi';

interface Props {
  projectRoundId: number;
  existingCapacity?: LecturerCapacityResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LecturerCapacityForm: React.FC<Props> = ({
  projectRoundId,
  existingCapacity,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<LecturerCapacityRequest>({
    lecturerId: existingCapacity?.lecturerId || 0,
    projectRoundId,
    baseQuota: existingCapacity?.baseQuota || 0,
    capacityCoefficient: existingCapacity?.capacityCoefficient || 1.0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingCapacity) {
      setFormData({
        lecturerId: existingCapacity.lecturerId,
        projectRoundId,
        baseQuota: existingCapacity.baseQuota,
        capacityCoefficient: existingCapacity.capacityCoefficient,
      });
    }
  }, [existingCapacity, projectRoundId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (existingCapacity) {
        await assignmentApi.updateCapacity(existingCapacity.id, formData);
      } else {
        await assignmentApi.createCapacity(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">
        {existingCapacity ? 'Cập nhật chỉ tiêu' : 'Khai báo chỉ tiêu mới'}
      </h3>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Giảng viên ID</label>
          <input
            type="number"
            required
            disabled={!!existingCapacity}
            value={formData.lecturerId || ''}
            onChange={(e) => setFormData({ ...formData, lecturerId: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Chỉ tiêu (Base Quota)</label>
          <input
            type="number"
            required
            min="0"
            value={formData.baseQuota}
            onChange={(e) => setFormData({ ...formData, baseQuota: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hệ số (Coefficient)</label>
          <input
            type="number"
            required
            step="0.1"
            min="0.1"
            value={formData.capacityCoefficient}
            onChange={(e) => setFormData({ ...formData, capacityCoefficient: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
};

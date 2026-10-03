import React, { useState } from 'react';
import { LecturerCapacityList } from '../components/LecturerCapacityList';
import { LecturerCapacityForm } from '../components/LecturerCapacityForm';
import type { LecturerCapacityResponse } from '../types/assignment.types';

export const LecturerCapacityPage: React.FC = () => {
  // In a real application, this would come from a global state or router parameter
  const [projectRoundId] = useState(201);
  const [showForm, setShowForm] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<LecturerCapacityResponse | null>(null);

  // A simple hack to force list refresh by updating a key
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddNew = () => {
    setEditingCapacity(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // trigger list refresh
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý năng lực hướng dẫn (Chỉ tiêu)</h1>
          {!showForm && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Thêm chỉ tiêu mới
            </button>
          )}
        </div>

        {showForm ? (
          <div className="mb-8">
            <LecturerCapacityForm
              projectRoundId={projectRoundId}
              existingCapacity={editingCapacity}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : (
          <LecturerCapacityList
            key={refreshKey}
            projectRoundId={projectRoundId}
            onEdit={(capacity) => {
              setEditingCapacity(capacity);
              setShowForm(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

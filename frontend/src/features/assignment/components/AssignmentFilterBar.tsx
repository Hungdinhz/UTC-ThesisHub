import React from 'react';

interface FilterOptions {
  major?: string;
  program?: string;
  directionId?: number;
  lecturerId?: number;
  status?: string;
  searchTerm?: string;
}

interface Props {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  showMajor?: boolean;
  showProgram?: boolean;
  showDirection?: boolean;
  // showLecturer?: boolean;
  showStatus?: boolean;
}

export const AssignmentFilterBar: React.FC<Props> = ({
  filters,
  onFilterChange,
  showMajor = true,
  showProgram = true,
  showDirection = true,
  // showLecturer = false,
  showStatus = true,
}) => {
  const handleChange = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
        <input
          type="text"
          placeholder="Mã SV / Họ tên..."
          value={filters.searchTerm || ''}
          onChange={(e) => handleChange('searchTerm', e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
      </div>

      {showMajor && (
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngành học</label>
          <select
            value={filters.major || ''}
            onChange={(e) => handleChange('major', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">Tất cả</option>
            <option value="CNTT">Công nghệ thông tin</option>
            <option value="KTPM">Kỹ thuật phần mềm</option>
          </select>
        </div>
      )}

      {showProgram && (
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chương trình ĐT</label>
          <select
            value={filters.program || ''}
            onChange={(e) => handleChange('program', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">Tất cả</option>
            <option value="Cử nhân">Cử nhân</option>
            <option value="Kỹ sư">Kỹ sư</option>
          </select>
        </div>
      )}

      {showDirection && (
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hướng đồ án</label>
          <select
            value={filters.directionId || ''}
            onChange={(e) => handleChange('directionId', e.target.value ? Number(e.target.value) : undefined)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">Tất cả</option>
            {/* Options would be populated dynamically */}
            <option value="1">Trí tuệ nhân tạo</option>
            <option value="2">Hệ thống thông tin</option>
          </select>
        </div>
      )}

      {showStatus && (
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="">Tất cả</option>
            <option value="VALID">Hợp lệ</option>
            <option value="INVALID">Không hợp lệ</option>
            <option value="PROPOSED">Đề xuất</option>
            <option value="FINAL">Đã chốt</option>
          </select>
        </div>
      )}
    </div>
  );
};

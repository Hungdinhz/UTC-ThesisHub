import React, { useState } from 'react';

interface Props {
  thesisId: number;
  onUploadSuccess: () => void;
}

export const DocumentUploader: React.FC<Props> = ({ thesisId, onUploadSuccess }) => {
  // Use thesisId to avoid TS6133
  console.log('Uploading for thesis:', thesisId);
  const [docType, setDocType] = useState('FINAL_REPORT');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    // TODO: Tích hợp API upload file thực tế
    // Mô phỏng call API delay:
    setTimeout(() => {
      setIsUploading(false);
      setFile(null);
      alert('Tải lên thành công!');
      onUploadSuccess();
    }, 1000);
  };

  return (
    <div className="bg-white p-5 border border-gray-200 rounded-md shadow-sm">
      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        Tải lên tài liệu
      </h4>
      <form onSubmit={handleUpload}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Loại tài liệu</label>
            <select 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-md p-2 border"
            >
              <option value="PROPOSAL">Đề cương</option>
              <option value="PROGRESS_REPORT">Báo cáo tiến độ</option>
              <option value="FINAL_REPORT">Báo cáo toàn văn (Quyển)</option>
              <option value="SOURCE_CODE">Source code (Zip)</option>
              <option value="SLIDE">Slide thuyết trình</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Chọn file</label>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={!file || isUploading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!file || isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isUploading ? 'Đang tải lên...' : 'Bắt đầu tải lên'}
        </button>
      </form>
    </div>
  );
};

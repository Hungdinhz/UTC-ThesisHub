import React, { useState, useRef } from 'react';
import { fileUploadService } from '../services/fileUploadService';
import { resolveFileUrl, getFileIcon } from '../utils/fileUtils';
import './FileUploadInput.css';

export interface FileUploadInputProps {
  label?: string;
  value?: string;
  onChange: (fileUrl: string, fileInfo?: { name: string; size: number }) => void;
  accept?: string;
  helperText?: string;
  required?: boolean;
  maxSizeMB?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label = 'Tập tin đính kèm',
  value = '',
  onChange,
  accept = '.pdf,.doc,.docx,.zip,.rar,.ppt,.pptx',
  helperText,
  required = false,
  maxSizeMB = 50,
  placeholder = 'Nhập link hoặc tải file lên...',
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileNameFromUrl = (url: string) => {
    if (uploadedFileName) return uploadedFileName;
    if (!url) return '';
    try {
      const parts = url.split('/');
      const last = parts[parts.length - 1];
      const underscoreIdx = last.indexOf('_');
      if (underscoreIdx > 20 && underscoreIdx < 45) {
        return decodeURIComponent(last.substring(underscoreIdx + 1));
      }
      return decodeURIComponent(last);
    } catch {
      return url;
    }
  };

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`Kích thước file không được vượt quá ${maxSizeMB}MB (File hiện tại: ${formatFileSize(file.size)})`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await fileUploadService.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });

      const finalUrl = result.fileDownloadUri || result.fileName;
      setUploadedFileName(file.name);
      setUploadedFileSize(result.size || file.size);
      onChange(finalUrl, { name: file.name, size: result.size || file.size });
    } catch (err: any) {
      console.error('Lỗi khi tải file lên:', err);
      const msg = err.response?.data?.message || err.message || 'Tải file thất bại. Vui lòng thử lại!';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setUploadedFileName('');
    setUploadedFileSize(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="utc-file-upload-wrapper">
      <div className="utc-file-upload-label">
        <span>
          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </span>
        <button
          type="button"
          className="utc-file-upload-mode-toggle"
          onClick={() => setManualMode(!manualMode)}
        >
          {manualMode ? '📤 Chọn tải file từ máy' : '🔗 Dán link trực tiếp'}
        </button>
      </div>

      {manualMode ? (
        <div className="utc-file-direct-input">
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : value ? (
        <div className="utc-file-selected-box">
          <div className="utc-file-info">
            <span className="utc-file-icon">
              {getFileIcon(value)}
            </span>
            <div className="utc-file-details">
              <span className="utc-file-name" title={getFileNameFromUrl(value)}>
                {getFileNameFromUrl(value)}
              </span>
              <span className="utc-file-size">
                {uploadedFileSize ? formatFileSize(uploadedFileSize) : 'Đã tải lên hệ thống'}
              </span>
            </div>
          </div>
          <div className="utc-file-actions">
            <a
              href={resolveFileUrl(value)}
              target="_blank"
              rel="noreferrer"
              className="utc-file-btn utc-file-btn-view"
            >
              👁️ Mở file
            </a>
            <button
              type="button"
              className="utc-file-btn utc-file-btn-delete"
              onClick={handleRemoveFile}
              disabled={disabled || isUploading}
              title="Xóa tập tin này để chọn file khác"
            >
              🗑️ Đổi file
            </button>
          </div>
        </div>
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept={accept}
            onChange={onFileInputChange}
            disabled={disabled || isUploading}
          />
          <div
            className={`utc-file-dropzone ${isDragOver ? 'dragover' : ''} ${disabled || isUploading ? 'disabled' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="utc-dropzone-icon">
              {isUploading ? '⏳' : '☁️'}
            </div>
            <div className="utc-dropzone-text">
              {isUploading ? (
                `Đang tải lên server (${uploadProgress}%)...`
              ) : (
                <>
                  <strong style={{ color: '#0a3273' }}>Nhấn để chọn file</strong> hoặc kéo thả file vào đây
                </>
              )}
            </div>
            <div className="utc-dropzone-subtext">
              {helperText || `Hỗ trợ ${accept.replace(/\./g, ' ').toUpperCase()} (tối đa ${maxSizeMB}MB)`}
            </div>

            {isUploading && (
              <div className="utc-file-progress-container">
                <div className="utc-file-progress-bar-bg">
                  <div
                    className="utc-file-progress-bar-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="utc-file-progress-text">
                  <span>Đang xử lý lưu file...</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="utc-file-error">
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
};

export default FileUploadInput;

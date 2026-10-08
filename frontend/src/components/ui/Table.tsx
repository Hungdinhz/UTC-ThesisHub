import React from 'react';
import './Table.css';

export interface Column<T> {
  key: string;
  title: React.ReactNode;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column<T>[];
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string | number);
  loading?: boolean;
  emptyText?: string;
  className?: string;
  onRowClick?: (record: T) => void;
}

export function Table<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  emptyText = 'Không có dữ liệu',
  className = '',
  onRowClick,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] !== undefined ? record[rowKey] : index;
  };

  return (
    <div className={`ui-table-container ${className}`}>
      <table className="ui-table">
        <thead className="ui-table-thead">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
                className="ui-table-th"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="ui-table-tbody">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="ui-table-loading-cell">
                <div className="ui-table-spinner" />
                <span>Đang tải dữ liệu...</span>
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ui-table-empty-cell">
                {emptyText}
              </td>
            </tr>
          ) : (
            dataSource.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={`ui-table-row ${onRowClick ? 'ui-table-row-clickable' : ''}`}
                onClick={() => onRowClick && onRowClick(record)}
              >
                {columns.map((col) => {
                  const val = record[col.key];
                  return (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align || 'left' }}
                      className="ui-table-td"
                    >
                      {col.render ? col.render(val, record, index) : val}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

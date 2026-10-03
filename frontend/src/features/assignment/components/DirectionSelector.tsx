import React from 'react';
import { ProjectDirection } from '../types/assignment.types';

interface Props {
  directions: ProjectDirection[];
  selectedDirectionId: number | null;
  onSelect: (directionId: number) => void;
  disabled?: boolean;
}

export const DirectionSelector: React.FC<Props> = ({
  directions,
  selectedDirectionId,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="direction-selector">
      <h3>Chọn hướng nghiên cứu</h3>
      {directions.length === 0 ? (
        <p>Không có hướng nghiên cứu nào trong đợt này.</p>
      ) : (
        <select
          value={selectedDirectionId || ''}
          onChange={(e) => onSelect(Number(e.target.value))}
          disabled={disabled}
          className="form-select"
        >
          <option value="" disabled>-- Chọn một hướng --</option>
          {directions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}
      
      {selectedDirectionId && (
        <div className="direction-description mt-2 text-gray-600">
          {directions.find(d => d.id === selectedDirectionId)?.description}
        </div>
      )}
    </div>
  );
};

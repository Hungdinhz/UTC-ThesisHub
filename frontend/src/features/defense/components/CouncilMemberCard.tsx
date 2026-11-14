import React from 'react';
import { COUNCIL_ROLE_LABELS } from '../types';
import type { CouncilMember, CouncilRole, LecturerOption } from '../types';
import './DefenseComponents.css';

interface CouncilMemberCardProps {
  member: CouncilMember;
  allLecturers: LecturerOption[];
  onLecturerChange: (memberId: number, newLecturerId: number) => void;
  excludedAdvisorIds?: number[];
  otherMemberLecturerIds?: number[];
  disabled?: boolean;
}

export const CouncilMemberCard: React.FC<CouncilMemberCardProps> = ({
  member,
  allLecturers,
  onLecturerChange,
  excludedAdvisorIds = [],
  otherMemberLecturerIds = [],
  disabled = false,
}) => {
  const getRoleConfig = (role: CouncilRole) => {
    switch (role) {
      case 'PRESIDENT':
        return { badgeClass: 'role-president', icon: '👑' };
      case 'SECRETARY':
        return { badgeClass: 'role-secretary', icon: '📝' };
      case 'REVIEWER_1':
      case 'REVIEWER_2':
        return { badgeClass: 'role-reviewer', icon: '🔎' };
      case 'MEMBER':
        return { badgeClass: 'role-member', icon: '👤' };
    }
  };

  const roleConfig = getRoleConfig(member.role);

  // Filter eligible lecturers based on role, always keeping currently assigned lecturer in list
  const eligibleLecturers = allLecturers.filter((l) => {
    if (Number(l.lecturerId) === Number(member.lecturerId)) return true;
    if (member.role === 'PRESIDENT') return l.canBePresident;
    if (member.role === 'SECRETARY') return l.canBeSecretary;
    return l.canBeMember;
  });

  const isAdvisorConflict = excludedAdvisorIds.map(Number).includes(Number(member.lecturerId));

  return (
    <div className={`council-member-card ${isAdvisorConflict ? 'conflict-warning' : ''}`}>
      <div className="member-card-header">
        <span className={`member-role-badge ${roleConfig.badgeClass}`}>
          {roleConfig.icon} {COUNCIL_ROLE_LABELS[member.role]}
        </span>
        {isAdvisorConflict && (
          <span className="conflict-badge" title="Ràng buộc cứng vi phạm: GVHD của sinh viên không được chấm chính sinh viên đó!">
            ⚠️ Trùng GVHD
          </span>
        )}
      </div>

      <div className="member-card-body">
        <label htmlFor={`lecturerSelect-${member.id}`} className="member-select-label">
          Chọn Giảng viên đảm nhiệm: {COUNCIL_ROLE_LABELS[member.role]}
        </label>
        <select
          id={`lecturerSelect-${member.id}`}
          className="form-control member-select"
          value={member.lecturerId}
          disabled={disabled}
          onChange={(e) => onLecturerChange(member.id, Number(e.target.value))}
          title={member.lecturerName}
        >
          {!eligibleLecturers.some((lec) => Number(lec.lecturerId) === Number(member.lecturerId)) && (
            <option value={member.lecturerId} disabled>{member.lecturerName} (Hiện tại)</option>
          )}
          {eligibleLecturers.map((lec) => {
            const isConflict = excludedAdvisorIds.map(Number).includes(Number(lec.lecturerId));
            const isDuplicate = otherMemberLecturerIds.map(Number).includes(Number(lec.lecturerId));
            return (
              <option key={lec.lecturerId} value={lec.lecturerId} disabled={isConflict || isDuplicate}>
                {lec.fullName} ({lec.degree}) — Tải: {lec.currentLoad} {isConflict ? '[TRÙNG GVHD]' : ''} {isDuplicate ? '[ĐÃ CÓ TRONG HỘI ĐỒNG]' : ''}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

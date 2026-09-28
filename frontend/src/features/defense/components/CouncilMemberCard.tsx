import React from 'react';
import type { CouncilMember, CouncilRole, LecturerOption } from '../types';
import './DefenseComponents.css';

interface CouncilMemberCardProps {
  member: CouncilMember;
  allLecturers: LecturerOption[];
  onLecturerChange: (memberId: number, newLecturerId: number) => void;
  excludedAdvisorIds?: number[];
}

export const CouncilMemberCard: React.FC<CouncilMemberCardProps> = ({
  member,
  allLecturers,
  onLecturerChange,
  excludedAdvisorIds = [],
}) => {
  const getRoleConfig = (role: CouncilRole) => {
    switch (role) {
      case 'PRESIDENT':
        return { label: 'Chủ tịch Hội đồng (CT)', badgeClass: 'role-president', icon: '👑' };
      case 'SECRETARY':
        return { label: 'Thư ký Hội đồng (TK)', badgeClass: 'role-secretary', icon: '📝' };
      case 'MEMBER':
        return { label: 'Ủy viên Hội đồng (UV)', badgeClass: 'role-member', icon: '👤' };
    }
  };

  const roleConfig = getRoleConfig(member.role);

  // Filter eligible lecturers based on role
  const eligibleLecturers = allLecturers.filter((l) => {
    if (member.role === 'PRESIDENT') return l.canBePresident;
    if (member.role === 'SECRETARY') return l.canBeSecretary;
    return l.canBeMember;
  });

  const isAdvisorConflict = excludedAdvisorIds.includes(member.lecturerId);

  return (
    <div className={`council-member-card ${isAdvisorConflict ? 'conflict-warning' : ''}`}>
      <div className="member-card-header">
        <span className={`member-role-badge ${roleConfig.badgeClass}`}>
          {roleConfig.icon} {roleConfig.label}
        </span>
        {isAdvisorConflict && (
          <span className="conflict-badge" title="Ràng buộc cứng vi phạm: GVHD của sinh viên không được chấm chính sinh viên đó!">
            ⚠️ Trùng GVHD
          </span>
        )}
      </div>

      <div className="member-card-body">
        <label htmlFor={`lecturerSelect-${member.id}`} className="member-select-label">
          Chọn Giảng viên đảm nhiệm:
        </label>
        <select
          id={`lecturerSelect-${member.id}`}
          className="form-control member-select"
          value={member.lecturerId}
          onChange={(e) => onLecturerChange(member.id, Number(e.target.value))}
        >
          {eligibleLecturers.map((lec) => {
            const isConflict = excludedAdvisorIds.includes(lec.lecturerId);
            return (
              <option key={lec.lecturerId} value={lec.lecturerId} disabled={isConflict}>
                {lec.fullName} ({lec.degree}) — Tải: {lec.currentLoad} {isConflict ? '[TRÙNG GVHD]' : ''}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CouncilMemberCard } from '../CouncilMemberCard';
import { COUNCIL_ROLES, COUNCIL_ROLE_LABELS } from '../../types';
import type { CouncilMember, LecturerOption } from '../../types';

const lecturers: LecturerOption[] = Array.from({ length: 5 }, (_, i) => ({
  lecturerId: i + 1,
  fullName: `Giảng viên ${i + 1}`,
  degree: 'Tiến sĩ',
  canBePresident: true,
  canBeSecretary: true,
  canBeMember: true,
  currentLoad: 0,
}));

const member: CouncilMember = {
  id: 10, lecturerId: 1, lecturerName: 'Giảng viên 1', role: 'PRESIDENT',
};

describe('CouncilMemberCard roles and options', () => {
  it.each(COUNCIL_ROLES)('renders and allows manual selection for %s', (role) => {
    const onChange = vi.fn();
    render(<CouncilMemberCard member={{ ...member, role }} allLecturers={lecturers} onLecturerChange={onChange} />);

    const select = screen.getByRole('combobox', { name: `Chọn Giảng viên đảm nhiệm: ${COUNCIL_ROLE_LABELS[role]}` });
    expect(select).toBeEnabled();
    expect(select).toHaveValue('1');
    fireEvent.change(select, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(10, 2);
  });

  it('disables advisors and lecturers occupying another slot, but keeps the current selection', () => {
    render(<CouncilMemberCard member={member} allLecturers={lecturers} onLecturerChange={vi.fn()}
      excludedAdvisorIds={[2]} otherMemberLecturerIds={[3]} />);

    expect(screen.getByRole('option', { name: /Giảng viên 1/ })).toBeEnabled();
    expect(screen.getByRole('option', { name: /Giảng viên 2.*TRÙNG GVHD/ })).toBeDisabled();
    expect(screen.getByRole('option', { name: /Giảng viên 3.*ĐÃ CÓ TRONG HỘI ĐỒNG/ })).toBeDisabled();
    expect(screen.getByRole('option', { name: /Giảng viên 4/ })).toBeEnabled();
  });

  it.each(COUNCIL_ROLES)('filters ineligible replacement lecturers for %s', (role) => {
    const ineligible = { ...lecturers[1], canBePresident: false, canBeSecretary: false, canBeMember: false };
    render(<CouncilMemberCard member={{ ...member, role }} allLecturers={[lecturers[0], ineligible]} onLecturerChange={vi.fn()} />);
    expect(screen.queryByRole('option', { name: /Giảng viên 2/ })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('1');
  });

  it('retains the assigned lecturer name when the option list is unavailable', () => {
    render(<CouncilMemberCard member={member} allLecturers={[]} onLecturerChange={vi.fn()} disabled />);
    expect(screen.getByRole('combobox')).toHaveValue('1');
    expect(screen.getByRole('option', { name: 'Giảng viên 1 (Hiện tại)' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});

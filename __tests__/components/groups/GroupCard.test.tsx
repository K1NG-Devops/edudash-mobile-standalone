import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GroupCard } from '@/components/groups/GroupCard';
import { PrincipalGroup } from '@/types/groups';

const mockGroup: PrincipalGroup = {
  id: '1',
  name: 'Test Group',
  description: 'Test Description',
  created_by: 'user-1',
  preschool_id: 'preschool-1',
  group_type: 'custom',
  color: '#3B82F6',
  icon: 'person.3.fill',
  is_active: true,
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  member_count: 5,
  user_role: 'member',
};

describe('GroupCard', () => {
  it('renders group information correctly', () => {
    const { getByText } = render(
      <GroupCard group={mockGroup} />
    );

    expect(getByText('Test Group')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
    expect(getByText('5 members')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GroupCard group={mockGroup} onPress={onPress} />
    );

    fireEvent.press(getByText('Test Group'));
    expect(onPress).toHaveBeenCalledWith(mockGroup);
  });

  it('shows join button when user is not a member', () => {
    const groupWithoutRole = { ...mockGroup, user_role: undefined };
    const onJoin = jest.fn();
    const { getByText } = render(
      <GroupCard group={groupWithoutRole} onJoin={onJoin} />
    );

    const joinButton = getByText('Join');
    expect(joinButton).toBeTruthy();
    
    fireEvent.press(joinButton);
    expect(onJoin).toHaveBeenCalledWith(groupWithoutRole);
  });

  it('shows leave button when user is a member', () => {
    const onLeave = jest.fn();
    const { getByText } = render(
      <GroupCard group={mockGroup} onLeave={onLeave} />
    );

    const leaveButton = getByText('Leave');
    expect(leaveButton).toBeTruthy();
    
    fireEvent.press(leaveButton);
    expect(onLeave).toHaveBeenCalledWith(mockGroup);
  });

  it('displays admin badge for admin role', () => {
    const adminGroup = { ...mockGroup, user_role: 'admin' as const };
    const { getByText } = render(
      <GroupCard group={adminGroup} />
    );

    expect(getByText('Admin')).toBeTruthy();
  });

  it('displays correct group type badge', () => {
    const departmentGroup = { ...mockGroup, group_type: 'department' as const };
    const { getByText } = render(
      <GroupCard group={departmentGroup} />
    );

    expect(getByText('Department')).toBeTruthy();
  });
});

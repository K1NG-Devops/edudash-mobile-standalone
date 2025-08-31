import { renderHook, waitFor } from '@testing-library/react-native';
import { useGroups } from '@/lib/hooks/useGroups';
import { supabase } from '@/lib/supabase';

jest.mock('@/contexts/SimpleWorkingAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

describe('useGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches groups on mount', async () => {
    const mockGroups = [
      { id: '1', name: 'Group 1', group_members: [] },
      { id: '2', name: 'Group 2', group_members: [] },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockGroups, error: null }),
    });

    const { result } = renderHook(() => useGroups('preschool-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.groups).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });
  });

  it('creates a new group', async () => {
    const newGroup = { id: '3', name: 'New Group' };
    
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newGroup, error: null }),
    });

    const { result } = renderHook(() => useGroups('preschool-1'));

    const createdGroup = await result.current.createGroup({
      name: 'New Group',
      group_type: 'custom',
    });

    expect(createdGroup).toEqual(newGroup);
    expect(supabase.from).toHaveBeenCalledWith('principal_groups');
  });

  it('handles errors gracefully', async () => {
    const mockError = new Error('Database error');

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    const { result } = renderHook(() => useGroups('preschool-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Database error');
      expect(result.current.groups).toEqual([]);
    });
  });

  it('updates a group', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useGroups('preschool-1'));

    await result.current.updateGroup('1', { name: 'Updated Group' });

    expect(supabase.from).toHaveBeenCalledWith('principal_groups');
    expect(supabase.from().update).toHaveBeenCalledWith({ name: 'Updated Group' });
  });

  it('deletes a group by marking it inactive', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useGroups('preschool-1'));

    await result.current.deleteGroup('1');

    expect(supabase.from).toHaveBeenCalledWith('principal_groups');
    expect(supabase.from().update).toHaveBeenCalledWith({ is_active: false });
  });

  it('joins a group', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useGroups('preschool-1'));

    await result.current.joinGroup('1');

    expect(supabase.from).toHaveBeenCalledWith('group_members');
    expect(supabase.from().insert).toHaveBeenCalledWith({
      group_id: '1',
      user_id: 'user-1',
      role_in_group: 'member',
      status: 'active',
    });
  });

  it('leaves a group', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useGroups('preschool-1'));

    await result.current.leaveGroup('1');

    expect(supabase.from).toHaveBeenCalledWith('group_members');
  });
});

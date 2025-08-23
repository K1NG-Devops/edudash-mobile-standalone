import { PrincipalService, PrincipalStats, SchoolInvitationCode, TeacherInvitation } from '../lib/services/principalService';
import { supabase } from '../lib/supabase';
import { StorageUtil } from '../lib/utils/storage';
import { EmailService } from '../lib/services/emailService';

// Mock dependencies
jest.mock('../lib/supabase');
jest.mock('../lib/utils/storage');
jest.mock('../lib/services/emailService');
jest.mock('../lib/utils/logger');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockStorageUtil = StorageUtil as jest.Mocked<typeof StorageUtil>;
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

describe('PrincipalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default supabase mock returns
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
    } as any);
  });

  describe('getPrincipalStats', () => {
    it('should return comprehensive principal stats', async () => {
      const preschoolId = 'test-preschool-id';
      
      // Mock the count queries
      mockSupabase.from.mockImplementation((table) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        
        // Mock different counts for different tables
        ...(table === 'students' && {
          select: jest.fn().mockResolvedValue({ count: 25, error: null })
        }),
        ...(table === 'users' && {
          select: jest.fn().mockResolvedValue({ count: 5, error: null })
        }),
        ...(table === 'classes' && {
          select: jest.fn().mockResolvedValue({ count: 3, error: null })
        }),
      } as any));

      const result = await PrincipalService.getPrincipalStats(preschoolId);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data?.totalStudents).toBeGreaterThanOrEqual(0);
      expect(result.data?.totalTeachers).toBeGreaterThanOrEqual(0);
      expect(result.data?.totalParents).toBeGreaterThanOrEqual(0);
      expect(result.data?.attendanceRate).toBeGreaterThan(0);
      expect(result.data?.monthlyRevenue).toBeGreaterThanOrEqual(0);
    });

    it('should handle database errors gracefully', async () => {
      const preschoolId = 'test-preschool-id';
      
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({ count: null, error: { code: 'NETWORK_ERROR' } })
      } as any));

      const result = await PrincipalService.getPrincipalStats(preschoolId);

      expect(result.data).toBeDefined();
      expect(result.data?.totalStudents).toBe(0);
    });
  });

  describe('getSchoolInfo', () => {
    it('should return school information for valid preschool ID', async () => {
      const preschoolId = 'test-preschool-id';
      const mockSchoolData = {
        id: preschoolId,
        name: 'Test Preschool',
        address: '123 Test Street',
        phone: '+27123456789'
      };

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockSchoolData, error: null })
      } as any));

      const result = await PrincipalService.getSchoolInfo(preschoolId);

      expect(result.data).toEqual(mockSchoolData);
      expect(result.error).toBeNull();
    });

    it('should return error for missing preschool ID', async () => {
      const result = await PrincipalService.getSchoolInfo('');

      expect(result.data).toBeNull();
      expect(result.error).toBe('No preschool selected');
    });

    it('should handle school not found', async () => {
      const preschoolId = 'non-existent-id';

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      } as any));

      const result = await PrincipalService.getSchoolInfo(preschoolId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('School not found');
    });
  });

  describe('generateSchoolInvitationCode', () => {
    it('should generate a valid school invitation code', async () => {
      const preschoolId = 'test-preschool-id';
      const createdBy = 'principal-id';
      const mockCode = 'ABC12345';

      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { code: mockCode }, error: null })
      } as any));

      const result = await PrincipalService.generateSchoolInvitationCode(
        preschoolId,
        createdBy,
        { description: 'Test code', expiryDays: 30 }
      );

      expect(result.data).toBe(mockCode);
      expect(result.error).toBeNull();
    });

    it('should handle database errors during code generation', async () => {
      const preschoolId = 'test-preschool-id';
      const createdBy = 'principal-id';

      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      } as any));

      const result = await PrincipalService.generateSchoolInvitationCode(preschoolId, createdBy);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getActiveSchoolInvitationCode', () => {
    it('should return active school invitation code when available', async () => {
      const preschoolId = 'test-preschool-id';
      const mockCodeData = {
        id: 'code-id',
        code: 'ABC12345',
        preschool_id: preschoolId,
        created_by: 'principal-id',
        invited_by: 'principal-id',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        current_uses: 0,
        max_uses: 100,
        description: 'Test code'
      };

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockCodeData, error: null })
      } as any));

      const result = await PrincipalService.getActiveSchoolInvitationCode(preschoolId);

      expect(result.data).toBeDefined();
      expect(result.data?.code).toBe('ABC12345');
      expect(result.data?.is_active).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return null when no active code exists', async () => {
      const preschoolId = 'test-preschool-id';

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      } as any));

      const result = await PrincipalService.getActiveSchoolInvitationCode(preschoolId);

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('should handle missing preschool ID', async () => {
      const result = await PrincipalService.getActiveSchoolInvitationCode('');

      expect(result.data).toBeNull();
      expect(result.error).toBe('No preschool ID provided');
    });

    it('should handle database errors', async () => {
      const preschoolId = 'test-preschool-id';

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      } as any));

      const result = await PrincipalService.getActiveSchoolInvitationCode(preschoolId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('deactivateSchoolInvitationCode', () => {
    it('should successfully deactivate school invitation code', async () => {
      const preschoolId = 'test-preschool-id';

      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      } as any));

      const result = await PrincipalService.deactivateSchoolInvitationCode(preschoolId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle database errors during deactivation', async () => {
      const preschoolId = 'test-preschool-id';

      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } })
      } as any));

      const result = await PrincipalService.deactivateSchoolInvitationCode(preschoolId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('inviteTeacher', () => {
    const teacherData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+27123456789'
    };
    const preschoolId = 'test-preschool-id';
    const invitedBy = 'principal-id';

    beforeEach(() => {
      mockStorageUtil.getJSON.mockResolvedValue([]);
      mockStorageUtil.setJSON.mockResolvedValue();
      mockEmailService.sendTeacherInvitation.mockResolvedValue({ success: true });
    });

    it('should successfully create teacher invitation', async () => {
      // Mock user check - no existing user
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
          };
        }
        if (table === 'school_invitation_codes') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null })
          };
        }
        if (table === 'preschools') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { name: 'Test School' },
              error: null
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { name: 'Principal Name' },
            error: null
          })
        };
      });

      const result = await PrincipalService.inviteTeacher(teacherData, preschoolId, invitedBy);

      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe(teacherData.email);
      expect(result.data?.name).toBe(teacherData.name);
      expect(result.data?.status).toBe('pending');
      expect(result.error).toBeNull();
      expect(mockStorageUtil.setJSON).toHaveBeenCalled();
      expect(mockEmailService.sendTeacherInvitation).toHaveBeenCalled();
    });

    it('should prevent duplicate teacher invitations', async () => {
      // Mock existing user
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'existing-id', email: teacherData.email, role: 'teacher' },
          error: null
        })
      } as any));

      const result = await PrincipalService.inviteTeacher(teacherData, preschoolId, invitedBy);

      expect(result.data).toBeNull();
      expect(result.error).toBe('A user with this email already exists');
    });

    it('should handle email service failures gracefully', async () => {
      // Mock user check - no existing user
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { name: 'Test' },
            error: null
          }),
          insert: jest.fn().mockResolvedValue({ error: null })
        };
      } as any);

      mockEmailService.sendTeacherInvitation.mockResolvedValue({
        success: false,
        error: 'Email service error'
      });

      const result = await PrincipalService.inviteTeacher(teacherData, preschoolId, invitedBy);

      // Should still succeed even if email fails
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('getTeacherInvitations', () => {
    it('should return teacher invitations for a school', async () => {
      const preschoolId = 'test-preschool-id';
      const mockInvitations: TeacherInvitation[] = [
        {
          id: 'inv-1',
          email: 'teacher1@example.com',
          name: 'Teacher One',
          invitation_code: 'ABC123',
          preschool_id: preschoolId,
          status: 'pending',
          invited_by: 'principal-id',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      mockStorageUtil.getJSON.mockResolvedValue(mockInvitations);

      const result = await PrincipalService.getTeacherInvitations(preschoolId);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('teacher1@example.com');
      expect(result.error).toBeNull();
    });

    it('should mark expired invitations as expired', async () => {
      const preschoolId = 'test-preschool-id';
      const expiredInvitation: TeacherInvitation = {
        id: 'inv-1',
        email: 'teacher1@example.com',
        name: 'Teacher One',
        invitation_code: 'ABC123',
        preschool_id: preschoolId,
        status: 'pending',
        invited_by: 'principal-id',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      };

      mockStorageUtil.getJSON.mockResolvedValue([expiredInvitation]);

      const result = await PrincipalService.getTeacherInvitations(preschoolId);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('expired');
    });
  });

  describe('getSchoolTeachers', () => {
    it('should return teachers with their classes', async () => {
      const preschoolId = 'test-preschool-id';
      const mockTeachers = [
        { id: 'teacher-1', name: 'Teacher One', email: 'teacher1@example.com', is_active: true }
      ];
      const mockClasses = [
        { id: 'class-1', name: 'Class A', teacher_id: 'teacher-1', current_enrollment: 20, max_capacity: 25 }
      ];

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockTeachers, error: null })
          };
        }
        if (table === 'classes') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: mockClasses, error: null })
          };
        }
        return {} as any;
      });

      const result = await PrincipalService.getSchoolTeachers(preschoolId);

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].classes).toHaveLength(1);
      expect(result.data?.[0].classes[0].name).toBe('Class A');
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent school activity', async () => {
      const preschoolId = 'test-preschool-id';

      // Mock various count queries
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({ count: 5, error: null })
      } as any));

      const result = await PrincipalService.getRecentActivity(preschoolId);

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should return default activities when no data available', async () => {
      const preschoolId = 'test-preschool-id';

      // Mock empty count queries
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({ count: 0, error: null })
      } as any));

      const result = await PrincipalService.getRecentActivity(preschoolId);

      expect(result.data).toBeDefined();
      expect(result.data).toContain('School dashboard is ready for your first activities');
    });
  });

  describe('getPendingTasks', () => {
    beforeEach(() => {
      mockStorageUtil.getJSON.mockResolvedValue([]);
    });

    it('should return pending tasks based on school state', async () => {
      const preschoolId = 'test-preschool-id';

      // Mock no active invitation code
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        is: jest.fn().mockReturnThis(),
      } as any));

      const result = await PrincipalService.getPendingTasks(preschoolId);

      expect(result.data).toBeDefined();
      expect(result.data!.some(task => 
        task.text.includes('Generate school invitation code')
      )).toBe(true);
    });

    it('should return growth activities when no urgent tasks exist', async () => {
      const preschoolId = 'test-preschool-id';

      // Mock active invitation code exists
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { code: 'ABC123', is_active: true },
          error: null
        }),
        is: jest.fn().mockReturnThis(),
      } as any));

      const result = await PrincipalService.getPendingTasks(preschoolId);

      expect(result.data).toBeDefined();
      expect(result.data!.some(task => 
        task.text.includes('All critical tasks are complete')
      )).toBe(true);
    });
  });
});

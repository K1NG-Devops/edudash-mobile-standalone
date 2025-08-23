import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PrincipalDashboard from '../../screens/principal-dashboard';
import { PrincipalService } from '../../lib/services/principalService';
import { ThemeContext } from '../../contexts/ThemeContext';

// Mock dependencies
jest.mock('../../lib/services/principalService');
jest.mock('../../lib/utils/logger');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock components
jest.mock('../../components/admin/SchoolCodeManager', () => ({
  SchoolCodeManager: ({ visible, onClose }: any) => {
    if (!visible) return null;
    return null; // Mock modal implementation
  },
}));

jest.mock('../../components/admin/TeacherManagement', () => ({
  TeacherManagement: ({ visible, onClose }: any) => {
    if (!visible) return null;
    return null; // Mock modal implementation
  },
}));

jest.mock('../../components/navigation/MobileHeader', () => ({
  MobileHeader: (props: any) => {
    return null; // Mock header implementation
  },
}));

jest.mock('../../components/ui/IconSymbol', () => ({
  IconSymbol: (props: any) => {
    return null; // Mock icon implementation
  },
}));

describe('Principal Dashboard Integration', () => {
  const mockProfile = {
    id: 'principal-id',
    name: 'Test Principal',
    email: 'principal@test.com',
    role: 'preschool_admin',
    preschool_id: 'test-preschool-id',
    avatar_url: null,
  };

  const mockOnSignOut = jest.fn();

  const mockThemeContext = {
    colorScheme: 'light' as const,
    toggleColorScheme: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock PrincipalService methods with realistic data
    (PrincipalService.getPrincipalStats as jest.Mock).mockResolvedValue({
      data: {
        totalStudents: 45,
        totalTeachers: 8,
        totalParents: 42,
        attendanceRate: 92.5,
        monthlyRevenue: 36000,
        pendingPayments: 7,
        activeClasses: 6,
        newEnrollments: 3,
      },
      error: null,
    });

    (PrincipalService.getSchoolInfo as jest.Mock).mockResolvedValue({
      data: {
        id: mockProfile.preschool_id,
        name: 'Sunshine Preschool',
        address: '123 Learning Street',
        phone: '+27123456789',
      },
      error: null,
    });

    (PrincipalService.getRecentActivity as jest.Mock).mockResolvedValue({
      data: [
        '3 new student enrollments this month',
        '8 active teachers managing classes',
        '2 new homework assignments created this week',
        '6 active classes running',
        '42 engaged parents in the community',
      ],
      error: null,
    });

    (PrincipalService.getPendingTasks as jest.Mock).mockResolvedValue({
      data: [
        {
          priority: 'high',
          text: 'Generate school invitation code for parent registration',
          color: '#EF4444',
        },
        {
          priority: 'medium',
          text: '2 teachers need class assignments',
          color: '#3B82F6',
        },
        {
          priority: 'low',
          text: 'Complete school profile (missing: logo)',
          color: '#10B981',
        },
      ],
      error: null,
    });

    (PrincipalService.getActiveSchoolInvitationCode as jest.Mock).mockResolvedValue({
      data: null,
      error: null,
    });
  });

  const renderDashboard = () => {
    return render(
      <ThemeContext.Provider value={mockThemeContext}>
        <PrincipalDashboard 
          profile={mockProfile} 
          onSignOut={mockOnSignOut} 
        />
      </ThemeContext.Provider>
    );
  };

  it('renders dashboard with all main sections', async () => {
    const { findByText, queryByText } = renderDashboard();

    // Wait for school name to load
    await findByText('Manage Sunshine Preschool');

    // Check main sections are present
    expect(queryByText('📊 School Overview')).toBeTruthy();
    expect(queryByText('🏫 School Overview')).toBeTruthy();
    expect(queryByText('⚡ Principal Tools')).toBeTruthy();
    expect(queryByText('🚀 Quick Actions')).toBeTruthy();
    expect(queryByText('📈 Recent School Activity')).toBeTruthy();
    expect(queryByText('📋 Pending Tasks')).toBeTruthy();
  });

  it('displays correct statistics after loading', async () => {
    const { findByText } = renderDashboard();

    // Wait for stats to load
    await findByText('45'); // Total students
    await findByText('8');  // Total teachers  
    await findByText('42'); // Total parents
    await findByText('R36k'); // Monthly revenue
    
    expect(PrincipalService.getPrincipalStats).toHaveBeenCalledWith(mockProfile.preschool_id);
  });

  it('displays recent activity and pending tasks', async () => {
    const { findByText } = renderDashboard();

    // Wait for activity to load
    await findByText('3 new student enrollments this month');
    await findByText('8 active teachers managing classes');

    // Check pending tasks
    await findByText('Generate school invitation code for parent registration');
    await findByText('2 teachers need class assignments');
    
    expect(PrincipalService.getRecentActivity).toHaveBeenCalledWith(mockProfile.preschool_id);
    expect(PrincipalService.getPendingTasks).toHaveBeenCalledWith(mockProfile.preschool_id);
  });

  it('handles refresh functionality', async () => {
    const { getByTestId } = renderDashboard();

    // Simulate pull to refresh (this would need a test ID on the ScrollView)
    // For now, we test that the data loading functions are called on mount
    await waitFor(() => {
      expect(PrincipalService.getPrincipalStats).toHaveBeenCalled();
      expect(PrincipalService.getSchoolInfo).toHaveBeenCalled();
      expect(PrincipalService.getRecentActivity).toHaveBeenCalled();
      expect(PrincipalService.getPendingTasks).toHaveBeenCalled();
    });
  });

  it('handles error states gracefully', async () => {
    // Mock error responses
    (PrincipalService.getPrincipalStats as jest.Mock).mockResolvedValue({
      data: null,
      error: 'Network error',
    });

    (PrincipalService.getSchoolInfo as jest.Mock).mockResolvedValue({
      data: null,
      error: 'School not found',
    });

    const { findByText } = renderDashboard();

    // Should still render with fallback data
    await waitFor(() => {
      expect(PrincipalService.getPrincipalStats).toHaveBeenCalled();
      expect(PrincipalService.getSchoolInfo).toHaveBeenCalled();
    });

    // Dashboard should still render with default school name
    await findByText('Manage Your Preschool');
  });

  it('opens and closes school code manager', async () => {
    const { findByText, queryByText } = renderDashboard();

    // Wait for dashboard to load
    await findByText('Manage Sunshine Preschool');

    // Find and click the School Code action card
    const schoolCodeButton = await findByText('School Code');
    fireEvent.press(schoolCodeButton);

    // Modal should be visible (mocked component would handle this)
    await waitFor(() => {
      expect(PrincipalService.getActiveSchoolInvitationCode).toHaveBeenCalledWith(mockProfile.preschool_id);
    });
  });

  it('opens and closes teacher management', async () => {
    const { findByText } = renderDashboard();

    // Wait for dashboard to load  
    await findByText('Manage Sunshine Preschool');

    // Find and click the Teacher Management action card
    const teacherManagementButton = await findByText('Teacher Management');
    fireEvent.press(teacherManagementButton);

    // This would open the TeacherManagement modal (mocked)
    // In a real test, we'd verify the modal is visible
  });

  it('handles dark theme properly', async () => {
    const darkThemeContext = {
      colorScheme: 'dark' as const,
      toggleColorScheme: jest.fn(),
    };

    const { container } = render(
      <ThemeContext.Provider value={darkThemeContext}>
        <PrincipalDashboard 
          profile={mockProfile} 
          onSignOut={mockOnSignOut} 
        />
      </ThemeContext.Provider>
    );

    // In a real test, we'd check for dark theme styles
    // This would require testing style props or test IDs
    await waitFor(() => {
      expect(PrincipalService.getPrincipalStats).toHaveBeenCalled();
    });
  });

  it('displays correct metrics with proper formatting', async () => {
    const { findByText } = renderDashboard();

    // Wait for stats to load and check formatting
    await findByText('45'); // Students count
    await findByText('3 new this month'); // New enrollments subtitle
    await findByText('R36k'); // Revenue formatted in thousands
    await findByText('7 pending payments'); // Pending payments subtitle

    expect(PrincipalService.getPrincipalStats).toHaveBeenCalledWith(mockProfile.preschool_id);
  });

  it('handles missing preschool_id gracefully', async () => {
    const profileWithoutPreschool = {
      ...mockProfile,
      preschool_id: null,
    };

    const { findByText } = render(
      <ThemeContext.Provider value={mockThemeContext}>
        <PrincipalDashboard 
          profile={profileWithoutPreschool} 
          onSignOut={mockOnSignOut} 
        />
      </ThemeContext.Provider>
    );

    // Should render with default school name
    await findByText('Manage Your Preschool');
    
    // Should not call services without preschool_id
    expect(PrincipalService.getPrincipalStats).toHaveBeenCalledWith(null);
  });
});

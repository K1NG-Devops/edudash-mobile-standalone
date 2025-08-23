import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SchoolCodeManager } from '../../components/admin/SchoolCodeManager';
import { PrincipalService } from '../../lib/services/principalService';
import * as Clipboard from 'expo-clipboard';
import { Alert, Share } from 'react-native';

// Mock dependencies
jest.mock('../../lib/services/principalService');
jest.mock('expo-clipboard');
jest.mock('../../lib/utils/logger');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(),
}));

// Mock components
jest.mock('../../components/ui/IconSymbol', () => ({
  IconSymbol: (props: any) => {
    return null; // Mock implementation
  },
}));

jest.mock('../../components/common/QRCode', () => {
  return {
    __esModule: true,
    default: (props: any) => {
      return null; // Mock implementation
    },
  };
});

describe('SchoolCodeManager Component', () => {
  const mockProps = {
    preschoolId: 'test-preschool-id',
    principalId: 'test-principal-id',
    schoolName: 'Test Preschool',
    visible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful PrincipalService methods
    (PrincipalService.getActiveSchoolInvitationCode as jest.Mock).mockResolvedValue({
      data: {
        id: 'code-id',
        code: 'ABC12345',
        preschool_id: mockProps.preschoolId,
        created_by: mockProps.principalId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        usage_count: 0,
        description: 'Test code',
      },
      error: null,
    });

    (PrincipalService.generateSchoolInvitationCode as jest.Mock).mockResolvedValue({
      data: 'NEW12345',
      error: null,
    });

    (PrincipalService.deactivateSchoolInvitationCode as jest.Mock).mockResolvedValue({
      success: true,
      error: null,
    });

    (Clipboard.setStringAsync as jest.Mock).mockResolvedValue(true);
    (Share.share as jest.Mock).mockResolvedValue({ action: 'sharedAction' });
  });

  it('renders the school code manager with active code', async () => {
    const { findByText, queryByText } = render(
      <SchoolCodeManager {...mockProps} />
    );

    // Wait for the active code to load
    await findByText('ABC12345');
    
    expect(queryByText('Active School Code')).toBeTruthy();
    expect(queryByText('No Active School Code')).toBeFalsy();
    expect(PrincipalService.getActiveSchoolInvitationCode).toHaveBeenCalledWith(mockProps.preschoolId);
  });

  it('renders empty state when no active code exists', async () => {
    // Mock no active code
    (PrincipalService.getActiveSchoolInvitationCode as jest.Mock).mockResolvedValue({
      data: null,
      error: null,
    });

    const { findByText, queryByText } = render(
      <SchoolCodeManager {...mockProps} />
    );

    // Wait for the empty state to render
    await findByText('No Active School Code');
    
    expect(queryByText('Active School Code')).toBeFalsy();
    expect(queryByText('Generate School Code')).toBeTruthy();
  });

  it('handles generate code button click', async () => {
    // Start with no active code
    (PrincipalService.getActiveSchoolInvitationCode as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const { findByText, getByText } = render(
      <SchoolCodeManager {...mockProps} />
    );

    // Wait for the empty state to render
    const generateButton = await findByText('Generate School Code');
    
    // Click the generate button
    fireEvent.press(generateButton);
    
    // Wait for the service to be called
    await waitFor(() => {
      expect(PrincipalService.generateSchoolInvitationCode).toHaveBeenCalledWith(
        mockProps.preschoolId,
        mockProps.principalId,
        expect.objectContaining({
          description: expect.stringContaining(mockProps.schoolName),
          expiryDays: 90,
        })
      );
    });
    
    // Check that Alert was called with the new code
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('handles copying code to clipboard', async () => {
    const { findByText } = render(
      <SchoolCodeManager {...mockProps} />
    );

    // Wait for the active code to load
    await findByText('ABC12345');
    
    // Find and click the copy code button
    const copyButton = await findByText('Copy Code');
    fireEvent.press(copyButton);
    
    // Check clipboard was set
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABC12345');
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('handles sharing code', async () => {
    const { findByText } = render(
      <SchoolCodeManager {...mockProps} />
    );

    // Wait for the active code to load
    await findByText('ABC12345');
    
    // Find and click the share code button
    const shareButton = await findByText('Share Code');
    fireEvent.press(shareButton);
    
    // Check share was called
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('ABC12345'),
        title: expect.stringContaining(mockProps.schoolName),
      })
    );
  });

  it('handles deactivating code', async () => {
    const { findByText } = render(
      <SchoolCodeManager {...mockProps} />
    );

    // Wait for the active code to load
    await findByText('ABC12345');
    
    // Find and click the deactivate button
    const deactivateButton = await findByText('Deactivate Code');
    fireEvent.press(deactivateButton);
    
    // Alert should be shown asking for confirmation
    expect(Alert.alert).toHaveBeenCalledWith(
      'Deactivate School Code',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Deactivate' }),
      ])
    );
    
    // Simulate clicking the "Deactivate" button in the confirmation dialog
    const confirmHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    await confirmHandler();
    
    // Check deactivate service was called
    expect(PrincipalService.deactivateSchoolInvitationCode).toHaveBeenCalledWith(mockProps.preschoolId);
  });
});

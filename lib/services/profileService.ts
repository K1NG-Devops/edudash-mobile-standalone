/**
 * Profile Service
 * Handles all profile-related database operations for parents and children
 * Includes validation, updates, and profile completion tracking
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';
import { Database } from '@/types/database';

const log = createLogger('profile');

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Student = Tables['students']['Row'];
type UserUpdate = Tables['users']['Update'];
type StudentInsert = Tables['students']['Insert'];
type StudentUpdate = Tables['students']['Update'];

export interface ParentProfileData {
  // Basic Information
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  id_number?: string;
  
  // Address Information
  street_address: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  
  // Work Information
  position_title?: string;
  department?: string;
  
  // Emergency Contacts
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface ChildProfileData {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  
  // Medical Information
  allergies?: string;
  medical_conditions?: string;
  
  // Emergency Contact for Child
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  
  // Enrollment
  enrollment_date: string;
  is_active: boolean;
}

export interface ProfileCompletionStatus {
  parentCompletion: number;
  childrenCompletion: number;
  overallCompletion: number;
  missingParentFields: string[];
  missingChildrenFields: { childIndex: number; fields: string[] }[];
}

class ProfileService {
  /**
   * Get user profile by auth_user_id
   */
  async getUserProfile(authUserId: string): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .limit(1)
        .single();

      if (error) {
        log.error('Error fetching user profile:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      log.error('Error in getUserProfile:', err);
      return { data: null, error: 'Failed to fetch user profile' };
    }
  }

  /**
   * Get children profiles for a parent
   */
  async getChildrenProfiles(parentId: string): Promise<{ data: Student[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        log.error('Error fetching children profiles:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      log.error('Error in getChildrenProfiles:', err);
      return { data: null, error: 'Failed to fetch children profiles' };
    }
  }

  /**
   * Validate parent profile data
   */
  validateParentProfile(profile: ParentProfileData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!profile.name?.trim()) errors.push('Full name is required');
    if (!profile.email?.trim()) errors.push('Email is required');
    if (!profile.phone?.trim()) errors.push('Phone number is required');
    if (!profile.street_address?.trim()) errors.push('Street address is required');

    // Email format validation
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.push('Invalid email format');
    }

    // Phone format validation (basic)
    if (profile.phone && !/^[\+]?[1-9][\d]{3,14}$/.test(profile.phone.replace(/\s|-/g, ''))) {
      errors.push('Invalid phone number format');
    }

    // Date format validation
    if (profile.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(profile.date_of_birth)) {
      errors.push('Invalid date of birth format');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate child profile data
   */
  validateChildProfile(child: ChildProfileData, index: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const childLabel = `Child #${index + 1}`;

    // Required fields validation
    if (!child.first_name?.trim()) errors.push(`${childLabel}: First name is required`);
    if (!child.last_name?.trim()) errors.push(`${childLabel}: Last name is required`);
    if (!child.date_of_birth?.trim()) errors.push(`${childLabel}: Date of birth is required`);

    // Date format validation
    if (child.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(child.date_of_birth)) {
      errors.push(`${childLabel}: Invalid date of birth format`);
    }

    if (child.enrollment_date && !/^\d{4}-\d{2}-\d{2}$/.test(child.enrollment_date)) {
      errors.push(`${childLabel}: Invalid enrollment date format`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Update parent profile
   */
  async updateParentProfile(
    authUserId: string, 
    profileData: ParentProfileData
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Validate data first
      const validation = this.validateParentProfile(profileData);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Prepare update data
      const updateData: UserUpdate = {
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        date_of_birth: profileData.date_of_birth || null,
        gender: profileData.gender || null,
        id_number: profileData.id_number?.trim() || null,
        street_address: profileData.street_address.trim(),
        city: profileData.city?.trim() || null,
        state_province: profileData.state_province?.trim() || null,
        postal_code: profileData.postal_code?.trim() || null,
        country: profileData.country?.trim() || null,
        position_title: profileData.position_title?.trim() || null,
        department: profileData.department?.trim() || null,
        emergency_contact_name: profileData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: profileData.emergency_contact_phone?.trim() || null,
        emergency_contact_relationship: profileData.emergency_contact_relationship?.trim() || null,
        profile_completion_status: 'complete',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('auth_user_id', authUserId);

      if (error) {
        log.error('Error updating parent profile:', error);
        return { success: false, error: error.message };
      }

      log.info('Parent profile updated successfully', { authUserId });
      return { success: true, error: null };
    } catch (err) {
      log.error('Error in updateParentProfile:', err);
      return { success: false, error: 'Failed to update parent profile' };
    }
  }

  /**
   * Update or insert child profile
   */
  async updateChildProfile(
    parentId: string,
    preschoolId: string,
    childData: ChildProfileData,
    index: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Validate data first
      const validation = this.validateChildProfile(childData, index);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Skip if both first and last name are empty
      if (!childData.first_name.trim() && !childData.last_name.trim()) {
        return { success: true, error: null };
      }

      const commonData = {
        preschool_id: preschoolId,
        parent_id: parentId,
        first_name: childData.first_name.trim(),
        last_name: childData.last_name.trim(),
        date_of_birth: childData.date_of_birth,
        gender: childData.gender || null,
        allergies: childData.allergies?.trim() || null,
        medical_conditions: childData.medical_conditions?.trim() || null,
        emergency_contact_name: childData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: childData.emergency_contact_phone?.trim() || null,
        emergency_contact_relation: childData.emergency_contact_relation?.trim() || null,
        enrollment_date: childData.enrollment_date,
        is_active: childData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (childData.id) {
        // Update existing child
        const { error } = await supabase
          .from('students')
          .update(commonData as StudentUpdate)
          .eq('id', childData.id);

        if (error) {
          log.error('Error updating child profile:', error);
          return { success: false, error: error.message };
        }

        log.info('Child profile updated successfully', { childId: childData.id });
      } else {
        // Insert new child
        const { error } = await supabase
          .from('students')
          .insert({
            ...commonData,
            created_at: new Date().toISOString(),
          } as StudentInsert);

        if (error) {
          log.error('Error inserting child profile:', error);
          return { success: false, error: error.message };
        }

        log.info('Child profile created successfully', { parentId });
      }

      return { success: true, error: null };
    } catch (err) {
      log.error('Error in updateChildProfile:', err);
      return { success: false, error: 'Failed to update child profile' };
    }
  }

  /**
   * Update multiple children profiles in a transaction
   */
  async updateChildrenProfiles(
    parentId: string,
    preschoolId: string,
    childrenData: ChildProfileData[]
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Process each child individually
      for (let i = 0; i < childrenData.length; i++) {
        const result = await this.updateChildProfile(parentId, preschoolId, childrenData[i], i);
        if (!result.success) {
          return result;
        }
      }

      log.info('All children profiles updated successfully', { 
        parentId, 
        childrenCount: childrenData.length 
      });
      return { success: true, error: null };
    } catch (err) {
      log.error('Error in updateChildrenProfiles:', err);
      return { success: false, error: 'Failed to update children profiles' };
    }
  }

  /**
   * Update complete profile (parent + children)
   */
  async updateCompleteProfile(
    authUserId: string,
    parentData: ParentProfileData,
    childrenData: ChildProfileData[]
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get parent profile first to get internal ID and preschool ID
      const { data: parentProfile, error: parentError } = await this.getUserProfile(authUserId);
      if (parentError || !parentProfile) {
        return { success: false, error: parentError || 'Parent profile not found' };
      }

      // Update parent profile
      const parentResult = await this.updateParentProfile(authUserId, parentData);
      if (!parentResult.success) {
        return parentResult;
      }

      // Update children profiles
      if (childrenData.length > 0) {
        const childrenResult = await this.updateChildrenProfiles(
          parentProfile.id,
          parentProfile.preschool_id!,
          childrenData
        );
        if (!childrenResult.success) {
          return childrenResult;
        }
      }

      log.info('Complete profile updated successfully', { authUserId });
      return { success: true, error: null };
    } catch (err) {
      log.error('Error in updateCompleteProfile:', err);
      return { success: false, error: 'Failed to update complete profile' };
    }
  }

  /**
   * Calculate profile completion status
   */
  calculateProfileCompletion(
    parentData: ParentProfileData,
    childrenData: ChildProfileData[]
  ): ProfileCompletionStatus {
    // Parent required fields
    const parentRequiredFields = ['name', 'email', 'phone', 'street_address'];
    const parentMissingFields: string[] = [];
    
    let parentCompletedFields = 0;
    parentRequiredFields.forEach(field => {
      const value = parentData[field as keyof ParentProfileData];
      if (value && value.toString().trim()) {
        parentCompletedFields++;
      } else {
        parentMissingFields.push(field.replace('_', ' '));
      }
    });

    const parentCompletion = parentRequiredFields.length > 0 
      ? Math.round((parentCompletedFields / parentRequiredFields.length) * 100)
      : 0;

    // Children required fields
    const childRequiredFields = ['first_name', 'last_name', 'date_of_birth'];
    let childrenCompletedFields = 0;
    let totalChildrenFields = 0;
    const missingChildrenFields: { childIndex: number; fields: string[] }[] = [];

    childrenData.forEach((child, index) => {
      const childMissingFields: string[] = [];
      
      childRequiredFields.forEach(field => {
        totalChildrenFields++;
        const value = child[field as keyof ChildProfileData];
        if (value && value.toString().trim()) {
          childrenCompletedFields++;
        } else {
          childMissingFields.push(field.replace('_', ' '));
        }
      });

      if (childMissingFields.length > 0) {
        missingChildrenFields.push({
          childIndex: index,
          fields: childMissingFields
        });
      }
    });

    const childrenCompletion = totalChildrenFields > 0
      ? Math.round((childrenCompletedFields / totalChildrenFields) * 100)
      : 100; // 100% if no children

    // Overall completion
    const totalRequired = parentRequiredFields.length + totalChildrenFields;
    const totalCompleted = parentCompletedFields + childrenCompletedFields;
    const overallCompletion = totalRequired > 0
      ? Math.round((totalCompleted / totalRequired) * 100)
      : 0;

    return {
      parentCompletion,
      childrenCompletion,
      overallCompletion,
      missingParentFields: parentMissingFields,
      missingChildrenFields
    };
  }

  /**
   * Delete child profile
   */
  async deleteChildProfile(childId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('students')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', childId);

      if (error) {
        log.error('Error deleting child profile:', error);
        return { success: false, error: error.message };
      }

      log.info('Child profile deleted successfully', { childId });
      return { success: true, error: null };
    } catch (err) {
      log.error('Error in deleteChildProfile:', err);
      return { success: false, error: 'Failed to delete child profile' };
    }
  }
}

export const profileService = new ProfileService();

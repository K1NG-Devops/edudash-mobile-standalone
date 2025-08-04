import { supabase } from '@/lib/supabase';
import { PreschoolOnboardingRequest } from '@/types/types';

interface OnboardingRequestInput {
  preschoolName: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  address?: string;
  numberOfStudents?: string;
  numberOfTeachers?: string;
  message?: string;
}

export const createOnboardingRequest = async (requestData: OnboardingRequestInput) => {
  const { preschoolName, adminName, adminEmail, phone, address, numberOfStudents, numberOfTeachers, message } = requestData;

  const { data, error } = await supabase
    .from('preschool_onboarding_requests')
    .insert([
      {
        preschool_name: preschoolName,
        admin_name: adminName,
        admin_email: adminEmail,
        phone,
        address,
        number_of_students: numberOfStudents ? parseInt(numberOfStudents, 10) : null,
        number_of_teachers: numberOfTeachers ? parseInt(numberOfTeachers, 10) : null,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw error;
  }

  return data;
};

// Fetch all onboarding requests (for super admins)
export const getAllOnboardingRequests = async (): Promise<PreschoolOnboardingRequest[]> => {
  const { data, error } = await supabase
    .from('preschool_onboarding_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

// Approve an onboarding request (for super admins)
export const approveOnboardingRequest = async (requestId: string, reviewerId: string) => {
  const { data, error } = await supabase
    .from('preschool_onboarding_requests')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw error;
  }

  return data;
};

// Reject an onboarding request (for super admins)
export const rejectOnboardingRequest = async (requestId: string, reviewerId: string) => {
  const { data, error } = await supabase
    .from('preschool_onboarding_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw error;
  }

  return data;
};


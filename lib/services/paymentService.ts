import { supabase } from '../supabase';
import { createLogger } from '@/lib/utils/logger';
const log = createLogger('payment');
import { 
  PaymentFee, 
  Payment, 
  PaymentMethod_Config, 
  PaymentSummary, 
  PaymentFormData,
  PaymentApiResponse,
  FeesApiResponse,
  PaymentReceipt
} from '@/types/payment-types';

export class PaymentService {
  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get monthly fee based on child's age
   */
  private static getMonthlyFeeByAge(age: number): number {
    // R720 for ages 1-3, R680 for ages 4-6
    if (age >= 1 && age <= 3) {
      return 720;
    } else if (age >= 4 && age <= 6) {
      return 680;
    }
    // Default fee for other ages (shouldn't happen in normal flow)
    return 700;
  }

  /**
   * Get parent's payment window settings (default: 1-7 of each month)
   */
  private static async getParentPaymentWindow(parentId: string): Promise<{ start_day: number; end_day: number }> {
    const { data: parentSettings } = await supabase
      .from('users')
      .select('payment_window_start, payment_window_end')
      .eq('id', parentId)
      .single();

    return {
      start_day: parentSettings?.payment_window_start || 1,
      end_day: parentSettings?.payment_window_end || 7
    };
  }

  /**
   * Check if current date is within or past payment window for overdue calculation
   */
  private static isOverdueBasedOnWindow(dueDate: Date, paymentWindow: { start_day: number; end_day: number }): boolean {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Payment window end date for current month
    const windowEndDate = new Date(currentYear, currentMonth, paymentWindow.end_day, 23, 59, 59);
    
    // Fee is overdue if current date is past the payment window end date
    return currentDate > windowEndDate;
  }

  /**
   * Generate and persist age-based fees for students who don't have current month payment
   */
  private static async generateAgeBasedFees(students: any[], preschoolId: string, parentId: string): Promise<PaymentFee[]> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Get parent's payment window settings
    const paymentWindow = await this.getParentPaymentWindow(parentId);
    
    const fees: PaymentFee[] = [];
    const feesToPersist = [];
    
    for (const student of students) {
      const age = this.calculateAge(student.date_of_birth);
      const monthlyFee = this.getMonthlyFeeByAge(age);
      
      // Check if this student already has a fee record for current month
      const { data: existingFees } = await supabase
        .from('payment_fees')
        .select('*')
        .eq('student_id', student.id)
        .eq('fee_type', 'tuition')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
      
      // Check if this student already has a payment record for current month
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_fee_id', null) -- placeholder, adapt to your association
        .eq('payment_status', 'completed')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
      
      // Only create/return fee if no existing fee and no payment exists for this month
      if ((!existingFees || existingFees.length === 0) && (!existingPayments || existingPayments.length === 0)) {
        // Calculate due date (15th of current month or custom based on payment window)
        const dueDate = new Date(currentYear, currentMonth - 1, paymentWindow.end_day);
        const isOverdue = this.isOverdueBasedOnWindow(dueDate, paymentWindow);
        
        const feeData = {
          preschool_id: preschoolId,
          student_id: student.id,
          fee_type: 'tuition',
          amount: monthlyFee,
          currency: 'ZAR',
          description: `Monthly school fee for ${student.first_name} ${student.last_name} (Age ${age})`,
          due_date: dueDate.toISOString().split('T')[0],
          recurring_type: 'monthly',
          status: isOverdue ? 'overdue' : 'pending'
        };
        
        // Add to persist list
        feesToPersist.push(feeData);
        
        // Add to return list with student info
        fees.push({
          ...feeData,
          id: `auto_${student.id}_${currentYear}_${currentMonth}`, // Temporary ID for UI
          student: {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name
          }
        });
      } else if (existingFees && existingFees.length > 0) {
        // Return existing fee with updated overdue status
        const existingFee = existingFees[0];
        const isOverdue = this.isOverdueBasedOnWindow(new Date(existingFee.due_date), paymentWindow);
        
        // Update overdue status if changed
        if (existingFee.is_overdue !== isOverdue) {
          await supabase
            .from('payment_fees')
            .update({ is_overdue: isOverdue, updated_at: currentDate.toISOString() })
            .eq('id', existingFee.id);
        }
        
        fees.push({
          ...existingFee,
          is_overdue: isOverdue,
          student: {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name
          }
        });
      }
    }
    
    // Persist new fees to database
    if (feesToPersist.length > 0) {
      const { data: persistedFees, error } = await supabase
        .from('payment_fees')
        .insert(feesToPersist)
        .select('*');
      
      if (error) {
        console.error('Error persisting fees:', error);
      } else {
        console.log(`✅ Persisted ${persistedFees?.length || 0} new fees to database`);
        
        // Update the fees array with actual IDs from database
        if (persistedFees) {
          fees.forEach((fee, index) => {
            if (fee.id.startsWith('auto_')) {
              const persistedFee = persistedFees.find(pf => pf.student_id === fee.student_id);
              if (persistedFee) {
                fee.id = persistedFee.id;
              }
            }
          });
        }
      }
    }
    
    return fees;
  }

  /**
   * Fetch outstanding fees for a parent's children
   */
  static async getOutstandingFees(parentAuthId: string): Promise<FeesApiResponse> {
    try {
      // First get the parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id, preschool_id')
        .eq('auth_user_id', parentAuthId)
        .single();

      if (parentError || !parentProfile) {
        return { success: false, error: 'Parent profile not found' };
      }

      // Get all children for this parent with date_of_birth
      const { data: children, error: childrenError } = await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth')
        .eq('parent_id', parentProfile.id)
        .eq('is_active', true);

      if (childrenError) {
        return { success: false, error: 'Failed to fetch children' };
      }

      if (!children || children.length === 0) {
        return { 
          success: true, 
          fees: [], 
          summary: {
            total_outstanding: 0,
            total_paid_this_month: 0,
            next_payment_due: null,
            overdue_amount: 0,
            upcoming_fees: [],
            recent_payments: []
          }
        };
      }

      // Generate age-based fees for all children
      const fees = await this.generateAgeBasedFees(children, parentProfile.preschool_id, parentProfile.id);
      
      console.log(`Generated ${fees.length} age-based fees for ${children.length} children`);
      
      // If no fees generated (all payments up to date), return empty state
      if (fees.length === 0) {
        console.log('All payments are up to date - no outstanding fees');
      }

      // Calculate summary data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const totalOutstanding = (fees || []).reduce((sum, fee) => sum + fee.amount, 0);
      const overdueAmount = (fees || [])
        .filter(fee => new Date(fee.due_date) < now)
        .reduce((sum, fee) => sum + fee.amount, 0);

      // Get recent payments for this month
      const { data: recentPayments } = await supabase
        .from('payments')
        .select(`
          *,
          student:students(id, first_name, last_name)
        `)
        .eq('parent_id', parentProfile.id)
        .eq('status', 'completed')
        .gte('processed_at', startOfMonth.toISOString())
        .lte('processed_at', endOfMonth.toISOString())
        .order('processed_at', { ascending: false })
        .limit(5);

      const totalPaidThisMonth = (recentPayments || []).reduce((sum, payment) => sum + payment.amount, 0);

      // Find next payment due
      const upcomingFees = (fees || [])
        .filter(fee => new Date(fee.due_date) >= now)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      const nextPaymentDue = upcomingFees.length > 0 ? upcomingFees[0].due_date : null;

      const summary: PaymentSummary = {
        total_outstanding: totalOutstanding,
        total_paid_this_month: totalPaidThisMonth,
        next_payment_due: nextPaymentDue,
        overdue_amount: overdueAmount,
        upcoming_fees: upcomingFees.slice(0, 5),
        recent_payments: recentPayments || []
      };

      return {
        success: true,
        fees: fees || [],
        summary
      };

    } catch (error) {
      console.error('PaymentService.getOutstandingFees error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Fetch payment history for a parent
   */
  static async getPaymentHistory(parentAuthId: string, limit: number = 20): Promise<Payment[]> {
    try {
      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', parentAuthId)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          student:students(id, first_name, last_name)
        `)
        .eq('parent_id', parentProfile.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return payments || [];
    } catch (error) {
      console.error('PaymentService.getPaymentHistory error:', error);
      return [];
    }
  }

  /**
   * Get available payment methods for a preschool
   */
  static async getPaymentMethods(preschoolId: string): Promise<PaymentMethod_Config[]> {
    try {
      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('preschool_id', preschoolId)
        .eq('is_enabled', true)
        .order('method_type');

      if (error) {
        throw error;
      }

      return methods || [];
    } catch (error) {
      console.error('PaymentService.getPaymentMethods error:', error);
      return [];
    }
  }

  /**
   * Process a payment (this would integrate with actual payment providers)
   */
  static async processPayment(formData: PaymentFormData, parentAuthId: string): Promise<PaymentApiResponse> {
    try {
      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id, preschool_id')
        .eq('auth_user_id', parentAuthId)
        .single();

      if (parentError || !parentProfile) {
        return { success: false, error: 'Parent profile not found' };
      }

      // Generate payment reference
      const paymentReference = `EDU${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // For now, we'll simulate payment processing
      // In a real implementation, this would integrate with Stripe, PayFast, etc.
      const paymentData = {
        preschool_id: parentProfile.preschool_id,
        parent_id: parentProfile.id,
        fee_ids: formData.selectedFees,
        amount: formData.totalAmount,
        currency: 'ZAR', // Default to South African Rand
        payment_method: formData.paymentMethod,
        payment_reference: paymentReference,
        status: 'pending' as const,
        description: `Payment for ${formData.selectedFees.length} fee(s)`
      };

      const { data: payment, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select(`
          *,
          student:students(id, first_name, last_name)
        `)
        .single();

      if (error) {
        console.error('Payment creation error:', error);
        return { success: false, error: 'Failed to create payment record' };
      }

      // For demo purposes, we'll simulate different payment outcomes
      let simulatedStatus: 'completed' | 'failed' = 'completed';
      let failureReason: string | undefined;

      // Simulate some failures for demo
      if (Math.random() < 0.1) { // 10% failure rate for demo
        simulatedStatus = 'failed';
        failureReason = 'Insufficient funds';
      }

      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: simulatedStatus,
          failure_reason: failureReason,
          processed_at: simulatedStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', payment.id)
        .select(`
          *,
          student:students(id, first_name, last_name)
        `)
        .single();

      if (updateError) {
        console.error('Payment update error:', updateError);
        return { success: false, error: 'Failed to update payment status' };
      }

      // If payment was successful, mark fees as paid
      if (simulatedStatus === 'completed') {
        const { error: feesUpdateError } = await supabase
          .from('payment_fees')
          .update({ is_paid: true, updated_at: new Date().toISOString() })
          .in('id', formData.selectedFees);

        if (feesUpdateError) {
          console.error('Fees update error:', feesUpdateError);
        }

        // Create receipt
        await this.createReceipt(updatedPayment, parentProfile.preschool_id);
      }

      return {
        success: simulatedStatus === 'completed',
        payment: updatedPayment,
        error: simulatedStatus === 'failed' ? failureReason : undefined
      };

    } catch (error) {
      console.error('PaymentService.processPayment error:', error);
      return { success: false, error: 'An unexpected error occurred during payment processing' };
    }
  }

  /**
   * Create a payment receipt
   */
  private static async createReceipt(payment: Payment, preschoolId: string): Promise<void> {
    try {
      // Generate receipt number
      const receiptNumber = `REC${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;

      // Get fee details
      const { data: fees } = await supabase
        .from('payment_fees')
        .select('id, title, amount')
        .in('id', payment.fee_ids);

      // Get preschool details
      const { data: preschool } = await supabase
        .from('preschools')
        .select('name, address')
        .eq('id', preschoolId)
        .single();

      const receiptData = {
        payment_id: payment.id,
        preschool_id: preschoolId,
        receipt_number: receiptNumber,
        amount: payment.amount,
        currency: payment.currency,
        fees_breakdown: (fees || []).map(fee => ({
          fee_id: fee.id,
          fee_title: fee.title,
          amount: fee.amount
        })),
        payment_date: payment.processed_at || payment.created_at,
        payment_method: payment.payment_method,
        receipt_data: {
          parent_name: payment.parent?.name || 'Unknown',
          parent_email: payment.parent?.email || 'Unknown',
          student_name: payment.student ? `${payment.student.first_name} ${payment.student.last_name}` : undefined,
          preschool_name: preschool?.name || 'Unknown',
          preschool_address: preschool?.address,
          payment_reference: payment.payment_reference
        }
      };

      await supabase
        .from('payment_receipts')
        .insert(receiptData);

    } catch (error) {
      console.error('Receipt creation error:', error);
    }
  }

  /**
   * Get payment receipt
   */
  static async getReceipt(paymentId: string): Promise<PaymentReceipt | null> {
    try {
      const { data: receipt, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (error) {
        console.error('Receipt fetch error:', error);
        return null;
      }

      return receipt;
    } catch (error) {
      console.error('PaymentService.getReceipt error:', error);
      return null;
    }
  }

  /**
   * Submit proof of payment for review by school admin
   */
  static async submitProofOfPayment(
    proofData: {
      referenceNumber: string;
      amount: string;
      paymentDate: string;
      paymentMethod: string;
      notes: string;
      attachment?: {
        uri: string;
        type: string;
        name: string;
      };
    },
    parentAuthId: string
  ): Promise<{ success: boolean; error?: string; paymentId?: string }> {
    try {
      // Get parent's profile
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id, preschool_id, name, email')
        .eq('auth_user_id', parentAuthId)
        .single();

      if (parentError || !parentProfile) {
        return { success: false, error: 'Parent profile not found' };
      }

      // Get the first active student for this parent (for now)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('parent_id', parentProfile.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      // Generate a unique payment reference if not provided
      const paymentReference = proofData.referenceNumber || 
        `POP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Upload file to Supabase storage if attachment exists
      let attachmentUrl: string | null = null;
      if (proofData.attachment) {
        try {
          const fileName = `${parentProfile.id}/${Date.now()}_${proofData.attachment.name}`;
          
          // For now, we'll store the file path. In a real implementation,
          // you'd upload the file to Supabase storage or another file service
          attachmentUrl = `proof-of-payments/${fileName}`;
          
          // TODO: Implement actual file upload
          // const { data: uploadData, error: uploadError } = await supabase.storage
          //   .from('proof-of-payments')
          //   .upload(fileName, fileBlob);
          
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue without attachment if upload fails
        }
      }

      // Create payment record with 'proof_submitted' status
      const paymentData = {
        preschool_id: parentProfile.preschool_id,
        parent_id: parentProfile.id,
        student_id: student?.id || null,
        fee_ids: [], // Empty for proof of payment submissions
        amount: parseFloat(proofData.amount),
        currency: 'ZAR',
        payment_method: proofData.paymentMethod,
        payment_reference: paymentReference,
        status: 'proof_submitted' as const,
        description: proofData.notes || 'Proof of payment submitted by parent',
        attachment_url: attachmentUrl,
        submitted_at: new Date().toISOString(),
        metadata: {
          submission_type: 'proof_of_payment',
          original_payment_date: proofData.paymentDate,
          parent_notes: proofData.notes,
          attachment_name: proofData.attachment?.name
        }
      };

      const { data: payment, error: insertError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select(`
          *,
          student:students(id, first_name, last_name)
        `)
        .single();

      if (insertError) {
        console.error('Payment insertion error:', insertError);
        return { success: false, error: 'Failed to submit proof of payment' };
      }

      // Create a notification for the school admin
      await this.createAdminNotification(
        parentProfile.preschool_id,
        'proof_of_payment_submitted',
        {
          payment_id: payment.id,
          parent_name: parentProfile.name,
          amount: proofData.amount,
          reference: paymentReference,
          student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown'
        }
      );

      console.log('✅ Proof of payment submitted successfully:', payment.id);
      return { success: true, paymentId: payment.id };

    } catch (error) {
      console.error('PaymentService.submitProofOfPayment error:', error);
      return { success: false, error: 'An unexpected error occurred while submitting proof of payment' };
    }
  }

  /**
   * Update parent's payment window settings
   */
  static async updatePaymentWindow(
    parentAuthId: string,
    startDay: number,
    endDay: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input
      if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
        return { success: false, error: 'Payment window days must be between 1 and 31' };
      }

      // Get parent profile
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id, payment_window_locked')
        .eq('auth_user_id', parentAuthId)
        .eq('role', 'parent')
        .single();

      if (parentError || !parentProfile) {
        return { success: false, error: 'Parent profile not found' };
      }

      // Check if payment window is locked
      if (parentProfile.payment_window_locked) {
        return { success: false, error: 'Payment window is locked and can only be changed by school admin' };
      }

      // Update payment window
      const { error: updateError } = await supabase
        .from('users')
        .update({
          payment_window_start: startDay,
          payment_window_end: endDay,
          payment_window_locked: true, // Lock after first setting
          updated_at: new Date().toISOString()
        })
        .eq('id', parentProfile.id);

      if (updateError) {
        console.error('Payment window update error:', updateError);
        return { success: false, error: 'Failed to update payment window settings' };
      }

      console.log(`✅ Updated payment window for parent ${parentProfile.id}: ${startDay}-${endDay}`);
      return { success: true };

    } catch (error) {
      console.error('PaymentService.updatePaymentWindow error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get parent's current payment window settings
   */
  static async getPaymentWindowSettings(
    parentAuthId: string
  ): Promise<{ success: boolean; settings?: { start_day: number; end_day: number; locked: boolean }; error?: string }> {
    try {
      const { data: parentSettings, error } = await supabase
        .from('users')
        .select('payment_window_start, payment_window_end, payment_window_locked')
        .eq('auth_user_id', parentAuthId)
        .eq('role', 'parent')
        .single();

      if (error) {
        return { success: false, error: 'Failed to fetch payment window settings' };
      }

      return {
        success: true,
        settings: {
          start_day: parentSettings?.payment_window_start || 1,
          end_day: parentSettings?.payment_window_end || 7,
          locked: parentSettings?.payment_window_locked || false
        }
      };

    } catch (error) {
      console.error('PaymentService.getPaymentWindowSettings error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Create notification for school admin
   */
  private static async createAdminNotification(
    preschoolId: string,
    notificationType: string,
    data: any
  ): Promise<void> {
    try {
      // Get preschool admin users
      const { data: adminUsers, error } = await supabase
        .from('users')
        .select('id, auth_user_id')
        .eq('preschool_id', preschoolId)
        .eq('role', 'admin')
        .eq('is_active', true);

      if (error || !adminUsers || adminUsers.length === 0) {
        console.log('No admin users found for preschool:', preschoolId);
        return;
      }

      // Create notifications for all admin users
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        title: 'New Proof of Payment Submitted',
        message: `${data.parent_name} has submitted proof of payment for R${data.amount} (Ref: ${data.reference})`,
        type: notificationType,
        data: data,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('notifications')
        .insert(notifications);

      console.log(`✅ Created ${notifications.length} admin notifications`);

    } catch (error) {
      console.error('Error creating admin notifications:', error);
      // Don't throw error, as notification failure shouldn't stop the payment submission
    }
  }

  /**
   * Generate comprehensive financial summary with AI insights
   */
  static async generateFinancialInsightsWithAI(preschoolId: string, parentId?: string, period = 'monthly'): Promise<{
    summary: {
      totalRevenue: number;
      outstandingAmount: number;
      paidOnTime: number;
      overduePayments: number;
      collectionRate: number;
    };
    insights: {
      paymentTrends: string;
      recommendations: string[];
      riskAssessment: string;
      forecastedRevenue: number;
    };
  }> {
    try {
      // Get payment data for analysis
      let paymentsQuery = supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          due_date,
          paid_at,
          created_at,
          student:students(id, full_name)
        `)
        .eq('preschool_id', preschoolId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (parentId) {
        paymentsQuery = paymentsQuery.eq('students.parent_id', parentId);
      }

      const { data: payments } = await paymentsQuery;
      const paymentData = payments || [];

      // Calculate basic metrics
      const totalRevenue = paymentData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const overduePayments = paymentData
        .filter(p => p.status === 'pending' && new Date(p.due_date) < new Date())
        .length;

      const paidOnTime = paymentData
        .filter(p => p.status === 'completed' && p.paid_at && new Date(p.paid_at) <= new Date(p.due_date))
        .length;

      const outstandingAmount = paymentData
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const collectionRate = paymentData.length > 0 
        ? (paymentData.filter(p => p.status === 'completed').length / paymentData.length) * 100
        : 0;

      const summary = {
        totalRevenue,
        outstandingAmount,
        paidOnTime,
        overduePayments,
        collectionRate: Math.round(collectionRate * 100) / 100
      };

      // Generate AI insights if enabled
      let insights = {
        paymentTrends: 'Payment data shows consistent revenue patterns.',
        recommendations: ['Continue monitoring payment schedules', 'Send gentle reminders for overdue payments'],
        riskAssessment: 'Low risk - payment collection is stable.',
        forecastedRevenue: totalRevenue * 1.1
      };

      if (process.env.EXPO_PUBLIC_AI_ENABLED === 'true' && paymentData.length > 0) {
        const paymentSummary = {
          totalPayments: paymentData.length,
          completedPayments: paymentData.filter(p => p.status === 'completed').length,
          averagePaymentAmount: totalRevenue / (paymentData.filter(p => p.status === 'completed').length || 1),
          overdueRate: overduePayments / paymentData.length,
          onTimePaymentRate: paidOnTime / paymentData.length,
          monthlyTrend: 'increasing' // This could be calculated from actual data
        };

        try {
          const { claudeService } = await import('@/services/ai/claude-service');
          const prompt = `
            As a financial analyst for an early childhood education center, analyze this payment data:
            
            Payment Summary: ${JSON.stringify(paymentSummary, null, 2)}
            Period: Last ${period === 'monthly' ? '3 months' : '12 months'}
            
            Provide:
            1. Payment trends analysis (2-3 sentences)
            2. 3-4 specific recommendations for improving collection
            3. Risk assessment (financial health evaluation)
            4. Forecasted revenue for next month (as number)
            
            Format as JSON: {
              "paymentTrends": "string",
              "recommendations": ["rec1", "rec2", "rec3"],
              "riskAssessment": "string",
              "forecastedRevenue": number
            }
          `;

          const response = await claudeService.generateContent({
            prompt,
            type: 'financial_analysis',
            context: { preschoolId, period },
          });

          if (response.success && response.content) {
            try {
              insights = JSON.parse(response.content);
            } catch (parseError) {
              console.warn('Failed to parse AI financial insights:', parseError);
              insights.paymentTrends = response.content.slice(0, 200);
            }
          }
        } catch (error) {
          console.warn('AI financial insights unavailable:', error);
        }
      }

      return { summary, insights };
    } catch (error) {
      console.error('Error generating financial insights:', error);
      return {
        summary: {
          totalRevenue: 0,
          outstandingAmount: 0,
          paidOnTime: 0,
          overduePayments: 0,
          collectionRate: 0
        },
        insights: {
          paymentTrends: 'Unable to analyze payment trends at this time.',
          recommendations: ['Review payment processes', 'Contact support for assistance'],
          riskAssessment: 'Analysis unavailable - please check data connectivity.',
          forecastedRevenue: 0
        }
      };
    }
  }

  private static getFeeTitle(feeType: string): string {
    const titles = {
      tuition: 'Monthly Tuition Fee',
      activity: 'Arts & Crafts Activity',
      meal: 'School Lunch Program',
      transport: 'School Transport',
      material: 'Learning Materials',
      late_fee: 'Late Payment Fee',
      registration: 'Registration Fee',
      other: 'Miscellaneous Fee'
    };
    return titles[feeType as keyof typeof titles] || 'School Fee';
  }

  private static getFeeDescription(feeType: string): string {
    const descriptions = {
      tuition: 'Monthly preschool tuition and educational activities',
      activity: 'Materials and supervision for creative activities',
      meal: 'Nutritious meals and snacks provided during school hours',
      transport: 'Safe transportation to and from school',
      material: 'Books, stationery, and learning resources',
      late_fee: 'Late payment penalty',
      registration: 'Annual registration and enrollment fee',
      other: 'Additional school-related expenses'
    };
    return descriptions[feeType as keyof typeof descriptions] || 'School-related fee';
  }
}

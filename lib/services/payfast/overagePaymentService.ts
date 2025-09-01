// PayFast Overage Payment Service
// Handles payment processing for usage overages through PayFast

import { overageBillingService } from '../overageBillingService';
import type { OverageBillingRecord } from '../overageBillingService';
import { logger } from '../../utils/logger';

interface PayFastOveragePayment {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string; // Overage billing record ID
  amount: string;
  item_name: string;
  item_description: string;
  custom_str1?: string; // User ID
  custom_str2?: string; // Billing period
  custom_str3?: string; // Quota types
}

interface PayFastConfig {
  merchant_id: string;
  merchant_key: string;
  passphrase?: string;
  sandbox: boolean;
  base_url: string;
}

class PayFastOveragePaymentService {
  private config: PayFastConfig;

  constructor() {
    // Load PayFast configuration from environment
    this.config = {
      merchant_id: process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_ID || process.env.PAYFAST_MERCHANT_ID || '10000100',
      merchant_key: process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_KEY || process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
      passphrase: process.env.PAYFAST_PASSPHRASE,
      sandbox: process.env.NODE_ENV !== 'production',
      base_url: process.env.NODE_ENV === 'production' 
        ? 'https://www.payfast.co.za/eng/process' 
        : 'https://sandbox.payfast.co.za/eng/process'
    };
  }

  /**
   * Generate PayFast payment data for overage billing
   */
  private generatePaymentData(
    billingRecord: OverageBillingRecord,
    userInfo: {
      firstName: string;
      lastName: string;
      email: string;
    }
  ): PayFastOveragePayment {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}` 
      : 'https://www.edudashpro.org.za';

    // Create descriptive item name
    const quotaTypes = billingRecord.quotaType;
    const itemName = `EduDash Pro - Usage Overages (${quotaTypes})`;
    const itemDescription = `Overage charges for ${billingRecord.overageUnits} units of ${quotaTypes} - Period: ${billingRecord.billingPeriodStart} to ${billingRecord.billingPeriodEnd}`;

    return {
      merchant_id: this.config.merchant_id,
      merchant_key: this.config.merchant_key,
      return_url: `${baseUrl}/payment/overage/success?billing_id=${billingRecord.id}`,
      cancel_url: `${baseUrl}/payment/overage/cancelled?billing_id=${billingRecord.id}`,
      notify_url: `${baseUrl}/api/webhooks/payfast/overage`,
      name_first: userInfo.firstName,
      name_last: userInfo.lastName,
      email_address: userInfo.email,
      m_payment_id: billingRecord.id,
      amount: billingRecord.totalAmount.toFixed(2),
      item_name: itemName,
      item_description: itemDescription,
      custom_str1: billingRecord.userId,
      custom_str2: `${billingRecord.billingPeriodStart}_${billingRecord.billingPeriodEnd}`,
      custom_str3: billingRecord.quotaType,
    };
  }

  /**
   * Generate MD5 signature for PayFast
   */
  private generateSignature(data: PayFastOveragePayment): string {
    // Remove empty values and create query string
    const filteredData: Record<string, string> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filteredData[key] = String(value);
      }
    });

    // Sort by key and create query string
    const sortedKeys = Object.keys(filteredData).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(filteredData[key])}`)
      .join('&');

    // Add passphrase if configured
    const stringToHash = this.config.passphrase 
      ? `${queryString}&passphrase=${encodeURIComponent(this.config.passphrase)}`
      : queryString;

    // Generate MD5 hash (you'll need to implement MD5 hashing)
    // For now, return empty string - implement actual MD5 hashing
    return this.md5Hash(stringToHash);
  }

  /**
   * Simple MD5 hash implementation (use crypto-js or similar in production)
   */
  private md5Hash(str: string): string {
    // This is a placeholder - implement actual MD5 hashing
    // You can use crypto-js: import { MD5 } from 'crypto-js';
    // return MD5(str).toString();
    return ''; // Return empty for now
  }

  /**
   * Create PayFast payment URL for overage billing
   */
  async createOveragePayment(
    billingRecords: OverageBillingRecord[],
    userInfo: {
      firstName: string;
      lastName: string;
      email: string;
    }
  ): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      if (billingRecords.length === 0) {
        return { success: false, error: 'No billing records provided' };
      }

      // For multiple records, we'll consolidate them into a single payment
      const totalAmount = billingRecords.reduce((sum, record) => sum + record.totalAmount, 0);
      const quotaTypesSet = new Set(billingRecords.map(r => r.quotaType));
      const quotaTypes = Array.from(quotaTypesSet).join(', ');
      
      // Use the first record as the base, but modify amounts and descriptions
      const baseRecord = billingRecords[0];
      const consolidatedRecord: OverageBillingRecord = {
        ...baseRecord,
        totalAmount: totalAmount,
        quotaType: quotaTypes,
        overageUnits: billingRecords.reduce((sum, r) => sum + r.overageUnits, 0)
      };

      const paymentData = this.generatePaymentData(consolidatedRecord, userInfo);
      
      // Generate signature if using secure mode
      const signature = this.config.passphrase ? this.generateSignature(paymentData) : undefined;

      // Create form data
      const formData = new URLSearchParams();
      Object.entries(paymentData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (signature) {
        formData.append('signature', signature);
      }

      const paymentUrl = `${this.config.base_url}?${formData.toString()}`;

      // Update billing records with payment reference
      const paymentReference = `OVERAGE_${Date.now()}_${baseRecord.userId.slice(-8)}`;
      
      for (const record of billingRecords) {
        await overageBillingService.updateOverageBillingPayment(
          record.id,
          paymentReference,
          paymentUrl,
          'processing'
        );
      }

      logger.info('Created overage payment', {
        paymentReference,
        totalAmount,
        quotaTypes,
        recordCount: billingRecords.length
      });

      return {
        success: true,
        paymentUrl
      };
    } catch (error) {
      logger.error('Error creating overage payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment'
      };
    }
  }

  /**
   * Handle PayFast ITN (Instant Transaction Notification) for overage payments
   */
  async handleOveragePaymentNotification(itnData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentId = itnData.m_payment_id;
      const paymentStatus = itnData.payment_status;
      const amount = parseFloat(itnData.amount_gross);
      
      if (!paymentId) {
        return { success: false, error: 'Missing payment ID' };
      }

      // Get billing record
      const billingResult = await overageBillingService.getPendingOverageBilling(itnData.custom_str1);
      if (billingResult.error || !billingResult.data) {
        return { success: false, error: 'Billing record not found' };
      }

      const billingRecord = billingResult.data.find(record => record.id === paymentId);
      if (!billingRecord) {
        return { success: false, error: 'Specific billing record not found' };
      }

      // Update billing status based on payment status
      let newStatus: 'processing' | 'completed' | 'failed';
      switch (paymentStatus) {
        case 'COMPLETE':
          newStatus = 'completed';
          break;
        case 'FAILED':
        case 'CANCELLED':
          newStatus = 'failed';
          break;
        default:
          newStatus = 'processing';
      }

      // Update billing record
      const updateResult = await overageBillingService.updateOverageBillingPayment(
        billingRecord.id,
        itnData.pf_payment_id || paymentId,
        undefined,
        newStatus
      );

      if (updateResult.error) {
        return { success: false, error: updateResult.error };
      }

      logger.info('Processed overage payment notification', {
        paymentId,
        paymentStatus,
        amount,
        newStatus
      });

      return { success: true };
    } catch (error) {
      logger.error('Error handling overage payment notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process notification'
      };
    }
  }

  /**
   * Process pending overage billing for a user
   */
  async processUserOveragePayment(
    userId: string,
    userInfo: {
      firstName: string;
      lastName: string;
      email: string;
    }
  ): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      // Get pending billing records
      const billingResult = await overageBillingService.getPendingOverageBilling(userId);
      if (billingResult.error || !billingResult.data) {
        return { success: false, error: billingResult.error || 'No pending billing records found' };
      }

      if (billingResult.data.length === 0) {
        return { success: false, error: 'No pending overages to pay' };
      }

      // Create payment for all pending records
      return await this.createOveragePayment(billingResult.data, userInfo);
    } catch (error) {
      logger.error('Error processing user overage payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process overage payment'
      };
    }
  }

  /**
   * Calculate and generate billing for overages, then create payment
   */
  async generateAndPayOverages(
    userId: string,
    userInfo: {
      firstName: string;
      lastName: string;
      email: string;
    },
    periodStart?: string
  ): Promise<{ success: boolean; paymentUrl?: string; totalAmount?: number; error?: string }> {
    try {
      // Generate billing records for overages
      const billingResult = await overageBillingService.generateOverageBilling(userId, periodStart);
      if (billingResult.error || !billingResult.data) {
        return { success: false, error: billingResult.error || 'Failed to generate billing' };
      }

      if (billingResult.data.totalAmount <= 0) {
        return { success: false, error: 'No overages found for billing' };
      }

      // Get the newly created billing records
      const pendingResult = await overageBillingService.getPendingOverageBilling(userId);
      if (pendingResult.error || !pendingResult.data) {
        return { success: false, error: 'Failed to retrieve generated billing records' };
      }

      // Create payment for the billing records
      const paymentResult = await this.createOveragePayment(pendingResult.data, userInfo);
      
      return {
        success: paymentResult.success,
        paymentUrl: paymentResult.paymentUrl,
        totalAmount: billingResult.data.totalAmount,
        error: paymentResult.error
      };
    } catch (error) {
      logger.error('Error generating and paying overages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate and pay overages'
      };
    }
  }
}

export const payFastOveragePaymentService = new PayFastOveragePaymentService();

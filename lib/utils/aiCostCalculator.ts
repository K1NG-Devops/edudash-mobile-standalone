/**
 * AI Model Cost Calculator
 * Provides cost analysis for different Claude models in EduDash Pro
 */

export interface ModelPricing {
  name: string;
  identifier: string;
  inputCostPer1M: number;  // USD per 1M input tokens
  outputCostPer1M: number; // USD per 1M output tokens
  speed: 'Fast' | 'Medium' | 'Slow';
  quality: 1 | 2 | 3 | 4 | 5;
  description: string;
  recommendedFor: string[];
}

export const CLAUDE_MODELS: ModelPricing[] = [
  {
    name: 'Claude 3 Haiku',
    identifier: 'claude-3-haiku-20240307',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    speed: 'Fast',
    quality: 3,
    description: 'Fast, cost-effective model ideal for high-volume educational content',
    recommendedFor: ['Free tier', 'Trial schools', 'Basic lesson generation', 'Homework grading']
  },
  {
    name: 'Claude 3.5 Sonnet',
    identifier: 'claude-3-5-sonnet-20241022',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    speed: 'Medium',
    quality: 5,
    description: 'Balanced performance with excellent reasoning and creativity',
    recommendedFor: ['Paid subscriptions', 'Advanced lesson planning', 'Premium features', 'STEM activities']
  },
  {
    name: 'Claude 3 Opus',
    identifier: 'claude-3-opus-20240229',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    speed: 'Slow',
    quality: 5,
    description: 'Highest quality with superior reasoning and comprehensive understanding',
    recommendedFor: ['Enterprise tier', 'Complex curriculum design', 'Research-grade content']
  }
];

export interface UsageEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Typical usage estimates for EduDash Pro features
export const USAGE_ESTIMATES: Record<string, UsageEstimate> = {
  lesson_generation: {
    inputTokens: 500,   // Prompt + context
    outputTokens: 1500, // Complete lesson plan
    totalTokens: 2000
  },
  homework_grading: {
    inputTokens: 300,   // Assignment + submission
    outputTokens: 800,  // Feedback + analysis
    totalTokens: 1100
  },
  stem_activity: {
    inputTokens: 400,   // Activity requirements
    outputTokens: 1200, // Activity description
    totalTokens: 1600
  },
  progress_analysis: {
    inputTokens: 600,   // Student data + notes
    outputTokens: 1000, // Analysis report
    totalTokens: 1600
  }
};

export class AICostCalculator {
  /**
   * Calculate cost for a specific feature using a specific model
   */
  static calculateFeatureCost(
    feature: keyof typeof USAGE_ESTIMATES,
    modelIdentifier: string
  ): number {
    const model = CLAUDE_MODELS.find(m => m.identifier === modelIdentifier);
    if (!model) return 0;

    const estimate = USAGE_ESTIMATES[feature];
    if (!estimate) return 0;

    const inputCost = (estimate.inputTokens / 1_000_000) * model.inputCostPer1M;
    const outputCost = (estimate.outputTokens / 1_000_000) * model.outputCostPer1M;

    return inputCost + outputCost;
  }

  /**
   * Calculate monthly cost projection for a school
   */
  static calculateMonthlyCost(params: {
    lessonsPerMonth: number;
    homeworkGradingPerMonth: number;
    stemActivitiesPerMonth: number;
    progressAnalysisPerMonth: number;
    modelIdentifier: string;
  }): {
    breakdown: Record<string, { cost: number; count: number }>;
    totalCost: number;
    averageCostPerRequest: number;
  } {
    const lessonCost = this.calculateFeatureCost('lesson_generation', params.modelIdentifier);
    const homeworkCost = this.calculateFeatureCost('homework_grading', params.modelIdentifier);
    const stemCost = this.calculateFeatureCost('stem_activity', params.modelIdentifier);
    const analysisCost = this.calculateFeatureCost('progress_analysis', params.modelIdentifier);

    const breakdown = {
      lessons: { cost: lessonCost * params.lessonsPerMonth, count: params.lessonsPerMonth },
      homework: { cost: homeworkCost * params.homeworkGradingPerMonth, count: params.homeworkGradingPerMonth },
      stem: { cost: stemCost * params.stemActivitiesPerMonth, count: params.stemActivitiesPerMonth },
      analysis: { cost: analysisCost * params.progressAnalysisPerMonth, count: params.progressAnalysisPerMonth }
    };

    const totalCost = Object.values(breakdown).reduce((sum, item) => sum + item.cost, 0);
    const totalRequests = Object.values(breakdown).reduce((sum, item) => sum + item.count, 0);
    const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

    return { breakdown, totalCost, averageCostPerRequest };
  }

  /**
   * Compare costs across all models for a given usage pattern
   */
  static compareModelsForUsage(params: {
    lessonsPerMonth: number;
    homeworkGradingPerMonth: number;
    stemActivitiesPerMonth: number;
    progressAnalysisPerMonth: number;
  }): Array<{
    model: ModelPricing;
    monthlyCost: number;
    costPerRequest: number;
    qualityScore: number;
    speedScore: number;
    recommendation: 'Budget' | 'Balanced' | 'Premium';
  }> {
    return CLAUDE_MODELS.map(model => {
      const costCalc = this.calculateMonthlyCost({
        ...params,
        modelIdentifier: model.identifier
      });

      const speedScore = model.speed === 'Fast' ? 5 : model.speed === 'Medium' ? 3 : 1;
      
      let recommendation: 'Budget' | 'Balanced' | 'Premium';
      if (model.name.includes('Haiku')) recommendation = 'Budget';
      else if (model.name.includes('Sonnet')) recommendation = 'Balanced';
      else recommendation = 'Premium';

      return {
        model,
        monthlyCost: costCalc.totalCost,
        costPerRequest: costCalc.averageCostPerRequest,
        qualityScore: model.quality,
        speedScore,
        recommendation
      };
    });
  }

  /**
   * Get subscription tier recommendations
   */
  static getSubscriptionTierRecommendations(): Record<string, {
    recommendedModel: string;
    rationale: string;
    features: string[];
    costProfile: string;
  }> {
    return {
      free: {
        recommendedModel: 'claude-3-haiku-20240307',
        rationale: 'Cost-effective model suitable for basic lesson generation and trial users',
        features: [
          'Basic lesson generation',
          'Simple homework grading',
          'Standard templates'
        ],
        costProfile: 'Minimal cost (~$0.002 per lesson)'
      },
      starter: {
        recommendedModel: 'claude-3-5-sonnet-20241022',
        rationale: 'Significant quality improvement justifies 12x cost increase for paying customers',
        features: [
          'High-quality lesson generation',
          'Advanced homework grading',
          'Creative STEM activities',
          'Better curriculum alignment'
        ],
        costProfile: 'Moderate cost (~$0.024 per lesson)'
      },
      premium: {
        recommendedModel: 'claude-3-5-sonnet-20241022',
        rationale: 'Professional-grade content with excellent educational understanding',
        features: [
          'Premium lesson generation',
          'Detailed progress analysis',
          'Advanced STEM activities',
          'Comprehensive parent guides'
        ],
        costProfile: 'Moderate cost (~$0.024 per lesson)'
      },
      enterprise: {
        recommendedModel: 'claude-3-5-sonnet-20241022',
        rationale: 'Enterprise-grade content with option to upgrade to Opus for special features',
        features: [
          'Unlimited lesson generation',
          'Advanced analytics',
          'Custom curriculum development',
          'Research-grade content (Opus available)'
        ],
        costProfile: 'Scalable cost (~$0.024-$0.12 per lesson)'
      }
    };
  }

  /**
   * Calculate ROI for model upgrade
   */
  static calculateUpgradeROI(params: {
    currentModel: string;
    upgradeModel: string;
    monthlyUsage: number;
    averageSubscriptionPrice: number;
    expectedQualityImprovement: number; // % improvement in user satisfaction
  }): {
    monthlyCostIncrease: number;
    annualCostIncrease: number;
    breakEvenNewSubscriptions: number;
    roiAnalysis: string;
  } {
    const currentCost = this.calculateFeatureCost('lesson_generation', params.currentModel) * params.monthlyUsage;
    const upgradeCost = this.calculateFeatureCost('lesson_generation', params.upgradeModel) * params.monthlyUsage;
    
    const monthlyCostIncrease = upgradeCost - currentCost;
    const annualCostIncrease = monthlyCostIncrease * 12;
    
    // Calculate how many new subscriptions needed to break even
    const breakEvenNewSubscriptions = Math.ceil(annualCostIncrease / (params.averageSubscriptionPrice * 12));
    
    const roiAnalysis = params.expectedQualityImprovement > 20 && breakEvenNewSubscriptions < 5 ?
      'Strong ROI - Quality improvement likely to attract new customers' :
      params.expectedQualityImprovement > 10 && breakEvenNewSubscriptions < 10 ?
      'Moderate ROI - Consider for premium tiers first' :
      'Low ROI - Focus on other improvements first';

    return {
      monthlyCostIncrease,
      annualCostIncrease,
      breakEvenNewSubscriptions,
      roiAnalysis
    };
  }

  /**
   * Format cost for display
   */
  static formatCost(cost: number): string {
    if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}k`;
    if (cost < 0.01) return `${(cost * 100).toFixed(1)}¢`;
    if (cost < 1) return `${(cost * 100).toFixed(0)}¢`;
    return `$${cost.toFixed(2)}`;
  }

  /**
   * Get real-time cost estimate based on actual usage logs
   */
  static async getRealUsageCosts(userId: string, days: number = 30): Promise<{
    estimatedMonthlyCost: number;
    breakdown: Record<string, number>;
    currentModel: string;
  } | null> {
    try {
      // This would typically fetch from ai_usage_logs table
      // For now, return estimated costs based on typical usage
      return {
        estimatedMonthlyCost: 0.50, // Placeholder
        breakdown: {
          lesson_generation: 0.30,
          homework_grading: 0.15,
          stem_activity: 0.05
        },
        currentModel: 'claude-3-haiku-20240307'
      };
    } catch (error) {
      console.error('Error calculating real usage costs:', error);
      return null;
    }
  }
}

// Export cost comparison data for dashboard display
export const MODEL_COMPARISON_DATA = {
  models: CLAUDE_MODELS,
  usageEstimates: USAGE_ESTIMATES,
  tierRecommendations: AICostCalculator.getSubscriptionTierRecommendations()
};

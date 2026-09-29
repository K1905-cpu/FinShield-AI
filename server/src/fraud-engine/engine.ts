import { 
  Transaction, 
  FraudAnalysis, 
  RiskContributor, 
  RiskLevel, 
  FraudRuleConfig, 
  UserBehaviorProfile 
} from '../types/shared.js';

export interface FraudEngineResult {
  riskScore: number;
  riskLevel: RiskLevel;
  fraudProbability: number;
  explanation: string;
  contributors: RiskContributor[];
  alertTriggered: boolean;
  alertType?: string;
  alertSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

export class FraudDetectionEngine {
  /**
   * Evaluates a transaction against user behavioral profile, recent transactions, and active rules.
   */
  public static evaluate(
    transaction: Omit<Transaction, 'id' | 'status' | 'riskScore' | 'riskLevel' | 'fraudAnalysis'>,
    userProfile: UserBehaviorProfile | null,
    recentUserTransactions: Transaction[],
    rules: FraudRuleConfig
  ): FraudEngineResult {
    const contributors: RiskContributor[] = [];
    const explanationParts: string[] = [];

    const weights = rules.weights || {
      amountAnomaly: 20,
      frequencyAnomaly: 20,
      locationAnomaly: 15,
      timeAnomaly: 10,
      merchantRisk: 15,
      deviceAnomaly: 10,
      behavioralAnomaly: 10,
    };

    const txTime = new Date(transaction.timestamp);
    const txHour = txTime.getHours();

    // -------------------------------------------------------------
    // 1. Amount Anomaly (Max: 20 points)
    // -------------------------------------------------------------
    let amountScore = 0;
    let amountReason = '';
    const avg = userProfile?.avgAmount || 2500;
    const ratio = transaction.amount / (avg > 0 ? avg : 2500);

    if (transaction.amount >= rules.highValueThreshold) {
      amountScore = weights.amountAnomaly;
      amountReason = `Transaction amount (₹${transaction.amount.toLocaleString()}) exceeds the critical threshold (₹${rules.highValueThreshold.toLocaleString()}) and is ${ratio.toFixed(1)}x user's historical average (₹${avg.toFixed(0)})`;
      explanationParts.push(`amount is exceptionally high (${ratio.toFixed(1)}x historical average)`);
    } else if (ratio >= 6.0) {
      amountScore = weights.amountAnomaly;
      amountReason = `Amount (₹${transaction.amount.toLocaleString()}) is ${ratio.toFixed(1)}x higher than user's normal average of ₹${avg.toFixed(0)}`;
      explanationParts.push(`amount is ${ratio.toFixed(1)}x higher than typical spending`);
    } else if (ratio >= 3.5) {
      amountScore = Math.round(weights.amountAnomaly * 0.75);
      amountReason = `Amount (₹${transaction.amount.toLocaleString()}) is moderately elevated (${ratio.toFixed(1)}x user average)`;
      explanationParts.push(`amount is ${ratio.toFixed(1)}x above user baseline`);
    } else if (ratio >= 2.0 && transaction.amount > 10000) {
      amountScore = Math.round(weights.amountAnomaly * 0.4);
      amountReason = `Amount is 2x higher than typical transaction volume`;
      explanationParts.push(`transaction size is double standard spending`);
    }

    if (amountScore > 0) {
      contributors.push({
        factor: 'amount_anomaly',
        label: 'Amount Anomaly',
        score: amountScore,
        maxScore: weights.amountAnomaly,
        percentage: Math.min(100, Math.round((amountScore / weights.amountAnomaly) * 100)),
        reason: amountReason,
      });
    }

    // -------------------------------------------------------------
    // 2. Frequency / Velocity Anomaly (Max: 20 points)
    // -------------------------------------------------------------
    let frequencyScore = 0;
    let frequencyReason = '';
    const windowMs = rules.velocityWindowMinutes * 60 * 1000;
    const recentInWindow = recentUserTransactions.filter(t => {
      const diff = Math.abs(txTime.getTime() - new Date(t.timestamp).getTime());
      return diff <= windowMs;
    });

    const txVelocityCount = recentInWindow.length + 1; // including current

    if (txVelocityCount >= rules.velocityCountThreshold + 2) {
      frequencyScore = weights.frequencyAnomaly;
      frequencyReason = `Extreme velocity: ${txVelocityCount} rapid transactions detected within ${rules.velocityWindowMinutes} minutes`;
      explanationParts.push(`rapid burst of ${txVelocityCount} transactions within ${rules.velocityWindowMinutes} minutes`);
    } else if (txVelocityCount >= rules.velocityCountThreshold) {
      frequencyScore = Math.round(weights.frequencyAnomaly * 0.75);
      frequencyReason = `High transaction frequency: ${txVelocityCount} transactions within ${rules.velocityWindowMinutes} minutes`;
      explanationParts.push(`unusually fast succession of ${txVelocityCount} transactions`);
    } else if (txVelocityCount > 1 && recentInWindow.some(t => Math.abs(txTime.getTime() - new Date(t.timestamp).getTime()) < 120000)) {
      frequencyScore = Math.round(weights.frequencyAnomaly * 0.45);
      frequencyReason = `Repeated transaction attempt within 2 minutes of prior purchase`;
      explanationParts.push(`back-to-back transaction within 2 minutes`);
    }

    if (frequencyScore > 0) {
      contributors.push({
        factor: 'frequency_anomaly',
        label: 'Velocity & Frequency Anomaly',
        score: frequencyScore,
        maxScore: weights.frequencyAnomaly,
        percentage: Math.min(100, Math.round((frequencyScore / weights.frequencyAnomaly) * 100)),
        reason: frequencyReason,
      });
    }

    // -------------------------------------------------------------
    // 3. Location Anomaly (Max: 15 points)
    // -------------------------------------------------------------
    let locationScore = 0;
    let locationReason = '';
    const frequentLocations = userProfile?.frequentLocations || [];
    const isKnownLocation = frequentLocations.some(
      loc => loc.toLowerCase() === transaction.location.toLowerCase()
    );

    if (!isKnownLocation && frequentLocations.length > 0) {
      // Check if another transaction occurred recently in a geographically distant place
      const lastTx = recentUserTransactions[0];
      if (lastTx && lastTx.location.toLowerCase() !== transaction.location.toLowerCase()) {
        const timeDiffHours = Math.abs(txTime.getTime() - new Date(lastTx.timestamp).getTime()) / (1000 * 60 * 60);
        if (timeDiffHours < 2) {
          locationScore = weights.locationAnomaly;
          locationReason = `Impossible travel velocity: Location shifted from ${lastTx.location} to ${transaction.location} in only ${timeDiffHours.toFixed(1)} hours`;
          explanationParts.push(`impossible physical transit from ${lastTx.location} to ${transaction.location}`);
        } else {
          locationScore = Math.round(weights.locationAnomaly * 0.8);
          locationReason = `Unusual location (${transaction.location}); not in user's standard activity profile [${frequentLocations.join(', ')}]`;
          explanationParts.push(`originates from an unfamiliar location (${transaction.location})`);
        }
      } else {
        locationScore = Math.round(weights.locationAnomaly * 0.7);
        locationReason = `Transaction originates from ${transaction.location}, outside user's primary operating cities`;
        explanationParts.push(`initiated from unrecognized city ${transaction.location}`);
      }
    }

    if (locationScore > 0) {
      contributors.push({
        factor: 'location_anomaly',
        label: 'Location Anomaly',
        score: locationScore,
        maxScore: weights.locationAnomaly,
        percentage: Math.min(100, Math.round((locationScore / weights.locationAnomaly) * 100)),
        reason: locationReason,
      });
    }

    // -------------------------------------------------------------
    // 4. Time Anomaly (Max: 10 points)
    // -------------------------------------------------------------
    let timeScore = 0;
    let timeReason = '';
    const isUnusualHour = (txHour >= rules.unusualHoursStart && txHour <= rules.unusualHoursEnd);

    if (isUnusualHour) {
      timeScore = weights.timeAnomaly;
      timeReason = `Transaction executed during high-risk sleeping hours (${txHour.toString().padStart(2, '0')}:${txTime.getMinutes().toString().padStart(2, '0')} hrs)`;
      explanationParts.push(`initiated during unusual off-peak hours (${txHour.toString().padStart(2, '0')}:${txTime.getMinutes().toString().padStart(2, '0')})`);
    }

    if (timeScore > 0) {
      contributors.push({
        factor: 'time_anomaly',
        label: 'Time Anomaly',
        score: timeScore,
        maxScore: weights.timeAnomaly,
        percentage: Math.min(100, Math.round((timeScore / weights.timeAnomaly) * 100)),
        reason: timeReason,
      });
    }

    // -------------------------------------------------------------
    // 5. Merchant Risk (Max: 15 points)
    // -------------------------------------------------------------
    let merchantScore = 0;
    let merchantReason = '';
    const highRiskCategories = rules.highRiskMerchantCategories.map(c => c.toLowerCase());
    const isHighRiskCategory = highRiskCategories.some(c => 
      transaction.category.toLowerCase().includes(c) || c.includes(transaction.category.toLowerCase())
    );

    if (isHighRiskCategory) {
      merchantScore = weights.merchantRisk;
      merchantReason = `Merchant category "${transaction.category}" (${transaction.merchant}) is classified as high-risk`;
      explanationParts.push(`merchant operates in high-risk domain (${transaction.category})`);
    } else if (transaction.paymentMethod === 'crypto_exchange' || transaction.paymentMethod === 'wire_transfer') {
      merchantScore = Math.round(weights.merchantRisk * 0.6);
      merchantReason = `Payment method ${transaction.paymentMethod} involves higher non-refundable risk`;
      explanationParts.push(`high-risk irreversible payment rail (${transaction.paymentMethod})`);
    }

    if (merchantScore > 0) {
      contributors.push({
        factor: 'merchant_risk',
        label: 'Merchant & Rail Risk',
        score: merchantScore,
        maxScore: weights.merchantRisk,
        percentage: Math.min(100, Math.round((merchantScore / weights.merchantRisk) * 100)),
        reason: merchantReason,
      });
    }

    // -------------------------------------------------------------
    // 6. Device Anomaly (Max: 10 points)
    // -------------------------------------------------------------
    let deviceScore = 0;
    let deviceReason = '';
    const knownDevices = userProfile?.knownDevices || [];
    const isKnownDevice = knownDevices.some(d => d.toLowerCase() === transaction.deviceId.toLowerCase());

    if (!isKnownDevice && knownDevices.length > 0) {
      deviceScore = weights.deviceAnomaly;
      deviceReason = `Unrecognized device footprint (${transaction.deviceId}). User typically uses: ${knownDevices.slice(0, 2).join(', ')}`;
      explanationParts.push(`unknown hardware signature (${transaction.deviceId})`);
    }

    if (deviceScore > 0) {
      contributors.push({
        factor: 'device_anomaly',
        label: 'Device Signature Anomaly',
        score: deviceScore,
        maxScore: weights.deviceAnomaly,
        percentage: Math.min(100, Math.round((deviceScore / weights.deviceAnomaly) * 100)),
        reason: deviceReason,
      });
    }

    // -------------------------------------------------------------
    // 7. Behavioral Anomaly (Max: 10 points)
    // -------------------------------------------------------------
    let behavioralScore = 0;
    let behavioralReason = '';
    const commonCategories = userProfile?.commonCategories || [];
    const isNewCategory = commonCategories.length > 0 && !commonCategories.some(
      c => c.toLowerCase() === transaction.category.toLowerCase()
    );

    if (isNewCategory && ratio > 1.8) {
      behavioralScore = weights.behavioralAnomaly;
      behavioralReason = `Spending in category "${transaction.category}" has no prior history for this user and exceeds regular ticket size`;
      explanationParts.push(`diverges from historic spending categories with elevated size`);
    } else if (ratio > 2.5) {
      behavioralScore = Math.round(weights.behavioralAnomaly * 0.6);
      behavioralReason = `Transaction behavior deviates from user baseline spend profile`;
      explanationParts.push(`deviates notably from user historical baseline`);
    }

    if (behavioralScore > 0) {
      contributors.push({
        factor: 'behavioral_anomaly',
        label: 'Behavioral Profile Deviation',
        score: behavioralScore,
        maxScore: weights.behavioralAnomaly,
        percentage: Math.min(100, Math.round((behavioralScore / weights.behavioralAnomaly) * 100)),
        reason: behavioralReason,
      });
    }

    // -------------------------------------------------------------
    // Total Weighted Risk Score Calculation (Capped at 100)
    // -------------------------------------------------------------
    const rawScore = amountScore + frequencyScore + locationScore + timeScore + merchantScore + deviceScore + behavioralScore;
    const riskScore = Math.min(100, Math.max(0, rawScore));

    // Determine Risk Level
    let riskLevel: RiskLevel = 'LOW';
    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 60) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 30) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // Fraud Probability calculation (realistic calibrated scale)
    const fraudProbability = Math.min(99.5, Math.max(1.5, Math.round(riskScore * 0.95 + (riskScore > 75 ? 4.5 : 0))));

    // Human-readable Dynamic Explanation
    let explanation = '';
    if (explanationParts.length === 0) {
      explanation = 'Transaction demonstrates normal financial characteristics with known device, customary location, standard daytime hours, and within expected amount boundaries.';
    } else if (explanationParts.length === 1) {
      explanation = `This transaction was flagged with ${riskLevel} risk primarily because the ${explanationParts[0]}.`;
    } else {
      const lastPart = explanationParts.pop();
      explanation = `This transaction was flagged with ${riskLevel} risk because the ${explanationParts.join(', ')}, and ${lastPart}.`;
    }

    // Alert determination
    const alertTriggered = riskScore >= 60;
    let alertType: string | undefined;
    let alertSeverity: 'low' | 'medium' | 'high' | 'critical' | undefined;

    if (alertTriggered) {
      alertSeverity = riskScore >= 80 ? 'critical' : 'high';
      if (amountScore >= 15) {
        alertType = 'High-Value Outlier Anomaly';
      } else if (frequencyScore >= 15) {
        alertType = 'High Velocity Spurt Detected';
      } else if (locationScore >= 12) {
        alertType = 'Unusual Geolocation Shift';
      } else if (merchantScore >= 12) {
        alertType = 'High-Risk Merchant Exposure';
      } else {
        alertType = 'Compound Risk Anomaly';
      }
    }

    return {
      riskScore,
      riskLevel,
      fraudProbability,
      explanation,
      contributors,
      alertTriggered,
      alertType,
      alertSeverity,
    };
  }
}

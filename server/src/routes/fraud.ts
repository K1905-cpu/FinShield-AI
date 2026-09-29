import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { FraudDetectionEngine } from '../fraud-engine/engine.js';
import { db } from '../db/db.js';

const router = Router();

// -------------------------------------------------------------
// POST /api/fraud/analyze (Explainable AI Sandbox Analyzer)
// -------------------------------------------------------------
router.post('/analyze', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const {
      amount,
      currency = 'INR',
      merchant = 'Demo Merchant',
      category = 'Shopping',
      location = 'Mumbai',
      paymentMethod = 'credit_card',
      deviceId = 'DEV-SANDBOX-TEST',
      timestamp = new Date().toISOString(),
      userId
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Please provide a valid positive amount.' });
      return;
    }

    const targetUserId = req.user!.role === 'user' ? req.user!.id : (userId || req.user!.id);
    const userProfile = db.getUserBehavior(targetUserId);
    const recentTxs = db.getTransactions({ userId: targetUserId, limit: 10 }).transactions;
    const rules = db.getRules();

    const rawTx = {
      userId: targetUserId,
      amount: parsedAmount,
      currency,
      merchant,
      category,
      location,
      paymentMethod,
      deviceId,
      timestamp
    };

    const evaluation = FraudDetectionEngine.evaluate(rawTx, userProfile, recentTxs, rules);

    res.json({
      success: true,
      analysis: {
        riskScore: evaluation.riskScore,
        riskLevel: evaluation.riskLevel,
        fraudProbability: evaluation.fraudProbability,
        explanation: evaluation.explanation,
        contributors: evaluation.contributors,
        alertTriggered: evaluation.alertTriggered,
        alertType: evaluation.alertType,
        alertSeverity: evaluation.alertSeverity,
        weightsUsed: rules.weights,
        userBaseline: userProfile ? {
          avgAmount: userProfile.avgAmount,
          knownDevices: userProfile.knownDevices,
          frequentLocations: userProfile.frequentLocations
        } : null
      }
    });
  } catch (err: any) {
    console.error('Error during fraud analysis:', err);
    res.status(500).json({ error: 'Failed to analyze transaction' });
  }
});

// -------------------------------------------------------------
// GET /api/fraud/matrix (7-Factor Scoring Model Details)
// -------------------------------------------------------------
router.get('/matrix', authenticate, (_req: AuthRequest, res: Response) => {
  const rules = db.getRules();
  res.json({
    factors: [
      {
        id: 'amount_anomaly',
        name: 'Amount Anomaly',
        maxPoints: rules.weights.amountAnomaly,
        description: "Compares current transaction amount against user's historical spend average and the global high-value threshold (₹50,000+).",
        thresholdRule: `>6x avg or >= ₹${rules.highValueThreshold.toLocaleString()}`
      },
      {
        id: 'frequency_anomaly',
        name: 'Velocity & Frequency Anomaly',
        maxPoints: rules.weights.frequencyAnomaly,
        description: `Tracks rapid bursts of transactions within a rolling ${rules.velocityWindowMinutes}-minute window.`,
        thresholdRule: `>= ${rules.velocityCountThreshold} txns within ${rules.velocityWindowMinutes} min`
      },
      {
        id: 'location_anomaly',
        name: 'Geolocation Deviation',
        maxPoints: rules.weights.locationAnomaly,
        description: "Checks geographic location against user's top frequent cities and detects impossible travel velocity (<2 hours between distant cities).",
        thresholdRule: 'Unregistered city or impossible physical transit speed'
      },
      {
        id: 'time_anomaly',
        name: 'Unusual Hour Anomaly',
        maxPoints: rules.weights.timeAnomaly,
        description: `Flags transactions initiated during off-peak sleeping hours (${rules.unusualHoursStart}:00 AM to ${rules.unusualHoursEnd}:00 AM).`,
        thresholdRule: `${rules.unusualHoursStart}:00 - ${rules.unusualHoursEnd}:00 hrs window`
      },
      {
        id: 'merchant_risk',
        name: 'High-Risk Merchant Exposure',
        maxPoints: rules.weights.merchantRisk,
        description: 'Evaluates exposure to volatile, irreversible, or high-chargeback merchant categories.',
        thresholdRule: rules.highRiskMerchantCategories.join(', ')
      },
      {
        id: 'device_anomaly',
        name: 'Device Signature Deviation',
        maxPoints: rules.weights.deviceAnomaly,
        description: "Identifies transactions from hardware signatures never before associated with the user's account.",
        thresholdRule: 'Unrecognized Device ID'
      },
      {
        id: 'behavioral_anomaly',
        name: 'Behavioral Baseline Deviation',
        maxPoints: rules.weights.behavioralAnomaly,
        description: 'Detects radical departures in category spending combined with elevated ticket size.',
        thresholdRule: 'New category + spend >1.8x baseline'
      }
    ],
    rules
  });
});

export default router;

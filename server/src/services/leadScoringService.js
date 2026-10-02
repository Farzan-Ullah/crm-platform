import { Setting } from '../models/Setting.js';

export const calculateLeadScore = async (leadData, tenantId) => {
  let score = 0;
  const breakdown = [];

  // Fetch tenant scoring configuration or use enterprise defaults
  let rules = [
    { criterion: 'Email provided', points: 10 },
    { criterion: 'Phone provided', points: 10 },
    { criterion: 'Company provided', points: 10 },
    { criterion: 'Website inquiry', points: 20 },
    { criterion: 'High-value designation', points: 15 },
    { criterion: 'Referral source', points: 25 },
  ];

  if (tenantId) {
    const settings = await Setting.findOne({ tenantId }).lean();
    if (settings?.crm?.scoringRules && settings.crm.scoringRules.length > 0) {
      rules = settings.crm.scoringRules;
    }
  }

  // 1. Email check
  if (leadData.email && leadData.email.includes('@')) {
    const rule = rules.find((r) => r.criterion === 'Email provided') || { points: 10 };
    score += rule.points;
    breakdown.push({ criterion: 'Email provided', points: rule.points });
  }

  // 2. Phone check
  if (leadData.phone && leadData.phone.trim().length >= 7) {
    const rule = rules.find((r) => r.criterion === 'Phone provided') || { points: 10 };
    score += rule.points;
    breakdown.push({ criterion: 'Phone provided', points: rule.points });
  }

  // 3. Company check
  if (leadData.company && leadData.company.trim().length > 1) {
    const rule = rules.find((r) => r.criterion === 'Company provided') || { points: 10 };
    score += rule.points;
    breakdown.push({ criterion: 'Company provided', points: rule.points });
  }

  // 4. Source checks
  if (leadData.source === 'Website') {
    const rule = rules.find((r) => r.criterion === 'Website inquiry') || { points: 20 };
    score += rule.points;
    breakdown.push({ criterion: 'Website inquiry', points: rule.points });
  } else if (leadData.source === 'Referral') {
    const rule = rules.find((r) => r.criterion === 'Referral source') || { points: 25 };
    score += rule.points;
    breakdown.push({ criterion: 'Referral source', points: rule.points });
  }

  // 5. High value / decision maker check (e.g. Director, VP, CEO, Founder, Head)
  const jobTitle = (leadData.jobTitle || '').toLowerCase();
  const executiveKeywords = ['director', 'vp', 'vice president', 'ceo', 'cto', 'cfo', 'founder', 'owner', 'head'];
  if (executiveKeywords.some((keyword) => jobTitle.includes(keyword))) {
    const rule = rules.find((r) => r.criterion === 'High-value designation') || { points: 15 };
    score += rule.points;
    breakdown.push({ criterion: 'Executive decision maker', points: rule.points });
  }

  // 6. Custom/tag checks
  if (Array.isArray(leadData.tags) && leadData.tags.includes('high-priority')) {
    score += 10;
    breakdown.push({ criterion: 'High Priority Tag', points: 10 });
  }

  // Clamp score to [0, 100]
  const finalScore = Math.min(100, Math.max(0, score));

  let category = 'Cold';
  if (finalScore >= 80) category = 'Very Hot';
  else if (finalScore >= 60) category = 'Hot';
  else if (finalScore >= 30) category = 'Warm';

  return {
    score: finalScore,
    category,
    breakdown,
  };
};

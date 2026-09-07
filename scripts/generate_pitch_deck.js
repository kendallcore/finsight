const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10" x 5.625"

// Unified Clean Light Palette
const C = {
  bg: 'FFFFFF',           // Pure White
  card: 'F8FAFC',         // Slate 50
  card2: 'F1F5F9',        // Slate 100
  border: 'CBD5E1',       // Slate 300
  textPrimary: '0F172A',  // Slate 900
  textBody: '334155',     // Slate 700
  textMuted: '64748B',    // Slate 500
  brandBlue: '0284C7',    // Sky 600
  brandGreen: '059669',   // Emerald 600
  brandIndigo: '6366F1',  // Indigo 500
  brandAmber: 'D97706',   // Amber 600
  brandRed: 'DC2626'      // Red 600
};

// ==========================================
// SLIDE 1: Title & Executive Overview (Light)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  // Category Pill
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 0.65, w: 4.6, h: 0.35,
    rectRadius: 0.15,
    fill: { color: C.card2 },
    line: { color: C.border, width: 1 }
  });
  slide.addText('FINANCIAL INTELLIGENCE & STATUTORY ML', {
    x: 0.8, y: 0.65, w: 4.6, h: 0.35,
    fontSize: 9.5, bold: true, color: C.brandBlue,
    align: 'center', valign: 'middle', fontFace: 'Calibri',
    margin: 0
  });

  // Main Title
  slide.addText('FinSight', {
    x: 0.8, y: 1.15, w: 8.4, h: 0.8,
    fontSize: 38, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });

  // Subtitle
  slide.addText('Automated Bank Statement Diagnostics & Indian Tax Intelligence', {
    x: 0.8, y: 1.95, w: 8.4, h: 0.4,
    fontSize: 16, bold: true, color: C.textMuted,
    fontFace: 'Calibri', margin: 0
  });

  // Description Card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 2.5, w: 8.4, h: 0.85,
    rectRadius: 0.08,
    fill: { color: C.card },
    line: { color: C.border, width: 1 }
  });
  slide.addText(
    'FinSight is a production-grade machine learning system that transforms raw, unstructured bank statement histories into standardized 16-dimensional financial behavioral vectors. It predicts annual gross income (R² = 0.9977), classifies Section 115BAC statutory tax slabs with 98.35% accuracy, and discovers spending personas in sub-45ms real-time latency.',
    {
      x: 1.05, y: 2.58, w: 7.9, h: 0.7,
      fontSize: 10.5, color: C.textBody,
      fontFace: 'Calibri', margin: 0
    }
  );

  // 4 Key Metric Stat Cards
  const stats = [
    { value: '0.9977', label: 'INCOME R² SCORE', desc: 'Random Forest (1.30% MAPE)', color: C.brandBlue },
    { value: '98.35%', label: 'TAX SLAB ACCURACY', desc: '7 Slabs under Sec 115BAC', color: C.brandGreen },
    { value: '41.25 ms', label: 'MEDIAN LATENCY (p50)', desc: '1,549 QPS High Throughput', color: C.brandBlue },
    { value: '₹12.75 L', label: 'ZERO-TAX CEILING', desc: 'Standard Deduction + 87A', color: C.brandGreen }
  ];

  stats.forEach((st, idx) => {
    const cardX = 0.8 + idx * (1.95 + 0.2);
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX, y: 3.65, w: 1.95, h: 1.45,
      rectRadius: 0.08,
      fill: { color: C.card },
      line: { color: C.border, width: 1 }
    });
    slide.addText(st.value, {
      x: cardX + 0.15, y: 3.75, w: 1.65, h: 0.5,
      fontSize: 22, bold: true, color: st.color,
      fontFace: 'Calibri', margin: 0
    });
    slide.addText(st.label, {
      x: cardX + 0.15, y: 4.25, w: 1.65, h: 0.35,
      fontSize: 8.5, bold: true, color: C.textPrimary,
      fontFace: 'Calibri', margin: 0
    });
    slide.addText(st.desc, {
      x: cardX + 0.15, y: 4.62, w: 1.65, h: 0.35,
      fontSize: 8.5, color: C.textMuted,
      fontFace: 'Calibri', margin: 0
    });
  });

  slide.addNotes(
    'FinSight addresses one of the most persistent bottlenecks in retail financial services: converting noisy, high-velocity bank statements into actionable credit and tax intelligence. Built for the Indian financial ecosystem and aligned with FY 2025-26 statutory tax reforms, FinSight delivers sub-45ms inference latency, making it directly embeddable into digital lending, neobanking, and tax advisory platforms.'
  );
}

// ==========================================
// SLIDE 2: Problem & Market Opportunity (Light)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  // Category Tag
  slide.addText('PROBLEM & MARKET OPPORTUNITY', {
    x: 0.8, y: 0.55, w: 6.0, h: 0.25,
    fontSize: 9.5, bold: true, color: C.brandBlue,
    fontFace: 'Calibri', margin: 0
  });

  // Title & Subtitle
  slide.addText('The Bottleneck in Retail Financial Diagnostics', {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5,
    fontSize: 22, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });
  slide.addText('Digital lending and wealth management are constrained by unstructured transaction logs and manual verification.', {
    x: 0.8, y: 1.3, w: 8.4, h: 0.3,
    fontSize: 11, color: C.textMuted,
    fontFace: 'Calibri', margin: 0
  });

  // 3 Problem & Solution Columns
  const columns = [
    {
      title: 'Unstructured Banking Data',
      tag: 'DATA INGESTION FRICTION',
      tagColor: C.brandRed,
      pain: [
        'Raw UPI, IMPS, and debit transaction logs lack standardized behavioral semantics.',
        'Inconsistent salary narrations and merchant codes break conventional heuristics.',
        'Manual statement analysis takes 24-48 hours, causing massive customer drop-off.'
      ],
      solution: 'FinSight 16D Feature Extractor:\nAggregates cashflow scale, inflow regularity, UPI velocity index, and discretionary spend into standard vectors.'
    },
    {
      title: 'Dynamic FY 2025-26 Tax Code',
      tag: 'REGULATORY COMPLEXITY',
      tagColor: C.brandAmber,
      pain: [
        'Section 115BAC introduces 7 progressive tax slabs from 0% up to 30%.',
        'Standard deduction (₹75k) and Sec 87A rebate (₹60k) create a dynamic zero-tax ceiling at ₹12.75L.',
        'Retail consumers and advisors struggle to accurately compute true tax liabilities.'
      ],
      solution: 'Dual ML & Statutory Waterfall:\nGradient Boosting classifier predicts tax bracket (98.35% accuracy) coupled with a deterministic rebate waterfall.'
    },
    {
      title: 'Slow Credit Decisioning',
      tag: 'OPERATIONAL LATENCY',
      tagColor: C.brandRed,
      pain: [
        'Manual underwriter inspection costs financial institutions significant human overhead.',
        'Linear heuristics fail to capture non-linear income spikes and volatile gig cashflows.',
        'Existing bureaus lack real-time visibility into disposable income and monthly burn rate.'
      ],
      solution: 'Real-Time REST Inference:\nDelivers continuous gross income predictions in under 45ms with 1,549 QPS throughput for instant underwriting.'
    }
  ];

  columns.forEach((col, idx) => {
    const cardX = 0.8 + idx * (2.65 + 0.22);
    // Outer Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX, y: 1.75, w: 2.65, h: 3.4,
      rectRadius: 0.08,
      fill: { color: C.card },
      line: { color: C.border, width: 1 }
    });

    // Tag Pill
    slide.addText(col.tag, {
      x: cardX + 0.18, y: 1.9, w: 2.29, h: 0.2,
      fontSize: 8, bold: true, color: col.tagColor,
      fontFace: 'Calibri', margin: 0
    });

    // Card Title
    slide.addText(col.title, {
      x: cardX + 0.18, y: 2.12, w: 2.29, h: 0.45,
      fontSize: 13, bold: true, color: C.textPrimary,
      fontFace: 'Calibri', margin: 0
    });

    // Pain Points List formatted properly
    const bulletRuns = col.pain.map((p) => ({
      text: p,
      options: {
        bullet: true,
        fontSize: 8.5,
        color: C.textBody,
        fontFace: 'Calibri',
        paraSpaceAfter: 5
      }
    }));

    slide.addText(bulletRuns, {
      x: cardX + 0.18, y: 2.58, w: 2.29, h: 1.45,
      margin: 0
    });

    // Solution Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX + 0.14, y: 4.15, w: 2.37, h: 0.85,
      rectRadius: 0.06,
      fill: { color: C.card2 },
      line: { color: C.border, width: 1 }
    });
    slide.addText(col.solution, {
      x: cardX + 0.22, y: 4.2, w: 2.21, h: 0.75,
      fontSize: 8.5, color: C.brandBlue, bold: false,
      fontFace: 'Calibri', margin: 0
    });
  });

  slide.addNotes(
    'Every retail loan application, credit line increase, or wealth advisory session begins with bank statement ingestion. Today, banks either rely on manual human review or brittle rule-based parsers that break on novel bank statement layouts or gig-economy income patterns. FinSight eliminates this friction entirely with machine learning.'
  );
}

// ==========================================
// SLIDE 3: ML Architecture & 16D Features (Light)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  // Category Tag
  slide.addText('MACHINE LEARNING ARCHITECTURE', {
    x: 0.8, y: 0.55, w: 6.0, h: 0.25,
    fontSize: 9.5, bold: true, color: C.brandBlue,
    fontFace: 'Calibri', margin: 0
  });

  // Title & Subtitle
  slide.addText('Dual-Stream Architecture & 16D Feature Pipeline', {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5,
    fontSize: 22, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });
  slide.addText('Raw banking streams are mathematically extracted into 16 dimensions feeding four synchronized ML models.', {
    x: 0.8, y: 1.3, w: 8.4, h: 0.3,
    fontSize: 11, color: C.textMuted,
    fontFace: 'Calibri', margin: 0
  });

  // Left Box: 16D Feature Extractor
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.75, w: 4.1, h: 3.4,
    rectRadius: 0.08,
    fill: { color: C.card },
    line: { color: C.border, width: 1 }
  });

  slide.addText('16D Feature Extraction Engine', {
    x: 1.0, y: 1.9, w: 3.7, h: 0.35,
    fontSize: 13, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });

  const featureGroups = [
    {
      title: 'Cashflow Scale & Magnitude (72.3% Total Importance)',
      items: '• log_annual_credit, log_annual_debit, log_avg_ticket_size\n• Captures macro spending volume and net wealth accumulation.'
    },
    {
      title: 'Inflow Regularity & Earnings Stability',
      items: '• salary_inflow_ratio, salary_regularity_score, monthly_credit_cv\n• Measures paycheck predictability vs erratic gig earnings.'
    },
    {
      title: 'Outflow Allocation & Wealth Creation',
      items: '• investment_ratio (SIPs), fixed_obligation_ratio, discretionary_ratio\n• Distinguishes disciplined investors from high-burn spenders.'
    },
    {
      title: 'Digital Velocity & Micro-Transactions',
      items: '• upi_velocity_index, micro_spend_density, capital_gains_flux\n• High-frequency transaction monitoring and trading flux.'
    }
  ];

  let featY = 2.3;
  featureGroups.forEach(grp => {
    slide.addText(grp.title, {
      x: 1.0, y: featY, w: 3.7, h: 0.25,
      fontSize: 9.5, bold: true, color: C.brandBlue,
      fontFace: 'Calibri', margin: 0
    });
    slide.addText(grp.items, {
      x: 1.0, y: featY + 0.22, w: 3.7, h: 0.45,
      fontSize: 8.5, color: C.textBody,
      fontFace: 'Calibri', margin: 0
    });
    featY += 0.68;
  });

  // Right Box: 4 Coordinated ML Engines
  const models = [
    {
      num: '1', name: 'Supervised Income Regressor', algo: 'Random Forest Regressor',
      metric: 'R² = 0.9977 · MAPE = 1.30% · RMSE = ₹34,815',
      desc: 'Predicts continuous annual gross income with sub-1.5% percentage error.'
    },
    {
      num: '2', name: 'Supervised Tax Slab Classifier', algo: 'Gradient Boosting Classifier',
      metric: 'Accuracy = 98.35% · Macro F1 = 0.9556',
      desc: 'Maps features across 7 statutory brackets under Section 115BAC (FY 2025-26).'
    },
    {
      num: '3', name: 'Unsupervised Persona Clustering', algo: 'K-Means (k = 4 Clusters)',
      metric: 'Silhouette Score = 0.3285 · 4 Financial Personas',
      desc: 'Segments users into Wealth Builders, Corporate Pros, Lifestyle Spenders & Savers.'
    },
    {
      num: '4', name: 'Latent Space Projector', algo: '3D PCA Decomposition',
      metric: 'Explained Variance = 79.22% (3 Components)',
      desc: 'Decomposes 16D space into interactive 2D/3D WebGL scatter coordinates.'
    }
  ];

  models.forEach((m, idx) => {
    const cardY = 1.75 + idx * (0.75 + 0.12);
    slide.addShape(pres.ShapeType.roundRect, {
      x: 5.1, y: cardY, w: 4.1, h: 0.75,
      rectRadius: 0.08,
      fill: { color: C.card },
      line: { color: C.border, width: 1 }
    });

    slide.addText(`${m.num}. ${m.name}`, {
      x: 5.25, y: cardY + 0.08, w: 3.8, h: 0.22,
      fontSize: 10.5, bold: true, color: C.textPrimary,
      fontFace: 'Calibri', margin: 0
    });

    slide.addText(m.metric, {
      x: 5.25, y: cardY + 0.29, w: 3.8, h: 0.2,
      fontSize: 9, bold: true, color: C.brandGreen,
      fontFace: 'Calibri', margin: 0
    });

    slide.addText(m.desc, {
      x: 5.25, y: cardY + 0.48, w: 3.8, h: 0.22,
      fontSize: 8.5, color: C.textMuted,
      fontFace: 'Calibri', margin: 0
    });
  });

  slide.addNotes(
    'The 16-dimensional feature vector is the core intellectual property of FinSight. Instead of treating bank statements as generic time series, our domain-informed extractor captures structural characteristics like salary regularity and UPI velocity. This allows Random Forest and Gradient Boosting to outperform linear baselines dramatically.'
  );
}

// ==========================================
// SLIDE 4: Empirical Benchmark & Real Data (Light)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  // Category Tag
  slide.addText('EMPIRICAL EVALUATION & VALIDATION', {
    x: 0.8, y: 0.55, w: 6.0, h: 0.25,
    fontSize: 9.5, bold: true, color: C.brandBlue,
    fontFace: 'Calibri', margin: 0
  });

  // Title & Subtitle
  slide.addText('Production Benchmarks & Real Holdout Validation', {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5,
    fontSize: 22, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });
  slide.addText('Evaluated across candidate algorithms and validated on 51,945 real Indian bank transactions (200 accounts).', {
    x: 0.8, y: 1.3, w: 8.4, h: 0.3,
    fontSize: 11, color: C.textMuted,
    fontFace: 'Calibri', margin: 0
  });

  // Left Column: Native Bar Chart for Algorithm Comparison
  slide.addChart(
    pres.ChartType.bar,
    [
      {
        name: 'R² Score',
        labels: ['Ridge Baseline', 'Gradient Boosting', 'Random Forest'],
        values: [0.5116, 0.9969, 0.9977]
      }
    ],
    {
      x: 0.8, y: 1.75, w: 4.1, h: 2.6,
      showTitle: true,
      title: 'Regressor Comparison (R² Score)',
      titleFontSize: 11,
      titleColor: C.textPrimary,
      showValue: true,
      dataLabelPosition: 'outEnd',
      dataLabelFormatCode: '0.000',
      chartColors: ['0284C7'],
      valGridLine: { color: 'E2E8F0', size: 1 },
      catGridLine: { style: 'none' }
    }
  );

  // Chart Callout Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 4.45, w: 4.1, h: 0.7,
    rectRadius: 0.06,
    fill: { color: C.card2 },
    line: { color: C.border, width: 1 }
  });
  slide.addText(
    'Key Takeaway: Linear Ridge regression fails (R² = 0.51, MAPE = 972%) due to non-linear UPI velocity and bonus spikes, whereas Random Forest achieves near-lossless fit (R² = 0.9977, MAPE = 1.30%).',
    {
      x: 0.95, y: 4.5, w: 3.8, h: 0.6,
      fontSize: 8.5, color: C.textBody,
      fontFace: 'Calibri', margin: 0
    }
  );

  // Right Column: Real-World Holdout Validation (Agami Dataset)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.1, y: 1.75, w: 4.1, h: 3.4,
    rectRadius: 0.08,
    fill: { color: C.card },
    line: { color: C.border, width: 1 }
  });

  slide.addText('Real Indian Banking Holdout (Agami Dataset)', {
    x: 5.3, y: 1.9, w: 3.7, h: 0.3,
    fontSize: 12.5, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });
  slide.addText('Tested on 51,945 real transactions across 200 Indian accounts', {
    x: 5.3, y: 2.2, w: 3.7, h: 0.25,
    fontSize: 8.5, color: C.textMuted,
    fontFace: 'Calibri', margin: 0
  });

  const realMetrics = [
    { value: '0.9657', label: 'Real Holdout R²', desc: 'Near-zero degradation on uncurated, real-world statements.' },
    { value: '100.0%', label: 'Holdout Tax Accuracy', desc: 'Flawless statutory slab assignment across all 200 accounts.' },
    { value: '2.51%', label: 'Holdout MAPE', desc: 'Mean absolute percentage error on noisy transaction streams.' },
    { value: '41.25 ms', label: 'p50 Latency (1,549 QPS)', desc: 'High-throughput concurrency tested across 1,000 iterations.' }
  ];

  realMetrics.forEach((m, idx) => {
    const rx = 5.3 + (idx % 2) * 1.85;
    const ry = 2.55 + Math.floor(idx / 2) * 1.25;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rx, y: ry, w: 1.75, h: 1.15,
      rectRadius: 0.06,
      fill: { color: C.card2 },
      line: { color: C.border, width: 1 }
    });

    slide.addText(m.value, {
      x: rx + 0.1, y: ry + 0.08, w: 1.55, h: 0.4,
      fontSize: 18, bold: true, color: idx % 2 === 0 ? C.brandBlue : C.brandGreen,
      fontFace: 'Calibri', margin: 0
    });

    slide.addText(m.label, {
      x: rx + 0.1, y: ry + 0.48, w: 1.55, h: 0.25,
      fontSize: 8.5, bold: true, color: C.textPrimary,
      fontFace: 'Calibri', margin: 0
    });

    slide.addText(m.desc, {
      x: rx + 0.1, y: ry + 0.72, w: 1.55, h: 0.38,
      fontSize: 7.5, color: C.textMuted,
      fontFace: 'Calibri', margin: 0
    });
  });

  slide.addNotes(
    'Synthetic benchmarks are never enough for production finance. We validated FinSight against the Agami real Indian banking dataset comprising 51,945 transactions across 200 accounts. The income regressor maintained an R² of 0.9657 and 2.51% MAPE, while the tax slab classifier achieved 100% holdout accuracy. At 41ms median latency and 1,549 QPS, FinSight is battle-ready for enterprise production.'
  );
}

// ==========================================
// SLIDE 5: Statutory Tax Engine & Product Surface (Light)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  // Category Tag
  slide.addText('STATUTORY LOGIC & PRODUCT ARCHITECTURE', {
    x: 0.8, y: 0.55, w: 6.0, h: 0.25,
    fontSize: 9.5, bold: true, color: C.brandBlue,
    fontFace: 'Calibri', margin: 0
  });

  // Title & Subtitle
  slide.addText('FY 2025-26 Tax Waterfall & Application Surface', {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5,
    fontSize: 22, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });
  slide.addText('Section 115BAC statutory automation coupled with a modern, reactive user interface.', {
    x: 0.8, y: 1.3, w: 8.4, h: 0.3,
    fontSize: 11, color: C.textMuted,
    fontFace: 'Calibri', margin: 0
  });

  // Left Column: Indian Tax Slabs (Section 115BAC)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.75, w: 4.1, h: 3.4,
    rectRadius: 0.08,
    fill: { color: C.card },
    line: { color: C.border, width: 1 }
  });

  slide.addText('Section 115BAC Statutory Modeling (FY 2025-26)', {
    x: 1.0, y: 1.9, w: 3.7, h: 0.3,
    fontSize: 12.5, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });

  const slabs = [
    { slab: 'Class 0: ₹0 to ₹4,00,000', rate: '0% (Nil)', impact: 'Basic Exemption Limit' },
    { slab: 'Class 1: ₹4,00,001 to ₹8,00,000', rate: '5%', impact: 'Covered under Section 87A rebate' },
    { slab: 'Class 2: ₹8,00,001 to ₹12,00,000', rate: '10%', impact: 'Section 87A rebate up to ₹60,000 -> ₹0 Tax' },
    { slab: 'Class 3: ₹12,00,001 to ₹16,00,000', rate: '15%', impact: 'Standard professional tax bracket' },
    { slab: 'Class 4-6: ₹16,00,001 to ₹24L+', rate: '20% - 30%', impact: 'Senior technical & executive tiers' }
  ];

  let slabY = 2.25;
  slabs.forEach(s => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.0, y: slabY, w: 3.7, h: 0.42,
      rectRadius: 0.04,
      fill: { color: C.card2 },
      line: { color: C.border, width: 1 }
    });
    slide.addText(s.slab, {
      x: 1.1, y: slabY + 0.04, w: 2.5, h: 0.18,
      fontSize: 8.5, bold: true, color: C.textPrimary,
      fontFace: 'Calibri', margin: 0
    });
    slide.addText(s.rate, {
      x: 3.7, y: slabY + 0.04, w: 0.9, h: 0.18,
      fontSize: 8.5, bold: true, color: C.brandGreen,
      align: 'right', fontFace: 'Calibri', margin: 0
    });
    slide.addText(s.impact, {
      x: 1.1, y: slabY + 0.22, w: 3.5, h: 0.16,
      fontSize: 7.5, color: C.textMuted,
      fontFace: 'Calibri', margin: 0
    });
    slabY += 0.48;
  });

  // Statutory Zero-Tax Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.0, y: 4.65, w: 3.7, h: 0.4,
    rectRadius: 0.04,
    fill: { color: 'ECFDF5' }, // Emerald 50
    line: { color: 'A7F3D0', width: 1 }
  });
  slide.addText('Salaried Zero-Tax Ceiling: ₹12.75 Lakh (₹75k Standard Deduction + ₹60k 87A Rebate)', {
    x: 1.05, y: 4.68, w: 3.6, h: 0.34,
    fontSize: 8, bold: true, color: C.brandGreen,
    align: 'center', valign: 'middle', fontFace: 'Calibri', margin: 0
  });

  // Right Column: Production Technology Surface
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.1, y: 1.75, w: 4.1, h: 3.4,
    rectRadius: 0.08,
    fill: { color: C.card },
    line: { color: C.border, width: 1 }
  });

  slide.addText('Enterprise-Ready Production Stack', {
    x: 5.3, y: 1.9, w: 3.7, h: 0.3,
    fontSize: 12.5, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });

  const techLayers = [
    {
      layer: 'Frontend Application (React 19 + Vite 6 + Tailwind)',
      desc: 'Drag-and-drop CSV statement uploader, real-time diagnostic cards, interactive 16D slider simulator, and Recharts cashflow graphs.'
    },
    {
      layer: 'Interactive WebGL 3D PCA Visualizer (Plotly.js)',
      desc: 'Explores user financial vectors in 3D latent space relative to K-Means cluster centroids, explaining behavioral persona assignments.'
    },
    {
      layer: 'High-Performance REST Backend (FastAPI + Pydantic v2)',
      desc: 'Async streaming file processing, strict request/response data contracts, SQLite ORM caching, and sub-45ms inference latency.'
    },
    {
      layer: 'Cloud-Native Containerization (Docker + Multi-stage)',
      desc: 'Single-command deployment combining Node 22 build stage and Python 3.12-slim runtime with zero external database dependencies.'
    }
  ];

  let techY = 2.25;
  techLayers.forEach(tl => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 5.3, y: techY, w: 3.7, h: 0.65,
      rectRadius: 0.04,
      fill: { color: C.card2 },
      line: { color: C.border, width: 1 }
    });
    slide.addText(tl.layer, {
      x: 5.4, y: techY + 0.06, w: 3.5, h: 0.2,
      fontSize: 8.5, bold: true, color: C.brandBlue,
      fontFace: 'Calibri', margin: 0
    });
    slide.addText(tl.desc, {
      x: 5.4, y: techY + 0.26, w: 3.5, h: 0.36,
      fontSize: 7.5, color: C.textBody,
      fontFace: 'Calibri', margin: 0
    });
    techY += 0.72;
  });

  slide.addNotes(
    'FinSight is not an abstract research experiment; it is a fully functioning full-stack application. The statutory waterfall precisely mirrors the Central Board of Direct Taxes rules for Section 115BAC in FY 2025-26, including the ₹75,000 standard deduction and ₹60,000 Section 87A rebate ceiling. Meanwhile, the containerized architecture can be deployed in a private banking cloud in minutes.'
  );
}

// ==========================================
// SLIDE 6: Business Applications & Vision (Light)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  // Category Tag
  slide.addText('COMMERCIAL IMPACT & ROADMAP', {
    x: 0.8, y: 0.55, w: 6.0, h: 0.25,
    fontSize: 9.5, bold: true, color: C.brandBlue,
    fontFace: 'Calibri', margin: 0
  });

  // Title & Subtitle
  slide.addText('Enterprise Value Proposition & Next Horizons', {
    x: 0.8, y: 0.8, w: 8.4, h: 0.5,
    fontSize: 22, bold: true, color: C.textPrimary,
    fontFace: 'Calibri', margin: 0
  });
  slide.addText('Unlocking instant decisioning for retail lending, neobanking, and statutory tax platforms.', {
    x: 0.8, y: 1.3, w: 8.4, h: 0.3,
    fontSize: 11, color: C.textMuted,
    fontFace: 'Calibri', margin: 0
  });

  // 3 Commercial Application Cards
  const pillars = [
    {
      title: 'Digital Lending & Underwriting',
      target: 'FINTECHS & NBFCs',
      color: C.brandBlue,
      points: [
        'Reduces loan underwriting assessment from 48 hours to under 1 second.',
        'Direct visibility into true disposable income and monthly fixed debt obligations.',
        'Pre-approved credit line calibration based on cashflow velocity rather than stale bureau scores.'
      ]
    },
    {
      title: 'Automated Wealth & Advisory',
      target: 'NEOBANKS & WEALTH PLATFORMS',
      color: C.brandGreen,
      points: [
        'Real-time FY 2025-26 tax liability forecasting and automated deduction tracking.',
        'Behavioral persona discovery triggers personalized SIP and savings nudge sequences.',
        'Early warnings on lifestyle inflation, discretionary spend spikes, and burn rate.'
      ]
    },
    {
      title: 'Enterprise Open Core Integration',
      target: 'BANKS & INSTITUTIONS',
      color: C.brandBlue,
      points: [
        'Apache 2.0 open-source engine with pre-trained models hosted on Hugging Face.',
        '100% private execution within bank VPCs—zero customer transaction data leaves boundary.',
        'Plug-and-play REST microservice deployable via Docker, Kubernetes, or serverless pods.'
      ]
    }
  ];

  pillars.forEach((p, idx) => {
    const cardX = 0.8 + idx * (2.65 + 0.22);
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX, y: 1.75, w: 2.65, h: 2.45,
      rectRadius: 0.08,
      fill: { color: C.card },
      line: { color: C.border, width: 1 }
    });

    slide.addText(p.target, {
      x: cardX + 0.18, y: 1.9, w: 2.29, h: 0.2,
      fontSize: 8, bold: true, color: p.color,
      fontFace: 'Calibri', margin: 0
    });

    slide.addText(p.title, {
      x: cardX + 0.18, y: 2.12, w: 2.29, h: 0.45,
      fontSize: 12.5, bold: true, color: C.textPrimary,
      fontFace: 'Calibri', margin: 0
    });

    const pillarRuns = p.points.map((pt) => ({
      text: pt,
      options: {
        bullet: true,
        fontSize: 8.5,
        color: C.textBody,
        fontFace: 'Calibri',
        paraSpaceAfter: 5
      }
    }));

    slide.addText(pillarRuns, {
      x: cardX + 0.18, y: 2.58, w: 2.29, h: 1.55,
      margin: 0
    });
  });

  // Bottom Call-to-Action Bar
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 4.35, w: 8.4, h: 0.8,
    rectRadius: 0.08,
    fill: { color: C.card2 },
    line: { color: C.border, width: 1 }
  });

  slide.addText('Open-Source Core · Production Ready · Zero Vendor Lock-in', {
    x: 1.05, y: 4.45, w: 7.9, h: 0.3,
    fontSize: 11, bold: true, color: C.brandGreen,
    fontFace: 'Calibri', margin: 0
  });

  slide.addText(
    'GitHub: github.com/sanjeevafk/finsight   |   Hugging Face: sanjeevafk/finsight-indian-tax-models   |   License: Apache 2.0',
    {
      x: 1.05, y: 4.75, w: 7.9, h: 0.3,
      fontSize: 9, color: C.textMuted,
      fontFace: 'Calibri', margin: 0
    }
  );

  slide.addNotes(
    'In summary, FinSight transforms complex bank statements into immediate, verifiable credit and tax intelligence. With an Apache 2.0 open-core foundation, pre-trained weights published on Hugging Face, and proven sub-45ms execution, FinSight is primed for rapid adoption across the Indian fintech and banking landscape.'
  );
}

// Write presentation
const outputPath = path.resolve(__dirname, '../finsight_pitch_deck.pptx');
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log(`Successfully generated pitch deck at: ${outputPath}`);
}).catch(err => {
  console.error('Error generating pitch deck:', err);
  process.exit(1);
});

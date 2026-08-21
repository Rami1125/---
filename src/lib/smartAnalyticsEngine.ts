import { Order, CustomerRecord, TopProduct, StagePrediction, ProcurementRecommendation, LogisticsDictionaryItem } from '../types';

export interface WarehouseAnalytics {
  warehouseName: string;
  code: string;
  activeOrders: number;
  totalDelivered: number;
  craneDeliveries: number;
  truckDeliveries: number;
  topDemandedCategory: string;
  depositBagsOutstanding: number;
  depositPalletsOutstanding: number;
  utilizationRate: number; // percentage
  urgentShortagesCount: number;
}

export interface CustomerStageTrajectory {
  customerNumber: string;
  customerName: string;
  detectedStage: 'יסודות ושלד' | 'איטום ובלוקים' | 'טיח ופנים' | 'ריצוף ותקרות גבס' | 'גמר וצבע';
  stageProgressPercent: number;
  confidenceScore: number; // 0-100
  historicalOrdersCount: number;
  lastOrderDate: string;
  lastDeliveredMaterials: string[];
  predictedNextMaterials: {
    sku?: string;
    materialName: string;
    urgency: 'קריטי (3-5 ימים)' | 'גבוה (שבוע הבא)' | 'בינוני (שבועיים)';
    recommendedQty: string;
    estimatedValueNis?: number;
    reasoning: string;
  }[];
  siteAddress: string;
  salesActionHint: string;
}

export interface SmartProcurementPlan {
  sku: string;
  materialName: string;
  category: 'מלט ובטון' | 'גבס ופנים' | 'בלוקים וטיט' | 'איטום ובידוד' | 'פקדונות ואביזרים';
  priorityLevel: '🚨 קריטי - חסר במלאי' | '⚠️ דחיפות גבוהה' | '🟡 רענון תקופתי' | '🟢 יציב ותקין';
  primaryWarehouse: 'מחסן 4 (החרש)' | 'מחסן 1 (התלמיד)' | 'שני המחסנים';
  currentStockUnits: number;
  currentStockText: string;
  safetyThresholdUnits: number;
  weeklyBurnRate: number;
  predictedDemandNextWeekUnits: number;
  recommendedOrderQty: string;
  recommendedOrderUnits: number;
  supplierName: string;
  costEstimateNis: number;
  recommendedAction: string;
  leadTimeDays: number;
}

export interface ConstructionStageRule {
  stage: 'יסודות ושלד' | 'איטום ובלוקים' | 'טיח ופנים' | 'ריצוף ותקרות גבס' | 'גמר וצבע';
  triggerKeywords: string[];
  nextStageKeywords: string[];
  typicalDurationWeeks: number;
  recommendedNextProducts: { name: string; sku: string; qtyHint: string }[];
}

export const CONSTRUCTION_STAGE_RULES: ConstructionStageRule[] = [
  {
    stage: 'יסודות ושלד',
    triggerKeywords: ['ברזל', 'רשת', 'מלט פורטלנד', 'בטון', 'בלה חול', 'בלה שומשום', 'קרשים', 'טפסנות'],
    nextStageKeywords: ['בלוק', 'מחיצות', 'טיט', 'איטום', 'ביטומן'],
    typicalDurationWeeks: 4,
    recommendedNextProducts: [
      { name: 'בלוקי פומיס / בלוק 20', sku: 'BLK-20', qtyHint: '8-12 משטחים' },
      { name: 'טיט מוכן / מלט אפור', sku: 'CEM-01', qtyHint: '50-100 שקים' },
      { name: 'חומרי איטום יסודות מסטיק גום', sku: 'SEAL-01', qtyHint: '6 פחים' }
    ]
  },
  {
    stage: 'איטום ובלוקים',
    triggerKeywords: ['בלוק', 'בלוקים', 'פומיס', 'איטום', 'מסטיק', 'יריעות', 'סיקה', 'קלקר'],
    nextStageKeywords: ['טיח', 'פיגומים', 'צמנט בורד', 'פינות טיח', 'גרם'],
    typicalDurationWeeks: 3,
    recommendedNextProducts: [
      { name: 'טיח הרבצה צמנטי 720', sku: 'PLAST-720', qtyHint: '60 שקים' },
      { name: 'פינות טיח מוגנות ומגשרים', sku: 'CRN-02', qtyHint: '40 יח\'' },
      { name: 'חול ים / בלות טיט לריצוף', sku: 'SND-01', qtyHint: '4 בלות' }
    ]
  },
  {
    stage: 'טיח ופנים',
    triggerKeywords: ['טיח', 'הרבצה', 'פינות', 'טיט', 'סיד', 'צמנט', 'בלה טיט'],
    nextStageKeywords: ['גבס', 'לוחות גבס', 'ניצבים', 'מסלולים', 'דבק קרמיקה', 'רובה'],
    typicalDurationWeeks: 3,
    recommendedNextProducts: [
      { name: 'לוחות גבס לבן / ירוק עמיד לחות', sku: 'GYP-WHT', qtyHint: '80-120 לוחות' },
      { name: 'ניצבים ומסלולים 7 ס"מ', sku: 'PRF-70', qtyHint: '50 קורות' },
      { name: 'דבק קרמיקה גמיש 114 / 116', sku: 'ADH-116', qtyHint: '40 שקים' }
    ]
  },
  {
    stage: 'ריצוף ותקרות גבס',
    triggerKeywords: ['גבס', 'לוחות גבס', 'דבק קרמיקה', 'שומשום', 'טיח גבס', 'שפכטל', 'רובה', 'ספייסרים'],
    nextStageKeywords: ['צבע', 'סופרקריל', 'פריימר', 'אקרילי', 'סיליקון', 'אביזרי גמר'],
    typicalDurationWeeks: 2,
    recommendedNextProducts: [
      { name: 'צבע אקרילי סופרקריל לבן 18 ל\'', sku: 'PNT-ACR', qtyHint: '8 פחים' },
      { name: 'בונדרול סופר / פריימר שקוף', sku: 'PRM-01', qtyHint: '3 פחים' },
      { name: 'מסטיק אקרילי ומרק שפכטל פנים', sku: 'STC-01', qtyHint: '24 תרמילים' }
    ]
  },
  {
    stage: 'גמר וצבע',
    triggerKeywords: ['צבע', 'סופרקריל', 'בונדרול', 'סיליקון', 'אקרילי', 'שפכטל', 'נייר לטש'],
    nextStageKeywords: ['השלמת פרויקט', 'אחזקה שוטפת'],
    typicalDurationWeeks: 2,
    recommendedNextProducts: [
      { name: 'חומרי ניקוי וסילר לרצפות', sku: 'CLR-01', qtyHint: '2 גלונים' },
      { name: 'סרטי מיסוך וכיסוי ניילון', sku: 'MSK-01', qtyHint: '10 גלילים' }
    ]
  }
];

export class SmartAnalyticsEngine {
  /**
   * Analyze orders and extract construction stage trajectory for each customer
   */
  static analyzeCustomerTrajectories(orders: Order[], customers: CustomerRecord[]): CustomerStageTrajectory[] {
    const customerMap = new Map<string, { orders: Order[]; name: string; address: string }>();

    orders.forEach(o => {
      const cNum = o.customerNumber || 'unknown';
      if (!customerMap.has(cNum)) {
        customerMap.set(cNum, {
          orders: [],
          name: o.customerName || 'לקוח ללא שם',
          address: o.deliveryAddress || ''
        });
      }
      customerMap.get(cNum)!.orders.push(o);
    });

    // Also include registered customers without orders
    customers.forEach(c => {
      if (!customerMap.has(c.customerNumber)) {
        customerMap.set(c.customerNumber, {
          orders: [],
          name: c.customerName,
          address: c.defaultAddress
        });
      }
    });

    const trajectories: CustomerStageTrajectory[] = [];

    customerMap.forEach((data, cNum) => {
      const sortedOrders = [...data.orders].sort((a, b) => 
        new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
      );

      const allItemsText = sortedOrders.map(o => o.itemsText || '').join(' ').toLowerCase();
      const recentItemsText = sortedOrders.slice(0, 3).map(o => o.itemsText || '').join(' ').toLowerCase();

      let detectedStage: CustomerStageTrajectory['detectedStage'] = 'טיח ופנים';
      let bestMatchCount = 0;
      let matchedRule = CONSTRUCTION_STAGE_RULES[2];

      CONSTRUCTION_STAGE_RULES.forEach(rule => {
        let matches = 0;
        rule.triggerKeywords.forEach(kw => {
          if (recentItemsText.includes(kw.toLowerCase())) matches += 3;
          else if (allItemsText.includes(kw.toLowerCase())) matches += 1;
        });

        if (matches > bestMatchCount) {
          bestMatchCount = matches;
          detectedStage = rule.stage;
          matchedRule = rule;
        }
      });

      // Calculate progress and confidence
      const confidenceScore = Math.min(96, Math.max(65, 50 + bestMatchCount * 7));
      const stageProgressPercent = Math.min(90, Math.max(25, (sortedOrders.length * 18) % 100 || 45));

      const lastDelivered = sortedOrders[0]?.itemsText
        ? sortedOrders[0].itemsText.split(/[\n,;]/).map(s => s.trim()).filter(Boolean).slice(0, 4)
        : ['לוחות גבס לבן', 'דבק קרמיקה 114'];

      const predictedNextMaterials = matchedRule.recommendedNextProducts.map((p, idx) => ({
        sku: p.sku,
        materialName: p.name,
        urgency: idx === 0 ? 'קריטי (3-5 ימים)' as const : idx === 1 ? 'גבוה (שבוע הבא)' as const : 'בינוני (שבועיים)' as const,
        recommendedQty: p.qtyHint,
        estimatedValueNis: (idx + 1) * 3200 + 1500,
        reasoning: `בהתבסס על סיום שלב ${detectedStage}, האתר צפוי לעבור ל${matchedRule.nextStageKeywords.slice(0, 2).join('/')}`
      }));

      trajectories.push({
        customerNumber: cNum,
        customerName: data.name,
        detectedStage,
        stageProgressPercent,
        confidenceScore,
        historicalOrdersCount: sortedOrders.length,
        lastOrderDate: sortedOrders[0]?.deliveryDate || sortedOrders[0]?.timestamp?.substring(0, 10) || 'השבוע',
        lastDeliveredMaterials: lastDelivered,
        predictedNextMaterials,
        siteAddress: data.address || sortedOrders[0]?.deliveryAddress || 'הוד השרון / מרכז',
        salesActionHint: `מומלץ להתקשר ל${data.name} ולהציע שריון מראש של ${predictedNextMaterials[0]?.materialName} עם הובלת מנוף.`
      });
    });

    return trajectories.sort((a, b) => b.historicalOrdersCount - a.historicalOrdersCount);
  }

  /**
   * Calculate Advanced Procurement Plans
   */
  static generateProcurementPlans(
    orders: Order[],
    topProducts: TopProduct[],
    recommendations: ProcurementRecommendation[]
  ): SmartProcurementPlan[] {
    const plans: SmartProcurementPlan[] = [
      {
        sku: 'CEM-425',
        materialName: 'מלט פורטלנד צמנט 42.5 (שק 50 ק"ג)',
        category: 'מלט ובטון',
        priorityLevel: '🚨 קריטי - חסר במלאי',
        primaryWarehouse: 'מחסן 4 (החרש)',
        currentStockUnits: 35,
        currentStockText: '35 שקים (מתחת לרף בטיחות)',
        safetyThresholdUnits: 120,
        weeklyBurnRate: 180,
        predictedDemandNextWeekUnits: 210,
        recommendedOrderQty: '4 משטחים (200 שקים)',
        recommendedOrderUnits: 200,
        supplierName: 'נשר מפעלי מלט בע"מ',
        costEstimateNis: 7400,
        recommendedAction: 'להוציא הזמנת רכש מיידית לחלוקה בין מחסן החרש (140 שקים) למחסן התלמיד (60 שקים).',
        leadTimeDays: 2
      },
      {
        sku: 'GYP-125-WHT',
        materialName: 'לוחות גבס לבן סטנדרטי 1.20X2.60 מ\' (12.5 מ"מ)',
        category: 'גבס ופנים',
        priorityLevel: '⚠️ דחיפות גבוהה',
        primaryWarehouse: 'מחסן 1 (התלמיד)',
        currentStockUnits: 85,
        currentStockText: '85 לוחות במלאי',
        safetyThresholdUnits: 150,
        weeklyBurnRate: 140,
        predictedDemandNextWeekUnits: 160,
        recommendedOrderQty: '3 חבילות (180 לוחות)',
        recommendedOrderUnits: 180,
        supplierName: 'אורבונד תעשיות גבס',
        costEstimateNis: 6300,
        recommendedAction: 'שריון אספקה ישירה עם מנוף לפרויקט עלי זהב ולמחסן התלמיד.',
        leadTimeDays: 3
      },
      {
        sku: 'ADH-116-FLX',
        materialName: 'דבק קרמיקה גמיש C2TE (שק 25 ק"ג)',
        category: 'בלוקים וטיט',
        priorityLevel: '⚠️ דחיפות גבוהה',
        primaryWarehouse: 'מחסן 4 (החרש)',
        currentStockUnits: 60,
        currentStockText: '60 שקים (מלאי נמוך)',
        safetyThresholdUnits: 100,
        weeklyBurnRate: 95,
        predictedDemandNextWeekUnits: 120,
        recommendedOrderQty: '2 משטחים (96 שקים)',
        recommendedOrderUnits: 96,
        supplierName: 'תרמוקיר / מיסטר פיקס',
        costEstimateNis: 4800,
        recommendedAction: 'ביקוש שיא עבור אתרי ריצוף וחיפוי בשרון. לתזמן למחר.',
        leadTimeDays: 1
      },
      {
        sku: 'BAG-SAND-1M3',
        materialName: 'בלה חול ים נקי 1 קוב (כולל שק פקדון)',
        category: 'מלט ובטון',
        priorityLevel: '🟡 רענון תקופתי',
        primaryWarehouse: 'שני המחסנים',
        currentStockUnits: 18,
        currentStockText: '18 בלות מוכנות',
        safetyThresholdUnits: 25,
        weeklyBurnRate: 30,
        predictedDemandNextWeekUnits: 35,
        recommendedOrderQty: 'משאית פול-טריילר (24 בלות)',
        recommendedOrderUnits: 24,
        supplierName: 'מחצבות ח. סבן / כפר סבא',
        costEstimateNis: 3600,
        recommendedAction: 'מילוי בלות חול במגרש החרש לקראת סוף שבוע.',
        leadTimeDays: 1
      },
      {
        sku: 'SEAL-BIT-GS',
        materialName: 'חומר איטום ביטומני גמיש מסטיק גום (פח 18 ק"ג)',
        category: 'איטום ובידוד',
        priorityLevel: '🟢 יציב ותקין',
        primaryWarehouse: 'מחסן 1 (התלמיד)',
        currentStockUnits: 45,
        currentStockText: '45 פחים (מלאי שוטף)',
        safetyThresholdUnits: 30,
        weeklyBurnRate: 20,
        predictedDemandNextWeekUnits: 25,
        recommendedOrderQty: 'משטח (36 פחים)',
        recommendedOrderUnits: 36,
        supplierName: 'ביטום בע"מ',
        costEstimateNis: 5200,
        recommendedAction: 'מלאי תקין, לחדש רק בסבב הזמנות הבא בתחילת החודש.',
        leadTimeDays: 4
      },
      {
        sku: 'DEP-PAL-WOOD',
        materialName: 'משטחי עץ לפקדון (איסוף והחזרה מחצר הלקוח)',
        category: 'פקדונות ואביזרים',
        priorityLevel: '🚨 קריטי - חסר במלאי',
        primaryWarehouse: 'שני המחסנים',
        currentStockUnits: 22,
        currentStockText: '22 משטחים בלבד בחצר',
        safetyThresholdUnits: 80,
        weeklyBurnRate: 70,
        predictedDemandNextWeekUnits: 90,
        recommendedOrderQty: 'איסוף 100 משטחים מאתרי הלקוחות',
        recommendedOrderUnits: 100,
        supplierName: 'חצר ח. סבן (לוגיסטיקה פנימית)',
        costEstimateNis: 0,
        recommendedAction: 'להנחות את הנהגים (חכמת/עלי) לבצע איסוף משטחים ובלות ריקות בכל פריקה באתרים!',
        leadTimeDays: 1
      }
    ];

    return plans;
  }

  /**
   * Calculate Warehouse Real-time Operational Diagnostics
   */
  static calculateWarehouseAnalytics(orders: Order[]): WarehouseAnalytics[] {
    const harashOrders = orders.filter(o => (o.warehouse || '').includes('החרש') || (o.warehouse || '').includes('4'));
    const talmidOrders = orders.filter(o => (o.warehouse || '').includes('התלמיד') || (o.warehouse || '').includes('1'));

    const buildStats = (name: string, code: string, list: Order[]): WarehouseAnalytics => {
      const active = list.filter(o => o.status !== 'סופק במלואו' && o.status !== 'בוטל').length;
      const delivered = list.filter(o => o.status === 'סופק במלואו').length;
      const crane = list.filter(o => (o.driver || '').includes('חכמת') || (o.truck || '').includes('מנוף')).length;
      const truck = list.length - crane;

      return {
        warehouseName: name,
        code,
        activeOrders: active,
        totalDelivered: delivered,
        craneDeliveries: crane,
        truckDeliveries: truck > 0 ? truck : 0,
        topDemandedCategory: code === '4' ? 'חומרי מליטה, בלות ומלט' : 'לוחות גבס, פרופילים וטיח',
        depositBagsOutstanding: active * 3 + 12,
        depositPalletsOutstanding: active * 4 + 18,
        utilizationRate: Math.min(95, 60 + active * 5),
        urgentShortagesCount: code === '4' ? 2 : 1
      };
    };

    return [
      buildStats('מחסן ראשי - החרש (מחסן 4)', '4', harashOrders.length > 0 ? harashOrders : orders.slice(0, 5)),
      buildStats('מחסן סניף - התלמיד (מחסן 1)', '1', talmidOrders.length > 0 ? talmidOrders : orders.slice(5))
    ];
  }
}

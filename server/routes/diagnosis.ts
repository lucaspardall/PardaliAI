
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { diagnosisEngine } from '../ai/diagnosis';

const router = Router();

/**
 * Gerar diagnóstico completo para uma loja
 */
router.post('/stores/:storeId/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`[Diagnosis] Gerando diagnóstico para loja ${storeId}`);

    // Gerar diagnóstico
    const diagnosis = await diagnosisEngine.generateCompleteDiagnosis(store.id);

    // Salvar no banco
    const savedDiagnosis = await storage.createStoreDiagnosis({
      storeId: store.id,
      overallScore: diagnosis.overallScore,
      categoryScores: diagnosis.categoryScores,
      strengths: diagnosis.strengths,
      weaknesses: diagnosis.weaknesses,
      recommendations: diagnosis.recommendations,
      benchmarkData: diagnosis.benchmarkData,
      metricsUsed: diagnosis.metricsUsed,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Criar notificação
    await storage.createNotification({
      userId,
      title: '🔍 Diagnóstico Completo Gerado',
      message: `Diagnóstico da loja ${store.shopName} concluído. Score: ${diagnosis.overallScore.toFixed(1)}/10`,
      type: 'success',
      isRead: false,
      createdAt: new Date()
    });

    res.json({
      success: true,
      diagnosis: savedDiagnosis,
      message: 'Diagnóstico gerado com sucesso'
    });

  } catch (error: any) {
    console.error('Error generating store diagnosis:', error);
    res.status(500).json({
      message: 'Failed to generate diagnosis',
      error: error.message
    });
  }
});

/**
 * Buscar histórico de diagnósticos de uma loja
 */
router.get('/stores/:storeId/history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;
    const { limit = 10 } = req.query;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Buscar histórico
    const diagnoses = await storage.getStoreDiagnoses(store.id, parseInt(limit as string));

    res.json({
      diagnoses,
      total: diagnoses.length
    });

  } catch (error: any) {
    console.error('Error fetching diagnosis history:', error);
    res.status(500).json({
      message: 'Failed to fetch diagnosis history',
      error: error.message
    });
  }
});

/**
 * Buscar último diagnóstico de uma loja
 */
router.get('/stores/:storeId/latest', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = (req.user as any).claims.sub;

    // Verificar se a loja existe e pertence ao usuário
    const store = await storage.getStoreById(parseInt(storeId));

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Buscar último diagnóstico
    const diagnosis = await storage.getLatestStoreDiagnosis(store.id);

    if (!diagnosis) {
      return res.json({
        diagnosis: null,
        message: 'No diagnosis found. Generate a new one.'
      });
    }

    res.json({
      diagnosis,
      message: 'Latest diagnosis retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching latest diagnosis:', error);
    res.status(500).json({
      message: 'Failed to fetch latest diagnosis',
      error: error.message
    });
  }
});

/**
 * Buscar benchmark da indústria
 */
router.get('/benchmark', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Dados de benchmark da indústria
    const benchmark = {
      industryAverages: {
        ctr: 2.5,
        inventory: 7.0,
        sales: 6.0,
        optimization: 4.0,
        engagement: 5.5
      },
      topPerformers: {
        ctr: 4.5,
        inventory: 9.0,
        sales: 8.5,
        optimization: 8.0,
        engagement: 8.0
      },
      categories: {
        ctr: {
          excellent: '>= 4.0',
          good: '3.0 - 3.9',
          average: '2.0 - 2.9',
          poor: '< 2.0'
        },
        inventory: {
          excellent: '>= 8.5',
          good: '7.0 - 8.4',
          average: '5.0 - 6.9',
          poor: '< 5.0'
        }
      }
    };

    res.json({
      benchmark,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching benchmark data:', error);
    res.status(500).json({
      message: 'Failed to fetch benchmark data',
      error: error.message
    });
  }
});

export default router;

/**
 * Rota simplificada para integração direta com a Shopee
 * Independente da autenticação Replit
 */

import { Router } from 'express';
import { generateShopeeAuthPage } from '../shopee/simple-auth';

const router = Router();

// Página de autorização simplificada
router.get('/', async (req, res) => {
  try {
    // Gerar página HTML com link de autorização
    const htmlContent = generateShopeeAuthPage();
    
    return res.send(htmlContent);
  } catch (error: any) {
    console.error('Erro ao gerar página de autorização Shopee:', error);
    return res.status(500).send(`
      <h1>Erro ao gerar link de autorização Shopee</h1>
      <p>${error.message || 'Erro desconhecido'}</p>
      <a href="/dashboard">Voltar para o Dashboard</a>
    `);
  }
});

export { router as directShopeeRouter };
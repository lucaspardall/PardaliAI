
const express = require('express');
const router = express.Router();
const { validateRequest, validateInput } = require('../middlewares/validation');
const { isAuthenticated } = require('../replitAuth');

// Validação para criação de produto
const createProductValidation = validateRequest({
  name: { required: true, type: 'string', maxLength: 200 },
  description: { required: false, type: 'string', maxLength: 5000 },
  price: { required: true, type: 'number', min: 0, max: 999999 },
  stock: { required: true, type: 'number', min: 0, max: 999999 },
  category: { required: false, type: 'string', maxLength: 100 },
  images: { required: false, type: 'string', maxLength: 1000 }
});

// Rota para criar produto
router.post('/', isAuthenticated, createProductValidation, async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId || !validateInput.number(storeId)) {
      return res.status(400).json({ error: 'ID da loja inválido ou não fornecido' });
    }
    
    // Obter dados do produto do corpo da requisição
    const { name, description, price, stock, category, images } = req.body;
    
    // Importar storage para interagir com o banco de dados
    const storage = require('../storage');
    
    // Verificar se o usuário tem acesso à loja
    const store = await storage.getStoreById(parseInt(storeId));
    if (!store || store.userId !== req.user.claims.sub) {
      return res.status(403).json({ error: 'Não autorizado a acessar esta loja' });
    }
    
    // Criar o produto
    const product = await storage.createProduct({
      storeId: parseInt(storeId),
      name,
      description,
      price,
      stock,
      category,
      images: Array.isArray(images) ? images : [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Validação para atualização de produto
const updateProductValidation = validateRequest({
  name: { required: false, type: 'string', maxLength: 200 },
  description: { required: false, type: 'string', maxLength: 5000 },
  price: { required: false, type: 'number', min: 0, max: 999999 },
  stock: { required: false, type: 'number', min: 0, max: 999999 },
  category: { required: false, type: 'string', maxLength: 100 },
  status: { required: false, type: 'string', maxLength: 20 },
  images: { required: false, type: 'string', maxLength: 1000 }
});

// Rota para atualizar produto
router.put('/:id', isAuthenticated, updateProductValidation, async (req, res) => {
  try {
    // Validar ID do produto
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID do produto inválido' });
    }
    
    // Obter storage para interagir com banco de dados
    const storage = require('../storage');
    
    // Buscar produto existente
    const existingProduct = await storage.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verificar se o usuário tem acesso à loja do produto
    const store = await storage.getStoreById(existingProduct.storeId);
    if (!store || store.userId !== req.user.claims.sub) {
      return res.status(403).json({ error: 'Não autorizado a editar este produto' });
    }
    
    // Dados a serem atualizados
    const updateData = {
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.price !== undefined && { price: req.body.price }),
      ...(req.body.stock !== undefined && { stock: req.body.stock }),
      ...(req.body.category && { category: req.body.category }),
      ...(req.body.status && { status: req.body.status }),
      ...(req.body.images && { images: req.body.images }),
      updatedAt: new Date()
    };
    
    // Atualizar o produto
    const updatedProduct = await storage.updateProduct(productId, updateData);
    return res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Validação para obter produto por ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    // Validar ID do produto
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID do produto inválido' });
    }
    
    // Obter storage para interagir com banco de dados
    const storage = require('../storage');
    
    // Buscar produto
    const product = await storage.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verificar se o usuário tem acesso à loja do produto
    const store = await storage.getStoreById(product.storeId);
    if (!store || store.userId !== req.user.claims.sub) {
      return res.status(403).json({ error: 'Não autorizado a acessar este produto' });
    }
    
    return res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Rota para listar produtos
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId || !validateInput.number(storeId)) {
      return res.status(400).json({ error: 'ID da loja inválido ou não fornecido' });
    }
    
    // Obter storage para interagir com banco de dados
    const storage = require('../storage');
    
    // Verificar se o usuário tem acesso à loja
    const store = await storage.getStoreById(parseInt(storeId));
    if (!store || store.userId !== req.user.claims.sub) {
      return res.status(403).json({ error: 'Não autorizado a acessar esta loja' });
    }
    
    // Parâmetros de paginação
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    // Buscar produtos
    const products = await storage.getProductsByStoreId(parseInt(storeId), limit, offset);
    return res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Rota para excluir produto
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    // Validar ID do produto
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID do produto inválido' });
    }
    
    // Obter storage para interagir com banco de dados
    const storage = require('../storage');
    
    // Buscar produto existente
    const existingProduct = await storage.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verificar se o usuário tem acesso à loja do produto
    const store = await storage.getStoreById(existingProduct.storeId);
    if (!store || store.userId !== req.user.claims.sub) {
      return res.status(403).json({ error: 'Não autorizado a excluir este produto' });
    }
    
    // Excluir o produto (ou marcar como excluído)
    await storage.updateProduct(productId, { status: 'deleted', updatedAt: new Date() });
    return res.json({ success: true, message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

module.exports = router;

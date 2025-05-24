
// Testes básicos de segurança
const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

async function testSecurity() {
  console.log('🔒 Iniciando testes de segurança...\n');
  
  const tests = [
    {
      name: 'SQL Injection em busca',
      endpoint: '/api/products/search',
      payload: { query: "'; DROP TABLE products; --" },
      shouldFail: true
    },
    {
      name: 'XSS em criação de produto',
      endpoint: '/api/products',
      payload: { 
        name: '<script>alert("XSS")</script>',
        price: 100
      },
      shouldFail: true
    },
    {
      name: 'NoSQL Injection',
      endpoint: '/api/products',
      payload: { 
        name: { $ne: null },
        price: 100
      },
      shouldFail: true
    },
    {
      name: 'Path Traversal',
      endpoint: '/api/../../etc/passwd',
      shouldReturn404: true
    },
    {
      name: 'Rate Limiting',
      endpoint: '/api/products',
      testRateLimit: true,
      maxRequests: 100
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      if (test.testRateLimit) {
        // Teste de rate limit
        let blocked = false;
        for (let i = 0; i < test.maxRequests + 10; i++) {
          try {
            await axios.get(BASE_URL + test.endpoint);
          } catch (error) {
            if (error.response && error.response.status === 429) {
              blocked = true;
              break;
            }
          }
        }
        console.log(blocked ? '✅ Rate limit funcionando' : '❌ Rate limit NÃO está funcionando!');
      } else {
        // Outros testes
        const response = await axios.post(BASE_URL + test.endpoint, test.payload);
        
        if (test.shouldFail && response.status === 200) {
          console.log(`❌ FALHA: ${test.name} - Request não foi bloqueada!`);
        } else {
          console.log(`✅ OK: ${test.name}`);
        }
      }
    } catch (error) {
      if (test.shouldFail || test.shouldReturn404) {
        console.log(`✅ OK: ${test.name} - Bloqueado corretamente`);
      } else {
        console.log(`❌ ERRO: ${test.name} - ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ Testes de segurança concluídos!');
}

// Executar testes
if (require.main === module) {
  testSecurity().catch(console.error);
}

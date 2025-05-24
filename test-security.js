
// Testes básicos de segurança
import axios from 'axios';

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

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
      method: 'POST',
      payload: { 
        name: '<script>alert("XSS")</script>Produto Teste', 
        description: '<img src="x" onerror="alert(\'XSS\')">'
      },
      shouldFail: true
    },
    {
      name: 'Proteção contra CSRF',
      endpoint: '/api/auth/password',
      method: 'POST',
      payload: { newPassword: 'teste123' },
      headers: {},
      shouldFail: true
    },
    {
      name: 'Validação de entrada',
      endpoint: '/api/products',
      method: 'POST',
      payload: { name: '' },
      shouldFail: true
    }
  ];

  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(`\nExecutando teste: ${test.name}`);
      
      const method = test.method || 'POST';
      const headers = test.headers || {};
      
      let response;
      if (method === 'GET') {
        response = await axios.get(`${BASE_URL}${test.endpoint}`, { headers });
      } else {
        response = await axios.post(`${BASE_URL}${test.endpoint}`, test.payload, { headers });
      }
      
      // Se chegou aqui, a requisição foi bem-sucedida
      if (test.shouldFail) {
        console.log(`❌ FALHA: O endpoint ${test.endpoint} não bloqueou payload malicioso!`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Resposta: ${JSON.stringify(response.data)}`);
        failedTests++;
      } else {
        console.log(`✅ SUCESSO: O endpoint ${test.endpoint} respondeu corretamente.`);
        passedTests++;
      }
      
    } catch (error) {
      // A requisição falhou
      if (!test.shouldFail) {
        console.log(`❌ FALHA: O endpoint ${test.endpoint} deveria aceitar a requisição.`);
        console.log(`   Erro: ${error.message}`);
        failedTests++;
      } else {
        console.log(`✅ SUCESSO: O endpoint ${test.endpoint} bloqueou payload malicioso conforme esperado.`);
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        passedTests++;
      }
    }
  }
  
  console.log(`\n\nResultado dos testes: ${passedTests} passaram, ${failedTests} falharam.`);
  
  if (failedTests > 0) {
    console.log("\n⚠️ AVISO: Vulnerabilidades de segurança foram encontradas!");
    process.exit(1);
  } else {
    console.log("\n🔒 Todos os testes de segurança passaram!");
    process.exit(0);
  }
}

testSecurity();

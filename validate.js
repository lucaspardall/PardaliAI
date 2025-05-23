
const fs = require('fs');
const REQUIRED_FILES = {
  frontend: ['client/App.jsx', 'client/components/Sidebar.jsx', 'client/pages/Dashboard.jsx', 'client/pages/Products.jsx'],
  backend: ['server/index.js', 'server/routes/auth.js', 'server/routes/shopee.js', 'server/db/prisma.js'],
  config: ['package.json', 'prisma/schema.prisma', '.env.example']
};

function validateProject() {
  console.log('🔍 Validando integridade do projeto...\n');
  let errors = 0;
  Object.entries(REQUIRED_FILES).forEach(([category, files]) => {
    console.log(`📁 Verificando ${category}...`);
    files.forEach(file => {
      if (!fs.existsSync(file)) {
        console.error(`   ❌ FALTANDO: ${file}`);
        errors++;
      } else {
        console.log(`   ✅ ${file}`);
      }
    });
  });
  console.log(`\n📊 Resultado: ${errors} erro(s) encontrado(s)`);
  return errors === 0;
}

if (require.main === module) {
  const isValid = validateProject();
  process.exit(isValid ? 0 : 1);
}

// Script para gerar hash da senha "Container0385!"
// Execute com: node gerar_hash_senha.js

const bcrypt = require('bcryptjs');

async function gerarHash() {
  try {
    const senha = 'Container0385!';
    const hash = await bcrypt.hash(senha, 10);
    
    console.log('=== HASH DA SENHA ===');
    console.log('Senha original:', senha);
    console.log('Hash gerado:', hash);
    console.log('\n=== SQL COMPLETO ===');
    console.log(`UPDATE usuarios SET senha_hash = '${hash}' WHERE nome = 'Dono Container';`);
    console.log('\n=== VERIFICAÇÃO ===');
    console.log('Testando se o hash está correto...');
    
    const isValid = await bcrypt.compare(senha, hash);
    console.log('Hash válido:', isValid ? '✅ SIM' : '❌ NÃO');
    
  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
}

gerarHash();

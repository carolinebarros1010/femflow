#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function logInfo(message) {
  console.log(`${colors.cyan}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}${message}${colors.reset}`);
}

function logError(message) {
  console.error(`${colors.red}${message}${colors.reset}`);
}

function runCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    logError(errorMessage);
    throw error;
  }
}

function validatePath(relativePath, expectedType = 'file') {
  const fullPath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`❌ Caminho obrigatório não encontrado: ${relativePath}`);
  }

  if (expectedType === 'directory' && !fs.statSync(fullPath).isDirectory()) {
    throw new Error(`❌ Esperado diretório, mas encontrado outro tipo: ${relativePath}`);
  }

  if (expectedType === 'file' && !fs.statSync(fullPath).isFile()) {
    throw new Error(`❌ Esperado arquivo, mas encontrado outro tipo: ${relativePath}`);
  }
}

function main() {
  const skipSync = process.argv.includes('--no-sync');

  try {
    logInfo('1️⃣ Validando ambiente...');
    runCommand('node --version', '❌ Node.js não está disponível no ambiente.');
    runCommand('npx cap --version', '❌ Capacitor CLI não está disponível. Instale/valide o acesso ao comando "npx cap".');

    logInfo('2️⃣ Build web...');
    runCommand('node tools/build-capacitor.mjs', '❌ Falha ao executar o build web com tools/build-capacitor.mjs.');
    logSuccess('✅ Web build concluído');

    logInfo('3️⃣ Validando cap/www...');
    const requiredPaths = [
      { relativePath: 'cap/www/home.html', expectedType: 'file' },
      { relativePath: 'cap/www/service-worker.js', expectedType: 'file' },
      { relativePath: 'cap/www/css', expectedType: 'directory' },
      { relativePath: 'cap/www/js', expectedType: 'directory' },
      { relativePath: 'cap/www/assets', expectedType: 'directory' }
    ];

    for (const item of requiredPaths) {
      validatePath(item.relativePath, item.expectedType);
    }
    logSuccess('✅ Estrutura cap/www validada');

    if (skipSync) {
      console.log(`${colors.yellow}⏭️  Flag --no-sync detectada. Etapa de sync Android ignorada.${colors.reset}`);
    } else {
      logInfo('4️⃣ Sync Android...');
      runCommand('npx cap sync android', '❌ Falha ao executar "npx cap sync android".');
      logSuccess('✅ Android sync concluído');
    }

    console.log('');
    logSuccess('🚀 FemFlow Mobile Release Finalizado');
    logSuccess(skipSync ? 'Web → cap/www OK (Android sync ignorado com --no-sync)' : 'Web → cap/www → Android OK');
  } catch (error) {
    logError(`\nErro fatal no release mobile: ${error.message}`);
    process.exit(1);
  }
}

main();

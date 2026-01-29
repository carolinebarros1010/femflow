/* ========================================================================
   FEMFLOW — 12_AUTH.gs
   ------------------------------------------------------------------------
   Responsabilidade ÚNICA:
   - Autenticação do Painel Personal (aba Personal)
   ======================================================================== */

function autenticarPersonal_(payload) {
  const senhaHash = obterSenhaHash_(payload);
  if (!senhaHash) throw new Error('Senha obrigatória.');

  const email = String(payload?.email || '').trim().toLowerCase();
  const telefone = normalizarTelefone_(payload?.telefone);
  const id = String(payload?.id || '').trim();

  if (!email && !telefone && !id) {
    throw new Error('Informe email, telefone ou ID.');
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName('Personal');
  if (!sheet) throw new Error('Aba Personal não encontrada.');

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error('Aba Personal sem registros.');

  const header = values.shift().map(h => String(h || '').trim().toLowerCase());
  const idx = {
    id: localizarColuna_(header, ['id']),
    nome: localizarColuna_(header, ['nome']),
    email: localizarColuna_(header, ['email', 'e-mail']),
    telefone: localizarColuna_(header, ['telefone', 'tel', 'celular']),
    senhaHash: localizarColuna_(header, ['senhahash', 'senha_hash', 'hash'])
  };

  if ([idx.id, idx.nome, idx.email, idx.telefone, idx.senhaHash].some(i => i < 0)) {
    throw new Error('Colunas obrigatórias ausentes na aba Personal.');
  }

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowId = String(row[idx.id] || '').trim();
    const rowNome = String(row[idx.nome] || '').trim();
    const rowEmail = String(row[idx.email] || '').trim().toLowerCase();
    const rowTelefone = normalizarTelefone_(row[idx.telefone]);
    const rowHash = String(row[idx.senhaHash] || '').trim().toLowerCase();

    const match = (id && rowId === id) ||
      (email && rowEmail && rowEmail === email) ||
      (telefone && rowTelefone && rowTelefone === telefone);

    if (!match) continue;

    if (!rowHash || rowHash !== senhaHash) {
      throw new Error('Credenciais inválidas.');
    }

    return {
      id: rowId,
      nome: rowNome,
      email: rowEmail,
      telefone: rowTelefone
    };
  }

  throw new Error('Credenciais inválidas.');
}

function cadastrarPersonal_(payload) {
  const nome = String(payload?.nome || '').trim();
  const senhaHash = obterSenhaHash_(payload);
  const email = String(payload?.email || '').trim().toLowerCase();
  const telefone = normalizarTelefone_(payload?.telefone);

  if (!nome || !senhaHash) throw new Error('Nome e senha são obrigatórios.');
  if (!email && !telefone) throw new Error('Informe email ou telefone.');

  const sheet = SpreadsheetApp.getActive().getSheetByName('Personal');
  if (!sheet) throw new Error('Aba Personal não encontrada.');

  const values = sheet.getDataRange().getValues();
  const header = values.shift().map(h => String(h || '').trim().toLowerCase());
  const idx = {
    id: localizarColuna_(header, ['id']),
    nome: localizarColuna_(header, ['nome']),
    email: localizarColuna_(header, ['email', 'e-mail']),
    telefone: localizarColuna_(header, ['telefone', 'tel', 'celular']),
    senhaHash: localizarColuna_(header, ['senhahash', 'senha_hash', 'hash'])
  };

  if ([idx.id, idx.nome, idx.email, idx.telefone, idx.senhaHash].some(i => i < 0)) {
    throw new Error('Colunas obrigatórias ausentes na aba Personal.');
  }

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowEmail = String(row[idx.email] || '').trim().toLowerCase();
    const rowTelefone = normalizarTelefone_(row[idx.telefone]);
    if (email && rowEmail && rowEmail === email) {
      throw new Error('Email já cadastrado.');
    }
    if (telefone && rowTelefone && rowTelefone === telefone) {
      throw new Error('Telefone já cadastrado.');
    }
  }

  const newId = gerarPersonalId_();
  const nextRow = sheet.getLastRow() + 1;
  const row = [];
  row[idx.id] = newId;
  row[idx.nome] = nome;
  row[idx.email] = email;
  row[idx.telefone] = telefone;
  row[idx.senhaHash] = senhaHash;
  sheet.getRange(nextRow, 1, 1, header.length).setValues([row]);

  return {
    id: newId,
    nome,
    email,
    telefone
  };
}

function localizarColuna_(header, nomes) {
  const lista = Array.isArray(nomes) ? nomes : [nomes];
  return header.findIndex(col => lista.includes(col));
}

function normalizarTelefone_(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function hashSenha_(senha) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    senha,
    Utilities.Charset.UTF_8
  );
  return digest.map(byte => {
    const hex = (byte + 256).toString(16).slice(-2);
    return hex;
  }).join('');
}

function obterSenhaHash_(payload) {
  const hash = String(payload?.senha_hash || payload?.senhaHash || '').trim().toLowerCase();
  if (hash) return hash;
  const senha = String(payload?.senha || '').trim();
  if (!senha) return '';
  return hashSenha_(senha);
}

function gerarPersonalId_() {
  return `PF-${Utilities.getUuid().slice(0, 8).toUpperCase()}`;
}

(() => {
  const BASE =
    window.FEMFLOW_ADMIN_BASE ||
    localStorage.getItem("femflow_script") ||
    "";
  const TOKEN_KEY = "femflow_admin_token";

  const el = (id) => document.getElementById(id);
  const setStatus = (text) => {
    const status = el("status");
    status.textContent = text;
  };
  const setBaseWarning = (visible) => {
    const warning = el("baseWarning");
    if (!warning) return;
    warning.style.display = visible ? "block" : "none";
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
  const setToken = (value) => localStorage.setItem(TOKEN_KEY, value);

  const serializeDate = (raw) => {
    if (!raw) return "";
    if (raw instanceof Date) {
      return raw.toISOString().slice(0, 10);
    }
    if (typeof raw === "string" && raw.includes("T")) {
      return raw.slice(0, 10);
    }
    return String(raw).slice(0, 10);
  };

  const resolveBaseUrl = () => {
    if (!BASE) return null;
    try {
      return new URL(BASE).toString();
    } catch (error) {
      return null;
    }
  };

  const apiGet = async (action, params = {}) => {
    const baseUrl = resolveBaseUrl();
    if (!baseUrl) {
      setStatus("Abra este painel via WebApp do Apps Script para carregar as alunas");
      return { status: "error", msg: "missing_base_url" };
    }
    setBaseWarning(false);
    const url = new URL(baseUrl);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    const response = await fetch(url.toString(), { method: "GET" });
    return response.json();
  };

  const apiPost = async (action, payload = {}) => {
    const baseUrl = resolveBaseUrl();
    if (!baseUrl) {
      setStatus("Abra este painel via WebApp do Apps Script para carregar as alunas");
      return { status: "error", msg: "missing_base_url" };
    }
    setBaseWarning(false);
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload })
    });
    return response.json();
  };

  const hydrateToken = () => {
    const saved = getToken();
    el("token").value = saved;
    el("tokenStatus").textContent = saved ? "Token carregado" : "Token não definido";
  };

  const collectToken = () => getToken() || el("token").value.trim();

  const handleSaveToken = () => {
    const value = el("token").value.trim();
    if (!value) return;
    setToken(value);
    el("tokenStatus").textContent = "Token salvo";
    setStatus("Token atualizado");
  };

  const handleCreate = async () => {
    setStatus("Salvando...");
    const token = collectToken();
    const payload = {
      token,
      nome: el("newNome").value,
      email: el("newEmail").value,
      telefone: el("newTelefone").value,
      produto: el("newProduto").value,
      dataCompra: el("newDataCompra").value,
      licencaAtiva: el("newLicenca").value,
      acessoPersonal: el("newPersonal").value
    };

    const resp = await apiPost("admin_create_aluna", payload);
    if (resp.status === "ok") {
      setStatus(`Nova aluna criada (${resp.id})`);
    } else {
      setStatus(resp.msg || "Erro ao criar");
    }
  };

  const handleSearch = async () => {
    setStatus("Buscando...");
    const token = collectToken();
    const raw = el("searchKey").value.trim();
    if (!raw) return;

    const params = {
      token,
      id: raw.includes("FF-") ? raw : "",
      email: raw.includes("@") ? raw : ""
    };

    const resp = await apiGet("admin_get_aluna", params);
    if (resp.status !== "ok") {
      setStatus("Não encontrada");
      el("editStatus").textContent = "";
      return;
    }

    const aluna = resp.aluna || {};
    el("editNome").value = aluna.nome || "";
    el("editEmail").value = aluna.email || "";
    el("editTelefone").value = aluna.telefone || "";
    el("editProduto").value = aluna.produto || "";
    el("editDataCompra").value = serializeDate(aluna.dataCompra);
    el("editLicenca").value = String(aluna.licencaAtiva);
    el("editPersonal").value = String(aluna.acessoPersonal);
    el("editStatus").textContent = `ID: ${aluna.id}`;
    setStatus("Aluna carregada");
  };

  const handleUpdate = async () => {
    setStatus("Atualizando...");
    const token = collectToken();
    const payload = {
      token,
      email: el("editEmail").value,
      nome: el("editNome").value,
      telefone: el("editTelefone").value,
      produto: el("editProduto").value,
      dataCompra: el("editDataCompra").value,
      licencaAtiva: el("editLicenca").value,
      acessoPersonal: el("editPersonal").value
    };

    const resp = await apiPost("admin_update_aluna", payload);
    if (resp.status === "ok") {
      setStatus("Alterações salvas");
    } else {
      setStatus(resp.msg || "Erro ao salvar");
    }
  };

  const renderList = (items) => {
    const tbody = el("listaNovas");
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted">Nenhuma aluna encontrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${serializeDate(item.dataCompra) || "-"}</td>
        <td>${item.id || "-"}</td>
        <td>${item.nome || "-"}</td>
        <td>${item.email || "-"}</td>
        <td>${item.produto || "-"}</td>
        <td>${item.licencaAtiva ? "Ativa" : "Inativa"}</td>
        <td>${item.acessoPersonal ? "Ligado" : "Desligado"}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  const handleLoadNew = async () => {
    setStatus("Carregando lista...");
    const token = collectToken();
    const sinceDays = el("sinceDays").value;
    const includeSemData = el("includeSemData").checked;
    const resp = await apiGet("admin_list_alunas", { token, sinceDays, includeSemData });
    if (resp.status !== "ok") {
      setStatus(resp.msg || "Erro ao carregar");
      return;
    }
    renderList(resp.items || []);
    setStatus(`Lista carregada (${resp.total || 0})`);
  };

  el("saveToken").addEventListener("click", handleSaveToken);
  el("createAluna").addEventListener("click", handleCreate);
  el("buscar").addEventListener("click", handleSearch);
  el("salvarEdicao").addEventListener("click", handleUpdate);
  el("carregarNovas").addEventListener("click", handleLoadNew);

  hydrateToken();
})();

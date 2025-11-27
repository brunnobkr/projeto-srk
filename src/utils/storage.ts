import type {
  ReceitaMaquina,
  ControleProducao,
  Funcionario,
  ControleFuncionarios,
  ProblemaTecnico,
  MudancaMelhoria,
  InstrucaoTrabalho,
  ComponenteProduto,
  SegurancaTrabalho,
  HistoricoVersao,
  TipoItem,
  PerfilUsuario,
  Acidente,
  Usuario,
  // Permissoes, // Não usado
  ProgramacaoPedido,
  Setor,
  Linha,
  ChamadoManutencao,
  MapeamentoFuncao,
  Mensagem,
  Conversa,
  Notificacao,
  Chamada,
  PermissoesModulo,
} from '../types';

const STORAGE_KEYS = {
  receitas: 'srk_receitas_maquina',
  producao: 'srk_controle_producao',
  funcionarios: 'srk_funcionarios',
  controleFuncionarios: 'srk_controle_funcionarios',
  problemas: 'srk_problemas_tecnicos',
  mudancas: 'srk_mudancas_melhorias',
  instrucoes: 'srk_instrucoes_trabalho',
  componentes: 'srk_componentes_produto',
  seguranca: 'srk_seguranca_trabalho',
  historico: 'srk_historico_versoes',
  perfil: 'srk_perfil_usuario',
  acidentes: 'srk_acidentes',
  usuarios: 'srk_usuarios',
  sessao: 'srk_sessao_atual',
  programacoesPedidos: 'srk_programacoes_pedidos',
  setores: 'srk_setores',
  chamados: 'srk_chamados_manutencao',
  mapeamentoFuncoes: 'srk_mapeamento_funcoes',
  mensagens: 'srk_mensagens',
  conversas: 'srk_conversas',
  notificacoes: 'srk_notificacoes',
  chamadas: 'srk_chamadas',
} as const;

// Funções genéricas de armazenamento
export const storage = {
  get: <T>(key: string, defaultValue: T[]): T[] => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T[]): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  },

  add: <T extends { id: string }>(key: string, item: T): void => {
    const items = storage.get<T>(key, []);
    items.push(item);
    storage.set(key, items);
  },

  update: <T extends { id: string }>(
    key: string, 
    id: string, 
    updates: Partial<T>,
    tipoItem?: TipoItem,
    motivo?: string
  ): void => {
    const items = storage.get<T>(key, []);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      // Salvar versão anterior no histórico
      if (tipoItem) {
        const itemAnterior = { ...items[index] };
        const historico = storage.get<HistoricoVersao<T>>(STORAGE_KEYS.historico, []);
        const versoesExistentes = historico.filter(h => h.itemId === id);
        const proximaVersao = versoesExistentes.length > 0 
          ? Math.max(...versoesExistentes.map(v => v.versao)) + 1 
          : 1;

        const versaoAnterior: HistoricoVersao<T> = {
          id: `${id}_v${proximaVersao}_${Date.now()}`,
          itemId: id,
          versao: proximaVersao,
          dados: itemAnterior,
          dataAlteracao: new Date().toISOString(),
          alteradoPor: 'Usuário', // Em produção, pegar do contexto de autenticação
          motivo: motivo,
        };

        historico.push(versaoAnterior);
        storage.set(STORAGE_KEYS.historico, historico);
      }

      // Atualizar item
      items[index] = { ...items[index], ...updates };
      storage.set(key, items);
    }
  },

  delete: <T extends { id: string }>(key: string, id: string): void => {
    const items = storage.get<T>(key, []);
    const filtered = items.filter(item => item.id !== id);
    storage.set(key, filtered);
  },
};

// Sistema de Histórico
export const historicoStorage = {
  getAll: <T>(): HistoricoVersao<T>[] => storage.get(STORAGE_KEYS.historico, []),
  getByItemId: <T>(itemId: string): HistoricoVersao<T>[] => {
    const historico = storage.get<HistoricoVersao<T>>(STORAGE_KEYS.historico, []);
    return historico.filter(h => h.itemId === itemId).sort((a, b) => b.versao - a.versao);
  },
  getByTipo: <T>(_tipoItem: TipoItem | undefined, itemId: string): HistoricoVersao<T>[] => {
    const historico = storage.get<HistoricoVersao<T>>(STORAGE_KEYS.historico, []);
    return historico.filter(h => h.itemId === itemId).sort((a, b) => b.versao - a.versao);
  },
};

// Funções específicas para cada módulo
export const receitasStorage = {
  getAll: (): ReceitaMaquina[] => storage.get(STORAGE_KEYS.receitas, []),
  add: (receita: ReceitaMaquina) => storage.add(STORAGE_KEYS.receitas, receita),
  update: (id: string, updates: Partial<ReceitaMaquina>, motivo?: string) =>
    storage.update(STORAGE_KEYS.receitas, id, updates, 'receita', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.receitas, id),
  getHistorico: (id: string): HistoricoVersao<ReceitaMaquina>[] => historicoStorage.getByItemId(id),
};

export const producaoStorage = {
  getAll: (): ControleProducao[] => storage.get(STORAGE_KEYS.producao, []),
  add: (controle: ControleProducao) => storage.add(STORAGE_KEYS.producao, controle),
  update: (id: string, updates: Partial<ControleProducao>, motivo?: string) =>
    storage.update(STORAGE_KEYS.producao, id, updates, 'producao', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.producao, id),
  getHistorico: (id: string): HistoricoVersao<ControleProducao>[] => historicoStorage.getByItemId(id),
};

export const funcionariosStorage = {
  getAll: (): Funcionario[] => storage.get(STORAGE_KEYS.funcionarios, []),
  add: (funcionario: Funcionario) => storage.add(STORAGE_KEYS.funcionarios, funcionario),
  update: (id: string, updates: Partial<Funcionario>, motivo?: string) =>
    storage.update(STORAGE_KEYS.funcionarios, id, updates, 'funcionario', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.funcionarios, id),
  getHistorico: (id: string): HistoricoVersao<Funcionario>[] => historicoStorage.getByItemId(id),
};

export const controleFuncionariosStorage = {
  getAll: (): ControleFuncionarios[] => storage.get(STORAGE_KEYS.controleFuncionarios, []),
  add: (controle: ControleFuncionarios) => storage.add(STORAGE_KEYS.controleFuncionarios, controle),
  update: (id: string, updates: Partial<ControleFuncionarios>, motivo?: string) =>
    storage.update(STORAGE_KEYS.controleFuncionarios, id, updates, 'controle-funcionario', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.controleFuncionarios, id),
  getHistorico: (id: string): HistoricoVersao<ControleFuncionarios>[] => historicoStorage.getByItemId(id),
};

export const problemasStorage = {
  getAll: (): ProblemaTecnico[] => storage.get(STORAGE_KEYS.problemas, []),
  add: (problema: ProblemaTecnico) => storage.add(STORAGE_KEYS.problemas, problema),
  update: (id: string, updates: Partial<ProblemaTecnico>, motivo?: string) =>
    storage.update(STORAGE_KEYS.problemas, id, updates, 'problema', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.problemas, id),
  getHistorico: (id: string): HistoricoVersao<ProblemaTecnico>[] => historicoStorage.getByItemId(id),
};

export const mudancasStorage = {
  getAll: (): MudancaMelhoria[] => storage.get(STORAGE_KEYS.mudancas, []),
  add: (mudanca: MudancaMelhoria) => storage.add(STORAGE_KEYS.mudancas, mudanca),
  update: (id: string, updates: Partial<MudancaMelhoria>, motivo?: string) =>
    storage.update(STORAGE_KEYS.mudancas, id, updates, 'mudanca', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.mudancas, id),
  getHistorico: (id: string): HistoricoVersao<MudancaMelhoria>[] => historicoStorage.getByItemId(id),
};

export const instrucoesStorage = {
  getAll: (): InstrucaoTrabalho[] => storage.get(STORAGE_KEYS.instrucoes, []),
  add: (instrucao: InstrucaoTrabalho) => storage.add(STORAGE_KEYS.instrucoes, instrucao),
  update: (id: string, updates: Partial<InstrucaoTrabalho>, motivo?: string) =>
    storage.update(STORAGE_KEYS.instrucoes, id, updates, 'instrucao', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.instrucoes, id),
  getHistorico: (id: string): HistoricoVersao<InstrucaoTrabalho>[] => historicoStorage.getByItemId(id),
};

export const componentesStorage = {
  getAll: (): ComponenteProduto[] => storage.get(STORAGE_KEYS.componentes, []),
  add: (componente: ComponenteProduto) => storage.add(STORAGE_KEYS.componentes, componente),
  update: (id: string, updates: Partial<ComponenteProduto>, motivo?: string) =>
    storage.update(STORAGE_KEYS.componentes, id, updates, 'componente', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.componentes, id),
  getHistorico: (id: string): HistoricoVersao<ComponenteProduto>[] => historicoStorage.getByItemId(id),
};

export const segurancaStorage = {
  getAll: (): SegurancaTrabalho[] => storage.get(STORAGE_KEYS.seguranca, []),
  add: (seguranca: SegurancaTrabalho) => storage.add(STORAGE_KEYS.seguranca, seguranca),
  update: (id: string, updates: Partial<SegurancaTrabalho>, motivo?: string) =>
    storage.update(STORAGE_KEYS.seguranca, id, updates, 'seguranca', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.seguranca, id),
  getHistorico: (id: string): HistoricoVersao<SegurancaTrabalho>[] => historicoStorage.getByItemId(id),
};

export const perfilStorage = {
  get: (): PerfilUsuario | null => {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.perfil);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (perfil: PerfilUsuario): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.perfil, JSON.stringify(perfil));
    } catch (error) {
      console.error('Erro ao salvar perfil no localStorage:', error);
    }
  },
  update: (updates: Partial<PerfilUsuario>): void => {
    const perfilAtual = perfilStorage.get();
    if (perfilAtual) {
      perfilStorage.set({
        ...perfilAtual,
        ...updates,
        dataAtualizacao: new Date().toISOString(),
      });
    } else {
      // Criar novo perfil se não existir
      const novoPerfil: PerfilUsuario = {
        id: 'perfil_usuario',
        nome: updates.nome || '',
        fotoPerfil: updates.fotoPerfil,
        telefoneCorporativo: updates.telefoneCorporativo,
        emailCorporativo: updates.emailCorporativo,
        cargo: updates.cargo,
        dataAtualizacao: new Date().toISOString(),
      };
      perfilStorage.set(novoPerfil);
    }
  },
};

export const acidentesStorage = {
  getAll: (): Acidente[] => storage.get(STORAGE_KEYS.acidentes, []),
  add: (acidente: Acidente) => storage.add(STORAGE_KEYS.acidentes, acidente),
  update: (id: string, updates: Partial<Acidente>, motivo?: string) =>
    storage.update(STORAGE_KEYS.acidentes, id, updates, undefined, motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.acidentes, id),
  getHistorico: (id: string): HistoricoVersao<Acidente>[] => historicoStorage.getByItemId(id),
};

export const usuariosStorage = {
  getAll: (): Usuario[] => storage.get(STORAGE_KEYS.usuarios, []),
  getById: (id: string): Usuario | null => {
    const usuarios = storage.get<Usuario>(STORAGE_KEYS.usuarios, []);
    return usuarios.find(u => u.id === id) || null;
  },
  getByUsername: (username: string): Usuario | null => {
    const usuarios = storage.get<Usuario>(STORAGE_KEYS.usuarios, []);
    return usuarios.find(u => u.username === username && u.isAtivo) || null;
  },
  add: (usuario: Usuario) => storage.add(STORAGE_KEYS.usuarios, usuario),
  update: (id: string, updates: Partial<Usuario>) => {
    const usuarios = storage.get<Usuario>(STORAGE_KEYS.usuarios, []);
    const index = usuarios.findIndex(u => u.id === id);
    if (index !== -1) {
      usuarios[index] = { ...usuarios[index], ...updates, dataAtualizacao: new Date().toISOString() };
      storage.set(STORAGE_KEYS.usuarios, usuarios);
    }
  },
  delete: (id: string) => storage.delete(STORAGE_KEYS.usuarios, id),
};

export const sessaoStorage = {
  get: (): Usuario | null => {
    try {
      const item = sessionStorage.getItem(STORAGE_KEYS.sessao);
      if (!item) return null;
      const usuarioId = JSON.parse(item);
      return usuariosStorage.getById(usuarioId);
    } catch {
      return null;
    }
  },
  set: (usuario: Usuario): void => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.sessao, JSON.stringify(usuario.id));
    } catch (error) {
      // Silencioso - não logar em produção
    }
  },
  clear: (): void => {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.sessao);
    } catch (error) {
      // Silencioso
    }
  },
};

export const programacoesPedidosStorage = {
  getAll: (): ProgramacaoPedido[] => storage.get(STORAGE_KEYS.programacoesPedidos, []),
  add: (programacao: ProgramacaoPedido) => storage.add(STORAGE_KEYS.programacoesPedidos, programacao),
  update: (id: string, updates: Partial<ProgramacaoPedido>) => {
    const programacoes = storage.get<ProgramacaoPedido>(STORAGE_KEYS.programacoesPedidos, []);
    const index = programacoes.findIndex(p => p.id === id);
    if (index !== -1) {
      programacoes[index] = { ...programacoes[index], ...updates };
      storage.set(STORAGE_KEYS.programacoesPedidos, programacoes);
    }
  },
  delete: (id: string) => storage.delete(STORAGE_KEYS.programacoesPedidos, id),
  getByCodigo: (codigo: string): ProgramacaoPedido[] => {
    const programacoes = storage.get<ProgramacaoPedido>(STORAGE_KEYS.programacoesPedidos, []);
    return programacoes.filter(p => p.codigoProduto === codigo);
  },
};

export const setoresStorage = {
  getAll: (): Setor[] => storage.get(STORAGE_KEYS.setores, []),
  add: (setor: Setor) => storage.add(STORAGE_KEYS.setores, setor),
  update: (id: string, updates: Partial<Setor>) => {
    const setores = storage.get<Setor>(STORAGE_KEYS.setores, []);
    const index = setores.findIndex(s => s.id === id);
    if (index !== -1) {
      setores[index] = { ...setores[index], ...updates, dataAtualizacao: new Date().toISOString() };
      storage.set(STORAGE_KEYS.setores, setores);
    }
  },
  delete: (id: string) => storage.delete(STORAGE_KEYS.setores, id),
  getById: (id: string): Setor | undefined => {
    const setores = storage.get<Setor>(STORAGE_KEYS.setores, []);
    return setores.find(s => s.id === id);
  },
  addLinha: (setorId: string, linha: Linha) => {
    const setores = storage.get<Setor>(STORAGE_KEYS.setores, []);
    const index = setores.findIndex(s => s.id === setorId);
    if (index !== -1) {
      setores[index].linhas.push(linha);
      setores[index].dataAtualizacao = new Date().toISOString();
      storage.set(STORAGE_KEYS.setores, setores);
    }
  },
  updateLinha: (setorId: string, linhaId: string, updates: Partial<Linha>) => {
    const setores = storage.get<Setor>(STORAGE_KEYS.setores, []);
    const setorIndex = setores.findIndex(s => s.id === setorId);
    if (setorIndex !== -1) {
      const linhaIndex = setores[setorIndex].linhas.findIndex(l => l.id === linhaId);
      if (linhaIndex !== -1) {
        setores[setorIndex].linhas[linhaIndex] = {
          ...setores[setorIndex].linhas[linhaIndex],
          ...updates,
          dataAtualizacao: new Date().toISOString(),
        };
        setores[setorIndex].dataAtualizacao = new Date().toISOString();
        storage.set(STORAGE_KEYS.setores, setores);
      }
    }
  },
  deleteLinha: (setorId: string, linhaId: string) => {
    const setores = storage.get<Setor>(STORAGE_KEYS.setores, []);
    const setorIndex = setores.findIndex(s => s.id === setorId);
    if (setorIndex !== -1) {
      setores[setorIndex].linhas = setores[setorIndex].linhas.filter(l => l.id !== linhaId);
      setores[setorIndex].dataAtualizacao = new Date().toISOString();
      storage.set(STORAGE_KEYS.setores, setores);
    }
  },
};

export const chamadosStorage = {
  getAll: (): ChamadoManutencao[] => storage.get(STORAGE_KEYS.chamados, []),
  add: (chamado: ChamadoManutencao) => storage.add(STORAGE_KEYS.chamados, chamado),
  update: (id: string, updates: Partial<ChamadoManutencao>) => {
    const chamados = storage.get<ChamadoManutencao>(STORAGE_KEYS.chamados, []);
    const index = chamados.findIndex(c => c.id === id);
    if (index !== -1) {
      chamados[index] = { ...chamados[index], ...updates };
      storage.set(STORAGE_KEYS.chamados, chamados);
    }
  },
  delete: (id: string) => storage.delete(STORAGE_KEYS.chamados, id),
  getById: (id: string): ChamadoManutencao | undefined => {
    const chamados = storage.get<ChamadoManutencao>(STORAGE_KEYS.chamados, []);
    return chamados.find(c => c.id === id);
  },
  getByTipo: (tipo: ChamadoManutencao['tipo']): ChamadoManutencao[] => {
    const chamados = storage.get<ChamadoManutencao>(STORAGE_KEYS.chamados, []);
    return chamados.filter(c => c.tipo === tipo);
  },
  getByStatus: (status: ChamadoManutencao['status']): ChamadoManutencao[] => {
    const chamados = storage.get<ChamadoManutencao>(STORAGE_KEYS.chamados, []);
    return chamados.filter(c => c.status === status);
  },
};

export const mapeamentoFuncoesStorage = {
  getAll: (): MapeamentoFuncao[] => storage.get(STORAGE_KEYS.mapeamentoFuncoes, []),
  add: (mapeamento: MapeamentoFuncao) => storage.add(STORAGE_KEYS.mapeamentoFuncoes, mapeamento),
  update: (id: string, updates: Partial<MapeamentoFuncao>) => {
    const mapeamentos = storage.get<MapeamentoFuncao>(STORAGE_KEYS.mapeamentoFuncoes, []);
    const index = mapeamentos.findIndex(m => m.id === id);
    if (index !== -1) {
      mapeamentos[index] = { ...mapeamentos[index], ...updates, dataAtualizacao: new Date().toISOString() };
      storage.set(STORAGE_KEYS.mapeamentoFuncoes, mapeamentos);
    }
  },
  delete: (id: string) => storage.delete(STORAGE_KEYS.mapeamentoFuncoes, id),
  getByFuncao: (funcao: string): MapeamentoFuncao | undefined => {
    const mapeamentos = storage.get<MapeamentoFuncao>(STORAGE_KEYS.mapeamentoFuncoes, []);
    return mapeamentos.find(m => m.funcao.toLowerCase() === funcao.toLowerCase() && m.ativo);
  },
  // Inicializar mapeamentos padrão
  inicializarPadroes: () => {
    const mapeamentos = storage.get<MapeamentoFuncao>(STORAGE_KEYS.mapeamentoFuncoes, []);
    if (mapeamentos.length === 0) {
      const agora = new Date().toISOString();
      
      // Função auxiliar para converter boolean em PermissoesModulo
      const boolToPermissao = (valor: boolean): PermissoesModulo => ({
        visualizar: valor,
        criar: valor,
        editar: valor,
        excluir: valor,
      });
      
      // Preparador - acesso básico
      const preparador: MapeamentoFuncao = {
        id: 'preparador',
        funcao: 'preparador',
        ativo: true,
        permissoes: {
          receitasMaquina: boolToPermissao(false),
          controleProducao: boolToPermissao(true),
          controleFuncionarios: boolToPermissao(false),
          problemasTecnicos: boolToPermissao(true),
          mudancasMelhorias: boolToPermissao(false),
          instrucoesTrabalho: boolToPermissao(true),
          componentesProduto: boolToPermissao(true),
          segurancaTrabalho: boolToPermissao(true),
          dashboardAdmin: false,
          gerenciarUsuarios: false,
          programarPedidos: false,
          criar: true,
          editar: true,
          excluir: false,
          visualizar: true,
        },
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor: 'Sistema',
      };

      // Engenharia - acesso completo
      const engenharia: MapeamentoFuncao = {
        id: 'engenharia',
        funcao: 'engenharia',
        ativo: true,
        permissoes: {
          receitasMaquina: boolToPermissao(true),
          controleProducao: boolToPermissao(true),
          controleFuncionarios: boolToPermissao(true),
          problemasTecnicos: boolToPermissao(true),
          mudancasMelhorias: boolToPermissao(true),
          instrucoesTrabalho: boolToPermissao(true),
          componentesProduto: boolToPermissao(true),
          segurancaTrabalho: boolToPermissao(true),
          dashboardAdmin: true,
          gerenciarUsuarios: false,
          programarPedidos: false,
          criar: true,
          editar: true,
          excluir: true,
          visualizar: true,
        },
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor: 'Sistema',
      };

      // Logística - acesso a pedidos
      const logistica: MapeamentoFuncao = {
        id: 'logistica',
        funcao: 'logistica',
        ativo: true,
        permissoes: {
          receitasMaquina: boolToPermissao(false),
          controleProducao: boolToPermissao(true),
          controleFuncionarios: boolToPermissao(false),
          problemasTecnicos: boolToPermissao(false),
          mudancasMelhorias: boolToPermissao(false),
          instrucoesTrabalho: boolToPermissao(true),
          componentesProduto: boolToPermissao(true),
          segurancaTrabalho: boolToPermissao(false),
          dashboardAdmin: false,
          gerenciarUsuarios: false,
          programarPedidos: true,
          criar: true,
          editar: true,
          excluir: false,
          visualizar: true,
        },
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor: 'Sistema',
      };

      // Líder - acesso intermediário
      const lider: MapeamentoFuncao = {
        id: 'lider',
        funcao: 'lider',
        ativo: true,
        permissoes: {
          receitasMaquina: boolToPermissao(true),
          controleProducao: boolToPermissao(true),
          controleFuncionarios: boolToPermissao(true),
          problemasTecnicos: boolToPermissao(true),
          mudancasMelhorias: boolToPermissao(false),
          instrucoesTrabalho: boolToPermissao(true),
          componentesProduto: boolToPermissao(true),
          segurancaTrabalho: boolToPermissao(true),
          dashboardAdmin: false,
          gerenciarUsuarios: false,
          programarPedidos: false,
          criar: true,
          editar: true,
          excluir: false,
          visualizar: true,
        },
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor: 'Sistema',
      };

      // Coordenador - acesso amplo
      const coordenador: MapeamentoFuncao = {
        id: 'coordenador',
        funcao: 'coordenador',
        ativo: true,
        permissoes: {
          receitasMaquina: boolToPermissao(true),
          controleProducao: boolToPermissao(true),
          controleFuncionarios: boolToPermissao(true),
          problemasTecnicos: boolToPermissao(true),
          mudancasMelhorias: boolToPermissao(true),
          instrucoesTrabalho: boolToPermissao(true),
          componentesProduto: boolToPermissao(true),
          segurancaTrabalho: boolToPermissao(true),
          dashboardAdmin: true,
          gerenciarUsuarios: false,
          programarPedidos: true,
          criar: true,
          editar: true,
          excluir: true,
          visualizar: true,
        },
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor: 'Sistema',
      };

      // Gerência - acesso quase total
      const gerencia: MapeamentoFuncao = {
        id: 'gerencia',
        funcao: 'gerencia',
        ativo: true,
        permissoes: {
          receitasMaquina: boolToPermissao(true),
          controleProducao: boolToPermissao(true),
          controleFuncionarios: boolToPermissao(true),
          problemasTecnicos: boolToPermissao(true),
          mudancasMelhorias: boolToPermissao(true),
          instrucoesTrabalho: boolToPermissao(true),
          componentesProduto: boolToPermissao(true),
          segurancaTrabalho: boolToPermissao(true),
          dashboardAdmin: true,
          gerenciarUsuarios: false,
          programarPedidos: true,
          criar: true,
          editar: true,
          excluir: true,
          visualizar: true,
        },
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor: 'Sistema',
      };

      const mapeamentosIniciais = [preparador, engenharia, logistica, lider, coordenador, gerencia];
      storage.set(STORAGE_KEYS.mapeamentoFuncoes, mapeamentosIniciais);
    }
  },
};

// Storage de Mensagens
export const mensagensStorage = {
  getAll: (): Mensagem[] => storage.get(STORAGE_KEYS.mensagens, []),
  add: (mensagem: Mensagem) => storage.add(STORAGE_KEYS.mensagens, mensagem),
  update: (id: string, updates: Partial<Mensagem>, motivo?: string) =>
    storage.update(STORAGE_KEYS.mensagens, id, updates, 'mensagem', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.mensagens, id),
  getByConversa: (conversaId: string): Mensagem[] => {
    return mensagensStorage.getAll().filter(m => m.conversaId === conversaId);
  },
  getByRemetenteEDestinatario: (remetenteId: string, destinatarioId: string): Mensagem[] => {
    return mensagensStorage.getAll().filter(m =>
      (m.remetenteId === remetenteId && m.destinatarioId === destinatarioId) ||
      (m.remetenteId === destinatarioId && m.destinatarioId === remetenteId)
    );
  },
  marcarComoLida: (id: string) => {
    mensagensStorage.update(id, { lida: true, dataLeitura: new Date().toISOString() });
  },
};

// Storage de Conversas
export const conversasStorage = {
  getAll: (): Conversa[] => storage.get(STORAGE_KEYS.conversas, []),
  add: (conversa: Conversa) => storage.add(STORAGE_KEYS.conversas, conversa),
  update: (id: string, updates: Partial<Conversa>, motivo?: string) =>
    storage.update(STORAGE_KEYS.conversas, id, updates, 'conversa', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.conversas, id),
  getByUsuario: (usuarioId: string): Conversa[] => {
    return conversasStorage.getAll().filter(c =>
      c.participante1Id === usuarioId || c.participante2Id === usuarioId
    );
  },
  getByParticipantes: (usuario1Id: string, usuario2Id: string): Conversa | undefined => {
    return conversasStorage.getAll().find(c =>
      (c.participante1Id === usuario1Id && c.participante2Id === usuario2Id) ||
      (c.participante1Id === usuario2Id && c.participante2Id === usuario1Id)
    );
  },
  criarOuObter: (usuario1Id: string, usuario2Id: string): Conversa => {
    const existente = conversasStorage.getByParticipantes(usuario1Id, usuario2Id);
    if (existente) return existente;

    const novaConversa: Conversa = {
      id: Date.now().toString(),
      participante1Id: usuario1Id,
      participante2Id: usuario2Id,
      naoLidas: 0,
      dataCriacao: new Date().toISOString(),
    };
    conversasStorage.add(novaConversa);
    return novaConversa;
  },
};

// Storage de Notificações
export const notificacoesStorage = {
  getAll: (): Notificacao[] => storage.get(STORAGE_KEYS.notificacoes, []),
  add: (notificacao: Notificacao) => storage.add(STORAGE_KEYS.notificacoes, notificacao),
  update: (id: string, updates: Partial<Notificacao>, motivo?: string) =>
    storage.update(STORAGE_KEYS.notificacoes, id, updates, 'notificacao', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.notificacoes, id),
  getByUsuario: (usuarioId: string): Notificacao[] => {
    return notificacoesStorage.getAll().filter(n => n.usuarioId === usuarioId);
  },
  getNaoLidas: (usuarioId: string): Notificacao[] => {
    return notificacoesStorage.getByUsuario(usuarioId).filter(n => !n.lida);
  },
  marcarComoLida: (id: string) => {
    notificacoesStorage.update(id, { lida: true });
  },
  marcarTodasComoLidas: (usuarioId: string) => {
    const naoLidas = notificacoesStorage.getNaoLidas(usuarioId);
    naoLidas.forEach(n => notificacoesStorage.marcarComoLida(n.id));
  },
};

// Storage de Chamadas
export const chamadasStorage = {
  getAll: (): Chamada[] => storage.get(STORAGE_KEYS.chamadas, []),
  add: (chamada: Chamada) => storage.add(STORAGE_KEYS.chamadas, chamada),
  update: (id: string, updates: Partial<Chamada>, motivo?: string) =>
    storage.update(STORAGE_KEYS.chamadas, id, updates, 'chamada', motivo),
  delete: (id: string) => storage.delete(STORAGE_KEYS.chamadas, id),
  getByUsuario: (usuarioId: string): Chamada[] => {
    return chamadasStorage.getAll().filter(c =>
      c.chamadorId === usuarioId || c.recebedorId === usuarioId
    );
  },
  getAtivas: (): Chamada[] => {
    return chamadasStorage.getAll().filter(c =>
      c.status === 'chamando' || c.status === 'em-andamento'
    );
  },
};


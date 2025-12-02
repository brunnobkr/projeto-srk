import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Upload, Mail, Save, X, AlertCircle, CheckCircle, Clock, Eye, FileText, Sparkles, Loader2 } from 'lucide-react';
import { programacoesPedidosStorage, componentesStorage, setoresStorage, problemasStorage, producaoStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ProgramacaoPedido, ComponenteProduto, Setor, ProblemaTecnico, AnexoPDF, DadosExtraidosIA, ControleProducao } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { processarExcel, processarPDF, criarAIBackend, obterOpenAIKey, salvarOpenAIKey } from '../utils/aiExtraction';
import { determinarTurno } from '../utils/turno';
import { determinarTurno } from '../utils/turno';

export default function ProgramacaoPedidos() {
  const { isLogistica, isPreparador, usuario } = useAuth();
  const [programacoes, setProgramacoes] = useState<ProgramacaoPedido[]>([]);
  const [componentes, setComponentes] = useState<ComponenteProduto[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingProgramacao, setEditingProgramacao] = useState<ProgramacaoPedido | null>(null);
  const [viewingProgramacao, setViewingProgramacao] = useState<ProgramacaoPedido | null>(null);
  const [anexosPDF, setAnexosPDF] = useState<AnexoPDF[]>([]);
  // Função auxiliar para determinar turno válido para produção (apenas 1, 2 ou 3)
  const determinarTurnoProducao = (): '1' | '2' | '3' => {
    const turno = determinarTurno();
    // Se for 'central', usar 1º turno como padrão (turno central não é usado para produção)
    return turno === 'central' ? '1' : turno as '1' | '2' | '3';
  };

  const [formData, setFormData] = useState({
    codigoProduto: '',
    setor: '',
    linha: '',
    quantidadeProgramada: '',
    turno: determinarTurnoProducao(),
    atencao: '',
  });
  const [emailData, setEmailData] = useState({
    setor: '',
    linha: '',
    quantidadeProgramada: '',
    turno: determinarTurnoProducao(),
    atencao: '',
    codigos: '', // Códigos separados por vírgula
  });
  const [filtroTurno, setFiltroTurno] = useState<'1' | '2' | '3' | 'todos'>('todos');
  const [_excelFile, setExcelFile] = useState<File | null>(null);
  const [problemasProducao, setProblemasProducao] = useState<ProblemaTecnico[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [dadosExtraidosIA, setDadosExtraidosIA] = useState<DadosExtraidosIA[]>([]);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [arquivoProcessando, setArquivoProcessando] = useState<File | null>(null);
  const [openAIKey, setOpenAIKey] = useState<string>(obterOpenAIKey() || '');
  const [showConfigAI, setShowConfigAI] = useState(false);

  useEffect(() => {
    if (isLogistica() || isPreparador()) {
      loadData();
      if (isLogistica()) {
        loadProblemasProducao();
      }
    }
  }, []);

  const loadData = () => {
    setProgramacoes(programacoesPedidosStorage.getAll());
    setComponentes(componentesStorage.getAll());
    const todosSetores = setoresStorage.getAll();
    // Filtrar apenas setores ativos
    setSetores(todosSetores.filter(s => s.ativo));
  };

  const loadProblemasProducao = () => {
    // Carregar problemas técnicos que afetam produção
    const todosProblemas = problemasStorage.getAll();
    const problemasAtivos = todosProblemas.filter(p => 
      (p.status === 'aberto' || p.status === 'em-andamento')
    );
    setProblemasProducao(problemasAtivos);

    // Carregar problemas de produção (produções com problemas)
    // const todasProducoes = producaoStorage.getAll(); // Não usado
    // Filtrar produções recentes (últimos 7 dias) que podem ter problemas
    // const dataLimite = new Date(); // Não usado
    // dataLimite.setDate(dataLimite.getDate() - 7); // Não usado
    // const producoesRecentes = todasProducoes.filter(p => // Não usado
    //   new Date(p.data) >= dataLimite // Não usado
    // ); // Não usado
    // setProblemasProducaoList(producoesRecentes); // Não usado
  };

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) {
          alert(`O arquivo ${file.name} é muito grande. Tamanho máximo: 10MB`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const novoAnexo: AnexoPDF = {
            nome: file.name,
            conteudo: base64String,
            dataUpload: new Date().toISOString(),
            tamanho: file.size,
          };
          setAnexosPDF((prev) => [...prev, novoAnexo]);
        };
        reader.onerror = () => {
          alert('Erro ao carregar o PDF. Por favor, tente novamente.');
        };
        reader.readAsDataURL(file);
      } else {
        alert('Por favor, selecione apenas arquivos PDF.');
      }
    });
    e.target.value = '';
  };

  const removePDF = (index: number) => {
    setAnexosPDF((prev) => prev.filter((_, i) => i !== index));
  };

  // Função auxiliar para criar registro no Controle de Produção automaticamente
  const criarControleProducaoAutomatico = (programacao: ProgramacaoPedido) => {
    // Usar o turno da programação, ou determinar baseado na hora se não tiver
    // Garantir que não seja 'central' (apenas 1, 2 ou 3)
    const turnoFinal = programacao.turno || determinarTurnoProducao();
    
    const controleProducao: ControleProducao = {
      id: `prod_${programacao.id}`,
      codigoTubo: programacao.codigoProduto,
      setor: programacao.setor,
      linha: programacao.linha,
      data: format(new Date(programacao.dataProgramacao || programacao.dataCriacao), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm'),
      turno: turnoFinal as '1' | '2' | '3' | 'central',
      quantidade30min: 0,
      quantidadeHora: 0,
      tempoMontagem: 0,
      maoObra: 0,
      maoObraPorLinha: 0,
      processo: 'Programado',
      quantidadeTotalLogistica: programacao.quantidadeProgramada,
      observacoes: `Importado automaticamente da programação de pedidos${programacao.estadoPedido ? ` (Estado: ${programacao.estadoPedido})` : ''}${programacao.atencao ? `. Atenção: ${programacao.atencao}` : ''}${programacao.turno ? ` (Turno: ${programacao.turno}º)` : ''}`,
    };

    producaoStorage.add(controleProducao);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const programacao: ProgramacaoPedido = {
      id: editingProgramacao?.id || Date.now().toString(),
      codigoProduto: formData.codigoProduto,
      setor: formData.setor,
      linha: formData.linha,
      quantidadeProgramada: parseInt(formData.quantidadeProgramada) || 0,
      dataProgramacao: new Date().toISOString(),
      turno: formData.turno,
      atencao: formData.atencao || undefined,
      importadoDe: 'manual',
      anexosPDF: anexosPDF.length > 0 ? anexosPDF : undefined,
      criadoPor: usuario?.nome || 'Logística',
      dataCriacao: editingProgramacao?.dataCriacao || new Date().toISOString(),
    };

    if (editingProgramacao) {
      programacoesPedidosStorage.update(editingProgramacao.id, programacao);
    } else {
      programacoesPedidosStorage.add(programacao);
      // Criar registro no Controle de Produção automaticamente apenas para novas programações
      criarControleProducaoAutomatico(programacao);
    }

    alert(editingProgramacao ? 'Programação atualizada com sucesso!' : 'Programação criada com sucesso e enviada automaticamente para o Controle de Produção!');
    resetForm();
    loadData();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codigos = emailData.codigos.split(',').map(c => c.trim()).filter(c => c);
    const programacoesCriadas: ProgramacaoPedido[] = [];
    
    codigos.forEach(codigo => {
      const programacao: ProgramacaoPedido = {
        id: `${Date.now()}_${codigo}`,
        codigoProduto: codigo,
        setor: emailData.setor,
        linha: emailData.linha,
        quantidadeProgramada: parseInt(emailData.quantidadeProgramada) || 0,
        dataProgramacao: new Date().toISOString(),
        turno: emailData.turno,
        atencao: emailData.atencao || undefined,
        importadoDe: 'email',
        arquivoOrigem: 'Email',
        criadoPor: usuario?.nome || 'Logística',
        dataCriacao: new Date().toISOString(),
      };

      programacoesPedidosStorage.add(programacao);
      programacoesCriadas.push(programacao);
      
      // Criar registro no Controle de Produção automaticamente
      criarControleProducaoAutomatico(programacao);
    });

    alert(`${codigos.length} programação(ões) criada(s) com sucesso e ${programacoesCriadas.length} registro(s) adicionado(s) ao Controle de Produção!`);
    setEmailData({
      setor: '',
      linha: '',
      quantidadeProgramada: '',
      turno: determinarTurnoProducao(),
      atencao: '',
      codigos: '',
    });
    setShowEmailModal(false);
    loadData();
  };

  // Processar arquivo com IA
  const handleArquivoIA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isPDF = file.name.endsWith('.pdf');

    if (!isExcel && !isPDF) {
      alert('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou PDF (.pdf)');
      return;
    }

    setProcessandoIA(true);
    setArquivoProcessando(file);
    setShowAIModal(true);

    try {
      // Criar backend de IA
      const aiBackend = openAIKey 
        ? criarAIBackend('openai', openAIKey)
        : criarAIBackend('local');

      // Processar arquivo
      let dadosExtraidos: DadosExtraidosIA[];
      
      if (isExcel) {
        dadosExtraidos = await processarExcel(file, aiBackend);
      } else {
        dadosExtraidos = await processarPDF(file, aiBackend);
      }

      setDadosExtraidosIA(dadosExtraidos);
    } catch (error: any) {
      alert(`Erro ao processar arquivo: ${error.message}`);
      setShowAIModal(false);
    } finally {
      setProcessandoIA(false);
      e.target.value = '';
    }
  };

  // Confirmar e criar programações após revisão
  const handleConfirmarIA = () => {
    if (dadosExtraidosIA.length === 0) {
      alert('Nenhum dado para confirmar');
      return;
    }

    const programacoesCriadas: ProgramacaoPedido[] = [];

    dadosExtraidosIA.forEach((dados, index) => {
      if (!dados.codigoProduto || !dados.setor || !dados.linha) {
        return; // Pular dados incompletos
      }

      const programacao: ProgramacaoPedido = {
        id: `${Date.now()}_${index}_${dados.codigoProduto}`,
        codigoProduto: dados.codigoProduto,
        setor: dados.setor,
        linha: dados.linha,
        quantidadeProgramada: dados.quantidade || 0,
        dataProgramacao: new Date().toISOString(),
        turno: dados.turno || determinarTurnoProducao(),
        atencao: dados.observacoes,
        importadoDe: 'ia',
        arquivoOrigem: arquivoProcessando?.name || 'Arquivo IA',
        estadoPedido: dados.estadoPedido || 'normal',
        revisado: true,
        dadosExtraidosIA: dados,
        criadoPor: usuario?.nome || 'Logística',
        dataCriacao: new Date().toISOString(),
      };

      programacoesPedidosStorage.add(programacao);
      programacoesCriadas.push(programacao);
    });

    // Criar registros no Controle de Produção automaticamente
    programacoesCriadas.forEach(programacao => {
      criarControleProducaoAutomatico(programacao);
    });

    alert(`${programacoesCriadas.length} programação(ões) criada(s) e ${programacoesCriadas.length} registro(s) adicionado(s) ao Controle de Produção!`);
    
    setDadosExtraidosIA([]);
    setArquivoProcessando(null);
    setShowAIModal(false);
    loadData();
  };

  // Editar dados extraídos pela IA
  const handleEditarDadosIA = (index: number, campo: keyof DadosExtraidosIA, valor: any) => {
    const novosDados = [...dadosExtraidosIA];
    novosDados[index] = { ...novosDados[index], [campo]: valor };
    setDadosExtraidosIA(novosDados);
  };

  // Remover item dos dados extraídos
  const handleRemoverDadosIA = (index: number) => {
    setDadosExtraidosIA(dadosExtraidosIA.filter((_, i) => i !== index));
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setExcelFile(file);
    // Em produção, usar biblioteca como xlsx para ler o arquivo
    alert('Funcionalidade de importação Excel será implementada. Por enquanto, use a programação manual ou por email.');
  };

  const handleEdit = (programacao: ProgramacaoPedido) => {
    setEditingProgramacao(programacao);
    setAnexosPDF(programacao.anexosPDF || []);
    setFormData({
      codigoProduto: programacao.codigoProduto,
      setor: programacao.setor,
      linha: programacao.linha,
      quantidadeProgramada: programacao.quantidadeProgramada.toString(),
      turno: programacao.turno || determinarTurnoProducao(),
      atencao: programacao.atencao || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta programação?')) {
      programacoesPedidosStorage.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      codigoProduto: '',
      setor: '',
      linha: '',
      quantidadeProgramada: '',
      turno: determinarTurnoProducao(),
      atencao: '',
    });
    setAnexosPDF([]);
    setEditingProgramacao(null);
    setShowModal(false);
  };

  const updateComponenteStatus = (codigo: string, status: 'ok' | 'atencao' | 'critico', notificacao?: string) => {
    const componente = componentes.find(c => c.codigo === codigo);
    if (componente) {
      componentesStorage.update(componente.id, {
        status,
        notificacao: notificacao || undefined,
        dataStatus: new Date().toISOString(),
        atualizadoPor: usuario?.nome || 'Logística',
      });
      loadData();
      alert('Status atualizado com sucesso!');
    }
  };

  // Filtrar programações: preparadores veem apenas do seu setor
  const filteredProgramacoes = programacoes.filter(p => {
    // Se for preparador, filtrar apenas do seu setor
    if (isPreparador() && usuario?.setor) {
      const setorUsuario = usuario.setor.toLowerCase().trim();
      const setorProgramacao = p.setor.toLowerCase().trim();
      // Comparar setores (pode ser nome completo ou parcial)
      if (!setorProgramacao.includes(setorUsuario) && !setorUsuario.includes(setorProgramacao)) {
        return false;
      }
    }
    
    // Filtrar por turno (se não for 'todos')
    if (filtroTurno !== 'todos' && p.turno !== filtroTurno) {
      return false;
    }
    
    // Aplicar filtro de busca
    return (
      p.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.linha.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!isLogistica() && !isPreparador()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas o setor de Logística e Preparadores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chamados e Problemas de Produção */}
      {problemasProducao.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Problemas Técnicos Afetando Produção</h2>
          </div>
          <div className="space-y-3">
            {problemasProducao.map((problema) => (
              <div key={problema.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        problema.tipo === 'mecanico' ? 'bg-red-100 text-red-800' :
                        problema.tipo === 'eletrico' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {problema.tipo === 'mecanico' ? 'Mecânico' :
                         problema.tipo === 'eletrico' ? 'Elétrico' : 'Sistema'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        problema.status === 'aberto' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {problema.status === 'aberto' ? 'Aberto' : 'Em Andamento'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{problema.maquina}</h4>
                    <p className="text-sm text-gray-600 mt-1">{problema.descricao}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {(() => {
                          try {
                            const data = new Date(problema.data);
                            if (isNaN(data.getTime())) return problema.data || '-';
                            return `${format(data, 'dd/MM/yyyy', { locale: ptBR })} às ${problema.hora || '-'}`;
                          } catch {
                            return problema.data || '-';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                  <a
                    href="/problemas-tecnicos"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver detalhes →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programação de Pedidos</h1>
          <p className="mt-2 text-gray-600">
            Gerencie a programação de pedidos e status dos códigos de produto
          </p>
        </div>
        <div className="flex space-x-2">
          {isPreparador() && (
            <div className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <span className="text-sm font-medium">Setor: {usuario?.setor || 'Não definido'}</span>
            </div>
          )}
          {isLogistica() && (
            <>
              <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                <Sparkles className="w-5 h-5 mr-2" />
                {processandoIA ? 'Processando...' : 'Processar com IA'}
                <input
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  onChange={handleArquivoIA}
                  className="hidden"
                  disabled={processandoIA}
                />
              </label>
              <button
                onClick={() => setShowConfigAI(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                title="Configurar API de IA (OpenAI)"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Config IA
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Mail className="w-5 h-5 mr-2" />
                Programar por Email
              </button>
              <button
                onClick={() => setShowExcelModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-5 h-5 mr-2" />
                Importar Excel
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Programação
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código, setor ou linha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Turno</label>
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value as '1' | '2' | '3' | 'todos')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="todos">Todos os Turnos</option>
              <option value="1">1º Turno (06:30-16:18)</option>
              <option value="2">2º Turno (16:18-01:30)</option>
              <option value="3">3º Turno (01:30-06:30)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status dos Componentes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Status dos Códigos de Produto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {componentes.map((componente) => (
            <div key={componente.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">Código: {componente.codigo}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => updateComponenteStatus(componente.codigo, 'ok', 'OK - Produção normal')}
                    className={`p-1 rounded ${componente.status === 'ok' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    title="OK"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateComponenteStatus(componente.codigo, 'atencao', 'Atenção - Verificar estoque')}
                    className={`p-1 rounded ${componente.status === 'atencao' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                    title="Atenção"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateComponenteStatus(componente.codigo, 'critico', 'Crítico - Urgente')}
                    className={`p-1 rounded ${componente.status === 'critico' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    title="Crítico"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className={`w-full h-2 rounded mb-2 ${
                componente.status === 'ok' ? 'bg-green-500' :
                componente.status === 'atencao' ? 'bg-yellow-500' :
                componente.status === 'critico' ? 'bg-red-500' :
                'bg-gray-300'
              }`}></div>
              {componente.notificacao && (
                <p className="text-xs text-gray-600 mt-1">{componente.notificacao}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Programações */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atenção</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProgramacoes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma programação encontrada
                  </td>
                </tr>
              ) : (
                filteredProgramacoes.map((programacao) => (
                  <tr key={programacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{programacao.codigoProduto}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{programacao.setor}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{programacao.linha}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {programacao.turno ? (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          programacao.turno === '1' ? 'bg-blue-100 text-blue-800' :
                          programacao.turno === '2' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {programacao.turno}º Turno
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{programacao.quantidadeProgramada}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        try {
                          const data = new Date(programacao.dataProgramacao);
                          if (isNaN(data.getTime())) return '-';
                          return format(data, 'dd/MM/yyyy', { locale: ptBR });
                        } catch {
                          return '-';
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        programacao.importadoDe === 'excel' ? 'bg-blue-100 text-blue-800' :
                        programacao.importadoDe === 'email' ? 'bg-green-100 text-green-800' :
                        programacao.importadoDe === 'ia' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {programacao.importadoDe === 'excel' ? 'Excel' :
                         programacao.importadoDe === 'email' ? 'Email' :
                         programacao.importadoDe === 'ia' ? 'IA' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {programacao.estadoPedido && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          programacao.estadoPedido === 'critico' ? 'bg-red-100 text-red-800' :
                          programacao.estadoPedido === 'alerta' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {programacao.estadoPedido === 'critico' ? 'Crítico' :
                           programacao.estadoPedido === 'alerta' ? 'Alerta' : 'Normal'}
                        </span>
                      )}
                      {!programacao.estadoPedido && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {programacao.atencao || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setViewingProgramacao(programacao)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Ver detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {isLogistica() && (
                        <>
                          <button
                            onClick={() => handleEdit(programacao)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(programacao.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Programação Manual */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingProgramacao ? 'Editar' : 'Nova'} Programação</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código do Produto *</label>
                <select
                  required
                  value={formData.codigoProduto}
                  onChange={(e) => setFormData({ ...formData, codigoProduto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {componentes.map(c => (
                    <option key={c.id} value={c.codigo}>{c.codigo}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Setor *</label>
                  <select
                    required
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione um setor...</option>
                    {setores.filter(s => s.ativo).map(setor => (
                      <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Linha *</label>
                  <select
                    required
                    value={formData.linha}
                    onChange={(e) => setFormData({ ...formData, linha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!formData.setor}
                  >
                    <option value="">Selecione uma linha...</option>
                    {setores
                      .find(s => s.nome === formData.setor)
                      ?.linhas.filter(l => l.ativo)
                      .map(linha => (
                        <option key={linha.id} value={linha.nome}>{linha.nome}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Turno *</label>
                  <select
                    required
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value as '1' | '2' | '3' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">1º Turno (06:30-16:18)</option>
                    <option value="2">2º Turno (16:18-01:30)</option>
                    <option value="3">3º Turno (01:30-06:30)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Central não é usado para programações de produção</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade Programada *</label>
                  <input
                    type="number"
                    required
                    value={formData.quantidadeProgramada}
                    onChange={(e) => setFormData({ ...formData, quantidadeProgramada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Atenção/Observações</label>
                <textarea
                  value={formData.atencao}
                  onChange={(e) => setFormData({ ...formData, atencao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Observações ou atenções sobre esta programação"
                />
              </div>
              
              {/* Seção de Anexos PDF */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Anexos PDF</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Adicionar Arquivo PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handlePDFUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tamanho máximo: 10MB por arquivo</p>
                </div>
                {anexosPDF.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Anexos adicionados ({anexosPDF.length}):</p>
                    <div className="space-y-2">
                      {anexosPDF.map((anexo, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{anexo.nome}</p>
                              {anexo.tamanho && (
                                <p className="text-xs text-gray-500">
                                  {(anexo.tamanho / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePDF(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Programação por Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Programar por Email</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Códigos do Produto *</label>
                <input
                  type="text"
                  required
                  value={emailData.codigos}
                  onChange={(e) => setEmailData({ ...emailData, codigos: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: ABC123, DEF456, GHI789 (separados por vírgula)"
                />
                <p className="text-xs text-gray-500 mt-1">Separe múltiplos códigos por vírgula</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Setor *</label>
                  <select
                    required
                    value={emailData.setor}
                    onChange={(e) => setEmailData({ ...emailData, setor: e.target.value, linha: '' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione um setor...</option>
                    {setores.filter(s => s.ativo).map(setor => (
                      <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Linha *</label>
                  <select
                    required
                    value={emailData.linha}
                    onChange={(e) => setEmailData({ ...emailData, linha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!emailData.setor}
                  >
                    <option value="">Selecione uma linha...</option>
                    {setores
                      .find(s => s.nome === emailData.setor)
                      ?.linhas.filter(l => l.ativo)
                      .map(linha => (
                        <option key={linha.id} value={linha.nome}>{linha.nome}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Turno *</label>
                  <select
                    required
                    value={emailData.turno}
                    onChange={(e) => setEmailData({ ...emailData, turno: e.target.value as '1' | '2' | '3' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">1º Turno (06:30-16:18)</option>
                    <option value="2">2º Turno (16:18-01:30)</option>
                    <option value="3">3º Turno (01:30-06:30)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade Programada *</label>
                  <input
                    type="number"
                    required
                    value={emailData.quantidadeProgramada}
                    onChange={(e) => setEmailData({ ...emailData, quantidadeProgramada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Atenções</label>
                <textarea
                  value={emailData.atencao}
                  onChange={(e) => setEmailData({ ...emailData, atencao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Atenções ou observações sobre a programação"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Mail className="w-5 h-5" />
                  <span>Programar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação Excel */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Importar Excel</h2>
              <button onClick={() => setShowExcelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Selecione o arquivo Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  O arquivo deve conter colunas: Código, Setor, Linha, Quantidade, Atenção
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Formato esperado:</strong><br />
                  Coluna A: Código do Produto<br />
                  Coluna B: Setor<br />
                  Coluna C: Linha<br />
                  Coluna D: Quantidade Programada<br />
                  Coluna E: Atenções (opcional)
                </p>
              </div>
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={() => setShowExcelModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização Detalhada */}
      {viewingProgramacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes da Programação de Pedido</h2>
              <button
                onClick={() => setViewingProgramacao(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Informações Gerais</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Código do Produto:</span>
                    <p className="text-gray-900">{viewingProgramacao.codigoProduto}</p>
                  </div>
                  {viewingProgramacao.setor && (
                    <div>
                      <span className="font-medium text-gray-700">Setor:</span>
                      <p className="text-gray-900">{viewingProgramacao.setor}</p>
                    </div>
                  )}
                  {viewingProgramacao.linha && (
                    <div>
                      <span className="font-medium text-gray-700">Linha:</span>
                      <p className="text-gray-900">{viewingProgramacao.linha}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Quantidade Programada:</span>
                    <p className="text-gray-900">{viewingProgramacao.quantidadeProgramada}</p>
                  </div>
                  {viewingProgramacao.turno && (
                    <div>
                      <span className="font-medium text-gray-700">Turno:</span>
                      <p className="text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          viewingProgramacao.turno === '1' ? 'bg-blue-100 text-blue-800' :
                          viewingProgramacao.turno === '2' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {viewingProgramacao.turno}º Turno
                        </span>
                      </p>
                    </div>
                  )}
                  {viewingProgramacao.atencao && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Atenção:</span>
                      <p className="text-gray-900">{viewingProgramacao.atencao}</p>
                    </div>
                  )}
                  {viewingProgramacao.dataCriacao && (() => {
                    try {
                      const data = new Date(viewingProgramacao.dataCriacao);
                      if (isNaN(data.getTime())) return null;
                      return (
                        <div>
                          <span className="font-medium text-gray-700">Criado em:</span>
                          <p className="text-gray-900">{format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                  {viewingProgramacao.dataProgramacao && (() => {
                    try {
                      const data = new Date(viewingProgramacao.dataProgramacao);
                      if (isNaN(data.getTime())) return null;
                      return (
                        <div>
                          <span className="font-medium text-gray-700">Data de Programação:</span>
                          <p className="text-gray-900">{format(data, 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>

              {/* Anexos PDF */}
              {viewingProgramacao.anexosPDF && Array.isArray(viewingProgramacao.anexosPDF) && viewingProgramacao.anexosPDF.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Anexos PDF ({viewingProgramacao.anexosPDF.length})</h3>
                  <div className="space-y-2">
                    {viewingProgramacao.anexosPDF.map((anexo, index) => {
                      if (!anexo || !anexo.nome || !anexo.conteudo) return null;
                      return (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-6 h-6 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{anexo.nome}</p>
                            {anexo.tamanho && (
                              <p className="text-xs text-gray-500">
                                {(anexo.tamanho / 1024 / 1024).toFixed(2)} MB
                                {anexo.dataUpload && (() => {
                                  try {
                                    const data = new Date(anexo.dataUpload);
                                    if (!isNaN(data.getTime())) {
                                      return ` - ${format(data, 'dd/MM/yyyy', { locale: ptBR })}`;
                                    }
                                  } catch {}
                                  return '';
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                        <a
                          href={anexo.conteudo}
                          download={anexo.nome}
                          className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                        >
                          Download
                        </a>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setViewingProgramacao(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Revisão de Dados Extraídos pela IA */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
                Revisar Dados Extraídos pela IA
              </h2>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setDadosExtraidosIA([]);
                  setArquivoProcessando(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {processandoIA ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                <p className="text-gray-600">Processando arquivo com IA...</p>
                <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
              </div>
            ) : dadosExtraidosIA.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum dado foi extraído do arquivo.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Arquivo:</strong> {arquivoProcessando?.name}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Itens encontrados:</strong> {dadosExtraidosIA.length}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Revise os dados abaixo e corrija se necessário antes de confirmar.
                  </p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {dadosExtraidosIA.map((dados, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">Item {index + 1}</h3>
                        <div className="flex items-center space-x-2">
                          {dados.confianca && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              dados.confianca >= 80 ? 'bg-green-100 text-green-800' :
                              dados.confianca >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Confiança: {dados.confianca}%
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoverDadosIA(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Código do Produto *</label>
                          <input
                            type="text"
                            value={dados.codigoProduto || ''}
                            onChange={(e) => handleEditarDadosIA(index, 'codigoProduto', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantidade *</label>
                          <input
                            type="number"
                            value={dados.quantidade || ''}
                            onChange={(e) => handleEditarDadosIA(index, 'quantidade', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Setor *</label>
                          <select
                            value={dados.setor || ''}
                            onChange={(e) => handleEditarDadosIA(index, 'setor', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            required
                          >
                            <option value="">Selecione...</option>
                            {setores.map(setor => (
                              <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Linha *</label>
                          <input
                            type="text"
                            value={dados.linha || ''}
                            onChange={(e) => handleEditarDadosIA(index, 'linha', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Turno *</label>
                          <select
                            value={dados.turno || determinarTurnoProducao()}
                            onChange={(e) => handleEditarDadosIA(index, 'turno', e.target.value as '1' | '2' | '3')}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            required
                          >
                            <option value="1">1º Turno (06:30-16:18)</option>
                            <option value="2">2º Turno (16:18-01:30)</option>
                            <option value="3">3º Turno (01:30-06:30)</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Estado do Pedido</label>
                          <select
                            value={dados.estadoPedido || 'normal'}
                            onChange={(e) => handleEditarDadosIA(index, 'estadoPedido', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="normal">Normal</option>
                            <option value="alerta">Alerta</option>
                            <option value="critico">Crítico</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Observações</label>
                          <textarea
                            value={dados.observacoes || ''}
                            onChange={(e) => handleEditarDadosIA(index, 'observacoes', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      setDadosExtraidosIA([]);
                      setArquivoProcessando(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarIA}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirmar e Criar Programações
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Configuração de IA */}
      {showConfigAI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
                Configuração de IA
              </h2>
              <button
                onClick={() => setShowConfigAI(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key (Opcional)
                </label>
                <input
                  type="password"
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para usar processamento local (menos preciso)
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Como obter a API Key:</strong>
                </p>
                <ol className="text-xs text-blue-700 mt-1 list-decimal list-inside space-y-1">
                  <li>Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                  <li>Crie uma conta ou faça login</li>
                  <li>Gere uma nova API key</li>
                  <li>Cole a chave aqui</li>
                </ol>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowConfigAI(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (openAIKey) {
                      salvarOpenAIKey(openAIKey);
                    } else {
                      localStorage.removeItem('openai_api_key');
                    }
                    setShowConfigAI(false);
                    alert('Configuração salva!');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


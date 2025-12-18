import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2, Search, PlusCircle, X, Shield, Clock, Image, FileText, Eye } from 'lucide-react';
import { segurancaStorage, problemasStorage, acidentesStorage, funcionariosStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { SegurancaTrabalho, PassoSeguranca, BotaoMaquina, CheckupSeguranca, ProblemaTecnico, Acidente, Funcionario } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function SegurancaTrabalho() {
  const { canCreate, canEdit, isEngenharia } = useAuth();
  const [segurancas, setSegurancas] = useState<SegurancaTrabalho[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSeguranca, setEditingSeguranca] = useState<SegurancaTrabalho | null>(null);
  
  const podeCriarEditar = canCreate('segurancaTrabalho') || canEdit('segurancaTrabalho') || isEngenharia();
  const [formData, setFormData] = useState({
    codigoProduto: '',
    titulo: '',
    passosMontagem: [] as PassoSeguranca[],
    sequenciaBotoes: [] as BotaoMaquina[],
    checkups: [] as CheckupSeguranca[],
  });

  const [novoPasso, setNovoPasso] = useState({
    ordem: 1,
    descricao: '',
    tipo: 'montagem' as 'montagem' | 'verificacao' | 'obrigatorio',
  });

  const [novoBotao, setNovoBotao] = useState({
    ordem: 1,
    nome: '',
    funcionalidade: '',
    obrigatorio: false,
  });

  const [novoCheckup, setNovoCheckup] = useState({
    item: '',
    frequencia: '',
    responsavel: '',
    obrigatorio: false,
  });

  const [problemasSeguranca, setProblemasSeguranca] = useState<ProblemaTecnico[]>([]);
  const [acidentesRecentes, setAcidentesRecentes] = useState<Acidente[]>([]);
  const [viewingAcidente, setViewingAcidente] = useState<Acidente | null>(null);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const [fotosModalAtual, setFotosModalAtual] = useState<string[]>([]);
  const [matriculaBusca, setMatriculaBusca] = useState('');
  const [resultadosMatricula, setResultadosMatricula] = useState<Acidente[]>([]);
  const [infoFuncionarioBusca, setInfoFuncionarioBusca] = useState<{ nome?: string; matricula?: string; setor?: string; cargo?: string } | null>(null);
  const [erroBuscaMatricula, setErroBuscaMatricula] = useState<string | null>(null);
  const [buscaMatriculaRealizada, setBuscaMatriculaRealizada] = useState(false);

  const funcionariosCache = funcionariosStorage.getAll();
  const funcionariosMap = new Map<string, Funcionario>();
  funcionariosCache.forEach((funcionario) => {
    funcionariosMap.set(funcionario.id, funcionario);
  });
  const matriculasDisponiveis = Array.from(
    new Set(
      funcionariosCache
        .map((funcionario) => funcionario.matricula)
        .filter((matricula): matricula is string => Boolean(matricula))
    )
  ).sort((a, b) => a.localeCompare(b));

  const normalizarMatricula = (valor?: string) =>
    valor ? valor.replace(/\s+/g, '').toLowerCase() : '';

  const getFuncionarioDoAcidente = (acidente: Acidente) => {
    return funcionariosMap.get(acidente.funcionarioId) || acidente.funcionario;
  };

  const formatarDataHoraAcidente = (acidente: Acidente) => {
    try {
      const data = new Date(acidente.data);
      if (Number.isNaN(data.getTime())) {
        return `${acidente.data || '-'}${acidente.hora ? ` às ${acidente.hora}` : ''}`;
      }
      const dataFormatada = format(data, 'dd/MM/yyyy', { locale: ptBR });
      return acidente.hora ? `${dataFormatada} às ${acidente.hora}` : dataFormatada;
    } catch {
      return `${acidente.data || '-'}${acidente.hora ? ` às ${acidente.hora}` : ''}`;
    }
  };

  const funcionarioVisualizado = viewingAcidente ? getFuncionarioDoAcidente(viewingAcidente) : undefined;

  const handleBuscarAcidentesPorMatricula = (event?: FormEvent) => {
    event?.preventDefault();
    setBuscaMatriculaRealizada(true);
    setErroBuscaMatricula(null);

    const termo = matriculaBusca.trim();
    if (!termo) {
      setErroBuscaMatricula('Informe a matrícula para realizar a busca.');
      setResultadosMatricula([]);
      setInfoFuncionarioBusca(null);
      return;
    }

    const matriculaNormalizada = normalizarMatricula(termo);
    const funcionarioEncontrado = funcionariosCache.find(
      (funcionario) => normalizarMatricula(funcionario.matricula) === matriculaNormalizada
    );

    const todosAcidentes = acidentesStorage.getAll();
    const acidentesFiltrados = todosAcidentes
      .filter((acidente) => {
        const funcionarioRelacionado = funcionariosMap.get(acidente.funcionarioId);
        const matriculaRelacionado = normalizarMatricula(funcionarioRelacionado?.matricula);
        const matriculaRegistrada = normalizarMatricula(acidente.funcionario?.matricula);

        if (matriculaRegistrada && matriculaRegistrada === matriculaNormalizada) {
          return true;
        }

        if (matriculaRelacionado && matriculaRelacionado === matriculaNormalizada) {
          return true;
        }

        if (funcionarioEncontrado && acidente.funcionarioId === funcionarioEncontrado.id) {
          return true;
        }

        return false;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    setResultadosMatricula(acidentesFiltrados);

    if (acidentesFiltrados.length === 0) {
      setInfoFuncionarioBusca(
        funcionarioEncontrado
          ? {
              nome: funcionarioEncontrado.nome,
              matricula: funcionarioEncontrado.matricula,
              setor: funcionarioEncontrado.setor,
              cargo: funcionarioEncontrado.cargo,
            }
          : { matricula: termo }
      );
      setErroBuscaMatricula('Nenhum acidente encontrado para esta matrícula.');
      return;
    }

    const funcionarioInfo =
      funcionarioEncontrado ||
      funcionariosMap.get(acidentesFiltrados[0].funcionarioId) ||
      acidentesFiltrados[0].funcionario ||
      null;

    setInfoFuncionarioBusca(
      funcionarioInfo
        ? {
            nome: funcionarioInfo.nome,
            matricula: funcionarioInfo.matricula,
            setor: funcionarioInfo.setor,
            cargo: funcionarioInfo.cargo,
          }
        : { matricula: termo }
    );
    setErroBuscaMatricula(null);
  };

  const handleLimparBuscaMatricula = () => {
    setMatriculaBusca('');
    setResultadosMatricula([]);
    setInfoFuncionarioBusca(null);
    setErroBuscaMatricula(null);
    setBuscaMatriculaRealizada(false);
  };

  useEffect(() => {
    loadSegurancas();
    loadProblemasSeguranca();
    loadAcidentesRecentes();
  }, []);

  const loadSegurancas = () => {
    setSegurancas(segurancaStorage.getAll());
  };

  const loadProblemasSeguranca = () => {
    const todosProblemas = problemasStorage.getAll();
    // Problemas que podem afetar segurança (todos os tipos)
    const problemasAtivos = todosProblemas.filter(p => 
      (p.status === 'aberto' || p.status === 'em-andamento')
    );
    setProblemasSeguranca(problemasAtivos);
  };

  const loadAcidentesRecentes = () => {
    const todosAcidentes = acidentesStorage.getAll();
    // Acidentes dos últimos 30 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    const acidentesFiltrados = todosAcidentes.filter(a => 
      new Date(a.data) >= dataLimite
    ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    setAcidentesRecentes(acidentesFiltrados.slice(0, 5)); // Últimos 5
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const seguranca: SegurancaTrabalho = {
      id: editingSeguranca?.id || Date.now().toString(),
      codigoProduto: formData.codigoProduto,
      titulo: formData.titulo,
      passosMontagem: formData.passosMontagem,
      sequenciaBotoes: formData.sequenciaBotoes,
      checkups: formData.checkups,
      dataCriacao: editingSeguranca?.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      criadoPor: 'Usuário',
    };

    if (editingSeguranca) {
      segurancaStorage.update(editingSeguranca.id, seguranca);
    } else {
      segurancaStorage.add(seguranca);
    }

    resetForm();
    loadSegurancas();
  };

  const handleEdit = (seguranca: SegurancaTrabalho) => {
    setEditingSeguranca(seguranca);
    setFormData({
      codigoProduto: seguranca.codigoProduto,
      titulo: seguranca.titulo,
      passosMontagem: seguranca.passosMontagem,
      sequenciaBotoes: seguranca.sequenciaBotoes,
      checkups: seguranca.checkups,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta documentação de segurança?')) {
      segurancaStorage.delete(id);
      loadSegurancas();
    }
  };

  const addPasso = () => {
    if (novoPasso.descricao) {
      setFormData({
        ...formData,
        passosMontagem: [...formData.passosMontagem, { ...novoPasso, ordem: formData.passosMontagem.length + 1 }],
      });
      setNovoPasso({
        ordem: formData.passosMontagem.length + 2,
        descricao: '',
        tipo: 'montagem',
      });
    }
  };

  const removePasso = (index: number) => {
    const novosPassos = formData.passosMontagem.filter((_, i) => i !== index).map((p, i) => ({ ...p, ordem: i + 1 }));
    setFormData({ ...formData, passosMontagem: novosPassos });
  };

  const addBotao = () => {
    if (novoBotao.nome && novoBotao.funcionalidade) {
      setFormData({
        ...formData,
        sequenciaBotoes: [...formData.sequenciaBotoes, { ...novoBotao, ordem: formData.sequenciaBotoes.length + 1 }],
      });
      setNovoBotao({
        ordem: formData.sequenciaBotoes.length + 2,
        nome: '',
        funcionalidade: '',
        obrigatorio: false,
      });
    }
  };

  const removeBotao = (index: number) => {
    const novosBotoes = formData.sequenciaBotoes.filter((_, i) => i !== index).map((b, i) => ({ ...b, ordem: i + 1 }));
    setFormData({ ...formData, sequenciaBotoes: novosBotoes });
  };

  const addCheckup = () => {
    if (novoCheckup.item && novoCheckup.frequencia && novoCheckup.responsavel) {
      setFormData({
        ...formData,
        checkups: [...formData.checkups, { ...novoCheckup }],
      });
      setNovoCheckup({
        item: '',
        frequencia: '',
        responsavel: '',
        obrigatorio: false,
      });
    }
  };

  const removeCheckup = (index: number) => {
    setFormData({ ...formData, checkups: formData.checkups.filter((_, i) => i !== index) });
  };

  const resetForm = () => {
    setFormData({
      codigoProduto: '',
      titulo: '',
      passosMontagem: [],
      sequenciaBotoes: [],
      checkups: [],
    });
    setNovoPasso({ ordem: 1, descricao: '', tipo: 'montagem' });
    setNovoBotao({ ordem: 1, nome: '', funcionalidade: '', obrigatorio: false });
    setNovoCheckup({ item: '', frequencia: '', responsavel: '', obrigatorio: false });
    setEditingSeguranca(null);
    setShowModal(false);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      montagem: 'Montagem',
      verificacao: 'Verificação',
      obrigatorio: 'Obrigatório',
    };
    return labels[tipo] || tipo;
  };

  const filteredSegurancas = segurancas.filter(s =>
    s.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Acidentes e Problemas de Segurança */}
      {(acidentesRecentes.length > 0 || problemasSeguranca.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Alertas de Segurança</h2>
          </div>

          {/* Acidentes Recentes */}
          {acidentesRecentes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Acidentes Recentes (Últimos 30 dias)</h3>
              <div className="space-y-3">
                {acidentesRecentes.map((acidente) => {
                  const funcionario = getFuncionarioDoAcidente(acidente);
                  return (
                    <div key={acidente.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            acidente.tipo === 'grave' ? 'bg-red-600 text-white' :
                            acidente.tipo === 'moderado' ? 'bg-orange-500 text-white' :
                            'bg-yellow-500 text-white'
                          }`}>
                            {acidente.tipo === 'grave' ? 'Grave' :
                             acidente.tipo === 'moderado' ? 'Moderado' : 'Leve'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          {acidente.numeroChamado && (
                            <span className="px-2 py-1 text-xs font-semibold bg-gray-700 text-white rounded">
                              {acidente.numeroChamado}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900">
                            {funcionario?.nome || acidente.funcionarioId || 'Funcionário não identificado'}
                          </h4>
                        </div>
                        {funcionario?.matricula && (
                          <p className="text-xs text-gray-500 mb-1">Matrícula: {funcionario.matricula}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{acidente.descricao}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span><strong>Setor:</strong> {acidente.setor}</span>
                          <span><strong>Localização:</strong> {acidente.localizacao}</span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatarDataHoraAcidente(acidente)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-3 flex-wrap">
                          {acidente.fotos && acidente.fotos.length > 0 && (
                            <button
                              onClick={() => {
                                setFotoSelecionada(acidente.fotos![0]);
                                setFotosModalAtual(acidente.fotos || []);
                                setShowFotoModal(true);
                              }}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              <Image className="w-4 h-4" />
                              <span>Ver {acidente.fotos.length} {acidente.fotos.length === 1 ? 'Foto' : 'Fotos'}</span>
                            </button>
                          )}
                          {acidente.anexosPDF && acidente.anexosPDF.length > 0 && (
                            <button
                              onClick={() => setViewingAcidente(acidente)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Ver {acidente.anexosPDF.length} {acidente.anexosPDF.length === 1 ? 'PDF' : 'PDFs'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => setViewingAcidente(acidente)}
                            className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Detalhes Completos</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Problemas Técnicos que Afetam Segurança */}
          {problemasSeguranca.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Problemas Técnicos que Podem Afetar Segurança</h3>
              <div className="space-y-3">
                {problemasSeguranca.map((problema) => (
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
                            {format(new Date(problema.data), 'dd/MM/yyyy', { locale: ptBR })} às {problema.hora}
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
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Segurança do Trabalho</h1>
          <p className="mt-2 text-gray-600">
            Documentação de segurança, passos de montagem e check-ups obrigatórios
          </p>
        </div>
        {podeCriarEditar && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Documentação
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Histórico de acidentes por matrícula</h2>
            <p className="text-sm text-gray-600">Digite a matrícula para visualizar todos os registros associados.</p>
          </div>
          {resultadosMatricula.length > 0 && !erroBuscaMatricula && (
            <span className="text-sm text-gray-500">
              {resultadosMatricula.length}{' '}
              {resultadosMatricula.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>
          )}
        </div>

        <form onSubmit={handleBuscarAcidentesPorMatricula} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              list="matriculas-acidentes"
              placeholder="Ex: 12345"
              value={matriculaBusca}
              onChange={(e) => setMatriculaBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <datalist id="matriculas-acidentes">
              {matriculasDisponiveis.map((matricula) => (
                <option key={matricula} value={matricula} />
              ))}
            </datalist>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Buscar
            </button>
            {(buscaMatriculaRealizada || matriculaBusca) && (
              <button
                type="button"
                onClick={handleLimparBuscaMatricula}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpar
              </button>
            )}
          </div>
        </form>

        {erroBuscaMatricula && (
          <div className="text-sm text-red-600">{erroBuscaMatricula}</div>
        )}

        {buscaMatriculaRealizada && (
          <div className="space-y-4">
            {infoFuncionarioBusca && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Funcionário:</strong> {infoFuncionarioBusca.nome || 'Nome não cadastrado'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Matrícula:</strong> {infoFuncionarioBusca.matricula || matriculaBusca || '-'}
                </p>
                {(infoFuncionarioBusca.setor || infoFuncionarioBusca.cargo) && (
                  <p className="text-sm text-gray-700">
                    <strong>Setor/Cargo:</strong>{' '}
                    {[infoFuncionarioBusca.setor, infoFuncionarioBusca.cargo].filter(Boolean).join(' • ')}
                  </p>
                )}
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Total de acidentes registrados:</strong> {resultadosMatricula.length}
                </p>
              </div>
            )}

            {resultadosMatricula.length === 0 && !erroBuscaMatricula && (
              <p className="text-sm text-gray-500">
                Nenhum acidente registrado para a matrícula informada.
              </p>
            )}

            {resultadosMatricula.length > 0 && (
              <div className="space-y-3">
                {resultadosMatricula.map((acidente) => {
                  const funcionario = getFuncionarioDoAcidente(acidente);
                  return (
                    <div key={acidente.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                acidente.tipo === 'grave'
                                  ? 'bg-red-600 text-white'
                                  : acidente.tipo === 'moderado'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-yellow-500 text-white'
                              }`}
                            >
                              {acidente.tipo === 'grave'
                                ? 'Grave'
                                : acidente.tipo === 'moderado'
                                  ? 'Moderado'
                                  : 'Leve'}
                            </span>
                            {acidente.numeroChamado && (
                              <span className="px-2 py-1 text-xs font-semibold bg-gray-700 text-white rounded">
                                {acidente.numeroChamado}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mt-2">
                            {funcionario?.nome || acidente.funcionarioId || 'Funcionário não identificado'}
                          </p>
                          {funcionario?.matricula && (
                            <p className="text-xs text-gray-500">Matrícula: {funcionario.matricula}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatarDataHoraAcidente(acidente)}</span>
                          </p>
                          <p>
                            <strong>Setor:</strong> {acidente.setor}
                          </p>
                          <p>
                            <strong>Localização:</strong> {acidente.localizacao}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">{acidente.descricao}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {acidente.fotos && acidente.fotos.length > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {acidente.fotos.length}{' '}
                            {acidente.fotos.length === 1 ? 'foto disponível' : 'fotos disponíveis'}
                          </span>
                        )}
                        {acidente.anexosPDF && acidente.anexosPDF.length > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            {acidente.anexosPDF.length}{' '}
                            {acidente.anexosPDF.length === 1 ? 'PDF anexado' : 'PDFs anexados'}
                          </span>
                        )}
                        <button
                          onClick={() => setViewingAcidente(acidente)}
                          className="ml-auto px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSegurancas.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhuma documentação encontrada
          </div>
        ) : (
          filteredSegurancas.map((seguranca) => (
            <div key={seguranca.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{seguranca.titulo}</h3>
                  <p className="text-sm text-gray-500">Código: {seguranca.codigoProduto}</p>
                </div>
                {podeCriarEditar && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(seguranca)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(seguranca.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div><strong>Passos de Montagem:</strong> {seguranca.passosMontagem.length}</div>
                <div><strong>Sequência de Botões:</strong> {seguranca.sequenciaBotoes.length}</div>
                <div><strong>Check-ups:</strong> {seguranca.checkups.length}</div>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                Atualizado: {format(new Date(seguranca.dataAtualizacao), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingSeguranca ? 'Editar' : 'Nova'} Documentação de Segurança</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código do Produto *</label>
                  <input type="text" required value={formData.codigoProduto} onChange={(e) => setFormData({ ...formData, codigoProduto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Título *</label>
                  <input type="text" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              {/* Passos de Montagem */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Passos de Montagem</h3>
                <div className="space-y-3 mb-4">
                  {formData.passosMontagem.map((passo, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-700">Passo {passo.ordem}:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            passo.tipo === 'obrigatorio' ? 'bg-red-100 text-red-800' :
                            passo.tipo === 'verificacao' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {getTipoLabel(passo.tipo)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{passo.descricao}</p>
                      </div>
                      <button type="button" onClick={() => removePasso(index)} className="text-red-600 hover:text-red-900 ml-4">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-3">
                    <select value={novoPasso.tipo} onChange={(e) => setNovoPasso({ ...novoPasso, tipo: e.target.value as any })} className="px-3 py-2 border rounded-lg">
                      <option value="montagem">Montagem</option>
                      <option value="verificacao">Verificação</option>
                      <option value="obrigatorio">Obrigatório</option>
                    </select>
                    <input type="text" placeholder="Descrição do passo" value={novoPasso.descricao} onChange={(e) => setNovoPasso({ ...novoPasso, descricao: e.target.value })} className="px-3 py-2 border rounded-lg" />
                    <button type="button" onClick={addPasso} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      <PlusCircle className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sequência de Botões */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Sequência de Botões da Máquina</h3>
                <div className="space-y-3 mb-4">
                  {formData.sequenciaBotoes.map((botao, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-700">Botão {botao.ordem}: {botao.nome}</span>
                          {botao.obrigatorio && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Obrigatório</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{botao.funcionalidade}</p>
                      </div>
                      <button type="button" onClick={() => removeBotao(index)} className="text-red-600 hover:text-red-900 ml-4">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-4 gap-3">
                    <input type="text" placeholder="Nome do botão" value={novoBotao.nome} onChange={(e) => setNovoBotao({ ...novoBotao, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                    <input type="text" placeholder="Funcionalidade" value={novoBotao.funcionalidade} onChange={(e) => setNovoBotao({ ...novoBotao, funcionalidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                    <label className="flex items-center">
                      <input type="checkbox" checked={novoBotao.obrigatorio} onChange={(e) => setNovoBotao({ ...novoBotao, obrigatorio: e.target.checked })} className="mr-2" />
                      <span className="text-sm">Obrigatório</span>
                    </label>
                    <button type="button" onClick={addBotao} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      <PlusCircle className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Check-ups */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Check-ups de Segurança</h3>
                <div className="space-y-3 mb-4">
                  {formData.checkups.map((checkup, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-700">{checkup.item}</span>
                          {checkup.obrigatorio && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Obrigatório</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">Frequência: {checkup.frequencia}</p>
                        <p className="text-sm text-gray-700">Responsável: {checkup.responsavel}</p>
                      </div>
                      <button type="button" onClick={() => removeCheckup(index)} className="text-red-600 hover:text-red-900 ml-4">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-4 gap-3">
                    <input type="text" placeholder="Item do check-up" value={novoCheckup.item} onChange={(e) => setNovoCheckup({ ...novoCheckup, item: e.target.value })} className="px-3 py-2 border rounded-lg" />
                    <input type="text" placeholder="Frequência" value={novoCheckup.frequencia} onChange={(e) => setNovoCheckup({ ...novoCheckup, frequencia: e.target.value })} className="px-3 py-2 border rounded-lg" />
                    <div className="flex items-center">
                      <input type="text" placeholder="Responsável" value={novoCheckup.responsavel} onChange={(e) => setNovoCheckup({ ...novoCheckup, responsavel: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg" />
                      <label className="ml-2 flex items-center">
                        <input type="checkbox" checked={novoCheckup.obrigatorio} onChange={(e) => setNovoCheckup({ ...novoCheckup, obrigatorio: e.target.checked })} className="mr-1" />
                        <span className="text-xs">Obrig.</span>
                      </label>
                    </div>
                    <button type="button" onClick={addCheckup} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      <PlusCircle className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingSeguranca ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização Detalhada do Acidente */}
      {viewingAcidente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Acidente</h2>
              <button
                onClick={() => setViewingAcidente(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Informações do Acidente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {viewingAcidente.numeroChamado && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Código do Chamado:</span>
                      <p className="text-gray-900 font-semibold text-lg">{viewingAcidente.numeroChamado}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Funcionário:</span>
                    <p className="text-gray-900">
                      {funcionarioVisualizado?.nome || viewingAcidente.funcionarioId || 'Não identificado'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Matrícula:</span>
                    <p className="text-gray-900">
                      {funcionarioVisualizado?.matricula || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Gravidade:</span>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        viewingAcidente.tipo === 'grave' ? 'bg-red-600 text-white' :
                        viewingAcidente.tipo === 'moderado' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {viewingAcidente.tipo === 'grave' ? 'Grave' :
                         viewingAcidente.tipo === 'moderado' ? 'Moderado' : 'Leve'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Setor:</span>
                    <p className="text-gray-900">{viewingAcidente.setor}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Localização:</span>
                    <p className="text-gray-900">{viewingAcidente.localizacao}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Data/Hora:</span>
                    <p className="text-gray-900">
                      {(() => {
                        try {
                          const data = new Date(viewingAcidente.data);
                          if (isNaN(data.getTime())) return viewingAcidente.data || '-';
                          return `${format(data, 'dd/MM/yyyy', { locale: ptBR })} às ${viewingAcidente.hora || '-'}`;
                        } catch {
                          return viewingAcidente.data || '-';
                        }
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Registrado por:</span>
                    <p className="text-gray-900">{viewingAcidente.registradoPor}</p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingAcidente.descricao}</p>
              </div>

              {/* Causas */}
              {viewingAcidente.causas && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Possíveis Causas</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingAcidente.causas}</p>
                </div>
              )}

              {/* Medidas Preventivas */}
              {viewingAcidente.medidasPreventivas && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Medidas Preventivas Sugeridas</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingAcidente.medidasPreventivas}</p>
                </div>
              )}

              {/* Fotos do Acidente */}
              {viewingAcidente.fotos && viewingAcidente.fotos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Fotos do Acidente ({viewingAcidente.fotos.length})</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {viewingAcidente.fotos.map((foto, index) => (
                      <div key={index} className="relative">
                        <img
                          src={foto}
                          alt={`Foto acidente ${index + 1}`}
                          className="w-full h-32 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setFotoSelecionada(foto);
                            setFotosModalAtual(viewingAcidente.fotos || []);
                            setShowFotoModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anexos PDF */}
              {viewingAcidente.anexosPDF && viewingAcidente.anexosPDF.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Anexos PDF ({viewingAcidente.anexosPDF.length})</h3>
                  <div className="space-y-2">
                    {viewingAcidente.anexosPDF.map((anexo, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-6 h-6 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{anexo.nome}</p>
                            {anexo.tamanho && (
                              <p className="text-xs text-gray-500">
                                {(anexo.tamanho / 1024 / 1024).toFixed(2)} MB
                                {anexo.dataUpload && ` - ${format(new Date(anexo.dataUpload), 'dd/MM/yyyy', { locale: ptBR })}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`
                                  <iframe src="${anexo.conteudo}" style="width:100%;height:100vh;border:none;"></iframe>
                                `);
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Visualizar
                          </button>
                          <a
                            href={anexo.conteudo}
                            download={anexo.nome}
                            className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setViewingAcidente(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Fotos */}
      {showFotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Fotos do Acidente</h2>
              <button
                onClick={() => {
                  setShowFotoModal(false);
                  setFotoSelecionada(null);
                  setFotosModalAtual([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {fotoSelecionada ? (
              <div className="relative">
                <img
                  src={fotoSelecionada}
                  alt="Foto ampliada"
                  className="max-w-full h-auto rounded-lg"
                />
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => {
                      const currentIndex = fotosModalAtual.indexOf(fotoSelecionada);
                      if (currentIndex > 0) {
                        setFotoSelecionada(fotosModalAtual[currentIndex - 1]);
                      }
                    }}
                    disabled={fotosModalAtual.indexOf(fotoSelecionada) === 0}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    {fotosModalAtual.indexOf(fotoSelecionada) + 1} de {fotosModalAtual.length}
                  </span>
                  <button
                    onClick={() => {
                      const currentIndex = fotosModalAtual.indexOf(fotoSelecionada);
                      if (currentIndex < fotosModalAtual.length - 1) {
                        setFotoSelecionada(fotosModalAtual[currentIndex + 1]);
                      }
                    }}
                    disabled={fotosModalAtual.indexOf(fotoSelecionada) === fotosModalAtual.length - 1}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
                <button
                  onClick={() => setFotoSelecionada(null)}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {fotosModalAtual.map((foto, index) => (
                  <div key={index} className="relative">
                    <img
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-32 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setFotoSelecionada(foto)}
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Foto {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


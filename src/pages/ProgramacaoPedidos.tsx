import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Upload, Mail, Save, X, AlertCircle, CheckCircle, Clock, Eye, FileText } from 'lucide-react';
import { programacoesPedidosStorage, componentesStorage, setoresStorage, problemasStorage } from '../utils/storage';
// producaoStorage removido - não usado
import { useAuth } from '../contexts/AuthContext';
import type { ProgramacaoPedido, ComponenteProduto, Setor, ProblemaTecnico, AnexoPDF } from '../types';
// ControleProducao removido - não usado
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function ProgramacaoPedidos() {
  const { isLogistica, usuario } = useAuth();
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
  const [formData, setFormData] = useState({
    codigoProduto: '',
    setor: '',
    linha: '',
    quantidadeProgramada: '',
    atencao: '',
  });
  const [emailData, setEmailData] = useState({
    setor: '',
    linha: '',
    quantidadeProgramada: '',
    atencao: '',
    codigos: '', // Códigos separados por vírgula
  });
  const [_excelFile, setExcelFile] = useState<File | null>(null);
  const [problemasProducao, setProblemasProducao] = useState<ProblemaTecnico[]>([]);
  // const [problemasProducaoList, setProblemasProducaoList] = useState<ControleProducao[]>([]); // Não usado

  useEffect(() => {
    if (isLogistica()) {
      loadData();
      loadProblemasProducao();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const programacao: ProgramacaoPedido = {
      id: editingProgramacao?.id || Date.now().toString(),
      codigoProduto: formData.codigoProduto,
      setor: formData.setor,
      linha: formData.linha,
      quantidadeProgramada: parseInt(formData.quantidadeProgramada) || 0,
      dataProgramacao: new Date().toISOString(),
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
    }

    alert(editingProgramacao ? 'Programação atualizada com sucesso!' : 'Programação criada com sucesso!');
    resetForm();
    loadData();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codigos = emailData.codigos.split(',').map(c => c.trim()).filter(c => c);
    
    codigos.forEach(codigo => {
      const programacao: ProgramacaoPedido = {
        id: `${Date.now()}_${codigo}`,
        codigoProduto: codigo,
        setor: emailData.setor,
        linha: emailData.linha,
        quantidadeProgramada: parseInt(emailData.quantidadeProgramada) || 0,
        dataProgramacao: new Date().toISOString(),
        atencao: emailData.atencao || undefined,
        importadoDe: 'email',
        arquivoOrigem: 'Email',
        criadoPor: usuario?.nome || 'Logística',
        dataCriacao: new Date().toISOString(),
      };

      programacoesPedidosStorage.add(programacao);

    });

    alert(`${codigos.length} programação(ões) criada(s) com sucesso!`);
    setEmailData({
      setor: '',
      linha: '',
      quantidadeProgramada: '',
      atencao: '',
      codigos: '',
    });
    setShowEmailModal(false);
    loadData();
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

  const filteredProgramacoes = programacoes.filter(p =>
    p.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.linha.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLogistica()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas o setor de Logística pode acessar esta página.</p>
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
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
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
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma programação encontrada
                  </td>
                </tr>
              ) : (
                filteredProgramacoes.map((programacao) => (
                  <tr key={programacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{programacao.codigoProduto}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{programacao.setor}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{programacao.linha}</td>
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
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {programacao.importadoDe === 'excel' ? 'Excel' :
                         programacao.importadoDe === 'email' ? 'Email' : 'Manual'}
                      </span>
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
    </div>
  );
}


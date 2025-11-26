import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, PlusCircle, X, Shield, Clock } from 'lucide-react';
import { segurancaStorage, problemasStorage, acidentesStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { SegurancaTrabalho, PassoSeguranca, BotaoMaquina, CheckupSeguranca, ProblemaTecnico, Acidente } from '../types';
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
                {acidentesRecentes.map((acidente) => (
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
                        <h4 className="font-semibold text-gray-900">
                          {acidente.funcionarioId || 'Funcionário não identificado'}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{acidente.descricao}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span><strong>Setor:</strong> {acidente.setor}</span>
                          <span><strong>Localização:</strong> {acidente.localizacao}</span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(new Date(acidente.data), 'dd/MM/yyyy', { locale: ptBR })} às {acidente.hora}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(seguranca)} className="text-primary-600 hover:text-primary-900">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(seguranca.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
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
    </div>
  );
}


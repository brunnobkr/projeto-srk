import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, X, CheckCircle, Clock, AlertCircle, Wrench, Zap, Hammer, Monitor } from 'lucide-react';
import { chamadosStorage } from '../utils/storage';
import { setoresStorage } from '../utils/storage';
import { usuariosStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import type { ChamadoManutencao } from '../types';
import { determinarTurno } from '../utils/turno';

interface ChamadosManutencaoProps {
  tipo: 'mecanica' | 'eletrica' | 'ferramentaria' | 'sistema';
  titulo: string;
  icone: React.ComponentType<{ className?: string }>;
}

export default function ChamadosManutencao({ tipo, titulo, icone: Icone }: ChamadosManutencaoProps) {
  const { usuario } = useAuth();
  const [chamados, setChamados] = useState<ChamadoManutencao[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChamadoManutencao['status'] | 'todos'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingChamado, setEditingChamado] = useState<ChamadoManutencao | null>(null);
  const [viewingChamado, setViewingChamado] = useState<ChamadoManutencao | null>(null);
  const [formData, setFormData] = useState({
    categoria: '',
    titulo: '',
    descricao: '',
    setor: '',
    linha: '',
    maquina: '',
    prioridade: 'media' as ChamadoManutencao['prioridade'],
    observacoes: '',
  });
  const [fotos, setFotos] = useState<string[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [linhas, setLinhas] = useState<any[]>([]);

  useEffect(() => {
    loadChamados();
    loadSetores();
  }, []);

  useEffect(() => {
    if (formData.setor) {
      const setorSelecionado = setores.find(s => s.id === formData.setor);
      if (setorSelecionado) {
        setLinhas(setorSelecionado.linhas || []);
      } else {
        setLinhas([]);
      }
    } else {
      setLinhas([]);
    }
  }, [formData.setor, setores]);

  const loadChamados = () => {
    const todosChamados = chamadosStorage.getByTipo(tipo);
    setChamados(todosChamados);
  };

  const loadSetores = () => {
    const setoresData = setoresStorage.getAll();
    // Filtrar apenas setores ativos
    setSetores(setoresData.filter(s => s.ativo));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFotos([...fotos, event.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      categoria: '',
      titulo: '',
      descricao: '',
      setor: '',
      linha: '',
      maquina: '',
      prioridade: 'media',
      observacoes: '',
    });
    setFotos([]);
    setEditingChamado(null);
    setShowModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    const agora = new Date();
    const horaSolicitacao = editingChamado?.horaSolicitacao || format(agora, 'HH:mm');
    const turno = editingChamado?.turno || determinarTurno(horaSolicitacao);
    
    const novoChamado: ChamadoManutencao = {
      id: editingChamado?.id || `chamado_${Date.now()}`,
      tipo,
      categoria: formData.categoria,
      titulo: formData.titulo,
      descricao: formData.descricao,
      setor: formData.setor,
      linha: formData.linha || undefined,
      maquina: formData.maquina || undefined,
      prioridade: formData.prioridade,
      status: editingChamado?.status || 'aberto',
      solicitadoPor: usuario.id,
      solicitadoPorNome: usuario.nome,
      dataSolicitacao: editingChamado?.dataSolicitacao || agora.toISOString(),
      horaSolicitacao: horaSolicitacao,
      turno: turno,
      atribuidoPara: editingChamado?.atribuidoPara,
      atribuidoParaNome: editingChamado?.atribuidoParaNome,
      dataAtribuicao: editingChamado?.dataAtribuicao,
      dataInicio: editingChamado?.dataInicio,
      dataResolucao: editingChamado?.dataResolucao,
      tempoResolucao: editingChamado?.tempoResolucao,
      solucao: editingChamado?.solucao,
      observacoes: formData.observacoes || undefined,
      fotos: fotos.length > 0 ? fotos : undefined,
      pecasUtilizadas: editingChamado?.pecasUtilizadas,
      custoEstimado: editingChamado?.custoEstimado,
      custoReal: editingChamado?.custoReal,
    };

    if (editingChamado) {
      chamadosStorage.update(editingChamado.id, novoChamado);
    } else {
      chamadosStorage.add(novoChamado);
    }

    loadChamados();
    resetForm();
  };

  const handleEdit = (chamado: ChamadoManutencao) => {
    setEditingChamado(chamado);
    setFormData({
      categoria: chamado.categoria,
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      setor: chamado.setor,
      linha: chamado.linha || '',
      maquina: chamado.maquina || '',
      prioridade: chamado.prioridade,
      observacoes: chamado.observacoes || '',
    });
    setFotos(chamado.fotos || []);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este chamado?')) {
      chamadosStorage.delete(id);
      loadChamados();
    }
  };

  const handleView = (chamado: ChamadoManutencao) => {
    setViewingChamado(chamado);
  };

  const getStatusColor = (status: ChamadoManutencao['status']) => {
    switch (status) {
      case 'aberto':
        return 'bg-red-100 text-red-800';
      case 'em-andamento':
        return 'bg-yellow-100 text-yellow-800';
      case 'aguardando-peca':
        return 'bg-orange-100 text-orange-800';
      case 'aguardando-aprovacao':
        return 'bg-blue-100 text-blue-800';
      case 'resolvido':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ChamadoManutencao['status']) => {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em-andamento':
        return 'Em Andamento';
      case 'aguardando-peca':
        return 'Aguardando Peça';
      case 'aguardando-aprovacao':
        return 'Aguardando Aprovação';
      case 'resolvido':
        return 'Resolvido';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPrioridadeColor = (prioridade: ChamadoManutencao['prioridade']) => {
    switch (prioridade) {
      case 'critica':
        return 'bg-red-600 text-white';
      case 'alta':
        return 'bg-orange-500 text-white';
      case 'media':
        return 'bg-yellow-500 text-white';
      case 'baixa':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const filteredChamados = chamados.filter(c => {
    const matchesSearch = 
      c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.maquina?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.setor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Icone className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{titulo}</h1>
            <p className="text-gray-600">Gerenciamento de chamados de {titulo.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Chamado</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="aberto">Aberto</option>
              <option value="em-andamento">Em Andamento</option>
              <option value="aguardando-peca">Aguardando Peça</option>
              <option value="aguardando-aprovacao">Aguardando Aprovação</option>
              <option value="resolvido">Resolvido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Chamados */}
      <div className="grid grid-cols-1 gap-4">
        {filteredChamados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Icone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum chamado encontrado</p>
          </div>
        ) : (
          filteredChamados.map((chamado) => (
            <div key={chamado.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{chamado.titulo}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(chamado.status)}`}>
                      {getStatusLabel(chamado.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadeColor(chamado.prioridade)}`}>
                      {chamado.prioridade.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{chamado.descricao}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span><strong>Setor:</strong> {chamado.setor}</span>
                    {chamado.linha && <span><strong>Linha:</strong> {chamado.linha}</span>}
                    {chamado.maquina && <span><strong>Máquina:</strong> {chamado.maquina}</span>}
                    <span><strong>Solicitado por:</strong> {chamado.solicitadoPorNome}</span>
                    <span><strong>Data:</strong> {format(new Date(chamado.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })} às {chamado.horaSolicitacao}</span>
                    {chamado.atribuidoParaNome && (
                      <span><strong>Atribuído para:</strong> {chamado.atribuidoParaNome}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleView(chamado)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(chamado)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(chamado.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingChamado ? 'Editar Chamado' : 'Novo Chamado'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ex: Máquina, Sistema, Ferramenta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade *
                    </label>
                    <select
                      required
                      value={formData.prioridade}
                      onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Título do chamado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    required
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Descreva o problema ou solicitação"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Setor *
                    </label>
                    <select
                      required
                      value={formData.setor}
                      onChange={(e) => setFormData({ ...formData, setor: e.target.value, linha: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Selecione um setor</option>
                      {setores.filter(s => s.ativo).map(setor => (
                        <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Linha
                    </label>
                    <select
                      value={formData.linha}
                      onChange={(e) => setFormData({ ...formData, linha: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      disabled={!formData.setor}
                    >
                      <option value="">Selecione uma linha</option>
                      {linhas.map(linha => (
                        <option key={linha.id} value={linha.nome}>{linha.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máquina/Equipamento
                    </label>
                    <input
                      type="text"
                      value={formData.maquina}
                      onChange={(e) => setFormData({ ...formData, maquina: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Nome da máquina"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Observações adicionais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fotos
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  {fotos.length > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {fotos.map((foto, index) => (
                        <div key={index} className="relative">
                          <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeFoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingChamado ? 'Atualizar' : 'Criar'} Chamado
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {viewingChamado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes do Chamado</h2>
                <button
                  onClick={() => setViewingChamado(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{viewingChamado.titulo}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(viewingChamado.status)}`}>
                      {getStatusLabel(viewingChamado.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadeColor(viewingChamado.prioridade)}`}>
                      {viewingChamado.prioridade.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-700">{viewingChamado.descricao}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-gray-700">Categoria:</strong> {viewingChamado.categoria}
                  </div>
                  <div>
                    <strong className="text-gray-700">Setor:</strong> {viewingChamado.setor}
                  </div>
                  {viewingChamado.linha && (
                    <div>
                      <strong className="text-gray-700">Linha:</strong> {viewingChamado.linha}
                    </div>
                  )}
                  {viewingChamado.maquina && (
                    <div>
                      <strong className="text-gray-700">Máquina:</strong> {viewingChamado.maquina}
                    </div>
                  )}
                  <div>
                    <strong className="text-gray-700">Solicitado por:</strong> {viewingChamado.solicitadoPorNome}
                  </div>
                  <div>
                    <strong className="text-gray-700">Data:</strong> {format(new Date(viewingChamado.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })} às {viewingChamado.horaSolicitacao}
                  </div>
                  {viewingChamado.atribuidoParaNome && (
                    <div>
                      <strong className="text-gray-700">Atribuído para:</strong> {viewingChamado.atribuidoParaNome}
                    </div>
                  )}
                  {viewingChamado.observacoes && (
                    <div className="col-span-2">
                      <strong className="text-gray-700">Observações:</strong> {viewingChamado.observacoes}
                    </div>
                  )}
                </div>

                {viewingChamado.fotos && viewingChamado.fotos.length > 0 && (
                  <div>
                    <strong className="text-gray-700 block mb-2">Fotos:</strong>
                    <div className="grid grid-cols-4 gap-2">
                      {viewingChamado.fotos.map((foto, index) => (
                        <img key={index} src={foto} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


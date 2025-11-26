import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { mudancasStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { MudancaMelhoria } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { determinarTurno } from '../utils/turno';

export default function MudancasMelhorias() {
  const { usuario } = useAuth();
  const [mudancas, setMudancas] = useState<MudancaMelhoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMudanca, setEditingMudanca] = useState<MudancaMelhoria | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'atualizacao' as 'atualizacao' | 'ajuste-receita' | 'correcao-problema',
    titulo: '',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora: format(new Date(), 'HH:mm'),
    turno: determinarTurno() as '1' | '2' | '3' | 'central',
    interrompeuProducao: false,
    engenheiro: '',
    status: 'planejado' as 'planejado' | 'em-execucao' | 'concluido',
    observacoes: '',
  });

  useEffect(() => {
    loadMudancas();
  }, []);

  const loadMudancas = () => {
    setMudancas(mudancasStorage.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const turno = formData.turno || determinarTurno(formData.hora);
    
    const mudanca: MudancaMelhoria = {
      id: editingMudanca?.id || Date.now().toString(),
      tipo: formData.tipo,
      titulo: formData.titulo,
      descricao: formData.descricao,
      data: formData.data,
      hora: formData.hora,
      turno: turno,
      interrompeuProducao: formData.interrompeuProducao,
      engenheiro: formData.engenheiro || usuario?.nome || 'Engenheiro não identificado',
      status: formData.status,
      dataConclusao: formData.status === 'concluido' ? new Date().toISOString() : undefined,
      observacoes: formData.observacoes || undefined,
    };

    if (editingMudanca) {
      mudancasStorage.update(editingMudanca.id, mudanca);
    } else {
      mudancasStorage.add(mudanca);
    }

    resetForm();
    loadMudancas();
  };

  const handleEdit = (mudanca: MudancaMelhoria) => {
    setEditingMudanca(mudanca);
    setFormData({
      tipo: mudanca.tipo,
      titulo: mudanca.titulo,
      descricao: mudanca.descricao,
      data: mudanca.data,
      hora: mudanca.hora,
      turno: mudanca.turno || determinarTurno(mudanca.hora),
      interrompeuProducao: mudanca.interrompeuProducao,
      status: mudanca.status,
      observacoes: mudanca.observacoes || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta mudança?')) {
      mudancasStorage.delete(id);
      loadMudancas();
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'atualizacao',
      titulo: '',
      descricao: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm'),
      turno: determinarTurno(),
      interrompeuProducao: false,
      status: 'planejado',
      observacoes: '',
    });
    setEditingMudanca(null);
    setShowModal(false);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      atualizacao: 'Atualização',
      'ajuste-receita': 'Ajuste de Receita',
      'correcao-problema': 'Correção de Problema',
    };
    return labels[tipo] || tipo;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planejado: 'Planejado',
      'em-execucao': 'Em Execução',
      concluido: 'Concluído',
    };
    return labels[status] || status;
  };

  const filteredMudancas = mudancas.filter(m =>
    m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mudanças e Melhorias</h1>
          <p className="mt-2 text-gray-600">
            Controle de atualizações, ajustes e correções pela engenharia
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Mudança
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engenheiro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interrompeu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMudancas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma mudança encontrada
                  </td>
                </tr>
              ) : (
                filteredMudancas.map((mudanca) => (
                  <tr key={mudanca.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {getTipoLabel(mudanca.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{mudanca.titulo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{mudanca.engenheiro}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(mudanca.data), 'dd/MM/yyyy', { locale: ptBR })} {mudanca.hora}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mudanca.interrompeuProducao ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Sim</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        mudanca.status === 'planejado' ? 'bg-gray-100 text-gray-800' :
                        mudanca.status === 'em-execucao' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getStatusLabel(mudanca.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleEdit(mudanca)} className="text-primary-600 hover:text-primary-900 mr-4">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(mudanca.id)} className="text-red-600 hover:text-red-900">
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingMudanca ? 'Editar' : 'Nova'} Mudança</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <select required value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="atualizacao">Atualização</option>
                    <option value="ajuste-receita">Ajuste de Receita</option>
                    <option value="correcao-problema">Correção de Problema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="planejado">Planejado</option>
                    <option value="em-execucao">Em Execução</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data *</label>
                  <input type="date" required value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora *</label>
                  <input 
                    type="time" 
                    required 
                    value={formData.hora} 
                    onChange={(e) => {
                      setFormData({ ...formData, hora: e.target.value, turno: determinarTurno(e.target.value) });
                    }} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Turno *</label>
                  <select
                    required
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value as '1' | '2' | '3' | 'central' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">1º Turno (06:30 às 16:18)</option>
                    <option value="2">2º Turno (16:18 às 01:30)</option>
                    <option value="3">3º Turno (01:30 às 06:30)</option>
                    <option value="central">Central</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Título *</label>
                  <input type="text" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Engenheiro *</label>
                  <input type="text" required value={formData.engenheiro} onChange={(e) => setFormData({ ...formData, engenheiro: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interrompeuProducao}
                      onChange={(e) => setFormData({ ...formData, interrompeuProducao: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Interrompeu o processo de produção</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <textarea required value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingMudanca ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


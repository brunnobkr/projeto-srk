import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { producaoStorage, setoresStorage } from '../utils/storage';
import type { ControleProducao, Setor } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { determinarTurno, getTurnoBadgeColor, getTurnoLabel } from '../utils/turno';

export default function ControleProducao() {
  const [controles, setControles] = useState<ControleProducao[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingControle, setEditingControle] = useState<ControleProducao | null>(null);
  const [formData, setFormData] = useState({
    codigoTubo: '',
    setor: '',
    linha: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora: format(new Date(), 'HH:mm'),
    quantidade30min: '',
    quantidadeHora: '',
    tempoMontagem: '',
    maoObra: '',
    pessoasPorMaquina: '',
    processo: '',
    quantidadeTotalLogistica: '',
    preparador: '',
    atualizacaoHora: false,
    turno: determinarTurno() as '' | '1' | '2' | '3' | 'central',
    observacoes: '',
  });

  useEffect(() => {
    loadControles();
    loadSetores();
  }, []);

  const loadSetores = () => {
    const todosSetores = setoresStorage.getAll();
    // Filtrar apenas setores ativos
    setSetores(todosSetores.filter(s => s.ativo));
  };

  const loadControles = () => {
    setControles(producaoStorage.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const controle: ControleProducao = {
      id: editingControle?.id || Date.now().toString(),
      codigoTubo: formData.codigoTubo,
      setor: formData.setor || undefined,
      linha: formData.linha || undefined,
      data: formData.data,
      hora: formData.hora,
      quantidade30min: parseInt(formData.quantidade30min),
      quantidadeHora: parseInt(formData.quantidadeHora),
      tempoMontagem: parseFloat(formData.tempoMontagem),
      maoObra: parseFloat(formData.maoObra),
      pessoasPorMaquina: parseInt(formData.pessoasPorMaquina),
      processo: formData.processo,
      quantidadeTotalLogistica: formData.quantidadeTotalLogistica ? parseFloat(formData.quantidadeTotalLogistica) : undefined,
      preparador: formData.preparador || undefined,
      atualizacaoHora: formData.atualizacaoHora,
      turno: formData.turno || determinarTurno(formData.hora) || undefined,
      observacoes: formData.observacoes || undefined,
    };

    if (editingControle) {
      producaoStorage.update(editingControle.id, controle);
    } else {
      producaoStorage.add(controle);
    }

    // Feedback de salvamento
    alert(editingControle ? 'Registro atualizado com sucesso!' : 'Registro salvo com sucesso!');

    resetForm();
    loadControles();
  };

  const handleEdit = (controle: ControleProducao) => {
    setEditingControle(controle);
    setFormData({
      codigoTubo: controle.codigoTubo,
      setor: controle.setor || '',
      linha: controle.linha || '',
      data: controle.data,
      hora: controle.hora,
      quantidade30min: controle.quantidade30min.toString(),
      quantidadeHora: controle.quantidadeHora.toString(),
      tempoMontagem: controle.tempoMontagem.toString(),
      maoObra: controle.maoObra.toString(),
      pessoasPorMaquina: controle.pessoasPorMaquina.toString(),
      processo: controle.processo,
      quantidadeTotalLogistica: controle.quantidadeTotalLogistica?.toString() || '',
      preparador: controle.preparador || '',
      turno: controle.turno || determinarTurno(controle.hora) || '',
      atualizacaoHora: controle.atualizacaoHora || false,
      observacoes: controle.observacoes || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este controle?')) {
      producaoStorage.delete(id);
      loadControles();
    }
  };

  const resetForm = () => {
    setFormData({
      codigoTubo: '',
      setor: '',
      linha: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm'),
      quantidade30min: '',
      quantidadeHora: '',
      tempoMontagem: '',
      maoObra: '',
      pessoasPorMaquina: '',
      processo: '',
      quantidadeTotalLogistica: '',
      preparador: '',
      atualizacaoHora: false,
      turno: determinarTurno(),
      observacoes: '',
    });
    setEditingControle(null);
    setShowModal(false);
  };

  const filteredControles = controles.filter(c =>
    c.codigoTubo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.processo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.preparador?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Produção</h1>
          <p className="mt-2 text-gray-600">
            Registre e acompanhe a produção por hora e a cada 30 minutos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Registro
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código do produto, processo ou preparador..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código do Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd 30min</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Montagem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mão de Obra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pessoas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Total Logística</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preparador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atualização Hora</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredControles.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredControles.map((controle) => (
                  <tr key={controle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{controle.codigoTubo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{controle.setor || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{controle.linha || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(controle.data), 'dd/MM/yyyy', { locale: ptBR })} {controle.hora}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {controle.turno ? (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTurnoBadgeColor(controle.turno)}`}>
                          {getTurnoLabel(controle.turno)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{controle.quantidade30min}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{controle.quantidadeHora}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{controle.tempoMontagem} min</td>
                    <td className="px-6 py-4 whitespace-nowrap">{controle.maoObra}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{controle.pessoasPorMaquina}</td>
                    <td className="px-6 py-4">{controle.processo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {controle.quantidadeTotalLogistica || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {controle.preparador || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {controle.atualizacaoHora ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Sim</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleEdit(controle)} className="text-primary-600 hover:text-primary-900 mr-4">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(controle.id)} className="text-red-600 hover:text-red-900">
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
            <h2 className="text-2xl font-bold mb-4">{editingControle ? 'Editar' : 'Novo'} Registro de Produção</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código do Produto *</label>
                  <input type="text" required value={formData.codigoTubo} onChange={(e) => setFormData({ ...formData, codigoTubo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Digite o código do produto" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Setor</label>
                  <select
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value, linha: '' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione um setor...</option>
                    {setores.filter(s => s.ativo).map(setor => (
                      <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Linha</label>
                  <select
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
                <div>
                  <label className="block text-sm font-medium mb-1">Processo *</label>
                  <input type="text" required value={formData.processo} onChange={(e) => setFormData({ ...formData, processo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
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
                    <option value="">Selecione o turno...</option>
                    <option value="1">1º Turno (06:30 às 16:18)</option>
                    <option value="2">2º Turno (16:18 às 01:30)</option>
                    <option value="3">3º Turno (01:30 às 06:30)</option>
                    <option value="central">Central</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade (30min) *</label>
                  <input type="number" required value={formData.quantidade30min} onChange={(e) => setFormData({ ...formData, quantidade30min: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade (Hora) *</label>
                  <input type="number" required value={formData.quantidadeHora} onChange={(e) => setFormData({ ...formData, quantidadeHora: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempo Montagem (min) *</label>
                  <input type="number" step="0.1" required value={formData.tempoMontagem} onChange={(e) => setFormData({ ...formData, tempoMontagem: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mão de Obra *</label>
                  <input type="number" step="0.1" required value={formData.maoObra} onChange={(e) => setFormData({ ...formData, maoObra: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pessoas por Máquina *</label>
                  <input type="number" required value={formData.pessoasPorMaquina} onChange={(e) => setFormData({ ...formData, pessoasPorMaquina: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              {/* Seção: Logística e Preparador */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logística e Preparador</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantidade Total Logística</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={formData.quantidadeTotalLogistica} 
                      onChange={(e) => setFormData({ ...formData, quantidadeTotalLogistica: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-lg" 
                      placeholder="Quantidade total passada pela logística"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preparador</label>
                    <input 
                      type="text" 
                      value={formData.preparador} 
                      onChange={(e) => setFormData({ ...formData, preparador: e.target.value })} 
                      className="w-full px-3 py-2 border rounded-lg" 
                      placeholder="Nome do preparador que atualizou"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.atualizacaoHora}
                        onChange={(e) => setFormData({ ...formData, atualizacaoHora: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Atualização horária (preparador atualizou a cada hora)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingControle ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


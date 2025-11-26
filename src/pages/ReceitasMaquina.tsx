import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, History, Image, X } from 'lucide-react';
import { receitasStorage, setoresStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ReceitaMaquina, HistoricoVersao, Setor } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import HistoricoModal from '../components/HistoricoModal';

export default function ReceitasMaquina() {
  const { canCreate, canEdit, isEngenharia } = useAuth();
  const [receitas, setReceitas] = useState<ReceitaMaquina[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<HistoricoVersao<ReceitaMaquina>[]>([]);
  const [editingReceita, setEditingReceita] = useState<ReceitaMaquina | null>(null);
  
  const podeCriarEditar = canCreate('receitasMaquina') || canEdit('receitasMaquina') || isEngenharia();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [formData, setFormData] = useState({
    codigoTubo: '',
    setor: '',
    linha: '',
    angulacao: '',
    velocidade: '',
    distancia: '',
    conectores: '',
    vazaoLado1: '',
    vazaoLado2: '',
    anguloInsercaoLadoA: '',
    anguloInsercaoLadoB: '',
    velocidadeLadoA: '',
    velocidadeLadoB: '',
    velocidadeMaquinaLadoA: '',
    velocidadeMaquinaLadoB: '',
    limiteInsercaoLadoA: '',
    limiteInsercaoLadoB: '',
    maoObraNecessaria: '',
    tempoMontagem: '',
    nomeResponsavel: '',
    matriculaResponsavel: '',
    motivo: '',
  });
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotosLadoA, setFotosLadoA] = useState<string[]>([]);
  const [fotosLadoB, setFotosLadoB] = useState<string[]>([]);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const [fotosModalAtual, setFotosModalAtual] = useState<string[]>([]);

  useEffect(() => {
    loadReceitas();
    setSetores(setoresStorage.getAll());
  }, []);

  const loadReceitas = () => {
    setReceitas(receitasStorage.getAll());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, lado?: 'A' | 'B' | 'geral') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          if (lado === 'A') {
            setFotosLadoA((prev) => [...prev, base64String]);
          } else if (lado === 'B') {
            setFotosLadoB((prev) => [...prev, base64String]);
          } else {
            setFotos((prev) => [...prev, base64String]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFoto = (index: number, lado?: 'A' | 'B' | 'geral') => {
    if (lado === 'A') {
      setFotosLadoA((prev) => prev.filter((_, i) => i !== index));
    } else if (lado === 'B') {
      setFotosLadoB((prev) => prev.filter((_, i) => i !== index));
    } else {
      setFotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const openFotoModal = (foto: string, fotosArray: string[]) => {
    setFotoSelecionada(foto);
    setFotosModalAtual(fotosArray);
    setShowFotoModal(true);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receita: ReceitaMaquina = {
      id: editingReceita?.id || Date.now().toString(),
      codigoTubo: formData.codigoTubo,
      setor: formData.setor || undefined,
      linha: formData.linha || undefined,
      angulacao: parseFloat(formData.angulacao),
      velocidade: parseFloat(formData.velocidade),
      distancia: parseFloat(formData.distancia),
      conectores: formData.conectores.split(',').map(c => c.trim()).filter(c => c),
      vazaoLado1: parseFloat(formData.vazaoLado1),
      vazaoLado2: parseFloat(formData.vazaoLado2),
      anguloInsercaoLadoA: formData.anguloInsercaoLadoA ? parseFloat(formData.anguloInsercaoLadoA) : undefined,
      anguloInsercaoLadoB: formData.anguloInsercaoLadoB ? parseFloat(formData.anguloInsercaoLadoB) : undefined,
      velocidadeLadoA: formData.velocidadeLadoA ? parseFloat(formData.velocidadeLadoA) : undefined,
      velocidadeLadoB: formData.velocidadeLadoB ? parseFloat(formData.velocidadeLadoB) : undefined,
      velocidadeMaquinaLadoA: formData.velocidadeMaquinaLadoA ? parseFloat(formData.velocidadeMaquinaLadoA) : undefined,
      velocidadeMaquinaLadoB: formData.velocidadeMaquinaLadoB ? parseFloat(formData.velocidadeMaquinaLadoB) : undefined,
      limiteInsercaoLadoA: formData.limiteInsercaoLadoA ? parseFloat(formData.limiteInsercaoLadoA) : undefined,
      limiteInsercaoLadoB: formData.limiteInsercaoLadoB ? parseFloat(formData.limiteInsercaoLadoB) : undefined,
      maoObraNecessaria: formData.maoObraNecessaria ? parseFloat(formData.maoObraNecessaria) : undefined,
      tempoMontagem: formData.tempoMontagem ? parseFloat(formData.tempoMontagem) : undefined,
      nomeResponsavel: formData.nomeResponsavel,
      matriculaResponsavel: formData.matriculaResponsavel,
      fotos: fotos.length > 0 ? fotos : undefined,
      fotosLadoA: fotosLadoA.length > 0 ? fotosLadoA : undefined,
      fotosLadoB: fotosLadoB.length > 0 ? fotosLadoB : undefined,
      dataCriacao: editingReceita?.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      criadoPor: formData.nomeResponsavel || 'Usuário',
    };

    if (editingReceita) {
      receitasStorage.update(editingReceita.id, receita, formData.motivo || undefined);
    } else {
      receitasStorage.add(receita);
    }

    // Feedback de salvamento
    alert(editingReceita ? 'Receita atualizada com sucesso!' : 'Receita salva com sucesso!');
    
    resetForm();
    loadReceitas();
  };

  const handleViewHistorico = (receita: ReceitaMaquina) => {
    const historico = receitasStorage.getHistorico(receita.id);
    setHistoricoSelecionado(historico);
    setShowHistoricoModal(true);
  };

  const handleEdit = (receita: ReceitaMaquina) => {
    setEditingReceita(receita);
    setFormData({
      codigoTubo: receita.codigoTubo,
      setor: receita.setor || '',
      linha: receita.linha || '',
      angulacao: receita.angulacao.toString(),
      velocidade: receita.velocidade.toString(),
      distancia: receita.distancia.toString(),
      conectores: receita.conectores.join(', '),
      vazaoLado1: receita.vazaoLado1.toString(),
      vazaoLado2: receita.vazaoLado2.toString(),
      anguloInsercaoLadoA: receita.anguloInsercaoLadoA?.toString() || '',
      anguloInsercaoLadoB: receita.anguloInsercaoLadoB?.toString() || '',
      velocidadeLadoA: receita.velocidadeLadoA?.toString() || '',
      velocidadeLadoB: receita.velocidadeLadoB?.toString() || '',
      velocidadeMaquinaLadoA: receita.velocidadeMaquinaLadoA?.toString() || '',
      velocidadeMaquinaLadoB: receita.velocidadeMaquinaLadoB?.toString() || '',
      limiteInsercaoLadoA: receita.limiteInsercaoLadoA?.toString() || '',
      limiteInsercaoLadoB: receita.limiteInsercaoLadoB?.toString() || '',
      maoObraNecessaria: receita.maoObraNecessaria?.toString() || '',
      tempoMontagem: receita.tempoMontagem?.toString() || '',
      nomeResponsavel: receita.nomeResponsavel || '',
      matriculaResponsavel: receita.matriculaResponsavel || '',
      motivo: '',
    });
    setFotos(receita.fotos || []);
    setFotosLadoA(receita.fotosLadoA || []);
    setFotosLadoB(receita.fotosLadoB || []);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
      receitasStorage.delete(id);
      loadReceitas();
    }
  };

  const resetForm = () => {
    setFormData({
      codigoTubo: '',
      angulacao: '',
      velocidade: '',
      distancia: '',
      conectores: '',
      vazaoLado1: '',
      vazaoLado2: '',
      anguloInsercaoLadoA: '',
      anguloInsercaoLadoB: '',
      velocidadeLadoA: '',
      velocidadeLadoB: '',
      velocidadeMaquinaLadoA: '',
      velocidadeMaquinaLadoB: '',
      limiteInsercaoLadoA: '',
      limiteInsercaoLadoB: '',
      maoObraNecessaria: '',
      tempoMontagem: '',
      nomeResponsavel: '',
      matriculaResponsavel: '',
      motivo: '',
    });
    setFotos([]);
    setFotosLadoA([]);
    setFotosLadoB([]);
    setEditingReceita(null);
    setShowModal(false);
  };

  const filteredReceitas = receitas.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    return (
      r.codigoTubo.toLowerCase().includes(searchLower) ||
      r.nomeResponsavel?.toLowerCase().includes(searchLower) ||
      r.matriculaResponsavel?.toLowerCase().includes(searchLower) ||
      r.conectores.some(c => c.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receitas de Máquina</h1>
          <p className="mt-2 text-gray-600">
            Configure e gerencie receitas de máquina para cada código de produto
          </p>
        </div>
        {podeCriarEditar && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Receita
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código do produto, nome ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Receitas */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código do Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Setor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Angulação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Velocidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distância
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vazão L1/L2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conectores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mão de Obra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo Montagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matrícula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fotos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atualizado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceitas.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma receita encontrada
                  </td>
                </tr>
              ) : (
                filteredReceitas.map((receita) => (
                  <tr key={receita.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {receita.codigoTubo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.setor || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.linha || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.angulacao}°
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.velocidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.distancia}mm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.vazaoLado1}/{receita.vazaoLado2}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {receita.conectores.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.maoObraNecessaria || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.tempoMontagem ? `${receita.tempoMontagem} min` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.nomeResponsavel || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receita.matriculaResponsavel || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const totalFotos = (receita.fotos?.length || 0) + (receita.fotosLadoA?.length || 0) + (receita.fotosLadoB?.length || 0);
                        return totalFotos > 0 ? (
                          <button
                            onClick={() => {
                              setFotoSelecionada(null);
                              const todasFotos = [
                                ...(receita.fotos || []),
                                ...(receita.fotosLadoA || []),
                                ...(receita.fotosLadoB || [])
                              ];
                              setFotosModalAtual(todasFotos);
                              setShowFotoModal(true);
                            }}
                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-900"
                            title="Ver fotos"
                          >
                            <Image className="w-5 h-5" />
                            <span className="text-sm font-medium">{totalFotos}</span>
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(receita.dataAtualizacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewHistorico(receita)}
                        className="text-purple-600 hover:text-purple-900 mr-4"
                        title="Ver histórico"
                      >
                        <History className="w-5 h-5" />
                      </button>
                      {podeCriarEditar && (
                        <>
                          <button
                            onClick={() => handleEdit(receita)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(receita.id)}
                            className="text-red-600 hover:text-red-900"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingReceita ? 'Editar Receita' : 'Nova Receita'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informações do Responsável */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Responsável</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nomeResponsavel}
                      onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matrícula do Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.matriculaResponsavel}
                      onChange={(e) => setFormData({ ...formData, matriculaResponsavel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Digite a matrícula"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigoTubo}
                    onChange={(e) => setFormData({ ...formData, codigoTubo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Digite o código do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Setor
                  </label>
                  <select
                    value={formData.setor}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value, linha: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione um setor...</option>
                    {setores.map(setor => (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Angulação (°) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.angulacao}
                    onChange={(e) => setFormData({ ...formData, angulacao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Velocidade *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.velocidade}
                    onChange={(e) => setFormData({ ...formData, velocidade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distância (mm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.distancia}
                    onChange={(e) => setFormData({ ...formData, distancia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vazão Lado 1 *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.vazaoLado1}
                    onChange={(e) => setFormData({ ...formData, vazaoLado1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vazão Lado 2 *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.vazaoLado2}
                    onChange={(e) => setFormData({ ...formData, vazaoLado2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Seção: Inserção Lado A */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Lado A</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ângulo de Inserção Lado A (°) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.anguloInsercaoLadoA}
                      onChange={(e) => setFormData({ ...formData, anguloInsercaoLadoA: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Velocidade Lado A *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.velocidadeLadoA}
                      onChange={(e) => setFormData({ ...formData, velocidadeLadoA: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Velocidade Máquina Lado A *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.velocidadeMaquinaLadoA}
                      onChange={(e) => setFormData({ ...formData, velocidadeMaquinaLadoA: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite Inserção Lado A *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.limiteInsercaoLadoA}
                      onChange={(e) => setFormData({ ...formData, limiteInsercaoLadoA: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                {/* Fotos Lado A */}
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fotos da Configuração Lado A
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'A')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  {fotosLadoA.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Fotos adicionadas ({fotosLadoA.length})
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        {fotosLadoA.map((foto, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={foto}
                              alt={`Foto Lado A ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80"
                              onClick={() => openFotoModal(foto, fotosLadoA)}
                            />
                            <button
                              type="button"
                              onClick={() => removeFoto(index, 'A')}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção: Inserção Lado B */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Lado B</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ângulo de Inserção Lado B (°) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.anguloInsercaoLadoB}
                      onChange={(e) => setFormData({ ...formData, anguloInsercaoLadoB: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Velocidade Lado B *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.velocidadeLadoB}
                      onChange={(e) => setFormData({ ...formData, velocidadeLadoB: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Velocidade Máquina Lado B *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.velocidadeMaquinaLadoB}
                      onChange={(e) => setFormData({ ...formData, velocidadeMaquinaLadoB: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite Inserção Lado B *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.limiteInsercaoLadoB}
                      onChange={(e) => setFormData({ ...formData, limiteInsercaoLadoB: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                {/* Fotos Lado B */}
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fotos da Configuração Lado B
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'B')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  {fotosLadoB.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Fotos adicionadas ({fotosLadoB.length})
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        {fotosLadoB.map((foto, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={foto}
                              alt={`Foto Lado B ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80"
                              onClick={() => openFotoModal(foto, fotosLadoB)}
                            />
                            <button
                              type="button"
                              onClick={() => removeFoto(index, 'B')}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção: Mão de Obra e Tempo */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mão de Obra e Tempo de Montagem</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mão de Obra Necessária *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.maoObraNecessaria}
                      onChange={(e) => setFormData({ ...formData, maoObraNecessaria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Quantidade de mão de obra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo de Montagem (minutos) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.tempoMontagem}
                      onChange={(e) => setFormData({ ...formData, tempoMontagem: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Tempo em minutos"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conectores (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.conectores}
                  onChange={(e) => setFormData({ ...formData, conectores: e.target.value })}
                  placeholder="Ex: Conector A, Conector B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Seção de Fotos */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fotos</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adicionar Fotos
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'geral')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você pode selecionar múltiplas imagens
                  </p>
                </div>
                {fotos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Fotos adicionadas ({fotos.length})
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {fotos.map((foto, index) => (
                        <div key={index} className="relative group">
                            <img
                              src={foto}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80"
                              onClick={() => openFotoModal(foto, fotos)}
                            />
                            <button
                              type="button"
                              onClick={() => removeFoto(index, 'geral')}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {editingReceita && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Alteração (opcional)
                  </label>
                  <textarea
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    placeholder="Descreva o motivo da alteração..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingReceita ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      <HistoricoModal
        isOpen={showHistoricoModal}
        onClose={() => setShowHistoricoModal(false)}
        historico={historicoSelecionado}
        titulo="Histórico de Alterações da Receita"
      />

      {/* Modal de Visualização de Fotos */}
      {showFotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Fotos da Receita</h2>
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
              <div className="space-y-4">
                <img
                  src={fotoSelecionada}
                  alt="Foto ampliada"
                  className="w-full h-auto rounded-lg"
                />
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => {
                      const currentIndex = fotosModalAtual.indexOf(fotoSelecionada);
                      if (currentIndex > 0) {
                        setFotoSelecionada(fotosModalAtual[currentIndex - 1]);
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    disabled={fotosModalAtual.indexOf(fotoSelecionada) === 0}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = fotosModalAtual.indexOf(fotoSelecionada);
                      if (currentIndex < fotosModalAtual.length - 1) {
                        setFotoSelecionada(fotosModalAtual[currentIndex + 1]);
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    disabled={fotosModalAtual.indexOf(fotoSelecionada) === fotosModalAtual.length - 1}
                  >
                    Próxima
                  </button>
                  <button
                    onClick={() => setFotoSelecionada(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Ver Todas
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {fotosModalAtual.map((foto, index) => (
                  <div key={index} className="relative">
                    <img
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setFotoSelecionada(foto)}
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
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


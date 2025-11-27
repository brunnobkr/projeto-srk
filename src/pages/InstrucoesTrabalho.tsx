import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, PlusCircle, X, Image, Eye } from 'lucide-react';
import { instrucoesStorage, setoresStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { InstrucaoTrabalho, PassoInstrucao, Setor } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function InstrucoesTrabalho() {
  const { canCreate, canEdit, isEngenharia, isSegurancaTrabalho } = useAuth();
  const [instrucoes, setInstrucoes] = useState<InstrucaoTrabalho[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInstrucao, setEditingInstrucao] = useState<InstrucaoTrabalho | null>(null);
  const [viewingInstrucao, setViewingInstrucao] = useState<InstrucaoTrabalho | null>(null);
  
  const podeCriarEditar = (canCreate('instrucoesTrabalho') || canEdit('instrucoesTrabalho') || isEngenharia() || isSegurancaTrabalho());
  const [setores, setSetores] = useState<Setor[]>([]);
  const [formData, setFormData] = useState({
    codigoProduto: '',
    setor: '',
    linha: '',
    tipoInstrucao: 'insercao' as 'insercao' | 'fechamento' | 'emergencia' | 'marcacao' | 'start' | 'botao' | 'outro',
    titulo: '',
    preparador: false,
    funcionario: false,
    passos: [] as PassoInstrucao[],
  });

  const [novoPasso, setNovoPasso] = useState({
    letra: 'A',
    descricao: '',
    tipo: 'insercao' as 'insercao' | 'marcacao' | 'botao' | 'emergencia' | 'fechamento',
    detalhes: '',
    fotos: [] as string[],
  });
  const [funcionarioAutorizado, setFuncionarioAutorizado] = useState('');
  const [_fotoPassoIndex, setFotoPassoIndex] = useState<number | null>(null);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const [fotosModalAtual, setFotosModalAtual] = useState<string[]>([]);

  useEffect(() => {
    loadInstrucoes();
    loadSetores();
  }, []);

  const loadSetores = () => {
    const todosSetores = setoresStorage.getAll();
    // Filtrar apenas setores ativos
    setSetores(todosSetores.filter(s => s.ativo));
  };

  const loadInstrucoes = () => {
    const todasInstrucoes = instrucoesStorage.getAll();
    // Migrar instruções antigas que não têm tipoInstrucao
    const instrucoesMigradas = todasInstrucoes.map(inst => ({
      ...inst,
      tipoInstrucao: inst.tipoInstrucao || 'insercao',
    }));
    setInstrucoes(instrucoesMigradas);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const instrucao: InstrucaoTrabalho = {
      id: editingInstrucao?.id || Date.now().toString(),
      codigoProduto: formData.codigoProduto,
      setor: formData.setor || undefined,
      linha: formData.linha || undefined,
      tipoInstrucao: formData.tipoInstrucao,
      titulo: formData.titulo,
      passos: formData.passos,
      preparador: formData.preparador,
      funcionario: formData.funcionario,
      dataCriacao: editingInstrucao?.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      criadoPor: 'Usuário',
    };

    if (editingInstrucao) {
      instrucoesStorage.update(editingInstrucao.id, instrucao);
    } else {
      instrucoesStorage.add(instrucao);
    }

    // Feedback de salvamento
    alert(editingInstrucao ? 'Instrução atualizada com sucesso!' : 'Instrução salva com sucesso!');

    resetForm();
    loadInstrucoes();
  };

  const handleEdit = (instrucao: InstrucaoTrabalho) => {
    setEditingInstrucao(instrucao);
    // Migrar passos antigos que usam "ordem" para "letra"
    const passosMigrados = instrucao.passos.map((p, index) => ({
      ...p,
      letra: p.letra || String.fromCharCode(64 + ((p as any).ordem || index + 1)),
    }));
    setFormData({
      codigoProduto: instrucao.codigoProduto,
      setor: instrucao.setor || '',
      linha: instrucao.linha || '',
      tipoInstrucao: instrucao.tipoInstrucao || 'insercao',
      titulo: instrucao.titulo,
      preparador: instrucao.preparador,
      funcionario: instrucao.funcionario,
      passos: passosMigrados,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta instrução?')) {
      instrucoesStorage.delete(id);
      loadInstrucoes();
    }
  };

  const getProximaLetra = () => {
    const letras = formData.passos
      .map(p => p.letra || String.fromCharCode(64 + (p as any).ordem || 1))
      .filter(l => l && l.length === 1)
      .sort();
    if (letras.length === 0) return 'A';
    const ultimaLetra = letras[letras.length - 1];
    const proxima = String.fromCharCode(ultimaLetra.charCodeAt(0) + 1);
    // Limitar até Z
    return proxima <= 'Z' ? proxima : 'A';
  };

  const addPasso = () => {
    if (novoPasso.descricao && funcionarioAutorizado) {
      const proximaLetra = getProximaLetra();
      setFormData({
        ...formData,
        passos: [...formData.passos, { 
          ...novoPasso, 
          letra: proximaLetra,
          criadoPor: funcionarioAutorizado,
          dataCriacao: new Date().toISOString()
        }],
      });
      setNovoPasso({
        letra: proximaLetra,
        descricao: '',
        tipo: 'insercao',
        detalhes: '',
        fotos: [],
      });
    } else if (!funcionarioAutorizado) {
      alert('Por favor, informe o nome do funcionário autorizado que está adicionando o passo.');
    }
  };

  const handleImageUploadPasso = (e: React.ChangeEvent<HTMLInputElement>, passoIndex: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const novosPassos = [...formData.passos];
    if (!novosPassos[passoIndex].fotos) {
      novosPassos[passoIndex].fotos = [];
    }

    let fotosProcessadas = 0;
    const totalFotos = Array.from(files).filter(f => f.type.startsWith('image/')).length;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          novosPassos[passoIndex].fotos = [...(novosPassos[passoIndex].fotos || []), base64String];
          fotosProcessadas++;
          
          // Atualizar apenas quando todas as fotos forem processadas
          if (fotosProcessadas === totalFotos) {
            setFormData({ ...formData, passos: novosPassos });
            // Limpar o input para permitir adicionar as mesmas fotos novamente
            e.target.value = '';
          }
        };
        reader.onerror = () => {
          alert('Erro ao carregar a imagem. Por favor, tente novamente.');
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFotoPasso = (passoIndex: number, fotoIndex: number) => {
    const novosPassos = [...formData.passos];
    if (novosPassos[passoIndex].fotos) {
      novosPassos[passoIndex].fotos = novosPassos[passoIndex].fotos!.filter((_, i) => i !== fotoIndex);
      setFormData({ ...formData, passos: novosPassos });
    }
  };

  const openFotoModalPasso = (foto: string, fotosArray: string[]) => {
    setFotoSelecionada(foto);
    setFotosModalAtual(fotosArray);
    setShowFotoModal(true);
  };

  const removePasso = (index: number) => {
    const novosPassos = formData.passos.filter((_, i) => i !== index);
    setFormData({ ...formData, passos: novosPassos });
  };

  const resetForm = () => {
    setFormData({
      codigoProduto: '',
      setor: '',
      linha: '',
      tipoInstrucao: 'insercao',
      titulo: '',
      preparador: false,
      funcionario: false,
      passos: [],
    });
    setNovoPasso({
      letra: 'A',
      descricao: '',
      tipo: 'insercao',
      detalhes: '',
      fotos: [],
    });
    setFuncionarioAutorizado('');
    setFotoPassoIndex(null);
    setShowFotoModal(false);
    setFotoSelecionada(null);
    setFotosModalAtual([]);
    setEditingInstrucao(null);
    setShowModal(false);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      insercao: 'Inserção',
      marcacao: 'Marcação',
      botao: 'Botão',
      emergencia: 'Emergência',
      fechamento: 'Fechamento',
      start: 'Start na Máquina',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const getTipoInstrucaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      insercao: 'Inserção',
      fechamento: 'Fechamento',
      emergencia: 'Emergência',
      marcacao: 'Marcação',
      start: 'Start na Máquina',
      botao: 'Botão',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const filteredInstrucoes = instrucoes.filter(i =>
    i.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTipoInstrucaoLabel(i.tipoInstrucao || 'insercao').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar instruções por código de produto, setor e linha
  const instrucoesAgrupadas = filteredInstrucoes.reduce((acc, instrucao) => {
    const chave = `${instrucao.codigoProduto}_${instrucao.setor || 'sem-setor'}_${instrucao.linha || 'sem-linha'}`;
    if (!acc[chave]) {
      acc[chave] = {
        codigo: instrucao.codigoProduto,
        setor: instrucao.setor,
        linha: instrucao.linha,
        instrucoes: []
      };
    }
    acc[chave].instrucoes.push(instrucao);
    return acc;
  }, {} as Record<string, { codigo: string; setor?: string; linha?: string; instrucoes: InstrucaoTrabalho[] }>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instruções de Trabalho</h1>
          <p className="mt-2 text-gray-600">
            Instruções para preparadores e funcionários por produto
          </p>
        </div>
        {podeCriarEditar && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Instrução
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código ou título... (pressione Enter para ver detalhes)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                // Buscar instrução pelo código exato
                const instrucaoEncontrada = instrucoes.find(i => 
                  i.codigoProduto.toLowerCase() === searchTerm.toLowerCase().trim()
                );
                if (instrucaoEncontrada) {
                  setViewingInstrucao(instrucaoEncontrada);
                } else if (filteredInstrucoes.length === 1) {
                  // Se encontrar apenas uma instrução, mostrar ela
                  setViewingInstrucao(filteredInstrucoes[0]);
                }
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {searchTerm.trim() && filteredInstrucoes.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredInstrucoes.length} {filteredInstrucoes.length === 1 ? 'instrução encontrada' : 'instruções encontradas'}. 
            {filteredInstrucoes.length === 1 && ' Pressione Enter para ver detalhes.'}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {Object.keys(instrucoesAgrupadas).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma instrução encontrada
          </div>
        ) : (
          Object.values(instrucoesAgrupadas).map((grupo) => (
            <div key={`${grupo.codigo}_${grupo.setor || ''}_${grupo.linha || ''}`} className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4 pb-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">Código: {grupo.codigo}</h2>
                {(grupo.setor || grupo.linha) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Setor: {grupo.setor || '-'} | Linha: {grupo.linha || '-'}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {grupo.instrucoes.length} {grupo.instrucoes.length === 1 ? 'instrução' : 'instruções'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grupo.instrucoes.map((instrucao) => (
                  <div key={instrucao.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800 font-medium">
                            {getTipoInstrucaoLabel(instrucao.tipoInstrucao || 'insercao')}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">{instrucao.titulo}</h3>
                        {(instrucao.setor || instrucao.linha) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {instrucao.setor && `Setor: ${instrucao.setor}`}
                            {instrucao.setor && instrucao.linha && ' | '}
                            {instrucao.linha && `Linha: ${instrucao.linha}`}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-2">
                        <button 
                          onClick={() => setViewingInstrucao(instrucao)} 
                          className="text-blue-600 hover:text-blue-900" 
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {podeCriarEditar && (
                          <>
                            <button onClick={() => handleEdit(instrucao)} className="text-primary-600 hover:text-primary-900" title="Editar">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(instrucao.id)} className="text-red-600 hover:text-red-900" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        {instrucao.preparador && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Preparador</span>
                        )}
                        {instrucao.funcionario && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Funcionário</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">Passos: {instrucao.passos.length}</p>
                      {(() => {
                        const totalFotos = instrucao.passos.reduce((acc, passo) => acc + (passo.fotos?.length || 0), 0);
                        return totalFotos > 0 ? (
                          <p className="text-xs text-gray-600 flex items-center">
                            <Image className="w-3 h-3 mr-1" />
                            Fotos: {totalFotos}
                          </p>
                        ) : null;
                      })()}
                      <div className="text-xs text-gray-500">
                        Atualizado: {format(new Date(instrucao.dataAtualizacao), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingInstrucao ? 'Editar' : 'Nova'} Instrução</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código do Produto *</label>
                  <input type="text" required value={formData.codigoProduto} onChange={(e) => setFormData({ ...formData, codigoProduto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                  <p className="text-xs text-gray-500 mt-1">O mesmo código pode ter múltiplas instruções</p>
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
                  <label className="block text-sm font-medium mb-1">Tipo de Instrução *</label>
                  <select 
                    required 
                    value={formData.tipoInstrucao} 
                    onChange={(e) => setFormData({ ...formData, tipoInstrucao: e.target.value as any })} 
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="insercao">Inserção</option>
                    <option value="fechamento">Fechamento</option>
                    <option value="emergencia">Emergência</option>
                    <option value="marcacao">Marcação</option>
                    <option value="start">Start na Máquina</option>
                    <option value="botao">Botão</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Título *</label>
                  <input type="text" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Instrução de inserção para código X" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" checked={formData.preparador} onChange={(e) => setFormData({ ...formData, preparador: e.target.checked })} className="mr-2" />
                      <span className="text-sm font-medium">Para Preparadores</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={formData.funcionario} onChange={(e) => setFormData({ ...formData, funcionario: e.target.checked })} className="mr-2" />
                      <span className="text-sm font-medium">Para Funcionários</span>
                    </label>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Passos da Instrução</h3>
                <div className="space-y-4 mb-4">
                  {formData.passos
                    .sort((a, b) => {
                      const letraA = a.letra || String.fromCharCode(64 + ((a as any).ordem || 1));
                      const letraB = b.letra || String.fromCharCode(64 + ((b as any).ordem || 1));
                      return letraA.localeCompare(letraB);
                    })
                    .map((passo, index) => {
                      const passoIndex = formData.passos.findIndex(p => p === passo);
                      return (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-700">Passo {passo.letra}:</span>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                            {getTipoLabel(passo.tipo)}
                          </span>
                          {passo.criadoPor && (
                            <span className="text-xs text-gray-500">por {passo.criadoPor}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{passo.descricao}</p>
                        {passo.detalhes && (
                          <p className="text-xs text-gray-500 mt-1">{passo.detalhes}</p>
                        )}
                        {/* Upload de Fotos para o Passo - SEMPRE VISÍVEL */}
                        <div className="mt-3 border-t pt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Adicionar Fotos ao Passo {passo.letra}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUploadPasso(e, passoIndex)}
                            className="w-full text-xs px-2 py-1 border border-gray-300 rounded-lg"
                          />
                        </div>
                        {/* Fotos do Passo - Exibição após upload */}
                        {passo.fotos && passo.fotos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">Fotos do Passo {passo.letra} ({passo.fotos.length}):</p>
                            <div className="grid grid-cols-4 gap-2">
                              {passo.fotos.map((foto, fotoIndex) => (
                                <div key={fotoIndex} className="relative group">
                                  <img
                                    src={foto}
                                    alt={`Foto passo ${passo.letra} - ${fotoIndex + 1}`}
                                    className="w-full h-20 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80"
                                    onClick={() => openFotoModalPasso(foto, passo.fotos || [])}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeFotoPasso(passoIndex, fotoIndex)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePasso(passoIndex)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                      );
                    })}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Adicionar Novo Passo</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Funcionário Autorizado *</label>
                      <input 
                        type="text" 
                        required
                        value={funcionarioAutorizado} 
                        onChange={(e) => setFuncionarioAutorizado(e.target.value)} 
                        placeholder="Nome do funcionário autorizado"
                        className="w-full px-3 py-2 border rounded-lg" 
                      />
                      <p className="text-xs text-gray-500 mt-1">Informe o nome do funcionário autorizado que está adicionando este passo</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo</label>
                      <select value={novoPasso.tipo} onChange={(e) => setNovoPasso({ ...novoPasso, tipo: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                        <option value="insercao">Inserção</option>
                        <option value="marcacao">Marcação</option>
                        <option value="botao">Botão</option>
                        <option value="emergencia">Emergência</option>
                        <option value="fechamento">Fechamento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descrição *</label>
                      <textarea value={novoPasso.descricao} onChange={(e) => setNovoPasso({ ...novoPasso, descricao: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Detalhes</label>
                      <input type="text" value={novoPasso.detalhes} onChange={(e) => setNovoPasso({ ...novoPasso, detalhes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <button
                      type="button"
                      onClick={addPasso}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Adicionar Passo
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingInstrucao ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização Detalhada */}
      {viewingInstrucao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes da Instrução</h2>
              <button
                onClick={() => setViewingInstrucao(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Informações Gerais</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Código do Produto:</span>
                    <p className="text-gray-900">{viewingInstrucao.codigoProduto}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tipo de Instrução:</span>
                    <p className="text-gray-900">{getTipoInstrucaoLabel(viewingInstrucao.tipoInstrucao || 'insercao')}</p>
                  </div>
                  {viewingInstrucao.setor && (
                    <div>
                      <span className="font-medium text-gray-700">Setor:</span>
                      <p className="text-gray-900">{viewingInstrucao.setor}</p>
                    </div>
                  )}
                  {viewingInstrucao.linha && (
                    <div>
                      <span className="font-medium text-gray-700">Linha:</span>
                      <p className="text-gray-900">{viewingInstrucao.linha}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Título:</span>
                    <p className="text-gray-900">{viewingInstrucao.titulo}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Destinatários:</span>
                    <div className="flex space-x-2 mt-1">
                      {viewingInstrucao.preparador && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Preparador</span>
                      )}
                      {viewingInstrucao.funcionario && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Funcionário</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Criado em:</span>
                    <p className="text-gray-900">{format(new Date(viewingInstrucao.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Atualizado em:</span>
                    <p className="text-gray-900">{format(new Date(viewingInstrucao.dataAtualizacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                  {viewingInstrucao.criadoPor && (
                    <div>
                      <span className="font-medium text-gray-700">Criado por:</span>
                      <p className="text-gray-900">{viewingInstrucao.criadoPor}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Passos da Instrução */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Passos da Instrução ({viewingInstrucao.passos.length})</h3>
                <div className="space-y-4">
                  {viewingInstrucao.passos
                    .sort((a, b) => {
                      const letraA = a.letra || String.fromCharCode(64 + ((a as any).ordem || 1));
                      const letraB = b.letra || String.fromCharCode(64 + ((b as any).ordem || 1));
                      return letraA.localeCompare(letraB);
                    })
                    .map((passo, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900 text-lg">Passo {passo.letra || String.fromCharCode(64 + ((passo as any).ordem || index + 1))}:</span>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                            {getTipoLabel(passo.tipo)}
                          </span>
                          {passo.criadoPor && (
                            <span className="text-xs text-gray-500">por {passo.criadoPor}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{passo.descricao}</p>
                        {passo.detalhes && (
                          <p className="text-xs text-gray-600 mb-3">{passo.detalhes}</p>
                        )}
                        {passo.fotos && passo.fotos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">Fotos do Passo ({passo.fotos.length}):</p>
                            <div className="grid grid-cols-4 gap-2">
                              {passo.fotos.map((foto, fotoIndex) => (
                                <div key={fotoIndex} className="relative">
                                  <img
                                    src={foto}
                                    alt={`Foto passo ${passo.letra} - ${fotoIndex + 1}`}
                                    className="w-full h-24 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openFotoModalPasso(foto, passo.fotos || [])}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setViewingInstrucao(null)}
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
              <h2 className="text-2xl font-bold text-gray-900">Fotos do Passo</h2>
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


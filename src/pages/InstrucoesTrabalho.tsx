import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, PlusCircle, X, Image, Eye, FileText } from 'lucide-react';
import { instrucoesStorage, setoresStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { InstrucaoTrabalho, PassoInstrucao, Setor, AnexoPDF } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function InstrucoesTrabalho() {
  const { usuario, canCreate, canEdit, isEngenharia, isSegurancaTrabalho } = useAuth();
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
  const [anexosPDF, setAnexosPDF] = useState<AnexoPDF[]>([]);
  const [fotosGerais, setFotosGerais] = useState<string[]>([]);

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

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type === 'application/pdf') {
        // Verificar tamanho (máximo 10MB)
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

  const handleFotoGeralUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        // Verificar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`A foto ${file.name} é muito grande. Tamanho máximo: 10MB`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setFotosGerais((prev) => [...prev, base64String]);
        };
        reader.onerror = () => {
          alert('Erro ao carregar a foto. Por favor, tente novamente.');
        };
        reader.readAsDataURL(file);
      } else {
        alert('Por favor, selecione apenas arquivos de imagem.');
      }
    });
    e.target.value = '';
  };

  const removeFotoGeral = (index: number) => {
    setFotosGerais((prev) => prev.filter((_, i) => i !== index));
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
      fotos: fotosGerais.length > 0 ? fotosGerais : undefined,
      anexosPDF: anexosPDF.length > 0 ? anexosPDF : undefined,
      dataCriacao: editingInstrucao?.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      criadoPor: editingInstrucao?.criadoPor || usuario?.nome || 'Usuário',
      atualizadoPor: editingInstrucao ? (usuario?.nome || 'Usuário') : undefined,
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
    setAnexosPDF(instrucao.anexosPDF || []);
    setFotosGerais(instrucao.fotos || []);
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
    setAnexosPDF([]);
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
        <div className="flex space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Nova Instrução
          </button>
        </div>
      </div>

      {/* Lista de Instruções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instrucoes.map((instrucao) => (
          <div key={instrucao.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{instrucao.titulo}</h3>
                <p className="text-sm text-gray-600">Código: {instrucao.codigoProduto}</p>
                {(instrucao.setor || instrucao.linha) && (
                  <p className="text-sm text-gray-600">
                    Setor: {instrucao.setor || '-'} | Linha: {instrucao.linha || '-'}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingInstrucao(instrucao)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(instrucao)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(instrucao.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                instrucao.tipoInstrucao === 'insercao' ? 'bg-blue-100 text-blue-800' :
                instrucao.tipoInstrucao === 'fechamento' ? 'bg-green-100 text-green-800' :
                instrucao.tipoInstrucao === 'emergencia' ? 'bg-red-100 text-red-800' :
                instrucao.tipoInstrucao === 'marcacao' ? 'bg-purple-100 text-purple-800' :
                instrucao.tipoInstrucao === 'start' ? 'bg-orange-100 text-orange-800' :
                instrucao.tipoInstrucao === 'botao' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getTipoInstrucaoLabel(instrucao.tipoInstrucao || 'insercao')}
              </span>
            </div>
            <p className="text-gray-700 text-sm mb-4 line-clamp-3">{instrucao.titulo}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Criado: {format(new Date(instrucao.dataCriacao), 'dd/MM/yyyy', { locale: ptBR })}</span>
              <span>Passos: {instrucao.passos?.length || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Visualização */}
      {viewingInstrucao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Instrução</h2>
                <button
                  onClick={() => setViewingInstrucao(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Código: {viewingInstrucao.codigoProduto}</h3>
                  {(viewingInstrucao.setor || viewingInstrucao.linha) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Setor: {viewingInstrucao.setor || '-'} | Linha: {viewingInstrucao.linha || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-700">{viewingInstrucao.titulo}</p>
                </div>
                {viewingInstrucao.fotos && viewingInstrucao.fotos.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Fotos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {viewingInstrucao.fotos.map((foto, index) => (
                        <img key={index} src={foto} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-300" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setViewingInstrucao(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

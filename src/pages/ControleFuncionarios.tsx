import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, UserPlus, AlertTriangle, X, FileWarning, Image, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { controleFuncionariosStorage, funcionariosStorage, setoresStorage, acidentesStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ControleFuncionarios, Funcionario, Setor, Acidente, AnexoPDF } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { determinarTurno } from '../utils/turno';

export default function ControleFuncionarios() {
  const { usuario } = useAuth();
  const [controles, setControles] = useState<ControleFuncionarios[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTurno, setFiltroTurno] = useState<'todos' | '1' | '2' | '3' | 'central'>('todos');
  const [filtroData, setFiltroData] = useState<string>('');
  const [turnoAtual, setTurnoAtual] = useState<'1' | '2' | '3' | 'central'>(determinarTurno());
  const [showModal, setShowModal] = useState(false);
  const [showFuncModal, setShowFuncModal] = useState(false);
  const [editingControle, setEditingControle] = useState<ControleFuncionarios | null>(null);
  const [formData, setFormData] = useState({
    funcionarioId: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    horaRegistro: format(new Date(), 'HH:mm'),
    turno: '' as '' | '1' | '2' | '3' | 'central',
    tipo: 'presente' as 'falta' | 'ausente' | 'tempo-ocioso' | 'transferencia' | 'chegada-atrasado' | 'presente' | 'saida-cedo' | 'chegada-tarde' | 'atestado' | 'afastado',
    inicio: '',
    fim: '',
    horaChegada: '',
    horaSaida: '',
    tempoOcioso: '',
    tempoAtraso: '',
    tempoAntecipacao: '',
    setorOrigem: '',
    setorDestino: '',
    tipoAtestado: '',
    dataInicioAtestado: '',
    dataFimAtestado: '',
    diasAtestado: '',
    motivoAfastamento: '',
    dataInicioAfastamento: '',
    dataFimAfastamento: '',
    observacoes: '',
  });

  const [funcFormData, setFuncFormData] = useState({
    nome: '',
    matricula: '',
    setor: '',
    cargo: '',
  });
  const [showAcidenteModal, setShowAcidenteModal] = useState(false);
  const [acidenteFormData, setAcidenteFormData] = useState({
    funcionarioId: '',
    setor: '',
    localizacao: '',
    tipo: 'leve' as 'leve' | 'moderado' | 'grave',
    descricao: '',
    causas: '',
    medidasPreventivas: '',
  });
  const [fotosAcidente, setFotosAcidente] = useState<string[]>([]);
  const [anexosPDFAcidente, setAnexosPDFAcidente] = useState<AnexoPDF[]>([]);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const [fotosModalAtual, setFotosModalAtual] = useState<string[]>([]);
  const [tiposExpandidos, setTiposExpandidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
    determinarTurnoAtual();
    // Atualizar turno a cada minuto para detectar mudanças
    const interval = setInterval(() => {
      determinarTurnoAtual();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Função para determinar o turno atual baseado no horário
  const determinarTurnoAtual = () => {
    const turno = determinarTurno();
    
    // Verificar se o turno mudou antes de atualizar
    setTurnoAtual(prevTurno => {
      // Se o turno mudou, recarregar os dados para atualizar a visualização
      if (prevTurno !== turno) {
        // Usar setTimeout para evitar problemas de estado
        setTimeout(() => {
          loadData();
        }, 100);
      }
      return turno;
    });
    
    // Atualizar o turno no formulário se não estiver editando
    if (!editingControle) {
      setFormData(prev => ({ ...prev, turno }));
    }
  };

  const loadData = () => {
    const controlesData = controleFuncionariosStorage.getAll();
    const funcsData = funcionariosStorage.getAll();
    const setoresData = setoresStorage.getAll();
    
    // Enriquecer controles com dados dos funcionários
    const controlesEnriquecidos = controlesData.map(controle => ({
      ...controle,
      funcionario: funcsData.find(f => f.id === controle.funcionarioId),
    }));
    
    setControles(controlesEnriquecidos);
    setFuncionarios(funcsData);
    setSetores(setoresData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Determinar turno se não foi selecionado
    const turno = formData.turno || determinarTurno(formData.horaRegistro);
    
    const controle: ControleFuncionarios = {
      id: editingControle?.id || Date.now().toString(),
      funcionarioId: formData.funcionarioId,
      data: formData.data,
      horaRegistro: formData.horaRegistro,
      turno: turno,
      tipo: formData.tipo,
      inicio: formData.inicio || undefined,
      fim: formData.fim || undefined,
      horaChegada: formData.horaChegada || undefined,
      horaSaida: formData.horaSaida || undefined,
      tempoOcioso: formData.tempoOcioso ? parseFloat(formData.tempoOcioso) : undefined,
      tempoAtraso: formData.tempoAtraso ? parseFloat(formData.tempoAtraso) : undefined,
      tempoAntecipacao: formData.tempoAntecipacao ? parseFloat(formData.tempoAntecipacao) : undefined,
      setorOrigem: formData.setorOrigem || undefined,
      setorDestino: formData.setorDestino || undefined,
      tipoAtestado: (formData.tipoAtestado as 'medico' | 'odontologico' | 'psicologico' | 'outro' | undefined) || undefined,
      dataInicioAtestado: formData.dataInicioAtestado || undefined,
      dataFimAtestado: formData.dataFimAtestado || undefined,
      diasAtestado: formData.diasAtestado ? parseInt(formData.diasAtestado) : undefined,
      motivoAfastamento: formData.motivoAfastamento || undefined,
      dataInicioAfastamento: formData.dataInicioAfastamento || undefined,
      dataFimAfastamento: formData.dataFimAfastamento || undefined,
      observacoes: formData.observacoes || undefined,
    };

    if (editingControle) {
      controleFuncionariosStorage.update(editingControle.id, controle);
    } else {
      controleFuncionariosStorage.add(controle);
    }

    // Feedback de salvamento
    alert(editingControle ? 'Registro atualizado com sucesso!' : 'Registro salvo com sucesso!');

    resetForm();
    loadData();
  };

  const handleFuncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const funcionario: Funcionario = {
      id: Date.now().toString(),
      nome: funcFormData.nome,
      matricula: funcFormData.matricula,
      setor: funcFormData.setor,
      cargo: funcFormData.cargo,
    };

    funcionariosStorage.add(funcionario);
    setFuncFormData({ nome: '', matricula: '', setor: '', cargo: '' });
    setShowFuncModal(false);
    loadData();
  };

  const handleEdit = (controle: ControleFuncionarios) => {
    setEditingControle(controle);
    setFormData({
      funcionarioId: controle.funcionarioId,
      data: controle.data,
      horaRegistro: controle.horaRegistro || format(new Date(), 'HH:mm'),
      turno: controle.turno || determinarTurno(controle.horaRegistro) || '',
      tipo: controle.tipo,
      inicio: controle.inicio || '',
      fim: controle.fim || '',
      horaChegada: controle.horaChegada || '',
      horaSaida: controle.horaSaida || '',
      tempoOcioso: controle.tempoOcioso?.toString() || '',
      tempoAtraso: controle.tempoAtraso?.toString() || '',
      tempoAntecipacao: controle.tempoAntecipacao?.toString() || '',
      setorOrigem: controle.setorOrigem || '',
      setorDestino: controle.setorDestino || '',
      tipoAtestado: controle.tipoAtestado || '',
      dataInicioAtestado: controle.dataInicioAtestado || '',
      dataFimAtestado: controle.dataFimAtestado || '',
      diasAtestado: controle.diasAtestado?.toString() || '',
      motivoAfastamento: controle.motivoAfastamento || '',
      dataInicioAfastamento: controle.dataInicioAfastamento || '',
      dataFimAfastamento: controle.dataFimAfastamento || '',
      observacoes: controle.observacoes || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      controleFuncionariosStorage.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      funcionarioId: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      horaRegistro: format(new Date(), 'HH:mm'),
      turno: determinarTurno(),
      tipo: 'presente',
      inicio: '',
      fim: '',
      horaChegada: '',
      horaSaida: '',
      tempoOcioso: '',
      tempoAtraso: '',
      tempoAntecipacao: '',
      setorOrigem: '',
      setorDestino: '',
      tipoAtestado: '',
      dataInicioAtestado: '',
      dataFimAtestado: '',
      diasAtestado: '',
      motivoAfastamento: '',
      dataInicioAfastamento: '',
      dataFimAfastamento: '',
      observacoes: '',
    });
    setEditingControle(null);
    setShowModal(false);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      falta: 'Falta',
      ausente: 'Ausente',
      'tempo-ocioso': 'Tempo Ocioso',
      transferencia: 'Transferência',
      'chegada-atrasado': 'Chegada Atrasado',
      presente: 'Presente',
      'saida-cedo': 'Saída Mais Cedo',
      'chegada-tarde': 'Chegada Mais Tarde',
      atestado: 'Atestado',
      afastado: 'Afastado',
    };
    return labels[tipo] || tipo;
  };

  const handleFotoAcidenteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`A foto ${file.name} é muito grande. Tamanho máximo: 10MB`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setFotosAcidente((prev) => [...prev, base64String]);
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

  const removeFotoAcidente = (index: number) => {
    setFotosAcidente((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePDFAcidenteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setAnexosPDFAcidente((prev) => [...prev, novoAnexo]);
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

  const removePDFAcidente = (index: number) => {
    setAnexosPDFAcidente((prev) => prev.filter((_, i) => i !== index));
  };

  const openFotoModal = (foto: string, fotosArray: string[]) => {
    setFotoSelecionada(foto);
    setFotosModalAtual(fotosArray);
    setShowFotoModal(true);
  };

  // Gerar número único de chamado para acidentes
  const gerarNumeroChamadoAcidente = (): string => {
    const todosAcidentes = acidentesStorage.getAll();
    // Encontrar o maior número de chamado existente
    let maiorNumero = 0;
    todosAcidentes.forEach(a => {
      if (a.numeroChamado) {
        const numero = parseInt(a.numeroChamado.replace('ACID-', ''));
        if (!isNaN(numero) && numero > maiorNumero) {
          maiorNumero = numero;
        }
      }
    });
    // Gerar próximo número
    const proximoNumero = maiorNumero + 1;
    return `ACID-${proximoNumero.toString().padStart(4, '0')}`;
  };

  const handleAcidenteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const acidente: Acidente = {
      id: Date.now().toString(),
      numeroChamado: gerarNumeroChamadoAcidente(),
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm'),
      funcionarioId: acidenteFormData.funcionarioId,
      setor: acidenteFormData.setor,
      localizacao: acidenteFormData.localizacao,
      tipo: acidenteFormData.tipo,
      descricao: acidenteFormData.descricao,
      causas: acidenteFormData.causas || undefined,
      medidasPreventivas: acidenteFormData.medidasPreventivas || undefined,
      fotos: fotosAcidente.length > 0 ? fotosAcidente : undefined,
      anexosPDF: anexosPDFAcidente.length > 0 ? anexosPDFAcidente : undefined,
      dataRegistro: new Date().toISOString(),
      registradoPor: usuario?.nome || 'Sistema',
    };

    acidentesStorage.add(acidente);
    alert('Acidente registrado com sucesso! A Segurança do Trabalho foi notificada.');
    
    // Resetar formulário
    setAcidenteFormData({
      funcionarioId: '',
      setor: '',
      localizacao: '',
      tipo: 'leve',
      descricao: '',
      causas: '',
      medidasPreventivas: '',
    });
    setFotosAcidente([]);
    setAnexosPDFAcidente([]);
    setShowAcidenteModal(false);
  };

  const filteredControles = controles.filter(c => {
    const func = c.funcionario;
    const matchesSearch = 
      func?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func?.matricula.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Se houver busca por nome/matrícula, mostrar TODOS os registros daquele funcionário
    // (ignorar filtros de data e turno para facilitar visualização completa)
    if (searchTerm.trim() !== '' && matchesSearch) {
      return true; // Mostrar todos os registros do funcionário encontrado
    }
    
    // Se não houver busca, aplicar filtros normalmente
    if (searchTerm.trim() === '') {
      const matchesTurno = filtroTurno === 'todos' || c.turno === filtroTurno;
      const matchesData = filtroData === '' || (() => {
        try {
          const dataControle = new Date(c.data);
          const dataFiltro = new Date(filtroData);
          if (isNaN(dataControle.getTime()) || isNaN(dataFiltro.getTime())) return true;
          // Comparar apenas dia, mês e ano
          return dataControle.getDate() === dataFiltro.getDate() &&
                 dataControle.getMonth() === dataFiltro.getMonth() &&
                 dataControle.getFullYear() === dataFiltro.getFullYear();
        } catch {
          return true;
        }
      })();
      return matchesTurno && matchesData;
    }
    
    return false;
  });

  // Agrupar controles por tipo
  const controlesPorTipo = filteredControles.reduce((acc, controle) => {
    const tipo = controle.tipo;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(controle);
    return acc;
  }, {} as Record<string, typeof filteredControles>);

  // Ordenar tipos por ordem de importância
  const tiposOrdenados = [
    'falta',
    'ausente',
    'chegada-atrasado',
    'chegada-tarde',
    'saida-cedo',
    'tempo-ocioso',
    'transferencia',
    'atestado',
    'afastado',
    'presente',
  ].filter(tipo => controlesPorTipo[tipo] && controlesPorTipo[tipo].length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Funcionários</h1>
          <p className="mt-2 text-gray-600">
            Gerencie faltas, ausências, tempo ocioso, chegadas atrasadas e transferências
          </p>
        </div>
<<<<<<< HEAD
=======
        {podeCriarEditar && (
>>>>>>> a99d161 (fix: correÃ§Ãµes de permissÃµes e tipos - adicionar atualizadoPor em InstrucoesTrabalho, melhorias em filtros e permissÃµes)
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAcidenteModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg animate-pulse"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            ACIDENTE - Segurança do Trabalho
          </button>
          <button
            onClick={() => {
              setFormData({
                ...formData,
                tipo: 'saida-cedo', // Pré-seleciona um tipo de ocorrência
              });
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <FileWarning className="w-5 h-5 mr-2" />
            Ocorrências
          </button>
          <button
            onClick={() => setShowFuncModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Novo Funcionário
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Registro
          </button>
        </div>
<<<<<<< HEAD
=======
        )}
>>>>>>> a99d161 (fix: correÃ§Ãµes de permissÃµes e tipos - adicionar atualizadoPor em InstrucoesTrabalho, melhorias em filtros e permissÃµes)
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {searchTerm.trim() !== '' && (
              <p className="mt-1 text-xs text-blue-600">
                ℹ️ Mostrando todos os registros do funcionário encontrado
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Filtrar por Data</label>
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={searchTerm.trim() !== ''}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Filtrar por Turno</label>
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={searchTerm.trim() !== ''}
            >
              <option value="todos">Todos os Turnos</option>
              <option value="1">1º Turno (06:30-16:18)</option>
              <option value="2">2º Turno (16:18-01:30)</option>
              <option value="3">3º Turno (01:30-06:30)</option>
              <option value="central">Central</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Turno Atual:</span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              turnoAtual === '1' ? 'bg-blue-100 text-blue-800' :
              turnoAtual === '2' ? 'bg-green-100 text-green-800' :
              turnoAtual === '3' ? 'bg-purple-100 text-purple-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {turnoAtual === '1' ? '1º Turno' :
               turnoAtual === '2' ? '2º Turno' :
               turnoAtual === '3' ? '3º Turno' : 'Central'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {filtroData && (
              <button
                onClick={() => setFiltroData('')}
                className="text-xs text-gray-600 hover:text-gray-900 underline"
              >
                Limpar filtro de data
              </button>
            )}
            <p className="text-xs text-gray-500">
              💾 Todos os registros são salvos permanentemente para consulta do RH
            </p>
          </div>
        </div>
      </div>

      {/* Registros Agrupados por Tipo */}
      {filteredControles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tiposOrdenados.map((tipo) => {
            const controlesDoTipo = controlesPorTipo[tipo];
            const isExpanded = tiposExpandidos[tipo] !== false; // Por padrão expandido
            const getTipoColor = (t: string) => {
              switch (t) {
                case 'falta': return 'bg-red-50 border-red-200';
                case 'ausente': return 'bg-yellow-50 border-yellow-200';
                case 'tempo-ocioso': return 'bg-orange-50 border-orange-200';
                case 'chegada-atrasado': return 'bg-pink-50 border-pink-200';
                case 'chegada-tarde': return 'bg-pink-50 border-pink-200';
                case 'saida-cedo': return 'bg-purple-50 border-purple-200';
                case 'transferencia': return 'bg-blue-50 border-blue-200';
                case 'atestado': return 'bg-indigo-50 border-indigo-200';
                case 'afastado': return 'bg-gray-50 border-gray-200';
                case 'presente': return 'bg-green-50 border-green-200';
                default: return 'bg-gray-50 border-gray-200';
              }
            };
            const getBadgeColor = (t: string) => {
              switch (t) {
                case 'falta': return 'bg-red-100 text-red-800';
                case 'ausente': return 'bg-yellow-100 text-yellow-800';
                case 'tempo-ocioso': return 'bg-orange-100 text-orange-800';
                case 'chegada-atrasado': return 'bg-pink-100 text-pink-800';
                case 'chegada-tarde': return 'bg-pink-100 text-pink-800';
                case 'saida-cedo': return 'bg-purple-100 text-purple-800';
                case 'transferencia': return 'bg-blue-100 text-blue-800';
                case 'atestado': return 'bg-indigo-100 text-indigo-800';
                case 'afastado': return 'bg-gray-100 text-gray-800';
                case 'presente': return 'bg-green-100 text-green-800';
                default: return 'bg-gray-100 text-gray-800';
              }
            };

            return (
              <div key={tipo} className={`bg-white rounded-lg shadow-sm border-2 ${getTipoColor(tipo)}`}>
                <button
                  onClick={() => setTiposExpandidos(prev => ({ ...prev, [tipo]: !isExpanded }))}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getBadgeColor(tipo)}`}>
                      {getTipoLabel(tipo)}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({controlesDoTipo.length} {controlesDoTipo.length === 1 ? 'registro' : 'registros'})
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora Registro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Ocioso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo Atraso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transferência</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {controlesDoTipo.map((controle) => (
                            <tr key={controle.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap font-medium">{controle.funcionario?.nome || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{controle.funcionario?.matricula || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {(() => {
                                  try {
                                    const data = new Date(controle.data);
                                    if (isNaN(data.getTime())) return controle.data || '-';
                                    return format(data, 'dd/MM/yyyy', { locale: ptBR });
                                  } catch {
                                    return controle.data || '-';
                                  }
                                })()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{controle.horaRegistro || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {controle.tipo === 'chegada-atrasado' && controle.horaChegada 
                                  ? `Chegada: ${controle.horaChegada}`
                                  : controle.tipo === 'chegada-tarde' && controle.horaChegada
                                  ? `Chegada: ${controle.horaChegada}`
                                  : controle.tipo === 'saida-cedo' && controle.horaSaida
                                  ? `Saída: ${controle.horaSaida}`
                                  : controle.tipo === 'atestado' && controle.dataInicioAtestado && controle.dataFimAtestado
                                  ? (() => {
                                      try {
                                        const inicio = new Date(controle.dataInicioAtestado);
                                        const fim = new Date(controle.dataFimAtestado);
                                        if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
                                          return `${format(inicio, 'dd/MM', { locale: ptBR })} - ${format(fim, 'dd/MM', { locale: ptBR })}`;
                                        }
                                      } catch {}
                                      return '-';
                                    })()
                                  : controle.tipo === 'afastado' && controle.dataInicioAfastamento
                                  ? (() => {
                                      try {
                                        const data = new Date(controle.dataInicioAfastamento);
                                        if (!isNaN(data.getTime())) {
                                          return `Desde: ${format(data, 'dd/MM/yyyy', { locale: ptBR })}`;
                                        }
                                      } catch {}
                                      return '-';
                                    })()
                                  : controle.inicio && controle.fim 
                                  ? `${controle.inicio} - ${controle.fim}` 
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {controle.tempoOcioso ? `${controle.tempoOcioso} min` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {controle.tempoAtraso ? `${controle.tempoAtraso} min` : 
                                 controle.tempoAntecipacao ? `${controle.tempoAntecipacao} min` :
                                 controle.tipo === 'atestado' && controle.diasAtestado ? `${controle.diasAtestado} dias` :
                                 '-'}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {controle.setorOrigem && controle.setorDestino ? `${controle.setorOrigem} → ${controle.setorDestino}` : '-'}
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Controle */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingControle ? 'Editar' : 'Novo'} Registro</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Funcionário *</label>
                <select required value={formData.funcionarioId} onChange={(e) => setFormData({ ...formData, funcionarioId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Selecione...</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome} - {f.matricula}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data *</label>
                  <input type="date" required value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Horário do Registro *</label>
                  <input 
                    type="time" 
                    required 
                    value={formData.horaRegistro} 
                    onChange={(e) => {
                      setFormData({ ...formData, horaRegistro: e.target.value, turno: determinarTurno(e.target.value) });
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <select required value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="presente">Presente</option>
                    <option value="falta">Falta</option>
                    <option value="ausente">Ausente</option>
                    <option value="tempo-ocioso">Tempo Ocioso</option>
                    <option value="chegada-atrasado">Chegada Atrasado</option>
                    <option value="saida-cedo">Saída Mais Cedo</option>
                    <option value="chegada-tarde">Chegada Mais Tarde</option>
                    <option value="atestado">Atestado</option>
                    <option value="afastado">Afastado</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
                {formData.tipo === 'tempo-ocioso' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Início</label>
                      <input type="time" value={formData.inicio} onChange={(e) => setFormData({ ...formData, inicio: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fim</label>
                      <input type="time" value={formData.fim} onChange={(e) => setFormData({ ...formData, fim: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tempo Ocioso (min) *</label>
                      <input type="number" required value={formData.tempoOcioso} onChange={(e) => setFormData({ ...formData, tempoOcioso: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Tempo em minutos" />
                    </div>
                  </>
                )}
                {formData.tipo === 'chegada-atrasado' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Horário que o Funcionário Chegou *</label>
                      <input type="time" required value={formData.horaChegada} onChange={(e) => setFormData({ ...formData, horaChegada: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tempo de Atraso (min) *</label>
                      <input type="number" required value={formData.tempoAtraso} onChange={(e) => setFormData({ ...formData, tempoAtraso: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Quantos minutos de atraso" />
                    </div>
                  </>
                )}
                {formData.tipo === 'transferencia' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Setor Origem</label>
                      <select
                        value={formData.setorOrigem || ''}
                        onChange={(e) => setFormData({ ...formData, setorOrigem: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Selecione um setor...</option>
                        {setores.map(setor => (
                          <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Setor Destino</label>
                      <select
                        value={formData.setorDestino || ''}
                        onChange={(e) => setFormData({ ...formData, setorDestino: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Selecione um setor...</option>
                        {setores.map(setor => (
                          <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
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

      {/* Modal Funcionário */}
      {showFuncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Novo Funcionário</h2>
            <form onSubmit={handleFuncSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" required value={funcFormData.nome} onChange={(e) => setFuncFormData({ ...funcFormData, nome: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Matrícula *</label>
                <input type="text" required value={funcFormData.matricula} onChange={(e) => setFuncFormData({ ...funcFormData, matricula: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Setor *</label>
                <input type="text" required value={funcFormData.setor} onChange={(e) => setFuncFormData({ ...funcFormData, setor: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cargo *</label>
                <input type="text" required value={funcFormData.cargo} onChange={(e) => setFuncFormData({ ...funcFormData, cargo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setShowFuncModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Acidente - Emergência */}
      {showAcidenteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-4 border-red-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <h2 className="text-2xl font-bold text-red-600">REGISTRO DE ACIDENTE - EMERGÊNCIA</h2>
              </div>
              <button
                onClick={() => setShowAcidenteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAcidenteSubmit} className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-semibold">
                  ⚠️ ATENÇÃO: Este registro será enviado imediatamente para a Segurança do Trabalho.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Funcionário Envolvido *</label>
                <select
                  required
                  value={acidenteFormData.funcionarioId}
                  onChange={(e) => setAcidenteFormData({ ...acidenteFormData, funcionarioId: e.target.value })}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Selecione o funcionário...</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome} - {f.matricula}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Setor *</label>
                  <select
                    required
                    value={acidenteFormData.setor}
                    onChange={(e) => setAcidenteFormData({ ...acidenteFormData, setor: e.target.value })}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Selecione o setor...</option>
                    {setores.map(setor => (
                      <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Localização *</label>
                  <input
                    type="text"
                    required
                    value={acidenteFormData.localizacao}
                    onChange={(e) => setAcidenteFormData({ ...acidenteFormData, localizacao: e.target.value })}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Ex: Linha 52, Máquina 3, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gravidade do Acidente *</label>
                <select
                  required
                  value={acidenteFormData.tipo}
                  onChange={(e) => setAcidenteFormData({ ...acidenteFormData, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="leve">Leve</option>
                  <option value="moderado">Moderado</option>
                  <option value="grave">Grave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição do Acidente *</label>
                <textarea
                  required
                  value={acidenteFormData.descricao}
                  onChange={(e) => setAcidenteFormData({ ...acidenteFormData, descricao: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Descreva detalhadamente o que aconteceu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Possíveis Causas</label>
                <textarea
                  value={acidenteFormData.causas}
                  onChange={(e) => setAcidenteFormData({ ...acidenteFormData, causas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Descreva as possíveis causas do acidente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Medidas Preventivas Sugeridas</label>
                <textarea
                  value={acidenteFormData.medidasPreventivas}
                  onChange={(e) => setAcidenteFormData({ ...acidenteFormData, medidasPreventivas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Sugestões de medidas para evitar acidentes similares..."
                />
              </div>

              {/* Seção de Fotos do Acidente */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Image className="w-5 h-5 mr-2 text-red-600" />
                  Fotos do Acidente
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Adicionar Fotos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFotoAcidenteUpload}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tamanho máximo: 10MB por foto</p>
                </div>
                {fotosAcidente.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Fotos adicionadas ({fotosAcidente.length}):</p>
                    <div className="grid grid-cols-4 gap-2">
                      {fotosAcidente.map((foto, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={foto}
                            alt={`Foto acidente ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-red-300 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openFotoModal(foto, fotosAcidente)}
                          />
                          <button
                            type="button"
                            onClick={() => removeFotoAcidente(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seção de Anexos PDF */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-red-600" />
                  Anexos PDF
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Adicionar Arquivo PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handlePDFAcidenteUpload}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tamanho máximo: 10MB por arquivo</p>
                </div>
                {anexosPDFAcidente.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Anexos adicionados ({anexosPDFAcidente.length}):</p>
                    <div className="space-y-2">
                      {anexosPDFAcidente.map((anexo, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-red-200">
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
                            onClick={() => removePDFAcidente(index)}
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
                  onClick={() => setShowAcidenteModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-lg"
                >
                  <AlertTriangle className="w-5 h-5 inline mr-2" />
                  Registrar Acidente
                </button>
              </div>
            </form>
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


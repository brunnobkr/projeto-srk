import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, X, Clock, CheckCircle } from 'lucide-react';
import { producaoStorage, setoresStorage, receitasStorage, programacoesPedidosStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ControleProducao, Setor, AtualizacaoHora, CodigoAtivoLinha } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { determinarTurno, getTurnoBadgeColor, getTurnoLabel } from '../utils/turno';

export default function ControleProducao() {
  const { usuario, podeAtualizarProducao, isAdmin } = useAuth();
  const [controles, setControles] = useState<ControleProducao[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTurno, setFiltroTurno] = useState<'1' | '2' | '3' | 'todos'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingControle, setEditingControle] = useState<ControleProducao | null>(null);
  const [viewingControle, setViewingControle] = useState<ControleProducao | null>(null);
  const [showAtualizacaoHoraModal, setShowAtualizacaoHoraModal] = useState(false);
  const [controleParaAtualizar, setControleParaAtualizar] = useState<ControleProducao | null>(null);
  const [quantidadeHoraAtual, setQuantidadeHoraAtual] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tabela' | 'linhas'>('tabela'); // Modo de visualizaçúo
  const [codigosAtivosPorLinha, setCodigosAtivosPorLinha] = useState<Record<string, CodigoAtivoLinha[]>>({});
  const [showPausaAlmocoModal, setShowPausaAlmocoModal] = useState(false);
  const [linhaParaPausa, setLinhaParaPausa] = useState<{ setor: string; linha: string } | null>(null);
  const [codigoParaPausa, setCodigoParaPausa] = useState<CodigoAtivoLinha | null>(null);
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
    maoObraPorLinha: '',
    processo: '',
    quantidadeTotalLogistica: '',
    preparador: '',
    atualizacaoHora: false,
    turno: determinarTurno() as '' | '1' | '2' | '3' | 'central',
    observacoes: '',
    justificativaFaltaFuncionario: '',
  });

  useEffect(() => {
    loadControles();
    loadSetores();
    
    // Carregar códigos ativos para quem pode atualizar produçúo
    if (podeAtualizarProducao()) {
      loadCodigosAtivosPorLinha();
    }
    
    // Atualizar controles a cada minuto para quem pode atualizar ver atualizaçÇes em tempo real
    if (podeAtualizarProducao()) {
      const interval = setInterval(() => {
        loadControles();
        loadCodigosAtivosPorLinha();
      }, 60000); // 1 minuto
      return () => clearInterval(interval);
    }
  }, [filtroTurno]);

  const loadSetores = () => {
    const todosSetores = setoresStorage.getAll();
    // Filtrar apenas setores ativos
    setSetores(todosSetores.filter(s => s.ativo));
  };

  const loadControles = () => {
    let todosControles = producaoStorage.getAll();
    
    // Filtrar por turno (apenas 1, 2 ou 3, excluindo central)
    if (filtroTurno !== 'todos') {
      todosControles = todosControles.filter(c => c.turno === filtroTurno);
    } else {
      // Se for 'todos', mostrar apenas controles com turno definido (1, 2 ou 3)
      todosControles = todosControles.filter(c => c.turno === '1' || c.turno === '2' || c.turno === '3');
    }
    
    // Se for quem pode atualizar produçúo (preparador ou autorizado), filtrar apenas do seu setor
    if (podeAtualizarProducao() && usuario?.setor) {
      const setorUsuario = usuario.setor.toLowerCase().trim();
      todosControles = todosControles.filter(c => {
        const setorControle = (c.setor || '').toLowerCase().trim();
        return setorControle.includes(setorUsuario) || setorUsuario.includes(setorControle);
      });
    }
    
    // Calcular eficiência e quantidade final para cada controle
    todosControles = todosControles.map(controle => {
      const atualizacoes = controle.atualizacoesHora || [];
      const quantidadeFinal = atualizacoes.reduce((sum, atualizacao) => sum + atualizacao.quantidadeRealizada, 0);
      
      // Calcular eficiência se tiver quantidade da logística
      let eficiencia: number | undefined;
      if (controle.quantidadeTotalLogistica && controle.quantidadeTotalLogistica > 0) {
        eficiencia = (quantidadeFinal / controle.quantidadeTotalLogistica) * 100;
      }
      
      return {
        ...controle,
        quantidadeFinalRealizada: quantidadeFinal,
        eficiencia,
      };
    });
    
    setControles(todosControles);
  };

    // Carregar códigos ativos por linha (para quem pode atualizar produçúo)
  const loadCodigosAtivosPorLinha = () => {
    if (!usuario?.setor || !podeAtualizarProducao()) return;

    const setorUsuario = usuario.setor.toLowerCase().trim();
    const dataHoje = format(new Date(), 'yyyy-MM-dd');
    
    let programacoes = programacoesPedidosStorage.getAll();
    let controles = producaoStorage.getAll();
    
    // Filtrar programaçÇes do dia atual (comparar apenas a data, núo a hora)
    programacoes = programacoes.filter(p => {
      try {
        const dataProg = p.dataProgramacao ? new Date(p.dataProgramacao) : new Date(p.dataCriacao);
        const dataProgFormatada = format(dataProg, 'yyyy-MM-dd');
        return dataProgFormatada === dataHoje;
      } catch {
        return false;
      }
    });
    
    // Filtrar por turno (apenas 1, 2 ou 3, excluindo central)
    if (filtroTurno !== 'todos') {
      programacoes = programacoes.filter(p => p.turno === filtroTurno);
      controles = controles.filter(c => c.turno === filtroTurno);
    } else {
      // Se for 'todos', mostrar apenas com turno definido (1, 2 ou 3)
      programacoes = programacoes.filter(p => p.turno === '1' || p.turno === '2' || p.turno === '3');
      controles = controles.filter(c => c.turno === '1' || c.turno === '2' || c.turno === '3');
    }

    // Filtrar programaçÇes do setor do preparador
    const programacoesSetor = programacoes.filter(p => {
      const setorProgramacao = (p.setor || '').toLowerCase().trim();
      return setorProgramacao.includes(setorUsuario) || setorUsuario.includes(setorProgramacao);
    });

    // Agrupar por linha
    const codigosPorLinha: Record<string, CodigoAtivoLinha[]> = {};

    programacoesSetor.forEach(programacao => {
      const chaveLinha = `${programacao.setor}_${programacao.linha}`;
      
      // Buscar controle de produçúo correspondente (comparar apenas a data)
      const controle = controles.find(c => {
        const dataControle = c.data;
        let dataProgFormatada: string;
        try {
          const dataProg = programacao.dataProgramacao ? new Date(programacao.dataProgramacao) : new Date(programacao.dataCriacao);
          dataProgFormatada = format(dataProg, 'yyyy-MM-dd');
        } catch {
          return false;
        }
        
        return c.codigoTubo === programacao.codigoProduto &&
          c.setor === programacao.setor &&
          c.linha === programacao.linha &&
          dataControle === dataProgFormatada;
      });

      const atualizacoes = controle?.atualizacoesHora || [];
      const quantidadeFinal = atualizacoes.reduce((sum, a) => sum + a.quantidadeRealizada, 0);
      const eficiencia = programacao.quantidadeProgramada > 0 
        ? (quantidadeFinal / programacao.quantidadeProgramada) * 100 
        : undefined;

      // Verificar se já existe código ativo para esta linha
      if (!codigosPorLinha[chaveLinha]) {
        codigosPorLinha[chaveLinha] = [];
      }

      // Verificar se já existe este código na linha
      const codigoExistente = codigosPorLinha[chaveLinha].find(c => c.codigoProduto === programacao.codigoProduto);
      
      if (!codigoExistente) {
        // Criar novo código ativo
        const codigoAtivo: CodigoAtivoLinha = {
          id: controle?.id || programacao.id,
          codigoProduto: programacao.codigoProduto,
          quantidadePedida: programacao.quantidadeProgramada,
          quantidadeRealizada: quantidadeFinal,
          eficiencia,
          atualizacoesHora: atualizacoes,
          dataInicio: (() => {
            try {
              const dataProg = programacao.dataProgramacao ? new Date(programacao.dataProgramacao) : new Date(programacao.dataCriacao);
              return format(dataProg, 'yyyy-MM-dd');
            } catch {
              return format(new Date(), 'yyyy-MM-dd');
            }
          })(),
          status: quantidadeFinal < programacao.quantidadeProgramada ? 'rodando' : 'finalizado',
        };
        
        codigosPorLinha[chaveLinha].push(codigoAtivo);
      } else {
        // Atualizar código existente
        codigoExistente.quantidadeRealizada = quantidadeFinal;
        codigoExistente.eficiencia = eficiencia;
        codigoExistente.atualizacoesHora = atualizacoes;
        codigoExistente.status = quantidadeFinal < programacao.quantidadeProgramada ? 'rodando' : 'finalizado';
      }
    });

    // Carregar códigos já marcados como ativos (do localStorage ou do estado anterior)
    const codigosAtivosSalvos = localStorage.getItem(`codigosAtivos_${usuario.setor}`);
    if (codigosAtivosSalvos) {
      try {
        const salvos = JSON.parse(codigosAtivosSalvos) as Record<string, CodigoAtivoLinha[]>;
        // Mesclar com os códigos carregados das programaçÇes
        Object.keys(salvos).forEach(chave => {
          if (codigosPorLinha[chave]) {
            // Manter códigos marcados como ativos
            salvos[chave].forEach(codigoSalvo => {
              const codigoExistente = codigosPorLinha[chave].find(c => c.codigoProduto === codigoSalvo.codigoProduto);
              if (codigoExistente) {
                codigoExistente.status = codigoSalvo.status;
                codigoExistente.pausaAlmoco = codigoSalvo.pausaAlmoco;
              }
            });
          }
        });
      } catch (e) {
        console.error('Erro ao carregar códigos ativos salvos:', e);
      }
    }

    setCodigosAtivosPorLinha(codigosPorLinha);
  };

  // Salvar códigos ativos por linha
  const salvarCodigosAtivos = () => {
    if (usuario?.setor) {
      localStorage.setItem(`codigosAtivos_${usuario.setor}`, JSON.stringify(codigosAtivosPorLinha));
    }
  };

  // Adicionar código ativo a uma linha
  const adicionarCodigoAtivo = (setor: string, linha: string, codigoProduto: string, quantidadePedida: number) => {
    const chaveLinha = `${setor}_${linha}`;
    const codigosLinha = codigosAtivosPorLinha[chaveLinha] || [];
    
    // Verificar se já existe
    if (codigosLinha.find(c => c.codigoProduto === codigoProduto)) {
      alert('Este código já está ativo nesta linha');
      return;
    }

    // Verificar limite de 3 códigos por linha
    if (codigosLinha.length >= 3) {
      alert('Limite de 3 códigos por linha atingido. Finalize um código antes de adicionar outro.');
      return;
    }

    const novoCodigo: CodigoAtivoLinha = {
      id: Date.now().toString(),
      codigoProduto,
      quantidadePedida,
      quantidadeRealizada: 0,
      dataInicio: format(new Date(), 'yyyy-MM-dd'),
      status: 'rodando',
    };

    setCodigosAtivosPorLinha(prev => ({
      ...prev,
      [chaveLinha]: [...codigosLinha, novoCodigo],
    }));

    salvarCodigosAtivos();
  };

  // Remover código ativo de uma linha
  const removerCodigoAtivo = (setor: string, linha: string, codigoId: string) => {
    const chaveLinha = `${setor}_${linha}`;
    const codigosLinha = codigosAtivosPorLinha[chaveLinha] || [];
    
    setCodigosAtivosPorLinha(prev => ({
      ...prev,
      [chaveLinha]: codigosLinha.filter(c => c.id !== codigoId),
    }));

    salvarCodigosAtivos();
  };

  // Buscar receita de máquina automaticamente quando o código for informado
  const buscarReceitaPorCodigo = (codigo: string) => {
    if (!codigo) return;
    
    const receitas = receitasStorage.getAll();
    const receita = receitas.find(r => r.codigoTubo === codigo);
    
    if (receita) {
      // Preencher automaticamente tempo de montagem e múo de obra da receita
      if (receita.tempoMontagem) {
        setFormData(prev => ({
          ...prev,
          tempoMontagem: receita.tempoMontagem!.toString(),
        }));
      }
      if (receita.maoObraNecessaria) {
        setFormData(prev => ({
          ...prev,
          maoObra: receita.maoObraNecessaria!.toString(),
        }));
      }
    }
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
      maoObraPorLinha: parseFloat(formData.maoObraPorLinha),
      processo: formData.processo,
      quantidadeTotalLogistica: formData.quantidadeTotalLogistica ? parseFloat(formData.quantidadeTotalLogistica) : undefined,
      preparador: formData.preparador || undefined,
      atualizacaoHora: formData.atualizacaoHora,
      turno: (formData.turno || determinarTurno(formData.hora) || undefined) as '1' | '2' | '3' | 'central' | undefined,
      observacoes: formData.observacoes || undefined,
      justificativaFaltaFuncionario: formData.justificativaFaltaFuncionario || undefined,
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
      maoObraPorLinha: controle.maoObraPorLinha?.toString() || (controle as any).pessoasPorMaquina?.toString() || '',
      processo: controle.processo,
      quantidadeTotalLogistica: controle.quantidadeTotalLogistica?.toString() || '',
      preparador: controle.preparador || '',
      turno: controle.turno || determinarTurno(controle.hora) || '',
      atualizacaoHora: controle.atualizacaoHora || false,
      observacoes: controle.observacoes || '',
      justificativaFaltaFuncionario: controle.justificativaFaltaFuncionario || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este controle?')) {
      producaoStorage.delete(id);
      loadControles();
    }
  };

  // Funçúo para preparador atualizar produçúo por hora (versúo por código ativo)
  const handleAtualizarHoraCodigo = (setor: string, linha: string, codigo: CodigoAtivoLinha) => {
    // Buscar programaçúo para obter o turno correto
    const programacoes = programacoesPedidosStorage.getAll();
    const programacao = programacoes.find(p => 
      p.codigoProduto === codigo.codigoProduto &&
      p.setor === setor &&
      p.linha === linha &&
      format(new Date(p.dataProgramacao || p.dataCriacao), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    );
    
    // Buscar ou criar controle de produçúo
    let controle = controles.find(c => 
      c.codigoTubo === codigo.codigoProduto &&
      c.setor === setor &&
      c.linha === linha &&
      c.data === format(new Date(), 'yyyy-MM-dd')
    );

    if (!controle) {
      // Usar turno da programaçúo se disponível, senúo determinar pela hora atual
      const turnoProgramacao = programacao?.turno;
      const turnoFinal = (turnoProgramacao && (turnoProgramacao === '1' || turnoProgramacao === '2' || turnoProgramacao === '3'))
        ? turnoProgramacao
        : determinarTurno();
      
      // Criar novo controle
      const novoControle: ControleProducao = {
        id: Date.now().toString(),
        codigoTubo: codigo.codigoProduto,
        setor,
        linha,
        data: format(new Date(), 'yyyy-MM-dd'),
        hora: format(new Date(), 'HH:mm'),
        quantidade30min: 0,
        quantidadeHora: 0,
        tempoMontagem: 0,
        maoObra: 0,
        maoObraPorLinha: 0,
        processo: 'Programado',
        quantidadeTotalLogistica: codigo.quantidadePedida,
        atualizacoesHora: [],
        turno: turnoFinal as '1' | '2' | '3' | 'central',
      };
      producaoStorage.add(novoControle);
      controle = novoControle;
      loadControles();
    }

    setControleParaAtualizar(controle);
    setQuantidadeHoraAtual('');
    setShowAtualizacaoHoraModal(true);
  };

  // Funçúo para preparador atualizar produçúo por hora (versúo antiga - mantida para compatibilidade)
  const handleAtualizarHora = (controle: ControleProducao) => {
    setControleParaAtualizar(controle);
    setQuantidadeHoraAtual('');
    setShowAtualizacaoHoraModal(true);
  };

  // Funçúo para iniciar pausa de almoço
  const handleIniciarPausaAlmoco = (setor: string, linha: string, codigo: CodigoAtivoLinha) => {
    setLinhaParaPausa({ setor, linha });
    setCodigoParaPausa(codigo);
    setShowPausaAlmocoModal(true);
  };

  // Funçúo para finalizar pausa de almoço
  const handleFinalizarPausaAlmoco = (setor: string, linha: string, codigoId: string) => {
    const chaveLinha = `${setor}_${linha}`;
    const codigosLinha = codigosAtivosPorLinha[chaveLinha] || [];
    const codigo = codigosLinha.find(c => c.id === codigoId);
    
    if (codigo && codigo.pausaAlmoco && codigo.pausaAlmoco.inicio) {
      const agora = new Date();
      const inicioPausa = new Date(codigo.pausaAlmoco.inicio);
      const duracaoMinutos = Math.floor((agora.getTime() - inicioPausa.getTime()) / (1000 * 60));

      setCodigosAtivosPorLinha(prev => ({
        ...prev,
        [chaveLinha]: codigosLinha.map(c => 
          c.id === codigoId 
            ? {
                ...c,
                pausaAlmoco: {
                  ...c.pausaAlmoco!,
                  fim: agora.toISOString(),
                  duracaoMinutos,
                },
                status: 'rodando' as const,
              }
            : c
        ),
      }));

      salvarCodigosAtivos();
      alert(`Pausa de almoço finalizada. Duraçúo: ${duracaoMinutos} minutos`);
    }
  };

  // Confirmar atualizaçúo por hora
  const handleConfirmarAtualizacaoHora = () => {
    if (!controleParaAtualizar || !quantidadeHoraAtual) {
      alert('Por favor, informe a quantidade realizada nesta hora');
      return;
    }

    const quantidade = parseInt(quantidadeHoraAtual);
    if (isNaN(quantidade) || quantidade < 0) {
      alert('Por favor, informe uma quantidade válida');
      return;
    }

    const horaAtual = format(new Date(), 'HH:00'); // Arredondar para hora cheia (ex: 08:00, 09:00)
    const atualizacoesExistentes = controleParaAtualizar.atualizacoesHora || [];
    
    // Verificar se já existe atualizaçúo para esta hora
    const atualizacaoExistente = atualizacoesExistentes.find(a => a.hora === horaAtual);
    
    let novasAtualizacoes: AtualizacaoHora[];
    if (atualizacaoExistente) {
      // Atualizar atualizaçúo existente
      novasAtualizacoes = atualizacoesExistentes.map(a => 
        a.hora === horaAtual 
          ? { ...a, quantidadeRealizada: quantidade, dataAtualizacao: new Date().toISOString(), atualizadoPor: usuario?.nome || 'Preparador' }
          : a
      );
    } else {
      // Criar nova atualizaçúo
      const novaAtualizacao: AtualizacaoHora = {
        id: `${controleParaAtualizar.id}_${horaAtual}_${Date.now()}`,
        hora: horaAtual,
        quantidadeRealizada: quantidade,
        dataAtualizacao: new Date().toISOString(),
        atualizadoPor: usuario?.nome || 'Preparador',
      };
      novasAtualizacoes = [...atualizacoesExistentes, novaAtualizacao];
    }

    // Calcular quantidade final e eficiência
    const quantidadeFinal = novasAtualizacoes.reduce((sum, a) => sum + a.quantidadeRealizada, 0);
    let eficiencia: number | undefined;
    if (controleParaAtualizar.quantidadeTotalLogistica && controleParaAtualizar.quantidadeTotalLogistica > 0) {
      eficiencia = (quantidadeFinal / controleParaAtualizar.quantidadeTotalLogistica) * 100;
    }

    // Atualizar controle
    const controleAtualizado: ControleProducao = {
      ...controleParaAtualizar,
      atualizacoesHora: novasAtualizacoes,
      quantidadeFinalRealizada: quantidadeFinal,
      eficiencia,
      preparador: usuario?.nome || controleParaAtualizar.preparador,
    };

    producaoStorage.update(controleParaAtualizar.id, controleAtualizado);
    
    // Atualizar código ativo na linha correspondente
    if (controleParaAtualizar.setor && controleParaAtualizar.linha) {
      const chaveLinha = `${controleParaAtualizar.setor}_${controleParaAtualizar.linha}`;
      const codigosLinha = codigosAtivosPorLinha[chaveLinha] || [];
      const codigoAtivo = codigosLinha.find(c => c.codigoProduto === controleParaAtualizar.codigoTubo);
      
      if (codigoAtivo) {
        setCodigosAtivosPorLinha(prev => ({
          ...prev,
          [chaveLinha]: codigosLinha.map(c => 
            c.id === codigoAtivo.id
              ? {
                  ...c,
                  quantidadeRealizada: quantidadeFinal,
                  eficiencia,
                  atualizacoesHora: novasAtualizacoes,
                  status: quantidadeFinal < c.quantidadePedida ? 'rodando' : 'finalizado',
                }
              : c
          ),
        }));
        salvarCodigosAtivos();
      }
    }
    
    alert(`Atualizaçúo registrada! Quantidade desta hora: ${quantidade}. Total realizado: ${quantidadeFinal}${controleParaAtualizar.quantidadeTotalLogistica ? ` (${eficiencia?.toFixed(1)}% de eficiência)` : ''}`);
    
    setShowAtualizacaoHoraModal(false);
    setControleParaAtualizar(null);
    setQuantidadeHoraAtual('');
    loadControles();
    // Recarregar códigos ativos para atualizar a visualizaçúo
    if (podeAtualizarProducao()) {
      loadCodigosAtivosPorLinha();
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
      maoObraPorLinha: '',
      processo: '',
      quantidadeTotalLogistica: '',
      preparador: '',
      atualizacaoHora: false,
      turno: determinarTurno(),
      observacoes: '',
      justificativaFaltaFuncionario: '',
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
            {podeAtualizarProducao() 
              ? 'Atualize a produção de hora em hora e acompanhe a eficiência do seu setor'
              : 'Visualize e acompanhe a produção por hora e a cada 30 minutos'}
          </p>
          {podeAtualizarProducao() && usuario?.setor && (
            <p className="mt-1 text-sm text-blue-600 font-medium">
              Setor: {usuario.setor}
            </p>
          )}
          {!podeAtualizarProducao() && (
            <p className="mt-1 text-sm text-orange-600 font-medium">
              ÔÜá´©Å Apenas usuários autorizados podem atualizar a produçúo hora a hora
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {podeAtualizarProducao() && (
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('linhas')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'linhas' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Visúo por Linhas
              </button>
              <button
                onClick={() => setViewMode('tabela')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'tabela' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tabela Completa
              </button>
            </div>
          )}
          {!podeAtualizarProducao() && isAdmin() && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Registro
            </button>
          )}
        </div>
      </div>

      {podeAtualizarProducao() && viewMode === 'linhas' ? (
        // VIS├âO POR LINHAS (para preparadores)
        <div className="space-y-4">
          {Object.entries(codigosAtivosPorLinha).map(([chaveLinha, codigos]) => {
            const [setor, linha] = chaveLinha.split('_');
            const dataHoje = format(new Date(), 'yyyy-MM-dd');
            
            let programacoes = programacoesPedidosStorage.getAll().filter(p => {
              // Comparar setor e linha
              if (p.setor !== setor || p.linha !== linha) return false;
              
              // Comparar data (dataProgramacao pode estar em formato ISO)
              try {
                const dataProg = p.dataProgramacao ? new Date(p.dataProgramacao) : new Date(p.dataCriacao);
                const dataProgFormatada = format(dataProg, 'yyyy-MM-dd');
                return dataProgFormatada === dataHoje;
              } catch {
                return false;
              }
            });
            
            // Filtrar por turno se núo for 'todos' (apenas 1, 2 ou 3, excluindo central)
            if (filtroTurno !== 'todos') {
              programacoes = programacoes.filter(p => p.turno === filtroTurno);
            } else {
              programacoes = programacoes.filter(p => p.turno === '1' || p.turno === '2' || p.turno === '3');
            }

            return (
              <div key={chaveLinha} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Linha {linha} - Setor {setor}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {codigos.filter(c => c.status === 'rodando').length} código(s) ativo(s) de {codigos.length} total
                    </p>
                  </div>
                </div>

                {/* Códigos Ativos */}
                <div className="space-y-3 mb-4">
                  {codigos.map((codigo) => (
                    <div 
                      key={codigo.id} 
                      className={`border-2 rounded-lg p-4 ${
                        codigo.status === 'rodando' 
                          ? 'border-green-500 bg-green-50' 
                          : codigo.status === 'pausado'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{codigo.codigoProduto}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              <strong>Pedido:</strong> {codigo.quantidadePedida}
                            </span>
                            <span className={`font-semibold ${
                              codigo.quantidadeRealizada >= codigo.quantidadePedida ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              <strong>Realizado:</strong> {codigo.quantidadeRealizada}
                            </span>
                            {codigo.eficiencia !== undefined && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                codigo.eficiencia >= 100 ? 'bg-green-100 text-green-800' :
                                codigo.eficiencia >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                Eficiência: {codigo.eficiencia.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          {codigo.pausaAlmoco && codigo.pausaAlmoco.inicio && (
                            <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                              ÔÅ©´©Å Pausa para almoço desde {format(new Date(codigo.pausaAlmoco.inicio), 'HH:mm')}
                              {codigo.pausaAlmoco.fim && ` at├® ${format(new Date(codigo.pausaAlmoco.fim), 'HH:mm')} (${codigo.pausaAlmoco.duracaoMinutos} min)`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {codigo.status === 'rodando' && (
                            <>
                              <button
                                onClick={() => handleAtualizarHoraCodigo(setor, linha, codigo)}
                                className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center"
                                title="Atualizar produçúo desta hora"
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Atualizar Hora
                              </button>
                              <button
                                onClick={() => handleIniciarPausaAlmoco(setor, linha, codigo)}
                                className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                                title="Iniciar pausa para almoço"
                              >
                                ÔÅ©´©Å Pausa Almoço
                              </button>
                            </>
                          )}
                          {codigo.status === 'pausado' && codigo.pausaAlmoco && !codigo.pausaAlmoco.fim && (
                            <button
                              onClick={() => handleFinalizarPausaAlmoco(setor, linha, codigo.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                              title="Finalizar pausa para almoço"
                            >
                              ÔûÂ´©Å Retomar
                            </button>
                          )}
                          <button
                            onClick={() => removerCodigoAtivo(setor, linha, codigo.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            title="Remover código"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Adicionar Novo Código */}
                {codigos.length < 3 && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adicionar código ativo nesta linha:
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const programacao = programacoes.find(p => p.id === e.target.value);
                          if (programacao) {
                            adicionarCodigoAtivo(setor, linha, programacao.codigoProduto, programacao.quantidadeProgramada);
                            e.target.value = '';
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      defaultValue=""
                    >
                      <option value="">Selecione um código programado...</option>
                      {programacoes
                        .filter(p => !codigos.find(c => c.codigoProduto === p.codigoProduto))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.codigoProduto} - Qtd: {p.quantidadeProgramada} ({p.estadoPedido || 'normal'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(codigosAtivosPorLinha).length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">Nenhuma linha com códigos ativos no momento.</p>
              <p className="text-sm text-gray-400 mt-2">Os códigos aparecerúo aqui quando houver programaçÇes da logística para seu setor.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Turno</label>
                <select
                  value={filtroTurno}
                  onChange={(e) => setFiltroTurno(e.target.value as '1' | '2' | '3' | 'todos')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="todos">Todos os Turnos</option>
                  <option value="1">1┬║ Turno (06:30-16:18)</option>
                  <option value="2">2┬║ Turno (16:18-01:30)</option>
                  <option value="3">3┬║ Turno (01:30-06:30)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Central não é usado para produção</p>
              </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mão de Obra por Linha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Pedida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Realizada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eficiência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preparador</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">{controle.maoObraPorLinha || (controle as any).pessoasPorMaquina || '-'}</td>
                    <td className="px-6 py-4">{controle.processo}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {controle.quantidadeTotalLogistica ? (
                        <span className="text-blue-600">{controle.quantidadeTotalLogistica}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {controle.quantidadeFinalRealizada !== undefined ? (
                        <span className={`${controle.quantidadeTotalLogistica && controle.quantidadeFinalRealizada >= controle.quantidadeTotalLogistica ? 'text-green-600' : 'text-orange-600'}`}>
                          {controle.quantidadeFinalRealizada}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {controle.eficiencia !== undefined ? (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          controle.eficiencia >= 100 ? 'bg-green-100 text-green-800' :
                          controle.eficiencia >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {controle.eficiencia.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {controle.preparador || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {podeAtualizarProducao() && controle.quantidadeTotalLogistica && (
                        <button 
                          onClick={() => handleAtualizarHora(controle)} 
                          className="text-purple-600 hover:text-purple-900 mr-2" 
                          title="Atualizar produçúo desta hora"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={() => setViewingControle(controle)} className="text-blue-600 hover:text-blue-900 mr-4" title="Ver detalhes">
                        <Eye className="w-5 h-5" />
                      </button>
                      {!podeAtualizarProducao() && isAdmin() && (
                        <>
                          <button onClick={() => handleEdit(controle)} className="text-primary-600 hover:text-primary-900 mr-4">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(controle.id)} className="text-red-600 hover:text-red-900">
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
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingControle ? 'Editar' : 'Novo'} Registro de Produçúo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código do Produto *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.codigoTubo} 
                    onChange={(e) => {
                      setFormData({ ...formData, codigoTubo: e.target.value });
                      // Buscar receita automaticamente quando o código for informado
                      buscarReceitaPorCodigo(e.target.value);
                    }} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    placeholder="Digite o código do produto"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tempo de montagem e múo de obra serúo preenchidos automaticamente da receita</p>
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
                    <option value="1">1┬║ Turno (06:30 ├ás 16:18)</option>
                    <option value="2">2┬║ Turno (16:18 ├ás 01:30)</option>
                    <option value="3">3┬║ Turno (01:30 ├ás 06:30)</option>
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
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={formData.tempoMontagem} 
                    onChange={(e) => setFormData({ ...formData, tempoMontagem: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    readOnly={!!formData.codigoTubo && formData.tempoMontagem !== ''}
                    title={formData.codigoTubo && formData.tempoMontagem !== '' ? 'Preenchido automaticamente da receita de máquina' : ''}
                  />
                  {formData.codigoTubo && formData.tempoMontagem !== '' && (
                    <p className="text-xs text-green-600 mt-1">Ô£ô Preenchido automaticamente da receita</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Múo de Obra *</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={formData.maoObra} 
                    onChange={(e) => setFormData({ ...formData, maoObra: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    readOnly={!!formData.codigoTubo && formData.maoObra !== ''}
                    title={formData.codigoTubo && formData.maoObra !== '' ? 'Preenchido automaticamente da receita de máquina' : ''}
                  />
                  {formData.codigoTubo && formData.maoObra !== '' && (
                    <p className="text-xs text-green-600 mt-1">Ô£ô Preenchido automaticamente da receita</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Múo de Obra por Linha *</label>
                  <input type="number" step="0.1" required value={formData.maoObraPorLinha} onChange={(e) => setFormData({ ...formData, maoObraPorLinha: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                  <p className="text-xs text-gray-500 mt-1">Múo de obra necessária por linha</p>
                </div>
              </div>

              {/* Seçúo: Logística e Preparador */}
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
                      <span className="text-sm font-medium">Atualizaçúo horária (preparador atualizou a cada hora)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ObservaçÇes</label>
                <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* Justificativa de Falta de Funcionário */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Justificativa de Núo Realizaçúo</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Justificativa por Falta de Funcionário</label>
                  <textarea 
                    value={formData.justificativaFaltaFuncionario} 
                    onChange={(e) => setFormData({ ...formData, justificativaFaltaFuncionario: e.target.value })} 
                    rows={3} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    placeholder="Justifique a núo realizaçúo do programado pela logística por motivos de falta de funcionário..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Use este campo para justificar quando núo foi possível atingir a meta programada devido ├á falta de funcionários</p>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingControle ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualizaçúo Detalhada */}
      {viewingControle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Controle de Produçúo</h2>
              <button
                onClick={() => setViewingControle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">InformaçÇes Gerais</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Código do Produto:</span>
                    <p className="text-gray-900">{viewingControle.codigoTubo}</p>
                  </div>
                  {viewingControle.setor && (
                    <div>
                      <span className="font-medium text-gray-700">Setor:</span>
                      <p className="text-gray-900">{viewingControle.setor}</p>
                    </div>
                  )}
                  {viewingControle.linha && (
                    <div>
                      <span className="font-medium text-gray-700">Linha:</span>
                      <p className="text-gray-900">{viewingControle.linha}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Data/Hora:</span>
                    <p className="text-gray-900">{format(new Date(viewingControle.data), 'dd/MM/yyyy', { locale: ptBR })} {viewingControle.hora}</p>
                  </div>
                  {viewingControle.turno && (
                    <div>
                      <span className="font-medium text-gray-700">Turno:</span>
                      <p className="text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTurnoBadgeColor(viewingControle.turno)}`}>
                          {getTurnoLabel(viewingControle.turno)}
                        </span>
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Quantidade 30min:</span>
                    <p className="text-gray-900">{viewingControle.quantidade30min}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Quantidade Hora:</span>
                    <p className="text-gray-900">{viewingControle.quantidadeHora}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tempo de Montagem:</span>
                    <p className="text-gray-900">{viewingControle.tempoMontagem} min</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Múo de Obra:</span>
                    <p className="text-gray-900">{viewingControle.maoObra}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Múo de Obra por Linha:</span>
                    <p className="text-gray-900">{viewingControle.maoObraPorLinha || (viewingControle as any).pessoasPorMaquina || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Processo:</span>
                    <p className="text-gray-900">{viewingControle.processo}</p>
                  </div>
                  {viewingControle.quantidadeTotalLogistica && (
                    <div>
                      <span className="font-medium text-gray-700">Quantidade Pedida pela Logística:</span>
                      <p className="text-gray-900 font-semibold text-blue-600">{viewingControle.quantidadeTotalLogistica}</p>
                    </div>
                  )}
                  {viewingControle.quantidadeFinalRealizada !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Quantidade Final Realizada:</span>
                      <p className={`text-gray-900 font-semibold ${viewingControle.quantidadeTotalLogistica && viewingControle.quantidadeFinalRealizada >= viewingControle.quantidadeTotalLogistica ? 'text-green-600' : 'text-orange-600'}`}>
                        {viewingControle.quantidadeFinalRealizada}
                      </p>
                    </div>
                  )}
                  {viewingControle.eficiencia !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Eficiência:</span>
                      <p className="text-gray-900">
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          viewingControle.eficiencia >= 100 ? 'bg-green-100 text-green-800' :
                          viewingControle.eficiencia >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {viewingControle.eficiencia.toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  )}
                  {viewingControle.atualizacoesHora && viewingControle.atualizacoesHora.length > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700 mb-2 block">Histórico de AtualizaçÇes por Hora:</span>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                        {viewingControle.atualizacoesHora
                          .sort((a, b) => b.hora.localeCompare(a.hora))
                          .map((atualizacao) => (
                            <div key={atualizacao.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                              <div>
                                <span className="font-medium text-gray-700">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  {atualizacao.hora}
                                </span>
                                <span className="ml-2 text-gray-600">: {atualizacao.quantidadeRealizada} unidades</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {atualizacao.atualizadoPor} - {format(new Date(atualizacao.dataAtualizacao), 'dd/MM HH:mm', { locale: ptBR })}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {viewingControle.preparador && (
                    <div>
                      <span className="font-medium text-gray-700">Preparador:</span>
                      <p className="text-gray-900">{viewingControle.preparador}</p>
                    </div>
                  )}
                  {viewingControle.observacoes && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">ObservaçÇes:</span>
                      <p className="text-gray-900">{viewingControle.observacoes}</p>
                    </div>
                  )}
                  {viewingControle.justificativaFaltaFuncionario && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Justificativa Falta de Funcionário:</span>
                      <p className="text-gray-900">{viewingControle.justificativaFaltaFuncionario}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setViewingControle(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Atualizaçúo por Hora (para Preparadores) */}
      {showAtualizacaoHoraModal && controleParaAtualizar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-purple-600" />
                Atualizar Produçúo por Hora
              </h2>
              <button
                onClick={() => {
                  setShowAtualizacaoHoraModal(false);
                  setControleParaAtualizar(null);
                  setQuantidadeHoraAtual('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Código:</strong> {controleParaAtualizar.codigoTubo}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Setor:</strong> {controleParaAtualizar.setor || '-'} | <strong>Linha:</strong> {controleParaAtualizar.linha || '-'}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Quantidade Pedida:</strong> {controleParaAtualizar.quantidadeTotalLogistica || '-'}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Quantidade Realizada at├® agora:</strong> {controleParaAtualizar.quantidadeFinalRealizada || 0}
                </p>
                {controleParaAtualizar.eficiencia !== undefined && (
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Eficiência Atual:</strong> {controleParaAtualizar.eficiencia.toFixed(1)}%
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade Realizada nesta Hora ({format(new Date(), 'HH:00')})
                </label>
                <input
                  type="number"
                  value={quantidadeHoraAtual}
                  onChange={(e) => setQuantidadeHoraAtual(e.target.value)}
                  placeholder="Digite a quantidade"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta quantidade será somada ao total realizado
                </p>
              </div>

              {controleParaAtualizar.atualizacoesHora && controleParaAtualizar.atualizacoesHora.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Histórico de AtualizaçÇes
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {controleParaAtualizar.atualizacoesHora
                        .sort((a, b) => b.hora.localeCompare(a.hora))
                        .map((atualizacao) => (
                          <div key={atualizacao.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {atualizacao.hora}: {atualizacao.quantidadeRealizada} unidades
                            </span>
                            <span className="text-gray-500 text-xs">
                              {atualizacao.atualizadoPor}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAtualizacaoHoraModal(false);
                    setControleParaAtualizar(null);
                    setQuantidadeHoraAtual('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarAtualizacaoHora}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmar Atualizaçúo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pausa para Almoço */}
      {showPausaAlmocoModal && linhaParaPausa && codigoParaPausa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Pausa para Almoço</h2>
              <button
                onClick={() => {
                  setShowPausaAlmocoModal(false);
                  setLinhaParaPausa(null);
                  setCodigoParaPausa(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Código:</strong> {codigoParaPausa.codigoProduto}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Linha:</strong> {linhaParaPausa.linha} | <strong>Setor:</strong> {linhaParaPausa.setor}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de início da pausa:
                </label>
                <input
                  type="time"
                  defaultValue={format(new Date(), 'HH:mm')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  id="horaInicioPausa"
                />
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ÔÜá´©Å A pausa será registrada automaticamente. Lembre-se de finalizar a pausa quando retornar!
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowPausaAlmocoModal(false);
                    setLinhaParaPausa(null);
                    setCodigoParaPausa(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const horaInput = document.getElementById('horaInicioPausa') as HTMLInputElement;
                    const horaInicio = horaInput?.value || format(new Date(), 'HH:mm');
                    const dataHoraInicio = new Date();
                    const [horas, minutos] = horaInicio.split(':');
                    dataHoraInicio.setHours(parseInt(horas), parseInt(minutos), 0, 0);

                    const chaveLinha = `${linhaParaPausa.setor}_${linhaParaPausa.linha}`;
                    const codigosLinha = codigosAtivosPorLinha[chaveLinha] || [];
                    
                    setCodigosAtivosPorLinha(prev => ({
                      ...prev,
                      [chaveLinha]: codigosLinha.map(c => 
                        c.id === codigoParaPausa.id
                          ? {
                              ...c,
                              status: 'pausado' as const,
                              pausaAlmoco: {
                                inicio: dataHoraInicio.toISOString(),
                              },
                            }
                          : c
                      ),
                    }));

                    salvarCodigosAtivos();
                    alert('Pausa para almoço iniciada! Núo esqueça de finalizar quando retornar.');
                    
                    setShowPausaAlmocoModal(false);
                    setLinhaParaPausa(null);
                    setCodigoParaPausa(null);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Iniciar Pausa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  Factory,
  Target,
} from 'lucide-react';
import {
  producaoStorage,
  controleFuncionariosStorage,
  problemasStorage,
  acidentesStorage,
  funcionariosStorage,
  programacoesPedidosStorage,
} from '../utils/storage';
import { perfilStorage } from '../utils/storage';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import type { ProblemaTecnico, Acidente } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function DashboardAdmin() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dados agregados
  const [producaoDetalhada, setProducaoDetalhada] = useState<any[]>([]);
  const [problemasProcesso, setProblemasProcesso] = useState<ProblemaTecnico[]>([]);
  const [faltasPorSetor, setFaltasPorSetor] = useState<Record<string, number>>({});
  const [acidentes, setAcidentes] = useState<Acidente[]>([]);
  const [periodo, setPeriodo] = useState(30); // dias
  
  // Produção Total da Fábrica
  const [producaoTotal, setProducaoTotal] = useState(0);
  const [producaoPorSetorDetalhado, setProducaoPorSetorDetalhado] = useState<any[]>([]);
  const [producaoPorLinhaDetalhado, setProducaoPorLinhaDetalhado] = useState<any[]>([]);
  const [producaoPorSetorLinha, setProducaoPorSetorLinha] = useState<any[]>([]);
  const [producaoTemporal, setProducaoTemporal] = useState<any[]>([]);
  
  // Dados de Programação vs Realização
  const [totalProgramadoFabrica, setTotalProgramadoFabrica] = useState(0);
  const [totalRealizadoFabrica, setTotalRealizadoFabrica] = useState(0);
  const [totalControleProducaoFabrica, setTotalControleProducaoFabrica] = useState(0);
  const [porcentagemRealizacao, setPorcentagemRealizacao] = useState(0);
  const [programadoVsRealizadoSetor, setProgramadoVsRealizadoSetor] = useState<any[]>([]);
  const [producaoPorHora, setProducaoPorHora] = useState<any[]>([]);
  const [contribuicaoPorSetor, setContribuicaoPorSetor] = useState<any[]>([]);
  const [metricasSetorLinha, setMetricasSetorLinha] = useState<any[]>([]);

  useEffect(() => {
    // Verificar autorização
    const perfil = perfilStorage.get();
    if (perfil?.isAdmin) {
      setIsAuthorized(true);
      loadData();
    } else {
      setIsAuthorized(false);
    }
    setLoading(false);
  }, [periodo]);

  // Atualizar dados automaticamente a cada 30 segundos
  useEffect(() => {
    if (!isAuthorized) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAuthorized, periodo]);

  const loadData = () => {
    const dataInicio = startOfDay(subDays(new Date(), periodo));
    const dataFim = endOfDay(new Date());


    // Carregar dados de produção
    const producoes = producaoStorage.getAll();
    const producoesFiltradas = producoes.filter(p => {
      const dataProd = new Date(p.data);
      return dataProd >= dataInicio && dataProd <= dataFim;
    });

    // Produção Total da Fábrica
    const total = producoesFiltradas.reduce((sum, p) => sum + (p.quantidadeHora || 0), 0);
    setProducaoTotal(total);

    // ===== DADOS DE PROGRAMAÇÃO VS REALIZAÇÃO =====
    // Carregar programações do período
    const programacoes = programacoesPedidosStorage.getAll().filter(p => {
      const dataProg = p.dataProgramacao ? new Date(p.dataProgramacao) : new Date(p.dataCriacao);
      return dataProg >= dataInicio && dataProg <= dataFim;
    });

    // Calcular total programado da fábrica
    const totalProgramado = programacoes.reduce((sum, p) => sum + (p.quantidadeProgramada || 0), 0);
    // Calcular total realizado (apenas atualizações horárias)
    const totalRealizado = producoesFiltradas
      .filter(p => p.atualizacaoHora)
      .reduce((sum, p) => sum + (p.quantidadeHora || 0), 0);
    // Calcular total controle de produção (todos os registros)
    const totalControleProducaoFabrica = producoesFiltradas.reduce((sum, p) => sum + (p.quantidadeHora || 0), 0);
    
    setTotalProgramadoFabrica(totalProgramado);
    setTotalRealizadoFabrica(totalRealizado);
    setTotalControleProducaoFabrica(totalControleProducaoFabrica);
    setPorcentagemRealizacao(totalProgramado > 0 ? (totalRealizado / totalProgramado) * 100 : 0);

    // Programado vs Realizado vs Controle de Produção por Setor
    const setorMap = new Map<string, { programado: number; realizado: number; controleProducao: number }>();
    programacoes.forEach(p => {
      const atual = setorMap.get(p.setor) || { programado: 0, realizado: 0, controleProducao: 0 };
      setorMap.set(p.setor, { ...atual, programado: atual.programado + p.quantidadeProgramada });
    });
    producoesFiltradas.forEach(p => {
      const setor = p.setor || 'Sem Setor';
      const atual = setorMap.get(setor) || { programado: 0, realizado: 0, controleProducao: 0 };
      // Realizado: apenas atualizações horárias (atualizacaoHora = true)
      if (p.atualizacaoHora) {
        setorMap.set(setor, { ...atual, realizado: atual.realizado + (p.quantidadeHora || 0) });
      }
      // Controle de Produção: todos os registros
      setorMap.set(setor, { ...atual, controleProducao: atual.controleProducao + (p.quantidadeHora || 0) });
    });
    setProgramadoVsRealizadoSetor(
      Array.from(setorMap.entries())
        .map(([setor, dados]) => ({
          setor,
          programado: dados.programado,
          realizado: dados.realizado,
          controleProducao: dados.controleProducao,
          porcentagem: dados.programado > 0 ? (dados.realizado / dados.programado) * 100 : 0,
          porcentagemContribuicao: totalProgramado > 0 ? (dados.programado / totalProgramado) * 100 : 0,
        }))
        .sort((a, b) => b.programado - a.programado)
    );

    // Programado vs Realizado vs Controle de Produção por Linha
    const linhaMap = new Map<string, { setor: string; linha: string; programado: number; realizado: number; controleProducao: number }>();
    programacoes.forEach(p => {
      const chave = `${p.setor}_${p.linha}`;
      const atual = linhaMap.get(chave) || { setor: p.setor, linha: p.linha, programado: 0, realizado: 0, controleProducao: 0 };
      linhaMap.set(chave, { ...atual, programado: atual.programado + p.quantidadeProgramada });
    });
    producoesFiltradas.forEach(p => {
      if (!p.setor || !p.linha) return;
      const chave = `${p.setor}_${p.linha}`;
      const atual = linhaMap.get(chave) || { setor: p.setor, linha: p.linha, programado: 0, realizado: 0, controleProducao: 0 };
      // Realizado: apenas atualizações horárias
      if (p.atualizacaoHora) {
        linhaMap.set(chave, { ...atual, realizado: atual.realizado + (p.quantidadeHora || 0) });
      }
      // Controle de Produção: todos os registros
      linhaMap.set(chave, { ...atual, controleProducao: atual.controleProducao + (p.quantidadeHora || 0) });
    });
    // setProgramadoVsRealizadoLinha(
    //   Array.from(linhaMap.entries())
    //     .map(([, dados]) => ({
    //       ...dados,
    //       porcentagem: dados.programado > 0 ? (dados.realizado / dados.programado) * 100 : 0,
    //       porcentagemContribuicao: totalProgramado > 0 ? (dados.programado / totalProgramado) * 100 : 0,
    //       diferenca: dados.realizado - dados.programado,
    //     }))
    //     .sort((a, b) => {
    //       if (a.setor !== b.setor) return a.setor.localeCompare(b.setor);
    //       return b.programado - a.programado;
    //     })
    // ); // Não usado

    // Produção por Hora (Realizado e Controle de Produção)
    const horaMapRealizado = new Map<string, number>();
    const horaMapControle = new Map<string, number>();
    producoesFiltradas.forEach(p => {
      const hora = p.hora.substring(0, 2);
      // Controle de Produção: todos os registros
      horaMapControle.set(hora, (horaMapControle.get(hora) || 0) + (p.quantidadeHora || 0));
      // Realizado: apenas atualizações horárias
      if (p.atualizacaoHora) {
        horaMapRealizado.set(hora, (horaMapRealizado.get(hora) || 0) + (p.quantidadeHora || 0));
      }
    });
    
    // Combinar dados de todas as horas
    const todasHoras = new Set([...horaMapRealizado.keys(), ...horaMapControle.keys()]);
    setProducaoPorHora(
      Array.from(todasHoras)
        .map(hora => ({
          hora,
          realizado: horaMapRealizado.get(hora) || 0,
          controleProducao: horaMapControle.get(hora) || 0,
          metaHoraria: totalProgramado > 0 ? totalProgramado / 24 : 0, // Distribuição uniforme
        }))
        .sort((a, b) => a.hora.localeCompare(b.hora))
    );

    // Contribuição por Setor (para gráfico de pizza)
    setContribuicaoPorSetor(
      Array.from(setorMap.entries())
        .map(([setor, dados]) => ({
          name: setor,
          value: dados.programado,
          porcentagem: totalProgramado > 0 ? ((dados.programado / totalProgramado) * 100).toFixed(1) : '0',
          realizado: dados.realizado,
          controleProducao: dados.controleProducao,
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
    );

    // Métricas detalhadas por Setor e Linha
    setMetricasSetorLinha(
      Array.from(linhaMap.entries())
        .map(([, dados]) => ({
          setor: dados.setor,
          linha: dados.linha,
          programado: dados.programado,
          realizado: dados.realizado,
          controleProducao: dados.controleProducao,
          porcentagemRealizacao: dados.programado > 0 ? (dados.realizado / dados.programado) * 100 : 0,
          porcentagemContribuicao: totalProgramado > 0 ? (dados.programado / totalProgramado) * 100 : 0,
          diferenca: dados.realizado - dados.programado,
        }))
        .sort((a, b) => {
          if (a.setor !== b.setor) return a.setor.localeCompare(b.setor);
          return b.programado - a.programado;
        })
    );

    // Produção por Setor (Detalhado)
    const producaoSetorMap = new Map<string, { 
      quantidade: number; 
      quantidadeHora: number; 
      quantidade30min: number;
      registros: number;
    }>();
    
    producoesFiltradas.forEach(p => {
      const setor = p.setor || 'Sem Setor';
      const atual = producaoSetorMap.get(setor) || { 
        quantidade: 0, 
        quantidadeHora: 0, 
        quantidade30min: 0,
        registros: 0
      };
      producaoSetorMap.set(setor, {
        quantidade: atual.quantidade + (p.quantidadeHora || 0),
        quantidadeHora: atual.quantidadeHora + (p.quantidadeHora || 0),
        quantidade30min: atual.quantidade30min + (p.quantidade30min || 0),
        registros: atual.registros + 1,
      });
    });
    
    setProducaoPorSetorDetalhado(
      Array.from(producaoSetorMap.entries())
        .map(([setor, dados]) => ({
          setor,
          quantidade: dados.quantidade,
          quantidadeHora: dados.quantidadeHora,
          quantidade30min: dados.quantidade30min,
          registros: dados.registros,
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
    );

    // Produção por Linha (Detalhado)
    const producaoLinhaMap = new Map<string, { 
      quantidade: number; 
      setor: string;
      quantidadeHora: number;
      quantidade30min: number;
      registros: number;
    }>();
    
    producoesFiltradas.forEach(p => {
      const linha = p.linha || 'Sem Linha';
      const setor = p.setor || 'Sem Setor';
      const atual = producaoLinhaMap.get(linha) || { 
        quantidade: 0, 
        setor,
        quantidadeHora: 0,
        quantidade30min: 0,
        registros: 0
      };
      producaoLinhaMap.set(linha, {
        quantidade: atual.quantidade + (p.quantidadeHora || 0),
        setor,
        quantidadeHora: atual.quantidadeHora + (p.quantidadeHora || 0),
        quantidade30min: atual.quantidade30min + (p.quantidade30min || 0),
        registros: atual.registros + 1,
      });
    });
    
    setProducaoPorLinhaDetalhado(
      Array.from(producaoLinhaMap.entries())
        .map(([linha, dados]) => ({
          linha,
          setor: dados.setor,
          linhaCompleta: `${dados.setor} - ${linha}`,
          quantidade: dados.quantidade,
          quantidadeHora: dados.quantidadeHora,
          quantidade30min: dados.quantidade30min,
          registros: dados.registros,
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
    );

    // Produção por Setor e Linha (Combinado)
    const producaoSetorLinhaMap = new Map<string, { 
      quantidade: number; 
      setor: string;
      linha: string;
      registros: number;
    }>();
    
    producoesFiltradas.forEach(p => {
      const setor = p.setor || 'Sem Setor';
      const linha = p.linha || 'Sem Linha';
      const chave = `${setor}_${linha}`;
      const atual = producaoSetorLinhaMap.get(chave) || { 
        quantidade: 0, 
        setor,
        linha,
        registros: 0
      };
      producaoSetorLinhaMap.set(chave, {
        quantidade: atual.quantidade + (p.quantidadeHora || 0),
        setor,
        linha,
        registros: atual.registros + 1,
      });
    });
    
    setProducaoPorSetorLinha(
      Array.from(producaoSetorLinhaMap.entries())
        .map(([, dados]) => ({
          setor: dados.setor,
          linha: dados.linha,
          setorLinha: `${dados.setor} - ${dados.linha}`,
          quantidade: dados.quantidade,
          registros: dados.registros,
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
    );

    // Produção Temporal (por dia)
    const producaoTemporalMap = new Map<string, number>();
    producoesFiltradas.forEach(p => {
      const data = format(new Date(p.data), 'dd/MM', { locale: ptBR });
      producaoTemporalMap.set(data, (producaoTemporalMap.get(data) || 0) + (p.quantidadeHora || 0));
    });
    
    setProducaoTemporal(
      Array.from(producaoTemporalMap.entries())
        .map(([data, quantidade]) => ({ data, quantidade }))
        .sort((a, b) => {
          const [diaA, mesA] = a.data.split('/').map(Number);
          const [diaB, mesB] = b.data.split('/').map(Number);
          if (mesA !== mesB) return mesA - mesB;
          return diaA - diaB;
        })
    );

    // Agrupar produção por código e data
    const producaoAgrupada = producoesFiltradas.reduce((acc, prod) => {
      const key = `${prod.codigoTubo}_${prod.data}`;
      if (!acc[key]) {
        acc[key] = {
          codigo: prod.codigoTubo,
          data: prod.data,
          quantidadeTotal: 0,
          quantidadeHora: 0,
          quantidade30min: 0,
          quantidadeLogistica: prod.quantidadeTotalLogistica || 0,
          preparador: prod.preparador || 'N/A',
        };
      }
      acc[key].quantidadeTotal += prod.quantidadeHora || 0;
      acc[key].quantidadeHora += prod.quantidadeHora || 0;
      acc[key].quantidade30min += prod.quantidade30min || 0;
      if (prod.quantidadeTotalLogistica) {
        acc[key].quantidadeLogistica = prod.quantidadeTotalLogistica;
      }
      if (prod.preparador) {
        acc[key].preparador = prod.preparador;
      }
      return acc;
    }, {} as Record<string, any>);

    setProducaoDetalhada(Object.values(producaoAgrupada));

    // Carregar problemas
    const problemas = problemasStorage.getAll();
    const problemasFiltrados = problemas.filter(p => {
      const dataProb = new Date(p.data);
      return dataProb >= dataInicio && dataProb <= dataFim;
    });
    setProblemasProcesso(problemasFiltrados);

    // Carregar faltas por setor
    const controles = controleFuncionariosStorage.getAll();
    const funcionarios = funcionariosStorage.getAll();
    
    const faltas = controles.filter(c => {
      const dataControle = new Date(c.data);
      return c.tipo === 'falta' && dataControle >= dataInicio && dataControle <= dataFim;
    });

    const faltasPorSetorMap: Record<string, number> = {};
    faltas.forEach(falta => {
      const funcionario = funcionarios.find(f => f.id === falta.funcionarioId);
      const setor = funcionario?.setor || 'Não informado';
      faltasPorSetorMap[setor] = (faltasPorSetorMap[setor] || 0) + 1;
    });
    setFaltasPorSetor(faltasPorSetorMap);

    // Carregar acidentes
    const acidentesData = acidentesStorage.getAll();
    const acidentesFiltrados = acidentesData.filter(a => {
      const dataAcidente = new Date(a.data);
      return dataAcidente >= dataInicio && dataAcidente <= dataFim;
    });
    setAcidentes(acidentesFiltrados);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Você não tem permissão para acessar o Dashboard Administrativo.</p>
        <p className="text-sm text-gray-500">Entre em contato com o administrador do sistema.</p>
      </div>
    );
  }

  const totalProducao = producaoDetalhada.reduce((acc, p) => acc + p.quantidadeTotal, 0);
  const totalProblemas = problemasProcesso.length;
  const totalFaltas = Object.values(faltasPorSetor).reduce((acc, val) => acc + val, 0);
  const totalAcidentes = acidentes.length;
  const acidentesGraves = acidentes.filter(a => a.tipo === 'grave').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="mt-2 text-gray-600">
            Visão geral e controle detalhado do sistema
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={180}>Últimos 6 meses</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Programado</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProgramadoFabrica.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500 mt-1">Meta da Fábrica</p>
            </div>
            <Target className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Realizado</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalRealizadoFabrica.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500 mt-1">Produção Real</p>
            </div>
            <Activity className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
          porcentagemRealizacao >= 100 ? 'border-green-500' :
          porcentagemRealizacao >= 80 ? 'border-yellow-500' : 'border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">% Realização</p>
              <p className={`text-3xl font-bold mt-2 ${
                porcentagemRealizacao >= 100 ? 'text-green-600' :
                porcentagemRealizacao >= 80 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {porcentagemRealizacao.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {porcentagemRealizacao >= 100 ? 'Meta Atingida' :
                 porcentagemRealizacao >= 80 ? 'Em Andamento' : 'Abaixo da Meta'}
              </p>
            </div>
            {porcentagemRealizacao >= 100 ? (
              <TrendingUp className="w-12 h-12 text-green-500" />
            ) : (
              <TrendingDown className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Produção</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducao.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500 mt-1">unidades produzidas</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Problemas no Processo</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProblemas}</p>
              <p className="text-xs text-gray-500 mt-1">registrados</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Faltas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalFaltas}</p>
              <p className="text-xs text-gray-500 mt-1">por setores</p>
            </div>
            <Users className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Acidentes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalAcidentes}</p>
              <p className="text-xs text-red-600 mt-1">{acidentesGraves} grave(s)</p>
            </div>
            <XCircle className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Métricas de Produção: Programado vs Realizado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white mb-6">
        <h2 className="text-2xl font-bold mb-4">Métricas de Produção da Empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Total Programado (Referência)</p>
            <p className="text-3xl font-bold mt-2">
              {totalProgramadoFabrica.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs opacity-75 mt-1">Meta da Fábrica</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Total Realizado</p>
            <p className="text-3xl font-bold mt-2">
              {totalRealizadoFabrica.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {totalRealizadoFabrica >= totalProgramadoFabrica ? '✅ Meta Atingida' : '⏳ Em Andamento'}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Controle de Produção</p>
            <p className="text-3xl font-bold mt-2">
              {totalControleProducaoFabrica.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs opacity-75 mt-1">Todos os registros</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">% Realização</p>
            <p className={`text-3xl font-bold mt-2 ${
              porcentagemRealizacao >= 100 ? 'text-green-300' :
              porcentagemRealizacao >= 80 ? 'text-yellow-300' : 'text-red-300'
            }`}>
              {porcentagemRealizacao.toFixed(1)}%
            </p>
            <p className="text-xs opacity-75 mt-1">
              {porcentagemRealizacao >= 100 ? 'Acima da Meta' :
               porcentagemRealizacao >= 80 ? 'Próximo da Meta' : 'Abaixo da Meta'}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Diferença</p>
            <p className={`text-3xl font-bold mt-2 ${
              (totalRealizadoFabrica - totalProgramadoFabrica) >= 0 ? 'text-green-300' : 'text-yellow-300'
            }`}>
              {(totalRealizadoFabrica - totalProgramadoFabrica).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {(totalRealizadoFabrica - totalProgramadoFabrica) >= 0 ? 'Acima da Meta' : 'Abaixo da Meta'}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos: Programado vs Realizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico: Programado vs Realizado por Setor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Programado vs Realizado por Setor
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Referência: {totalProgramadoFabrica.toLocaleString('pt-BR')} (Total Programado da Fábrica)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={programadoVsRealizadoSetor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="setor" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    'programado': 'Programado',
                    'realizado': 'Realizado',
                    'controleProducao': 'Controle de Produção'
                  };
                  return [
                    `${value.toLocaleString('pt-BR')} (${labels[name] || name})`,
                    labels[name] || name
                  ];
                }}
              />
              <Legend />
              <Bar dataKey="programado" fill="#3b82f6" name="Programado" />
              <Bar dataKey="realizado" fill="#10b981" name="Realizado" />
              <Bar dataKey="controleProducao" fill="#f59e0b" name="Controle de Produção" />
              <ReferenceLine 
                y={totalProgramadoFabrica} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                label={{ value: 'Meta Total', position: 'top' }}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>• Linha vermelha tracejada: Meta total programada da fábrica</p>
            <p>• Barra azul: Quantidade programada</p>
            <p>• Barra verde: Quantidade realizada (atualizações horárias)</p>
            <p>• Barra laranja: Controle de produção (todos os registros)</p>
          </div>
        </div>

        {/* Gráfico: Produção por Hora com Meta */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Produção por Hora vs Meta Horária
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Comparação com meta horária baseada no total programado
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={producaoPorHora}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    'realizado': 'Realizado',
                    'controleProducao': 'Controle de Produção',
                    'metaHoraria': 'Meta Horária'
                  };
                  return [
                    `${value.toLocaleString('pt-BR')} (${labels[name] || name})`,
                    labels[name] || name
                  ];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="realizado"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Realizado"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="controleProducao"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Controle de Produção"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="metaHoraria"
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                name="Meta Horária"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Contribuição por Setor */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contribuição de Cada Setor no Total Programado
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contribuicaoPorSetor}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, porcentagem }) => `${name}: ${porcentagem}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {contribuicaoPorSetor.map((_entry, _index) => (
                  <Cell key={`cell-${_index}`} fill={COLORS[_index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, _name: string, props: any) => [
                  `${value.toLocaleString('pt-BR')} (${props.payload.porcentagem}% do total)`,
                  'Programado'
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 mb-3">Detalhamento por Setor</h4>
            {contribuicaoPorSetor.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-gray-600">{item.porcentagem}%</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Programado: {item.value.toLocaleString('pt-BR')} | 
                  Realizado: {item.realizado.toLocaleString('pt-BR')} | 
                  Controle: {item.controleProducao?.toLocaleString('pt-BR') || '0'} | 
                  Realização: {item.value > 0 ? ((item.realizado / item.value) * 100).toFixed(1) : '0'}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas Detalhadas por Setor e Linha */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Métricas Detalhadas por Setor e Linha
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Comparação com o total programado da fábrica ({totalProgramadoFabrica.toLocaleString('pt-BR')})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Programado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Realizado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Controle Produção</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Realização</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Contribuição</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferença</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metricasSetorLinha.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Nenhum dado encontrado para este período
                  </td>
                </tr>
              ) : (
                metricasSetorLinha.map((metrica, index) => {
                  const statusColor = metrica.porcentagemRealizacao >= 100 ? 'text-green-600' :
                                     metrica.porcentagemRealizacao >= 80 ? 'text-yellow-600' : 'text-red-600';
                  const statusIcon = metrica.porcentagemRealizacao >= 100 ? <CheckCircle className="w-5 h-5" /> :
                                    metrica.porcentagemRealizacao >= 80 ? <AlertTriangle className="w-5 h-5" /> :
                                    <XCircle className="w-5 h-5" />;
                  const statusText = metrica.porcentagemRealizacao >= 100 ? 'Meta Atingida' :
                                    metrica.porcentagemRealizacao >= 80 ? 'Em Andamento' : 'Abaixo da Meta';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{metrica.setor}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{metrica.linha}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {metrica.programado.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {metrica.realizado.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-orange-600 font-medium">
                        {metrica.controleProducao.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`font-semibold ${statusColor}`}>
                          {metrica.porcentagemRealizacao.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {metrica.porcentagemContribuicao.toFixed(2)}%
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${
                        metrica.diferenca >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metrica.diferenca >= 0 ? '+' : ''}{metrica.diferenca.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={statusColor}>
                            {statusIcon}
                          </span>
                          <span className="text-sm">{statusText}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Produção Total da Fábrica - Detalhada */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Factory className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Produção Total da Fábrica</h2>
              <p className="text-sm text-gray-600">Visão detalhada por setores e linhas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{producaoTotal.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-500">unidades produzidas</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Produção Temporal */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={producaoTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quantidade" stroke="#10b981" strokeWidth={2} name="Quantidade" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Produção por Setor - Gráfico */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção por Setor</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={producaoPorSetorDetalhado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="setor" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabelas Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Produção por Setor - Tabela */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção por Setor - Detalhado</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Setor</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qtd Total</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qtd Hora</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qtd 30min</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Registros</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {producaoPorSetorDetalhado.length > 0 ? (
                    producaoPorSetorDetalhado.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.setor}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {item.quantidade.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                          {item.quantidadeHora.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                          {item.quantidade30min.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                          {item.registros}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-500">Nenhum dado disponível</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Produção por Linha - Tabela */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção por Linha - Detalhado</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Setor - Linha</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qtd Total</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qtd Hora</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Qtd 30min</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Registros</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {producaoPorLinhaDetalhado.length > 0 ? (
                    producaoPorLinhaDetalhado.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.linhaCompleta}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {item.quantidade.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                          {item.quantidadeHora.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                          {item.quantidade30min.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                          {item.registros}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-500">Nenhum dado disponível</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Produção por Setor e Linha Combinado */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção por Setor e Linha (Combinado)</h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Setor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Linha</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Quantidade Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Registros</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {producaoPorSetorLinha.length > 0 ? (
                  producaoPorSetorLinha.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.setor}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.linha}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {item.quantidade.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                        {item.registros}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Nenhum dado disponível</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Controle de Produção Detalhado */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Controle de Produção Detalhado</h2>
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd 30min</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Logística</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preparador</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {producaoDetalhada.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum dado de produção no período selecionado
                  </td>
                </tr>
              ) : (
                producaoDetalhada.map((prod, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{prod.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(prod.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{prod.quantidadeTotal}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{prod.quantidadeHora}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{prod.quantidade30min}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{prod.quantidadeLogistica}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{prod.preparador}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Problemas Durante o Processo */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Problemas Durante o Processo</h2>
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        <div className="space-y-4">
          {problemasProcesso.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum problema registrado no período</p>
          ) : (
            problemasProcesso.map((problema) => (
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
                        problema.status === 'em-andamento' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {problema.status === 'aberto' ? 'Aberto' :
                         problema.status === 'em-andamento' ? 'Em Andamento' : 'Resolvido'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{problema.maquina}</h3>
                    <p className="text-sm text-gray-600 mt-1">{problema.descricao}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(problema.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {problema.hora}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Faltas por Setor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Faltas por Setor</h2>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          {Object.keys(faltasPorSetor).length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma falta registrada no período</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(faltasPorSetor)
                .sort(([, a], [, b]) => b - a)
                .map(([setor, quantidade]) => (
                  <div key={setor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{setor}</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                      {quantidade} {quantidade === 1 ? 'falta' : 'faltas'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Acidentes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Acidentes Registrados</h2>
            <XCircle className="w-6 h-6 text-purple-500" />
          </div>
          {acidentes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum acidente registrado no período</p>
          ) : (
            <div className="space-y-4">
              {acidentes.map((acidente) => (
                <div key={acidente.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        acidente.tipo === 'grave' ? 'bg-red-100 text-red-800' :
                        acidente.tipo === 'moderado' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {acidente.tipo === 'grave' ? 'Grave' :
                         acidente.tipo === 'moderado' ? 'Moderado' : 'Leve'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(acidente.data), 'dd/MM/yyyy', { locale: ptBR })} às {acidente.hora}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-2">
                    {acidente.funcionario?.nome || 'Funcionário não identificado'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{acidente.descricao}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p><strong>Setor:</strong> {acidente.setor}</p>
                    <p><strong>Localização:</strong> {acidente.localizacao}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


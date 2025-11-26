import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  ClipboardList,
  Users,
  AlertTriangle,
  Wrench,
  FileText,
  Package,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  Activity,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import {
  receitasStorage,
  producaoStorage,
  controleFuncionariosStorage,
  problemasStorage,
  mudancasStorage,
  instrucoesStorage,
  componentesStorage,
  segurancaStorage,
  acidentesStorage,
  setoresStorage,
} from '../utils/storage';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useAuth } from '../contexts/AuthContext';
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
} from 'recharts';
import type { ControleProducao, ProblemaTecnico, ControleFuncionarios } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    receitas: 0,
    producao: 0,
    funcionarios: 0,
    problemas: 0,
    mudancas: 0,
    instrucoes: 0,
    componentes: 0,
    seguranca: 0,
  });

  const [producaoAtual, setProducaoAtual] = useState<ControleProducao[]>([]);
  const [producaoPorSetor, setProducaoPorSetor] = useState<any[]>([]);
  const [producaoPorLinha, setProducaoPorLinha] = useState<any[]>([]);
  const [problemasPorSetor, setProblemasPorSetor] = useState<any[]>([]);
  const [problemasPorLinha, setProblemasPorLinha] = useState<any[]>([]);
  const [producaoTemporal, setProducaoTemporal] = useState<any[]>([]);
  const [producaoPorCodigo, setProducaoPorCodigo] = useState<any[]>([]);
  const [faltasPorSetor, setFaltasPorSetor] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes' | 'ano' | 'decada'>('dia');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());

  const loadData = () => {
    const agora = new Date();
    let dataInicio: Date;
    let dataFim: Date = endOfDay(agora);

    switch (periodo) {
      case 'dia':
        dataInicio = startOfDay(agora);
        break;
      case 'semana':
        dataInicio = startOfWeek(agora, { locale: ptBR });
        dataFim = endOfWeek(agora, { locale: ptBR });
        break;
      case 'mes':
        dataInicio = startOfMonth(agora);
        dataFim = endOfMonth(agora);
        break;
      case 'ano':
        dataInicio = startOfYear(agora);
        dataFim = endOfYear(agora);
        break;
      case 'decada':
        dataInicio = new Date(agora.getFullYear() - 10, 0, 1);
        dataFim = endOfYear(agora);
        break;
      default:
        dataInicio = startOfDay(agora);
    }

    // Estatísticas gerais
    const receitas = receitasStorage.getAll();
    const producao = producaoStorage.getAll();
    const funcionarios = controleFuncionariosStorage.getAll();
    const problemas = problemasStorage.getAll();
    const mudancas = mudancasStorage.getAll();
    const instrucoes = instrucoesStorage.getAll();
    const componentes = componentesStorage.getAll();
    const seguranca = segurancaStorage.getAll();

    setStats({
      receitas: receitas.length,
      producao: producao.length,
      funcionarios: funcionarios.length,
      problemas: problemas.filter(p => p.status !== 'resolvido').length,
      mudancas: mudancas.filter(m => m.status !== 'concluido').length,
      instrucoes: instrucoes.length,
      componentes: componentes.length,
      seguranca: seguranca.length,
    });

    // Produção atual (últimas 24 horas)
    const ultimas24h = producao.filter(p => {
      const dataProd = new Date(p.data + 'T' + p.hora);
      return dataProd >= subDays(agora, 1);
    });
    setProducaoAtual(ultimas24h);

    // Produção filtrada por período
    const producaoFiltrada = producao.filter(p => {
      const dataProd = new Date(p.data);
      return dataProd >= dataInicio && dataProd <= dataFim;
    });

    // Produção por Setor
    const producaoSetorMap = new Map<string, { quantidade: number; quantidadeHora: number; quantidade30min: number }>();
    producaoFiltrada.forEach(p => {
      const setor = p.setor || 'Sem Setor';
      const atual = producaoSetorMap.get(setor) || { quantidade: 0, quantidadeHora: 0, quantidade30min: 0 };
      producaoSetorMap.set(setor, {
        quantidade: atual.quantidade + (p.quantidadeHora || 0),
        quantidadeHora: atual.quantidadeHora + (p.quantidadeHora || 0),
        quantidade30min: atual.quantidade30min + (p.quantidade30min || 0),
      });
    });
    setProducaoPorSetor(Array.from(producaoSetorMap.entries()).map(([setor, dados]) => ({
      setor,
      quantidade: dados.quantidade,
      quantidadeHora: dados.quantidadeHora,
      quantidade30min: dados.quantidade30min,
    })));

    // Produção por Linha
    const producaoLinhaMap = new Map<string, { quantidade: number; setor: string }>();
    producaoFiltrada.forEach(p => {
      const linha = p.linha || 'Sem Linha';
      const setor = p.setor || 'Sem Setor';
      const atual = producaoLinhaMap.get(linha) || { quantidade: 0, setor };
      producaoLinhaMap.set(linha, {
        quantidade: atual.quantidade + (p.quantidadeHora || 0),
        setor,
      });
    });
    setProducaoPorLinha(Array.from(producaoLinhaMap.entries()).map(([linha, dados]) => ({
      linha: `${dados.setor} - ${linha}`,
      quantidade: dados.quantidade,
    })).slice(0, 10));

    // Problemas por Setor
    const problemasFiltrados = problemas.filter(p => {
      const dataProb = new Date(p.data);
      return dataProb >= dataInicio && dataProb <= dataFim;
    });
    const problemasSetorMap = new Map<string, number>();
    problemasFiltrados.forEach(p => {
      const setor = (p as any).setor || 'Sem Setor';
      problemasSetorMap.set(setor, (problemasSetorMap.get(setor) || 0) + 1);
    });
    setProblemasPorSetor(Array.from(problemasSetorMap.entries()).map(([setor, count]) => ({
      setor,
      problemas: count,
    })));

    // Problemas por Linha
    const problemasLinhaMap = new Map<string, { problemas: number; setor: string }>();
    problemasFiltrados.forEach(p => {
      const linha = (p as any).linha || 'Sem Linha';
      const setor = (p as any).setor || 'Sem Setor';
      const atual = problemasLinhaMap.get(linha) || { problemas: 0, setor };
      problemasLinhaMap.set(linha, {
        problemas: atual.problemas + 1,
        setor,
      });
    });
    setProblemasPorLinha(Array.from(problemasLinhaMap.entries()).map(([linha, dados]) => ({
      linha: `${dados.setor} - ${linha}`,
      problemas: dados.problemas,
    })).slice(0, 10));

    // Produção Temporal (por dia)
    const producaoTemporalMap = new Map<string, number>();
    producaoFiltrada.forEach(p => {
      const data = format(new Date(p.data), 'dd/MM', { locale: ptBR });
      producaoTemporalMap.set(data, (producaoTemporalMap.get(data) || 0) + (p.quantidadeHora || 0));
    });
    setProducaoTemporal(Array.from(producaoTemporalMap.entries()).map(([data, quantidade]) => ({
      data,
      quantidade,
    })).sort((a, b) => {
      const [diaA, mesA] = a.data.split('/').map(Number);
      const [diaB, mesB] = b.data.split('/').map(Number);
      if (mesA !== mesB) return mesA - mesB;
      return diaA - diaB;
    }));

    // Produção por Código
    const producaoCodigoMap = new Map<string, number>();
    producaoFiltrada.forEach(p => {
      producaoCodigoMap.set(p.codigoTubo, (producaoCodigoMap.get(p.codigoTubo) || 0) + (p.quantidadeHora || 0));
    });
    setProducaoPorCodigo(Array.from(producaoCodigoMap.entries())
      .map(([codigo, quantidade]) => ({ codigo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10));

    // Faltas por Setor
    const faltasFiltradas = funcionarios.filter(f => {
      const dataFunc = new Date(f.data);
      return dataFunc >= dataInicio && dataFunc <= dataFim && f.tipo === 'falta';
    });
    const faltasSetorMap = new Map<string, number>();
    faltasFiltradas.forEach(f => {
      const setor = (f.funcionario as any)?.setor || 'Sem Setor';
      faltasSetorMap.set(setor, (faltasSetorMap.get(setor) || 0) + 1);
    });
    setFaltasPorSetor(Array.from(faltasSetorMap.entries()).map(([setor, faltas]) => ({
      setor,
      faltas,
    })));

    // Atividades recentes
    const activities = [
      ...problemas.filter(p => p.status !== 'resolvido').map(p => ({
        type: 'problema',
        title: `Problema ${p.tipo}: ${p.maquina}`,
        date: p.data,
        icon: AlertTriangle,
        color: 'text-red-600',
      })),
      ...mudancas.filter(m => m.status !== 'concluido').map(m => ({
        type: 'mudanca',
        title: m.titulo,
        date: m.data,
        icon: Wrench,
        color: 'text-blue-600',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    setRecentActivity(activities);
    setUltimaAtualizacao(new Date());
  };

  useEffect(() => {
    loadData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [periodo]);

  const cards = [
    {
      title: 'Receitas de Máquina',
      count: stats.receitas,
      icon: Settings,
      link: '/receitas-maquina',
      color: 'bg-blue-500',
    },
    {
      title: 'Controle de Produção',
      count: stats.producao,
      icon: ClipboardList,
      link: '/controle-producao',
      color: 'bg-green-500',
    },
    {
      title: 'Controle de Funcionários',
      count: stats.funcionarios,
      icon: Users,
      link: '/controle-funcionarios',
      color: 'bg-purple-500',
    },
    {
      title: 'Problemas Técnicos',
      count: stats.problemas,
      icon: AlertTriangle,
      link: '/problemas-tecnicos',
      color: 'bg-red-500',
    },
    {
      title: 'Mudanças e Melhorias',
      count: stats.mudancas,
      icon: Wrench,
      link: '/mudancas-melhorias',
      color: 'bg-yellow-500',
    },
    {
      title: 'Instruções de Trabalho',
      count: stats.instrucoes,
      icon: FileText,
      link: '/instrucoes-trabalho',
      color: 'bg-indigo-500',
    },
    {
      title: 'Componentes por Código',
      count: stats.componentes,
      icon: Package,
      link: '/componentes-produto',
      color: 'bg-pink-500',
    },
    {
      title: 'Segurança do Trabalho',
      count: stats.seguranca,
      icon: Shield,
      link: '/seguranca-trabalho',
      color: 'bg-teal-500',
    },
  ];

  const totalProducaoHoje = producaoAtual.reduce((sum, p) => sum + (p.quantidadeHora || 0), 0);
  const totalProducao30min = producaoAtual.reduce((sum, p) => sum + (p.quantidade30min || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Visão geral do sistema de controle ITCC
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Atualizado: {format(ultimaAtualizacao, 'HH:mm:ss', { locale: ptBR })}</span>
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="dia">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Este Ano</option>
            <option value="decada">Última Década</option>
          </select>
        </div>
      </div>

      {/* Produção Atual (Atualizada a cada 30 segundos) */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Produção Atual (Últimas 24h)</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>Atualiza a cada 30 segundos</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Total Produzido (Hora)</p>
            <p className="text-4xl font-bold mt-2">{totalProducaoHoje.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Total Produzido (30min)</p>
            <p className="text-4xl font-bold mt-2">{totalProducao30min.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Registros de Produção</p>
            <p className="text-4xl font-bold mt-2">{producaoAtual.length}</p>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.link}
              to={card.link}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.count}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção Temporal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={producaoTemporal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quantidade" stroke="#3b82f6" strokeWidth={2} name="Quantidade" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Produção por Setor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção por Setor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={producaoPorSetor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="setor" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade" fill="#10b981" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Problemas por Setor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Problemas por Setor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={problemasPorSetor}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ setor, problemas }) => `${setor}: ${problemas}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="problemas"
              >
                {problemasPorSetor.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Produção por Código */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Códigos de Produção</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={producaoPorCodigo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="codigo" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade" fill="#f59e0b" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabelas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção por Linha */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção por Linha (Top 10)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {producaoPorLinha.length > 0 ? (
                  producaoPorLinha.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.linha}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {item.quantidade.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-gray-500">Nenhum dado disponível</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Problemas por Linha */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Problemas por Linha (Top 10)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Problemas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {problemasPorLinha.length > 0 ? (
                  problemasPorLinha.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.linha}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 text-right font-semibold">
                        {item.problemas}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-gray-500">Nenhum dado disponível</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Faltas por Setor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Faltas por Setor</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Faltas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faltasPorSetor.length > 0 ? (
                  faltasPorSetor.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.setor}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 text-right font-semibold">
                        {item.faltas}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-gray-500">Nenhum dado disponível</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Produção por Setor - Tabela */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produção por Setor - Detalhado</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd Hora</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd 30min</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {producaoPorSetor.length > 0 ? (
                  producaoPorSetor.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.setor}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {item.quantidadeHora.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {item.quantidade30min.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">Nenhum dado disponível</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Atividades Recentes
        </h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <Icon className={`w-5 h-5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(activity.date), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhuma atividade recente
          </p>
        )}
      </div>

      {/* Link para Dashboard Admin */}
      {isAdmin() && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Link
            to="/dashboard-admin"
            className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-8 h-8 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dashboard Administrativo</h3>
                <p className="text-sm text-gray-600">Acesse análises detalhadas e relatórios avançados</p>
              </div>
            </div>
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </Link>
        </div>
      )}
    </div>
  );
}

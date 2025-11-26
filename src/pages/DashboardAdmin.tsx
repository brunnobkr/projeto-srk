import { useEffect, useState } from 'react';
import {
  TrendingUp,
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
} from 'lucide-react';
import {
  producaoStorage,
  controleFuncionariosStorage,
  problemasStorage,
  acidentesStorage,
  funcionariosStorage,
  setoresStorage,
} from '../utils/storage';
import { perfilStorage } from '../utils/storage';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useNavigate } from 'react-router-dom';
import type { ControleProducao, ControleFuncionarios, ProblemaTecnico, Acidente, Funcionario, Setor } from '../types';
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function DashboardAdmin() {
  const navigate = useNavigate();
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
  const [setores, setSetores] = useState<Setor[]>([]);

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

    // Carregar setores
    const setoresData = setoresStorage.getAll();
    setSetores(setoresData);

    // Carregar dados de produção
    const producoes = producaoStorage.getAll();
    const producoesFiltradas = producoes.filter(p => {
      const dataProd = new Date(p.data);
      return dataProd >= dataInicio && dataProd <= dataFim;
    });

    // Produção Total da Fábrica
    const total = producoesFiltradas.reduce((sum, p) => sum + (p.quantidadeHora || 0), 0);
    setProducaoTotal(total);

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
              <p className="text-sm font-medium text-gray-600">Total de Produção</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducao.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">unidades produzidas</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500" />
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


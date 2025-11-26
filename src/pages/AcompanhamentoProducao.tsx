import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Edit,
  Save,
  X,
  Target,
  Activity,
  Factory,
} from 'lucide-react';
import {
  programacoesPedidosStorage,
  producaoStorage,
  problemasStorage,
} from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ControleProducao, ProblemaTecnico } from '../types';
// ProgramacaoPedido removido - não usado
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from 'recharts';

interface ProducaoResumo {
  setor: string;
  linha: string;
  codigoProduto: string;
  quantidadeProgramada: number;
  quantidadeRealizada: number;
  porcentagemRealizacao: number;
  totalPorHora: { hora: string; quantidade: number }[];
  problemas: ProblemaTecnico[];
  ultimaAtualizacao?: string;
  preparador?: string;
}

const COLORS_STATUS = {
  sucesso: '#10b981',
  atencao: '#f59e0b',
  erro: '#ef4444',
  info: '#3b82f6',
};

const COLORS_PIE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function AcompanhamentoProducao() {
  const { usuario } = useAuth();
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [resumoProducao, setResumoProducao] = useState<ProducaoResumo[]>([]);
  const [resumoGeral, setResumoGeral] = useState({
    totalProgramado: 0,
    totalRealizado: 0,
    porcentagemRealizacao: 0,
    setores: 0,
    linhas: 0,
  });
  // setores removido - não usado
  const [showModalAtualizacao, setShowModalAtualizacao] = useState(false);
  const [producaoSelecionada, setProducaoSelecionada] = useState<ProducaoResumo | null>(null);
  const [formAtualizacao, setFormAtualizacao] = useState({
    quantidade: '',
    hora: format(new Date(), 'HH:mm'),
    observacoes: '',
  });
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

  useEffect(() => {
    loadDados();
  }, [dataSelecionada]);

  // Atualizar automaticamente a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      loadDados();
      setUltimaAtualizacao(new Date());
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [dataSelecionada]);

  // const loadSetores = () => {
  //   const todosSetores = setoresStorage.getAll();
  //   setSetores(todosSetores.filter(s => s.ativo));
  // }; // Não usado

  const loadDados = () => {
    const dataInicio = startOfDay(parseISO(dataSelecionada));
    const dataFim = endOfDay(parseISO(dataSelecionada));

    // Carregar programações do dia
    // Compara pela data de criação ou data de programação
    const programacoes = programacoesPedidosStorage.getAll().filter(p => {
      const dataProg = p.dataProgramacao ? parseISO(p.dataProgramacao) : parseISO(p.dataCriacao);
      return dataProg >= dataInicio && dataProg <= dataFim;
    });

    // Carregar produções realizadas do dia
    const producoes = producaoStorage.getAll().filter(p => {
      const dataProd = parseISO(p.data);
      return dataProd >= dataInicio && dataProd <= dataFim;
    });

    // Carregar problemas técnicos do dia
    const problemas = problemasStorage.getAll().filter(p => {
      const dataProb = parseISO(p.data);
      return dataProb >= dataInicio && dataProb <= dataFim;
    });

    // Agrupar por setor, linha e código de produto
    const resumoMap = new Map<string, ProducaoResumo>();

    // Processar programações
    programacoes.forEach(prog => {
      const chave = `${prog.setor}_${prog.linha}_${prog.codigoProduto}`;
      if (!resumoMap.has(chave)) {
        resumoMap.set(chave, {
          setor: prog.setor,
          linha: prog.linha,
          codigoProduto: prog.codigoProduto,
          quantidadeProgramada: 0,
          quantidadeRealizada: 0,
          porcentagemRealizacao: 0,
          totalPorHora: [],
          problemas: [],
        });
      }
      const resumo = resumoMap.get(chave)!;
      resumo.quantidadeProgramada += prog.quantidadeProgramada;
    });

    // Processar produções realizadas
    producoes.forEach(prod => {
      if (!prod.setor || !prod.linha || !prod.codigoTubo) return;

      const chave = `${prod.setor}_${prod.linha}_${prod.codigoTubo}`;
      if (!resumoMap.has(chave)) {
        // Se não tem programação, cria registro apenas com produção
        resumoMap.set(chave, {
          setor: prod.setor,
          linha: prod.linha,
          codigoProduto: prod.codigoTubo,
          quantidadeProgramada: 0,
          quantidadeRealizada: 0,
          porcentagemRealizacao: 0,
          totalPorHora: [],
          problemas: [],
        });
      }
      const resumo = resumoMap.get(chave)!;
      resumo.quantidadeRealizada += prod.quantidadeHora;

      // Agrupar por hora
      const hora = prod.hora.substring(0, 2); // Pega apenas a hora (HH)
      const horaIndex = resumo.totalPorHora.findIndex(h => h.hora === hora);
      if (horaIndex >= 0) {
        resumo.totalPorHora[horaIndex].quantidade += prod.quantidadeHora;
      } else {
        resumo.totalPorHora.push({ hora, quantidade: prod.quantidadeHora });
      }

      // Ordenar por hora
      resumo.totalPorHora.sort((a, b) => a.hora.localeCompare(b.hora));

      // Atualizar última atualização e preparador
      if (prod.preparador && prod.atualizacaoHora) {
        resumo.ultimaAtualizacao = `${prod.data} ${prod.hora}`;
        resumo.preparador = prod.preparador;
      }
    });

    // Associar problemas técnicos
    problemas.forEach(prob => {
      if (!prob.setor || !prob.linha) return;
      // Buscar resumo mais próximo (mesmo setor e linha)
      Array.from(resumoMap.values())
        .filter(r => r.setor === prob.setor && r.linha === prob.linha)
        .forEach(resumo => {
          if (!resumo.problemas.find(p => p.id === prob.id)) {
            resumo.problemas.push(prob);
          }
        });
    });

    // Calcular porcentagem de realização
    const resumos = Array.from(resumoMap.values()).map(resumo => {
      resumo.porcentagemRealizacao =
        resumo.quantidadeProgramada > 0
          ? (resumo.quantidadeRealizada / resumo.quantidadeProgramada) * 100
          : resumo.quantidadeRealizada > 0
          ? 100
          : 0;
      return resumo;
    });

    // Ordenar por setor, linha e código
    resumos.sort((a, b) => {
      if (a.setor !== b.setor) return a.setor.localeCompare(b.setor);
      if (a.linha !== b.linha) return a.linha.localeCompare(b.linha);
      return a.codigoProduto.localeCompare(b.codigoProduto);
    });

    setResumoProducao(resumos);

    // Calcular resumo geral
    const totalProgramado = resumos.reduce((sum, r) => sum + r.quantidadeProgramada, 0);
    const totalRealizado = resumos.reduce((sum, r) => sum + r.quantidadeRealizada, 0);
    const setoresUnicos = new Set(resumos.map(r => r.setor));
    const linhasUnicas = new Set(resumos.map(r => `${r.setor}_${r.linha}`));

    setResumoGeral({
      totalProgramado,
      totalRealizado,
      porcentagemRealizacao: totalProgramado > 0 ? (totalRealizado / totalProgramado) * 100 : 0,
      setores: setoresUnicos.size,
      linhas: linhasUnicas.size,
    });
  };

  const handleAtualizarProducao = (resumo: ProducaoResumo) => {
    setProducaoSelecionada(resumo);
    setFormAtualizacao({
      quantidade: '',
      hora: format(new Date(), 'HH:mm'),
      observacoes: '',
    });
    setShowModalAtualizacao(true);
  };

  const handleSalvarAtualizacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!producaoSelecionada) return;

    const novaProducao: ControleProducao = {
      id: Date.now().toString(),
      codigoTubo: producaoSelecionada.codigoProduto,
      setor: producaoSelecionada.setor,
      linha: producaoSelecionada.linha,
      data: dataSelecionada,
      hora: formAtualizacao.hora,
      quantidade30min: 0,
      quantidadeHora: parseInt(formAtualizacao.quantidade) || 0,
      tempoMontagem: 0,
      maoObra: 0,
      pessoasPorMaquina: 0,
      processo: 'Atualização horária',
      preparador: usuario?.nome || 'Preparador',
      atualizacaoHora: true,
      observacoes: formAtualizacao.observacoes || undefined,
    };

    producaoStorage.add(novaProducao);
    loadDados();
    setShowModalAtualizacao(false);
    alert('Produção atualizada com sucesso!');
  };

  const getStatusColor = (porcentagem: number) => {
    if (porcentagem >= 100) return COLORS_STATUS.sucesso;
    if (porcentagem >= 80) return COLORS_STATUS.atencao;
    return COLORS_STATUS.erro;
  };

  const getStatusIcon = (porcentagem: number) => {
    if (porcentagem >= 100) return <CheckCircle className="w-5 h-5" />;
    if (porcentagem >= 80) return <AlertTriangle className="w-5 h-5" />;
    return <X className="w-5 h-5" />;
  };

  // Total programado da fábrica (referência)
  const totalProgramadoFabrica = resumoGeral.totalProgramado;

  // Dados para gráfico de barras (Programado vs Realizado por Setor)
  const dadosGraficoSetor = Array.from(
    new Set(resumoProducao.map(r => r.setor))
  ).map(setor => {
    const resumosSetor = resumoProducao.filter(r => r.setor === setor);
    const programadoSetor = resumosSetor.reduce((sum, r) => sum + r.quantidadeProgramada, 0);
    const realizadoSetor = resumosSetor.reduce((sum, r) => sum + r.quantidadeRealizada, 0);
    const porcentagemContribuicao = totalProgramadoFabrica > 0 
      ? (programadoSetor / totalProgramadoFabrica) * 100 
      : 0;
    return {
      setor,
      programado: programadoSetor,
      realizado: realizadoSetor,
      porcentagemContribuicao: porcentagemContribuicao.toFixed(1),
      metaReferencia: totalProgramadoFabrica > 0 
        ? (programadoSetor / totalProgramadoFabrica) * resumoGeral.totalRealizado 
        : 0, // Meta proporcional baseada no realizado total
    };
  }).sort((a, b) => b.programado - a.programado); // Ordenar por programado (maior primeiro)

  // Dados para gráfico de linha (Produção por hora com referência do programado total)
  const dadosGraficoHora = resumoProducao
    .flatMap(r => r.totalPorHora.map(h => ({ hora: h.hora, quantidade: h.quantidade, setor: r.setor, linha: r.linha })))
    .reduce((acc, curr) => {
      const existing = acc.find(a => a.hora === curr.hora);
      if (existing) {
        existing.quantidade += curr.quantidade;
      } else {
        acc.push({ hora: curr.hora, quantidade: curr.quantidade });
      }
      return acc;
    }, [] as { hora: string; quantidade: number }[])
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .map(item => ({
      ...item,
      // Meta horária: distribuir o total programado proporcionalmente pelas horas do dia
      metaHoraria: totalProgramadoFabrica > 0 
        ? totalProgramadoFabrica / 24 // Distribuição uniforme (pode ser ajustada)
        : 0,
    }));

  // Dados para gráfico de pizza (Contribuição por Setor)
  const dadosGraficoContribuicao = dadosGraficoSetor.map(item => ({
    name: item.setor,
    value: item.programado,
    porcentagem: item.porcentagemContribuicao,
    realizado: item.realizado,
  }));

  // Métricas detalhadas por setor e linha
  const metricasDetalhadas = Array.from(
    new Set(resumoProducao.map(r => `${r.setor}_${r.linha}`))
  ).map(_chave => {
    const [setor, linha] = _chave.split('_');
    const resumosSetorLinha = resumoProducao.filter(r => r.setor === setor && r.linha === linha);
    const programadoSetorLinha = resumosSetorLinha.reduce((sum, r) => sum + r.quantidadeProgramada, 0);
    const realizadoSetorLinha = resumosSetorLinha.reduce((sum, r) => sum + r.quantidadeRealizada, 0);
    const porcentagemRealizacao = programadoSetorLinha > 0 
      ? (realizadoSetorLinha / programadoSetorLinha) * 100 
      : 0;
    const porcentagemContribuicao = totalProgramadoFabrica > 0 
      ? (programadoSetorLinha / totalProgramadoFabrica) * 100 
      : 0;
    
    return {
      setor,
      linha,
      programado: programadoSetorLinha,
      realizado: realizadoSetorLinha,
      porcentagemRealizacao,
      porcentagemContribuicao,
      diferenca: realizadoSetorLinha - programadoSetorLinha,
    };
  }).sort((a, b) => {
    // Ordenar por setor, depois por programado (maior primeiro)
    if (a.setor !== b.setor) return a.setor.localeCompare(b.setor);
    return b.programado - a.programado;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Acompanhamento de Produção</h1>
          <p className="mt-2 text-gray-600">
            Programado vs Realizado - Atualização em tempo real
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4" />
            <span>Atualizado: {format(ultimaAtualizacao, 'HH:mm:ss', { locale: ptBR })}</span>
          </div>
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Programado</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {resumoGeral.totalProgramado.toLocaleString('pt-BR')}
              </p>
            </div>
            <Target className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Realizado</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {resumoGeral.totalRealizado.toLocaleString('pt-BR')}
              </p>
            </div>
            <Activity className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">% Realização</p>
              <p
                className={`text-3xl font-bold mt-2 ${getStatusColor(resumoGeral.porcentagemRealizacao).replace('#', 'text-')}`}
              >
                {resumoGeral.porcentagemRealizacao.toFixed(1)}%
              </p>
            </div>
            {resumoGeral.porcentagemRealizacao >= 100 ? (
              <TrendingUp className="w-12 h-12 text-green-500" />
            ) : (
              <TrendingDown className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Setores / Linhas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {resumoGeral.setores} / {resumoGeral.linhas}
              </p>
            </div>
            <Factory className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Métricas da Empresa */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Métricas de Produção da Empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {resumoGeral.totalRealizado.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {resumoGeral.totalRealizado >= totalProgramadoFabrica ? '✅ Meta Atingida' : '⏳ Em Andamento'}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <p className="text-sm opacity-90">Diferença</p>
            <p className={`text-3xl font-bold mt-2 ${
              resumoGeral.totalRealizado >= totalProgramadoFabrica ? 'text-green-300' : 'text-yellow-300'
            }`}>
              {(resumoGeral.totalRealizado - totalProgramadoFabrica).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {resumoGeral.totalRealizado >= totalProgramadoFabrica ? 'Acima da Meta' : 'Abaixo da Meta'}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico: Programado vs Realizado por Setor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Programado vs Realizado por Setor
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Referência: {totalProgramadoFabrica.toLocaleString('pt-BR')} (Total Programado da Fábrica)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGraficoSetor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="setor" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('pt-BR')} ${name === 'programado' ? '(Programado)' : '(Realizado)'}`,
                  name === 'programado' ? 'Programado' : 'Realizado'
                ]}
              />
              <Legend />
              <Bar dataKey="programado" fill="#3b82f6" name="Programado" />
              <Bar dataKey="realizado" fill="#10b981" name="Realizado" />
              <ReferenceLine 
                y={totalProgramadoFabrica} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                label={{ value: 'Meta Total', position: 'top' }}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-500">
            <p>Linha vermelha tracejada: Meta total programada da fábrica</p>
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
            <LineChart data={dadosGraficoHora}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString('pt-BR')} ${name === 'quantidade' ? '(Realizado)' : '(Meta)'}`,
                  name === 'quantidade' ? 'Realizado' : 'Meta Horária'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="quantidade"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Realizado"
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contribuição de Cada Setor no Total Programado
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosGraficoContribuicao}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, porcentagem }) => `${name}: ${porcentagem}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosGraficoContribuicao.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  `${value.toLocaleString('pt-BR')}`,
                  'Programado'
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 mb-3">Detalhamento por Setor</h4>
            {dadosGraficoSetor.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.setor}</span>
                  <span className="text-sm text-gray-600">{item.porcentagemContribuicao}%</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Programado: {item.programado.toLocaleString('pt-BR')} | 
                  Realizado: {item.realizado.toLocaleString('pt-BR')} | 
                  Realização: {item.programado > 0 ? ((item.realizado / item.programado) * 100).toFixed(1) : '0'}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas Detalhadas por Setor e Linha */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Realização</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Contribuição</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferença</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metricasDetalhadas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Nenhum dado encontrado para esta data
                  </td>
                </tr>
              ) : (
                metricasDetalhadas.map((metrica, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{metrica.setor}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{metrica.linha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {metrica.programado.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {metrica.realizado.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-semibold ${getStatusColor(metrica.porcentagemRealizacao).replace('#', 'text-')}`}>
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
                        <span className={getStatusColor(metrica.porcentagemRealizacao).replace('#', 'text-')}>
                          {getStatusIcon(metrica.porcentagemRealizacao)}
                        </span>
                        <span className="text-sm">
                          {metrica.porcentagemRealizacao >= 100
                            ? 'Meta Atingida'
                            : metrica.porcentagemRealizacao >= 80
                            ? 'Em Andamento'
                            : 'Abaixo da Meta'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela Detalhada por Código */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalhamento por Setor, Linha e Código
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Detalhamento completo por código de produto
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Setor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Linha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Programado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Realizado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  % Realização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Problemas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Última Atualização
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resumoProducao.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    Nenhum dado encontrado para esta data
                  </td>
                </tr>
              ) : (
                resumoProducao.map((resumo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{resumo.setor}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{resumo.linha}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{resumo.codigoProduto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {resumo.quantidadeProgramada.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {resumo.quantidadeRealizada.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`font-semibold ${getStatusColor(resumo.porcentagemRealizacao).replace('#', 'text-')}`}
                      >
                        {resumo.porcentagemRealizacao.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`${getStatusColor(resumo.porcentagemRealizacao).replace('#', 'text-')}`}
                        >
                          {getStatusIcon(resumo.porcentagemRealizacao)}
                        </span>
                        <span className="text-sm">
                          {resumo.porcentagemRealizacao >= 100
                            ? 'Meta Atingida'
                            : resumo.porcentagemRealizacao >= 80
                            ? 'Em Andamento'
                            : 'Abaixo da Meta'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {resumo.problemas.length > 0 ? (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">{resumo.problemas.length}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sem problemas</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resumo.ultimaAtualizacao
                        ? format(parseISO(resumo.ultimaAtualizacao), 'dd/MM HH:mm', { locale: ptBR })
                        : '-'}
                      {resumo.preparador && (
                        <div className="text-xs text-gray-400">por {resumo.preparador}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleAtualizarProducao(resumo)}
                        className="text-primary-600 hover:text-primary-900 flex items-center justify-center space-x-1"
                        title="Atualizar produção"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Atualizar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Atualização */}
      {showModalAtualizacao && producaoSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Atualizar Produção</h2>
              <button
                onClick={() => setShowModalAtualizacao(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Setor: {producaoSelecionada.setor}</p>
              <p className="text-sm text-gray-600">Linha: {producaoSelecionada.linha}</p>
              <p className="text-sm text-gray-600">Código: {producaoSelecionada.codigoProduto}</p>
              <p className="text-sm text-gray-600">
                Programado: {producaoSelecionada.quantidadeProgramada.toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-gray-600">
                Realizado: {producaoSelecionada.quantidadeRealizada.toLocaleString('pt-BR')}
              </p>
            </div>
            <form onSubmit={handleSalvarAtualizacao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantidade Realizada (última hora) *
                </label>
                <input
                  type="number"
                  required
                  value={formAtualizacao.quantidade}
                  onChange={(e) => setFormAtualizacao({ ...formAtualizacao, quantidade: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Quantidade produzida na última hora"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora *</label>
                <input
                  type="time"
                  required
                  value={formAtualizacao.hora}
                  onChange={(e) => setFormAtualizacao({ ...formAtualizacao, hora: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={formAtualizacao.observacoes}
                  onChange={(e) => setFormAtualizacao({ ...formAtualizacao, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Observações sobre a produção (problemas, paradas, etc.)"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModalAtualizacao(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Atualização</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


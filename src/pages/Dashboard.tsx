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
  BarChart3,
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
} from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

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

  const loadData = () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Acesso rápido às funcionalidades do sistema
        </p>
      </div>

      {/* Cards de Acesso Rápido */}
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

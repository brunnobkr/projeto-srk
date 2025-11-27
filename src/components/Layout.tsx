import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  ClipboardList, 
  AlertTriangle,
  Wrench,
  FileText,
  Package,
  Shield,
  User,
  BarChart3,
  ShoppingCart,
  Building2,
  Zap,
  Hammer,
  Monitor,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  TrendingUp,
  Cloud
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode, useState, useEffect } from 'react';
import { notificacoesStorage } from '../utils/storage';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/receitas-maquina', label: 'Receitas de Máquina', icon: Settings },
  { path: '/controle-producao', label: 'Controle de Produção', icon: ClipboardList },
  { path: '/acompanhamento-producao', label: 'Acompanhamento de Produção', icon: TrendingUp },
  { path: '/controle-funcionarios', label: 'Controle de Funcionários', icon: Users },
  { path: '/problemas-tecnicos', label: 'Problemas Técnicos', icon: AlertTriangle },
  { path: '/mudancas-melhorias', label: 'Mudanças e Melhorias', icon: Wrench },
  { path: '/instrucoes-trabalho', label: 'Instruções de Trabalho', icon: FileText },
  { path: '/componentes-produto', label: 'Componentes por Código', icon: Package },
  { path: '/seguranca-trabalho', label: 'Segurança do Trabalho', icon: Shield },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { usuario, logout, isAdmin, isLogistica, isEngenharia, isSegurancaTrabalho, isCentralMecanica, isTI } = useAuth();
  const [setoresExpandidos, setSetoresExpandidos] = useState<Record<string, boolean>>({
    setores: false,
    centralMecanica: false,
  });
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  useEffect(() => {
    if (usuario) {
      const loadNotificacoes = () => {
        const notifs = notificacoesStorage.getNaoLidas(usuario.id);
        setNotificacoesNaoLidas(notifs.length);
      };
      
      loadNotificacoes();
      const interval = setInterval(loadNotificacoes, 2000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-700">
                Sumitomo S-riko
              </h1>
              <span className="ml-4 text-sm text-gray-500">
                Controle ITCC
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-600">
                <p>CNPJ: 60.689.346/0001-70</p>
                <p className="text-xs">Juatuba - MG</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/chat"
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Chat"
                >
                  <MessageCircle className="w-6 h-6" />
                  {notificacoesNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
                    </span>
                  )}
                </Link>
                <Link
                  to="/meu-perfil"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Meu Perfil"
                >
                  <div className="relative">
                    {usuario?.fotoPerfil ? (
                      <img
                        src={usuario.fotoPerfil}
                        alt={usuario.nome || 'Perfil'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {usuario?.nome || 'Usuário'}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
                  title="Sair"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              {isAdmin() && (
                <li>
                  <Link
                    to="/dashboard-admin"
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/dashboard-admin'
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5 mr-3" />
                    <span>Dashboard Admin</span>
                  </Link>
                </li>
              )}
              {usuario?.id === 'admin_inicial' && (
                <>
                  <li>
                    <Link
                      to="/gerenciar-usuarios"
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/gerenciar-usuarios'
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-5 h-5 mr-3" />
                      <span>Gerenciar Usuários</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/configuracao-cloud"
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/configuracao-cloud'
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Cloud className="w-5 h-5 mr-3" />
                      <span>Configuração Cloud</span>
                    </Link>
                  </li>
                </>
              )}
              {isLogistica() && (
                <li>
                  <Link
                    to="/programacao-pedidos"
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/programacao-pedidos'
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    <span>Programação de Pedidos</span>
                  </Link>
                </li>
              )}
              {isEngenharia() && (
                <li>
                  <Link
                    to="/gerenciar-setores-linhas"
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/gerenciar-setores-linhas'
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mr-3" />
                    <span>Gerenciar Setores e Linhas</span>
                  </Link>
                </li>
              )}

              {/* Divisor de Setores */}
              <li className="pt-4 mt-4 border-t border-gray-200">
                <button
                  onClick={() => setSetoresExpandidos({
                    ...setoresExpandidos,
                    setores: !setoresExpandidos.setores
                  })}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-3 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-gray-500 rounded"></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Setores</span>
                  </div>
                  {setoresExpandidos.setores ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </li>

              {/* Menu de Setores Expansível */}
              {setoresExpandidos.setores && (
                <>
                  {/* Engenharia - sempre disponível para admin */}
                  {(isEngenharia() || usuario?.id === 'admin_inicial') && (
                    <li>
                      <Link
                        to="/gerenciar-setores-linhas"
                        onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false })}
                        className={`flex items-center px-4 py-3 pl-12 rounded-lg transition-colors ${
                          location.pathname === '/gerenciar-setores-linhas'
                            ? 'bg-primary-50 text-primary-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Settings className="w-5 h-5 mr-3" />
                        <span>Engenharia</span>
                      </Link>
                    </li>
                  )}

                  {/* Logística - sempre disponível para admin */}
                  {(isLogistica() || usuario?.id === 'admin_inicial') && (
                    <>
                      <li>
                        <Link
                          to="/programacao-pedidos"
                          onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false })}
                          className={`flex items-center px-4 py-3 pl-12 rounded-lg transition-colors ${
                            location.pathname === '/programacao-pedidos'
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <ShoppingCart className="w-5 h-5 mr-3" />
                          <span>Logística</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/equipe"
                          onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false })}
                          className={`flex items-center px-4 py-3 pl-12 rounded-lg transition-colors ${
                            location.pathname === '/equipe'
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Users className="w-5 h-5 mr-3" />
                          <span>Equipe</span>
                        </Link>
                      </li>
                    </>
                  )}

                  {/* Segurança do Trabalho - sempre disponível para admin */}
                  {(isSegurancaTrabalho() || usuario?.id === 'admin_inicial') && (
                    <li>
                      <Link
                        to="/seguranca-trabalho"
                        onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false })}
                        className={`flex items-center px-4 py-3 pl-12 rounded-lg transition-colors ${
                          location.pathname === '/seguranca-trabalho'
                            ? 'bg-primary-50 text-primary-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Shield className="w-5 h-5 mr-3" />
                        <span>Segurança do Trabalho</span>
                      </Link>
                    </li>
                  )}

                  {/* Central de Mecânica - sempre disponível para admin */}
                  {(isCentralMecanica() || usuario?.id === 'admin_inicial') && (
                    <>
                      <li>
                        <button
                          onClick={() => setSetoresExpandidos({
                            ...setoresExpandidos,
                            centralMecanica: !setoresExpandidos.centralMecanica
                          })}
                          className="w-full flex items-center justify-between px-4 py-3 pl-12 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <Wrench className="w-5 h-5 mr-3" />
                            <span>Central de Mecânica</span>
                          </div>
                          {setoresExpandidos.centralMecanica ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </li>
                      {setoresExpandidos.centralMecanica && (
                        <>
                          <li className="pl-16">
                            <Link
                              to="/central-mecanica"
                              onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false, centralMecanica: false })}
                              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                                location.pathname === '/central-mecanica' && !location.search.includes('tipo=')
                                  ? 'bg-primary-50 text-primary-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Wrench className="w-5 h-5 mr-3" />
                              <span>Mecânica</span>
                            </Link>
                          </li>
                          <li className="pl-16">
                            <Link
                              to="/central-mecanica?tipo=eletrica"
                              onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false, centralMecanica: false })}
                              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                                location.search.includes('tipo=eletrica')
                                  ? 'bg-primary-50 text-primary-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Zap className="w-5 h-5 mr-3" />
                              <span>Elétrica</span>
                            </Link>
                          </li>
                          <li className="pl-16">
                            <Link
                              to="/central-mecanica?tipo=ferramentaria"
                              onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false, centralMecanica: false })}
                              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                                location.search.includes('tipo=ferramentaria')
                                  ? 'bg-primary-50 text-primary-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Hammer className="w-5 h-5 mr-3" />
                              <span>Ferramentaria</span>
                            </Link>
                          </li>
                        </>
                      )}
                    </>
                  )}

                  {/* TI - sempre disponível para admin */}
                  {(isTI() || usuario?.id === 'admin_inicial') && (
                    <>
                      <li>
                        <Link
                          to="/chamados-ti"
                          onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false })}
                          className={`flex items-center px-4 py-3 pl-12 rounded-lg transition-colors ${
                            location.pathname === '/chamados-ti'
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Monitor className="w-5 h-5 mr-3" />
                          <span>TI</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/equipe"
                          onClick={() => setSetoresExpandidos({ ...setoresExpandidos, setores: false })}
                          className={`flex items-center px-4 py-3 pl-12 rounded-lg transition-colors ${
                            location.pathname === '/equipe'
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Users className="w-5 h-5 mr-3" />
                          <span>Equipe</span>
                        </Link>
                      </li>
                    </>
                  )}

                  {/* Mensagem se não tiver acesso a nenhum setor */}
                  {!isEngenharia() && !isLogistica() && !isCentralMecanica() && !isTI() && !isSegurancaTrabalho() && usuario?.id !== 'admin_inicial' && (
                    <li>
                      <div className="px-4 py-3 pl-12 text-sm text-gray-500">
                        Nenhum setor disponível
                      </div>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


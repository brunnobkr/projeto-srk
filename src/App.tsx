import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReceitasMaquina from './pages/ReceitasMaquina';
import ControleProducao from './pages/ControleProducao';
import ControleFuncionarios from './pages/ControleFuncionarios';
import ProblemasTecnicos from './pages/ProblemasTecnicos';
import MudancasMelhorias from './pages/MudancasMelhorias';
import InstrucoesTrabalho from './pages/InstrucoesTrabalho';
import ComponentesProduto from './pages/ComponentesProduto';
import SegurancaTrabalho from './pages/SegurancaTrabalho';
import MeuPerfil from './pages/MeuPerfil';
import DashboardAdmin from './pages/DashboardAdmin';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import ProgramacaoPedidos from './pages/ProgramacaoPedidos';
import GerenciarSetoresLinhas from './pages/GerenciarSetoresLinhas';
import CentralMecanica from './pages/CentralMecanica';
import ChamadosTI from './pages/ChamadosTI';
import Registro from './pages/Registro';
import Chat from './pages/Chat';
import Equipe from './pages/Equipe';

function AppRoutes() {
  const { usuario } = useAuth();

  // Sempre redirecionar para login se não estiver autenticado
  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/receitas-maquina" element={<ProtectedRoute requiredPermission="receitasMaquina"><ReceitasMaquina /></ProtectedRoute>} />
        <Route path="/controle-producao" element={<ProtectedRoute requiredPermission="controleProducao"><ControleProducao /></ProtectedRoute>} />
        <Route path="/controle-funcionarios" element={<ProtectedRoute requiredPermission="controleFuncionarios"><ControleFuncionarios /></ProtectedRoute>} />
        <Route path="/problemas-tecnicos" element={<ProtectedRoute requiredPermission="problemasTecnicos"><ProblemasTecnicos /></ProtectedRoute>} />
        <Route path="/mudancas-melhorias" element={<ProtectedRoute requiredPermission="mudancasMelhorias"><MudancasMelhorias /></ProtectedRoute>} />
        <Route path="/instrucoes-trabalho" element={<ProtectedRoute requiredPermission="instrucoesTrabalho"><InstrucoesTrabalho /></ProtectedRoute>} />
        <Route path="/componentes-produto" element={<ProtectedRoute requiredPermission="componentesProduto"><ComponentesProduto /></ProtectedRoute>} />
        <Route path="/seguranca-trabalho" element={<ProtectedRoute requiredPermission="segurancaTrabalho"><SegurancaTrabalho /></ProtectedRoute>} />
        <Route path="/meu-perfil" element={<ProtectedRoute><MeuPerfil /></ProtectedRoute>} />
        <Route path="/dashboard-admin" element={<ProtectedRoute requiredPermission="dashboardAdmin"><DashboardAdmin /></ProtectedRoute>} />
        <Route path="/gerenciar-usuarios" element={<ProtectedRoute requireAdminPadrao><GerenciarUsuarios /></ProtectedRoute>} />
        <Route path="/programacao-pedidos" element={<ProtectedRoute requiredPermission="programarPedidos"><ProgramacaoPedidos /></ProtectedRoute>} />
        <Route path="/gerenciar-setores-linhas" element={<ProtectedRoute><GerenciarSetoresLinhas /></ProtectedRoute>} />
        <Route path="/central-mecanica" element={<ProtectedRoute><CentralMecanica /></ProtectedRoute>} />
        <Route path="/chamados-ti" element={<ProtectedRoute><ChamadosTI /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;


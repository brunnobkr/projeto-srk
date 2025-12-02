import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sessaoStorage, usuariosStorage } from '../utils/storage';
import type { Usuario, Permissoes } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  login: (username: string, senha: string) => boolean;
  logout: () => void;
  hasPermission: (permission: keyof Permissoes) => boolean;
  hasAnyPermission: (permissions: (keyof Permissoes)[]) => boolean;
  isAdmin: () => boolean;
  canView: (modulo: string) => boolean;
  canEdit: (modulo: string) => boolean;
  canCreate: (modulo: string) => boolean;
  canDelete: (modulo: string) => boolean;
  isLogistica: () => boolean;
  isEngenharia: () => boolean;
  isSegurancaTrabalho: () => boolean;
  isCentralMecanica: () => boolean;
  isTI: () => boolean;
  isPreparador: () => boolean;
  podeAtualizarProducao: () => boolean; // Verifica se pode atualizar produção hora a hora
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const loadUsuario = () => {
    const usuarioSessao = sessaoStorage.get();
    if (usuarioSessao && usuarioSessao.isAtivo) {
      // Recarregar do storage para pegar atualizações
      const usuarioAtualizado = usuariosStorage.getById(usuarioSessao.id);
      if (usuarioAtualizado && usuarioAtualizado.isAtivo) {
        setUsuario(usuarioAtualizado);
      } else {
        setUsuario(null);
        sessaoStorage.clear();
      }
    }
  };

  useEffect(() => {
    // Criar usuário admin inicial se não existir nenhum
    const todosUsuarios = usuariosStorage.getAll();
    if (todosUsuarios.length === 0) {
      const permissoesModuloPadrao = {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
      };

      const permissoesPadrao: Permissoes = {
        receitasMaquina: { ...permissoesModuloPadrao },
        controleProducao: { ...permissoesModuloPadrao },
        controleFuncionarios: { ...permissoesModuloPadrao },
        problemasTecnicos: { ...permissoesModuloPadrao },
        mudancasMelhorias: { ...permissoesModuloPadrao },
        instrucoesTrabalho: { ...permissoesModuloPadrao },
        componentesProduto: { ...permissoesModuloPadrao },
        segurancaTrabalho: { ...permissoesModuloPadrao },
        dashboardAdmin: false,
        gerenciarUsuarios: false,
        programarPedidos: false,
        atualizarProducaoHora: false,
      };

      const adminInicial: Usuario = {
        id: 'admin_inicial',
        username: 'admin',
        senha: 'admin2020',
        nome: 'Administrador',
        email: 'admin@sumitomo.com.br',
        cargo: 'Administrador',
        isAdmin: true,
        isAtivo: true,
        permissoes: permissoesPadrao,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        criadoPor: 'Sistema',
      };
      usuariosStorage.add(adminInicial);
    }

    loadUsuario();
    // Recarregar usuário periodicamente para pegar atualizações
    const interval = setInterval(() => {
      loadUsuario();
    }, 5000); // A cada 5 segundos
    return () => {
      clearInterval(interval);
    };
  }, []);

  const login = (username: string, senha: string): boolean => {
    const usuario = usuariosStorage.getByUsername(username);
    if (usuario && usuario.senha === senha && usuario.isAtivo) {
      setUsuario(usuario);
      sessaoStorage.set(usuario);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUsuario(null);
    sessaoStorage.clear();
  };

  const hasPermission = (permission: keyof Permissoes): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem todas as permissões
    
    // Controle de Produção: todos os usuários autenticados podem visualizar
    if (permission === 'controleProducao') {
      return true; // Todos podem visualizar (atualização é controlada por podeAtualizarProducao)
    }
    
    // Verificar permissões baseadas em cargo/setor
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    
    // Engenharia tem acesso a receitas, componentes, instruções e segurança
    if (cargo.includes('engenharia') || setor.includes('engenharia')) {
      if (['receitasMaquina', 'componentesProduto', 'instrucoesTrabalho', 'segurancaTrabalho'].includes(permission)) {
        return true;
      }
    }
    
    // Logística tem acesso a programação de pedidos
    if (setor.includes('logística') || setor.includes('logistica')) {
      if (permission === 'programarPedidos') {
        return true;
      }
    }
    
    // Verificar permissões explícitas
    const permissao = usuario.permissoes[permission];
    // Se for boolean, retornar diretamente
    if (typeof permissao === 'boolean') {
      return permissao;
    }
    // Se for PermissoesModulo, retornar false (não é uma permissão simples)
    return false;
  };

  const hasAnyPermission = (permissions: (keyof Permissoes)[]): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true;
    return permissions.some(perm => hasPermission(perm));
  };

  const isAdmin = (): boolean => {
    return usuario?.isAdmin || false;
  };

  const canView = (modulo: string): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true;
    if (usuario.isAdmin) return true;
    
    // Controle de Produção: todos podem visualizar (apenas atualização requer permissão)
    if (modulo === 'controleProducao') {
      return true; // Todos os usuários autenticados podem visualizar
    }
    
    const moduloPermissao = usuario.permissoes[modulo as keyof Permissoes];
    
    // Nova estrutura: permissões por módulo
    if (typeof moduloPermissao === 'object' && 'visualizar' in moduloPermissao) {
      return moduloPermissao.visualizar;
    }
    
    // Estrutura antiga (compatibilidade)
    if (usuario.permissoes.visualizar) return true;
    
    // Verificar se o módulo está habilitado (estrutura antiga)
    if (typeof moduloPermissao === 'boolean') {
      return moduloPermissao;
    }
    
    return false;
  };

  const canCreate = (modulo: string): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true;
    if (usuario.isAdmin) return true;
    
    const moduloPermissao = usuario.permissoes[modulo as keyof Permissoes];
    
    // Nova estrutura: permissões por módulo
    if (typeof moduloPermissao === 'object' && 'criar' in moduloPermissao) {
      return moduloPermissao.criar;
    }
    
    // Estrutura antiga (compatibilidade)
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    
    // Engenharia pode criar receitas, componentes, instruções e segurança
    if (cargo.includes('engenharia') || setor.includes('engenharia')) {
      if (['receitasMaquina', 'componentesProduto', 'instrucoesTrabalho', 'segurancaTrabalho'].includes(modulo)) {
        return usuario.permissoes.criar || true;
      }
    }
    
    return usuario.permissoes.criar || false;
  };

  const canEdit = (modulo: string): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true;
    if (usuario.isAdmin) return true;
    
    const moduloPermissao = usuario.permissoes[modulo as keyof Permissoes];
    
    // Nova estrutura: permissões por módulo
    if (typeof moduloPermissao === 'object' && 'editar' in moduloPermissao) {
      return moduloPermissao.editar;
    }
    
    // Estrutura antiga (compatibilidade)
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    
    // Engenharia pode editar receitas, componentes, instruções e segurança
    if (cargo.includes('engenharia') || setor.includes('engenharia')) {
      if (['receitasMaquina', 'componentesProduto', 'instrucoesTrabalho', 'segurancaTrabalho'].includes(modulo)) {
        return usuario.permissoes.editar || true;
      }
    }
    
    return usuario.permissoes.editar || false;
  };

  const canDelete = (modulo: string): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true;
    if (usuario.isAdmin) return true;
    
    const moduloPermissao = usuario.permissoes[modulo as keyof Permissoes];
    
    // Nova estrutura: permissões por módulo
    if (typeof moduloPermissao === 'object' && 'excluir' in moduloPermissao) {
      return moduloPermissao.excluir;
    }
    
    // Estrutura antiga (compatibilidade)
    return usuario.permissoes.excluir || false;
  };

  const isLogistica = (): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem acesso a tudo
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    return cargo.includes('logística') || cargo.includes('logistica') ||
           setor.includes('logística') || setor.includes('logistica');
  };

  const isEngenharia = (): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem acesso a tudo
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    return cargo.includes('engenharia') || cargo.includes('engenheiro') ||
           setor.includes('engenharia');
  };

  const isSegurancaTrabalho = (): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem acesso a tudo
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    return cargo.includes('segurança') || cargo.includes('seguranca') || 
           cargo.includes('segurança do trabalho') ||
           setor.includes('segurança') || setor.includes('seguranca');
  };

  const isCentralMecanica = (): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem acesso a tudo
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    return cargo.includes('mecânico') || cargo.includes('mecanico') ||
           cargo.includes('eletricista') || cargo.includes('ferramentaria') ||
           cargo.includes('ferramenteiro') ||
           setor.includes('mecânica') || setor.includes('mecanica') ||
           setor.includes('elétrica') || setor.includes('eletrica') ||
           setor.includes('central de mecânica') || setor.includes('central de mecanica');
  };

  const isTI = (): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem acesso a tudo
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    return cargo.includes('ti') || cargo.includes('tecnologia') ||
           cargo.includes('informática') || cargo.includes('informatica') ||
           cargo.includes('analista') || cargo.includes('suporte') ||
           setor.includes('ti') || setor.includes('tecnologia') ||
           setor.includes('informática') || setor.includes('informatica');
  };

  const isPreparador = (): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem acesso a tudo
    const cargo = usuario.cargo?.toLowerCase() || '';
    const setor = usuario.setor?.toLowerCase() || '';
    return cargo.includes('preparador') || cargo.includes('preparadora') ||
           setor.includes('preparação') || setor.includes('preparacao');
  };

  // Verifica se o usuário pode atualizar produção hora a hora
  // Preparadores têm permissão automática, mas admin pode autorizar outros usuários
  const podeAtualizarProducao = (): boolean => {
    if (!usuario) return false;
    if (usuario.id === 'admin_inicial') return true; // Admin padrão tem acesso a tudo
    if (isAdmin()) return true; // Admins podem atualizar
    if (isPreparador()) return true; // Preparadores têm permissão automática
    // Verificar permissão específica concedida pelo admin
    return usuario.permissoes?.atualizarProducaoHora === true;
  };

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      login, 
      logout, 
      hasPermission, 
      hasAnyPermission, 
      isAdmin,
      canView,
      canEdit,
      canCreate,
      canDelete,
      isLogistica,
      isEngenharia,
      isSegurancaTrabalho,
      isCentralMecanica,
      isTI,
      isPreparador,
      podeAtualizarProducao
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}



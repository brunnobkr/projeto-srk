import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { usuariosStorage, mapeamentoFuncoesStorage, setoresStorage } from '../utils/storage';
import { ensureSetoresPadraoAtualizados } from '../utils/setoresConfig';
import type { Usuario, Permissoes, PermissoesModulo } from '../types';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    senha: '',
    confirmarSenha: '',
    nome: '',
    email: '',
    cargo: '',
    setor: '',
    matricula: '',
    telefoneCorporativo: '',
    emailCorporativo: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setores, setSetores] = useState<any[]>([]);
  const [funcoesAutorizadas] = useState([
    'preparador',
    'engenharia',
    'logistica',
    'lider',
    'coordenador',
    'gerencia',
  ]);

  useEffect(() => {
    // Inicializar mapeamentos padrão
    mapeamentoFuncoesStorage.inicializarPadroes();
    
    // Carregar setores
    ensureSetoresPadraoAtualizados();
    const setoresData = setoresStorage.getAll();
    setSetores(setoresData);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    // Validações
    if (!formData.username.trim() || !formData.senha.trim() || !formData.nome.trim() || 
        !formData.email.trim() || !formData.cargo.trim()) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    // Verificar se o username já existe
    const usuarioExistente = usuariosStorage.getByUsername(formData.username);
    if (usuarioExistente) {
      setErro('Este nome de usuário já está em uso. Por favor, escolha outro.');
      setLoading(false);
      return;
    }

    // Verificar se o email já existe
    const todosUsuarios = usuariosStorage.getAll();
    const emailExistente = todosUsuarios.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExistente) {
      setErro('Este email já está cadastrado.');
      setLoading(false);
      return;
    }

    // Verificar se a função está autorizada
    const cargoLower = formData.cargo.toLowerCase();
    const funcaoAutorizada = funcoesAutorizadas.find(f => cargoLower.includes(f));
    
    if (!funcaoAutorizada) {
      setErro(`A função "${formData.cargo}" não está autorizada para cadastro automático. Entre em contato com o administrador.`);
      setLoading(false);
      return;
    }

    // Buscar mapeamento de permissões para a função
    const mapeamento = mapeamentoFuncoesStorage.getByFuncao(funcaoAutorizada);
    let permissoes: Permissoes;

    if (mapeamento) {
      permissoes = mapeamento.permissoes;
    } else {
      // Função auxiliar para converter boolean em PermissoesModulo
      const boolToPermissao = (valor: boolean): PermissoesModulo => ({
        visualizar: valor,
        criar: valor,
        editar: valor,
        excluir: valor,
      });
      
      // Permissões padrão se não encontrar mapeamento
      permissoes = {
        receitasMaquina: boolToPermissao(false),
        controleProducao: boolToPermissao(true),
        controleFuncionarios: boolToPermissao(false),
        problemasTecnicos: boolToPermissao(false),
        mudancasMelhorias: boolToPermissao(false),
        instrucoesTrabalho: boolToPermissao(true),
        componentesProduto: boolToPermissao(true),
        segurancaTrabalho: boolToPermissao(false),
        dashboardAdmin: false,
        gerenciarUsuarios: false,
        programarPedidos: false,
        atualizarProducaoHora: false,
        criar: true,
        editar: true,
        excluir: false,
        visualizar: true,
      };
    }

    // Criar usuário com status pendente
    const novoUsuario: Usuario = {
      id: `user_${Date.now()}`,
      username: formData.username,
      senha: formData.senha, // Em produção, usar hash
      nome: formData.nome,
      email: formData.email,
      cargo: formData.cargo,
      setor: formData.setor || undefined,
      matricula: formData.matricula || undefined,
      telefoneCorporativo: formData.telefoneCorporativo || undefined,
      emailCorporativo: formData.emailCorporativo || undefined,
      isAdmin: false,
      isAtivo: false, // Inativo até aprovação
      permissoes: permissoes,
      statusAprovacao: 'pendente',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      criadoPor: 'Auto-cadastro',
    };

    usuariosStorage.add(novoUsuario);
    
    setSucesso(true);
    setLoading(false);

    // Redirecionar para login após 3 segundos
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cadastro Realizado!</h1>
          <p className="text-gray-600 mb-6">
            Seu cadastro foi enviado para aprovação. Um administrador revisará suas informações e ativará sua conta em breve.
          </p>
          <p className="text-sm text-gray-500">
            Você será redirecionado para a página de login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-600 mt-2">Sumitomo S-riko - Sistema de Controle ITCC</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Funções autorizadas:</strong> Preparador, Engenharia, Logística, Líder, Coordenador, Gerência.
              Seu cadastro será revisado por um administrador antes da ativação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome de Usuário *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Digite seu nome de usuário"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Seu nome completo"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <input
                type="password"
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Confirme sua senha"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo/Função *
              </label>
              <select
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Selecione seu cargo</option>
                {funcoesAutorizadas.map(funcao => (
                  <option key={funcao} value={funcao}>
                    {funcao.charAt(0).toUpperCase() + funcao.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Seu cargo será verificado pelo administrador
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setor
              </label>
              <select
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Selecione um setor</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matrícula
              </label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Sua matrícula"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone Corporativo
              </label>
              <input
                type="tel"
                value={formData.telefoneCorporativo}
                onChange={(e) => setFormData({ ...formData, telefoneCorporativo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Corporativo
              </label>
              <input
                type="email"
                value={formData.emailCorporativo}
                onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="seu@sumitomo.com.br"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Já tenho uma conta
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>CNPJ: 60.689.346/0001-70</p>
          <p>Juatuba - MG</p>
        </div>
      </div>
    </div>
  );
}


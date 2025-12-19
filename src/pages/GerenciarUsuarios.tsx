import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, X, Save, Eye, EyeOff, UserPlus, CheckCircle, XCircle } from 'lucide-react';
// Plus removido - núo usado
import { usuariosStorage, setoresStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { Usuario, Permissoes, PermissoesModulo, Setor } from '../types';

const permissoesModuloPadrao: PermissoesModulo = {
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

export default function GerenciarUsuarios() {
  const { usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  
  const isAdminPadrao = usuarioLogado?.id === 'admin_inicial';
  const [formData, setFormData] = useState({
    username: '',
    senha: '',
    nome: '',
    email: '',
    cargo: '',
    setor: '',
    matricula: '',
    telefoneCorporativo: '',
    emailCorporativo: '',
    isAdmin: false,
    isAtivo: true,
    permissoes: { ...permissoesPadrao },
    statusAprovacao: 'aprovado' as 'pendente' | 'aprovado' | 'rejeitado',
    motivoRejeicao: '',
  });

  useEffect(() => {
    if (isAdminPadrao) {
      loadUsuarios();
      setSetores(setoresStorage.getAll());
    }
  }, [isAdminPadrao]);

  const loadUsuarios = () => {
    setUsuarios(usuariosStorage.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.nome.trim() || !formData.email.trim()) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    if (!editingUsuario && !formData.senha.trim()) {
      alert('Por favor, defina uma senha para o novo usuário.');
      return;
    }

    const usuario: Usuario = {
      id: editingUsuario?.id || Date.now().toString(),
      username: formData.username,
      senha: editingUsuario ? (formData.senha || editingUsuario.senha) : formData.senha,
      nome: formData.nome,
      email: formData.email,
      cargo: formData.cargo,
      setor: formData.setor || undefined,
      matricula: formData.matricula || undefined,
      telefoneCorporativo: formData.telefoneCorporativo || undefined,
      emailCorporativo: formData.emailCorporativo || undefined,
      isAdmin: formData.isAdmin,
      isAtivo: formData.isAtivo,
      permissoes: formData.permissoes,
      statusAprovacao: editingUsuario ? (editingUsuario.statusAprovacao || 'aprovado') : formData.statusAprovacao,
      motivoRejeicao: formData.motivoRejeicao || undefined,
      aprovadoPor: editingUsuario?.aprovadoPor,
      dataAprovacao: editingUsuario?.dataAprovacao,
      dataCriacao: editingUsuario?.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      criadoPor: editingUsuario?.criadoPor || usuarioLogado?.nome || 'Sistema',
    };

    if (editingUsuario) {
      usuariosStorage.update(editingUsuario.id, usuario);
    } else {
      usuariosStorage.add(usuario);
    }

    alert(editingUsuario ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
    resetForm();
    loadUsuarios();
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    
    // Migrar permissÇes antigas para nova estrutura se necessário
    const permissoesMigradas: Permissoes = { ...usuario.permissoes };
    
    // Se as permissÇes ainda estúo na estrutura antiga, migrar
    if (typeof permissoesMigradas.receitasMaquina === 'boolean') {
      const visualizar = permissoesMigradas.visualizar || false;
      const criar = permissoesMigradas.criar || false;
      const editar = permissoesMigradas.editar || false;
      const excluir = permissoesMigradas.excluir || false;
      
      permissoesMigradas.receitasMaquina = { visualizar, criar, editar, excluir };
      permissoesMigradas.controleProducao = { visualizar, criar, editar, excluir };
      permissoesMigradas.controleFuncionarios = { visualizar, criar, editar, excluir };
      permissoesMigradas.problemasTecnicos = { visualizar, criar, editar, excluir };
      permissoesMigradas.mudancasMelhorias = { visualizar, criar, editar, excluir };
      permissoesMigradas.instrucoesTrabalho = { visualizar, criar, editar, excluir };
      permissoesMigradas.componentesProduto = { visualizar, criar, editar, excluir };
      permissoesMigradas.segurancaTrabalho = { visualizar, criar, editar, excluir };
    }
    
    setFormData({
      username: usuario.username,
      senha: '',
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      setor: usuario.setor || '',
      matricula: usuario.matricula || '',
      telefoneCorporativo: usuario.telefoneCorporativo || '',
      emailCorporativo: usuario.emailCorporativo || '',
      isAdmin: usuario.isAdmin,
      isAtivo: usuario.isAtivo,
      permissoes: permissoesMigradas,
      statusAprovacao: usuario.statusAprovacao || 'aprovado',
      motivoRejeicao: usuario.motivoRejeicao || '',
    });
    setShowModal(true);
  };

  const handleAprovar = (usuario: Usuario) => {
    if (confirm(`Deseja aprovar o cadastro de ${usuario.nome}?`)) {
      usuariosStorage.update(usuario.id, {
        statusAprovacao: 'aprovado',
        isAtivo: true,
        aprovadoPor: usuarioLogado?.nome || 'Admin',
        dataAprovacao: new Date().toISOString(),
      });
      loadUsuarios();
      alert('Cadastro aprovado com sucesso!');
    }
  };

  const handleRejeitar = (usuario: Usuario) => {
    const motivo = prompt(`Informe o motivo da rejeiçúo do cadastro de ${usuario.nome}:`);
    if (motivo !== null) {
      usuariosStorage.update(usuario.id, {
        statusAprovacao: 'rejeitado',
        isAtivo: false,
        motivoRejeicao: motivo,
        aprovadoPor: usuarioLogado?.nome || 'Admin',
        dataAprovacao: new Date().toISOString(),
      });
      loadUsuarios();
      alert('Cadastro rejeitado.');
    }
  };

  const handleDelete = (id: string) => {
    if (id === usuarioLogado?.id) {
      alert('Você núo pode excluir sua própria conta.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      usuariosStorage.delete(id);
      loadUsuarios();
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      senha: '',
      nome: '',
      email: '',
      cargo: '',
      setor: '',
      matricula: '',
      telefoneCorporativo: '',
      emailCorporativo: '',
      isAdmin: false,
      isAtivo: true,
      permissoes: { ...permissoesPadrao },
      statusAprovacao: 'aprovado',
      motivoRejeicao: '',
    });
    setEditingUsuario(null);
    setShowModal(false);
    setShowSenha(false);
  };

  const togglePermissao = (permissao: keyof Permissoes) => {
    const valorAtual = formData.permissoes[permissao];
    
    // Verificar se ├® uma permissúo boolean (dashboardAdmin, gerenciarUsuarios, programarPedidos)
    if (typeof valorAtual === 'boolean') {
      setFormData({
        ...formData,
        permissoes: {
          ...formData.permissoes,
          [permissao]: !valorAtual,
        },
      });
    }
    // Se for PermissoesModulo, núo fazer nada (usar togglePermissaoModulo)
  };

  const togglePermissaoModulo = (modulo: keyof Permissoes, acao: keyof PermissoesModulo) => {
    const moduloPermissao = formData.permissoes[modulo];
    if (typeof moduloPermissao === 'object' && 'visualizar' in moduloPermissao) {
      const novoValor = !moduloPermissao[acao];
      
      // Se desabilitar visualizar, desabilitar todas as outras permissÇes tamb├®m
      if (acao === 'visualizar' && !novoValor) {
        setFormData({
          ...formData,
          permissoes: {
            ...formData.permissoes,
            [modulo]: {
              visualizar: false,
              criar: false,
              editar: false,
              excluir: false,
            },
          },
        });
      } else {
        setFormData({
          ...formData,
          permissoes: {
            ...formData.permissoes,
            [modulo]: {
              ...moduloPermissao,
              [acao]: novoValor,
            },
          },
        });
      }
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usuariosPendentes = filteredUsuarios.filter(u => u.statusAprovacao === 'pendente');
  const usuariosAprovados = filteredUsuarios.filter(u => u.statusAprovacao !== 'pendente');

  if (!isAdminPadrao) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <X className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas o administrador padrúo pode gerenciar usuários.</p>
        <p className="text-sm text-gray-500">Entre em contato com o administrador do sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="mt-2 text-gray-600">
            Crie e gerencie contas de usuários e permissÇes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, usuário, email ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprovaçúo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">AçÇes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                <>
                  {/* Usuários Pendentes */}
                  {usuariosPendentes.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={8} className="px-6 py-3 bg-yellow-50">
                          <span className="font-semibold text-yellow-800">Cadastros Pendentes de Aprovaçúo</span>
                        </td>
                      </tr>
                      {usuariosPendentes.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50 bg-yellow-50/30">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{usuario.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{usuario.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{usuario.cargo}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{usuario.setor || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Pendente
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              Inativo
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {usuario.isAdmin ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                Admin
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleAprovar(usuario)}
                                className="text-green-600 hover:text-green-900"
                                title="Aprovar"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRejeitar(usuario)}
                                className="text-red-600 hover:text-red-900"
                                title="Rejeitar"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleEdit(usuario)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Editar"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                  {/* Usuários Aprovados */}
                  {usuariosAprovados.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{usuario.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{usuario.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{usuario.cargo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{usuario.setor || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          usuario.statusAprovacao === 'aprovado' ? 'bg-green-100 text-green-800' :
                          usuario.statusAprovacao === 'rejeitado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.statusAprovacao === 'aprovado' ? 'Aprovado' :
                           usuario.statusAprovacao === 'rejeitado' ? 'Rejeitado' :
                           'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          usuario.isAtivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.isAtivo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usuario.isAdmin ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            Admin
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {usuario.id !== usuarioLogado?.id && (
                          <button
                            onClick={() => handleDelete(usuario.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criar/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingUsuario ? 'Editar' : 'Novo'} Usuário</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Usuário (Login) *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!!editingUsuario}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Senha {editingUsuario ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      required={!editingUsuario}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Engenheiro, Preparador, Operador"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Setor</label>
                  <select
                    value={formData.setor || ''}
                    onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione um setor...</option>
                    {setores.map(setor => (
                      <option key={setor.id} value={setor.nome}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Matrícula</label>
                  <input
                    type="text"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone Corporativo</label>
                  <input
                    type="tel"
                    value={formData.telefoneCorporativo}
                    onChange={(e) => setFormData({ ...formData, telefoneCorporativo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Corporativo</label>
                  <input
                    type="email"
                    value={formData.emailCorporativo}
                    onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Administrador</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAtivo}
                      onChange={(e) => setFormData({ ...formData, isAtivo: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Usuário Ativo</span>
                  </label>
                </div>
              </div>

              {!formData.isAdmin && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <span className="mr-2">Ôä╣´©Å</span>
                      PermissÇes Granulares por Módulo
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Importante:</strong> Você pode configurar permissÇes independentes para cada módulo:
                    </p>
                    <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                      <li><strong>Visualizar:</strong> Permite apenas ver as informaçÇes (sem editar, criar ou excluir)</li>
                      <li><strong>Criar:</strong> Permite adicionar novos registros (requer permissúo de visualizar)</li>
                      <li><strong>Editar:</strong> Permite modificar registros existentes (requer permissúo de visualizar)</li>
                      <li><strong>Excluir:</strong> Permite remover registros (requer permissúo de visualizar)</li>
                    </ul>
                    <p className="text-sm text-blue-800 mt-2">
                      <strong>Exemplo:</strong> Um operador pode ter permissúo para <strong>visualizar</strong> o Controle de Produçúo, mas <strong>núo pode editar</strong> os registros.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'receitasMaquina', label: 'Receitas de Máquina' },
                      { key: 'controleProducao', label: 'Controle de Produçúo' },
                      { key: 'controleFuncionarios', label: 'Controle de Funcionários' },
                      { key: 'problemasTecnicos', label: 'Problemas T├®cnicos' },
                      { key: 'mudancasMelhorias', label: 'Mudanças e Melhorias' },
                      { key: 'instrucoesTrabalho', label: 'InstruçÇes de Trabalho' },
                      { key: 'componentesProduto', label: 'Componentes por Código' },
                      { key: 'segurancaTrabalho', label: 'Segurança do Trabalho' },
                    ].map(({ key, label }) => {
                      const moduloPermissao = formData.permissoes[key as keyof Permissoes];
                      const permissoesModulo = typeof moduloPermissao === 'object' && 'visualizar' in moduloPermissao 
                        ? moduloPermissao as PermissoesModulo 
                        : permissoesModuloPadrao;
                      
                      const todasPermissoes = permissoesModulo.visualizar && permissoesModulo.criar && permissoesModulo.editar && permissoesModulo.excluir;
                      const apenasVisualizar = permissoesModulo.visualizar && !permissoesModulo.criar && !permissoesModulo.editar && !permissoesModulo.excluir;
                      
                      return (
                        <div key={key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-sm text-gray-900">{label}</h4>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    permissoes: {
                                      ...formData.permissoes,
                                      [key]: { visualizar: true, criar: false, editar: false, excluir: false },
                                    },
                                  });
                                }}
                                className={`text-xs px-2 py-1 rounded ${apenasVisualizar ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                title="Apenas visualizar"
                              >
                                Apenas Ver
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    permissoes: {
                                      ...formData.permissoes,
                                      [key]: { visualizar: true, criar: true, editar: true, excluir: true },
                                    },
                                  });
                                }}
                                className={`text-xs px-2 py-1 rounded ${todasPermissoes ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                title="Todas as permissÇes"
                              >
                                Todas
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    permissoes: {
                                      ...formData.permissoes,
                                      [key]: { visualizar: false, criar: false, editar: false, excluir: false },
                                    },
                                  });
                                }}
                                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                                title="Nenhuma permissúo"
                              >
                                Nenhuma
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className="flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors">
                              <input
                                type="checkbox"
                                checked={permissoesModulo.visualizar}
                                onChange={() => togglePermissaoModulo(key as keyof Permissoes, 'visualizar')}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">Visualizar</span>
                                <span className="text-xs text-gray-500">Ver informaçÇes</span>
                              </div>
                            </label>
                            <label className="flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors">
                              <input
                                type="checkbox"
                                checked={permissoesModulo.criar}
                                onChange={() => togglePermissaoModulo(key as keyof Permissoes, 'criar')}
                                disabled={!permissoesModulo.visualizar}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">Criar</span>
                                <span className="text-xs text-gray-500">Adicionar novos</span>
                              </div>
                            </label>
                            <label className="flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors">
                              <input
                                type="checkbox"
                                checked={permissoesModulo.editar}
                                onChange={() => togglePermissaoModulo(key as keyof Permissoes, 'editar')}
                                disabled={!permissoesModulo.visualizar}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">Editar</span>
                                <span className="text-xs text-gray-500">Modificar existentes</span>
                              </div>
                            </label>
                            <label className="flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors">
                              <input
                                type="checkbox"
                                checked={permissoesModulo.excluir}
                                onChange={() => togglePermissaoModulo(key as keyof Permissoes, 'excluir')}
                                disabled={!permissoesModulo.visualizar}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">Excluir</span>
                                <span className="text-xs text-gray-500">Remover registros</span>
                              </div>
                            </label>
                          </div>
                          {!permissoesModulo.visualizar && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center">
                              <span className="mr-1">ÔÜá´©Å</span>
                              Sem permissúo de visualizaçúo. O usuário núo poderá acessar este módulo.
                            </p>
                          )}
                          {permissoesModulo.visualizar && !permissoesModulo.editar && (
                            <p className="text-xs text-blue-600 mt-2 flex items-center">
                              <span className="mr-1">Ôä╣´©Å</span>
                              Usuário pode apenas visualizar este módulo, sem editar.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-3 text-gray-700">PermissÇes Especiais</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissoes.dashboardAdmin}
                          onChange={() => togglePermissao('dashboardAdmin')}
                          className="mr-2"
                        />
                        <span className="text-sm">Dashboard Admin</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissoes.programarPedidos}
                          onChange={() => togglePermissao('programarPedidos')}
                          className="mr-2"
                        />
                        <span className="text-sm">Programar Pedidos (Logística)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissoes.atualizarProducaoHora}
                          onChange={() => togglePermissao('atualizarProducaoHora')}
                          className="mr-2"
                        />
                        <span className="text-sm">Atualizar Produçúo Hora a Hora</span>
                        <span className="ml-2 text-xs text-gray-500">(Preparadores têm permissúo automática)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


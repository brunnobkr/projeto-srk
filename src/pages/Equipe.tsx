import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Calendar, MessageCircle, Building2, Briefcase, Hash } from 'lucide-react';
import { usuariosStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Usuario } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function Equipe() {
  const { usuario: usuarioLogado, isAdmin, isEngenharia, isLogistica, isSegurancaTrabalho, isCentralMecanica, isTI } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = () => {
    const todosUsuarios = usuariosStorage.getAll();
    setUsuarios(todosUsuarios.filter(u => u.isAtivo));
  };

  // Filtrar usuários baseado no cargo do usuário logado
  const getUsuariosFiltrados = () => {
    if (isAdmin()) {
      // Admin vê todos
      return usuarios;
    }

    if (isEngenharia()) {
      // Engenharia vê outros da engenharia
      return usuarios.filter(u => 
        u.cargo.toLowerCase().includes('engen') || 
        u.setor?.toLowerCase().includes('engenharia')
      );
    }

    if (isCentralMecanica()) {
      // Central de Mecânica vê mecânicos, elétricos e ferramentaria
      return usuarios.filter(u => {
        const cargoLower = u.cargo.toLowerCase();
        const setorLower = u.setor?.toLowerCase() || '';
        return (
          cargoLower.includes('mecan') ||
          cargoLower.includes('eletr') ||
          cargoLower.includes('ferrament') ||
          setorLower.includes('mecanica') ||
          setorLower.includes('eletrica') ||
          setorLower.includes('ferramentaria')
        );
      });
    }

    if (isLogistica()) {
      // Logística vê outros da logística
      return usuarios.filter(u => 
        u.cargo.toLowerCase().includes('logist') || 
        u.setor?.toLowerCase().includes('logistica')
      );
    }

    if (isTI()) {
      // TI vê outros de TI
      return usuarios.filter(u => 
        u.cargo.toLowerCase().includes('ti') || 
        u.cargo.toLowerCase().includes('tecnologia') ||
        u.setor?.toLowerCase().includes('ti')
      );
    }

    if (isSegurancaTrabalho()) {
      // Segurança do Trabalho vê outros de segurança
      return usuarios.filter(u => 
        u.cargo.toLowerCase().includes('seguranca') || 
        u.setor?.toLowerCase().includes('seguranca')
      );
    }

    // Outros usuários veem apenas seu próprio setor
    return usuarios.filter(u => u.setor === usuarioLogado?.setor);
  };

  const usuariosFiltrados = getUsuariosFiltrados();

  const filteredUsuarios = usuariosFiltrados.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.setor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnviarMensagem = (usuario: Usuario) => {
    // Salvar no localStorage para o Chat abrir automaticamente
    localStorage.setItem('srk_chat_conversa_selecionada', usuario.id);
    navigate('/chat');
  };

  const getTituloSecao = () => {
    if (isAdmin()) return 'Equipe Completa';
    if (isEngenharia()) return 'Equipe da Engenharia';
    if (isCentralMecanica()) return 'Equipe da Central de Mecânica';
    if (isLogistica()) return 'Equipe da Logística';
    if (isTI()) return 'Equipe de TI';
    if (isSegurancaTrabalho()) return 'Equipe de Segurança do Trabalho';
    return 'Equipe do Setor';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getTituloSecao()}</h1>
          <p className="text-gray-600 mt-1">
            {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo, matrícula ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsuarios.map((usuario) => (
          <div
            key={usuario.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setUsuarioSelecionado(usuario)}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {usuario.fotoPerfil ? (
                  <img
                    src={usuario.fotoPerfil}
                    alt={usuario.nome}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{usuario.nome}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {usuario.cargo}
                </p>
                {usuario.setor && (
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Building2 className="w-4 h-4 mr-1" />
                    {usuario.setor}
                  </p>
                )}
                {usuario.matricula && (
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Hash className="w-4 h-4 mr-1" />
                    {usuario.matricula}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnviarMensagem(usuario);
                }}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Mensagem
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsuarios.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma pessoa encontrada</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm ? 'Tente buscar com outros termos' : 'Não há pessoas cadastradas nesta área'}
          </p>
        </div>
      )}

      {/* Modal de Detalhes */}
      {usuarioSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setUsuarioSelecionado(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start space-x-4 mb-6">
              {usuarioSelecionado.fotoPerfil ? (
                <img
                  src={usuarioSelecionado.fotoPerfil}
                  alt={usuarioSelecionado.nome}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{usuarioSelecionado.nome}</h2>
                <p className="text-gray-600">{usuarioSelecionado.cargo}</p>
              </div>
            </div>

            <div className="space-y-4">
              {usuarioSelecionado.setor && (
                <div className="flex items-center text-gray-700">
                  <Building2 className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">Setor:</span>
                  <span className="ml-2">{usuarioSelecionado.setor}</span>
                </div>
              )}

              {usuarioSelecionado.matricula && (
                <div className="flex items-center text-gray-700">
                  <Hash className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">Matrícula:</span>
                  <span className="ml-2">{usuarioSelecionado.matricula}</span>
                </div>
              )}

              {usuarioSelecionado.emailCorporativo && (
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">Email:</span>
                  <a href={`mailto:${usuarioSelecionado.emailCorporativo}`} className="ml-2 text-primary-600 hover:underline">
                    {usuarioSelecionado.emailCorporativo}
                  </a>
                </div>
              )}

              {usuarioSelecionado.telefoneCorporativo && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">Telefone:</span>
                  <a href={`tel:${usuarioSelecionado.telefoneCorporativo}`} className="ml-2 text-primary-600 hover:underline">
                    {usuarioSelecionado.telefoneCorporativo}
                  </a>
                </div>
              )}

              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <span className="font-medium">Membro desde:</span>
                <span className="ml-2">
                  {format(new Date(usuarioSelecionado.dataCriacao), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>

              <div className="pt-4 border-t">
                <span className={`px-3 py-1 text-xs rounded-full ${
                  usuarioSelecionado.isAtivo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {usuarioSelecionado.isAtivo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => handleEnviarMensagem(usuarioSelecionado)}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </button>
              <button
                onClick={() => setUsuarioSelecionado(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


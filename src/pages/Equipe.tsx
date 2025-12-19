import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Calendar, MessageCircle, Building2, Briefcase, Hash, Users, Send } from 'lucide-react';
import { usuariosStorage, conversasStorage, mensagensStorage, notificacoesStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Usuario, Mensagem, Notificacao } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function Equipe() {
  const { usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = () => {
    const todosUsuarios = usuariosStorage.getAll();
    // Mostrar todos os usuários ativos, independente de permissões
    setUsuarios(todosUsuarios.filter(u => u.isAtivo));
  };

  // Normalizar cargo para agrupamento consistente
  // O setor é apenas informativo (para localizar linhas), o agrupamento é baseado no CARGO
  const normalizarCargoParaGrupo = (cargo: string | undefined): string => {
    if (!cargo) return 'Outros';
    
    const cargoLower = cargo.toLowerCase();
    
    // Engenharia - baseado apenas no cargo
    if (cargoLower.includes('engen')) {
      return 'Engenharia';
    }
    
    // Logística - baseado apenas no cargo
    if (cargoLower.includes('logist')) {
      return 'Logística';
    }
    
    // Central de Mecânica - baseado apenas no cargo
    if (cargoLower.includes('mecan') || cargoLower.includes('eletr') || cargoLower.includes('ferrament')) {
      return 'Central de Mecânica';
    }
    
    // TI - baseado apenas no cargo
    if (cargoLower.includes('ti') || cargoLower.includes('tecnologia') || cargoLower.includes('informática') || 
        cargoLower.includes('informatica') || cargoLower.includes('t.i') || cargoLower.includes('t.i.')) {
      return 'TI';
    }
    
    // RH - baseado apenas no cargo
    if (cargoLower.includes('rh') || cargoLower.includes('recursos humanos') || cargoLower.includes('r.h') ||
        cargoLower.includes('r.h.')) {
      return 'RH';
    }
    
    // Segurança do Trabalho - baseado apenas no cargo
    if (cargoLower.includes('seguranca') || cargoLower.includes('segurança')) {
      return 'Segurança do Trabalho';
    }
    
    // Produção - baseado apenas no cargo
    if (cargoLower.includes('preparador') || cargoLower.includes('operador') || cargoLower.includes('produção') || 
        cargoLower.includes('producao') || cargoLower.includes('montador')) {
      return 'Produção';
    }
    
    // Gestão - baseado apenas no cargo
    if (cargoLower.includes('lider') || cargoLower.includes('líder') || cargoLower.includes('coordenador') || 
        cargoLower.includes('gerente') || cargoLower.includes('supervisor') || cargoLower.includes('diretor')) {
      return 'Gestão';
    }
    
    // Qualidade - baseado apenas no cargo
    if (cargoLower.includes('qualidade') || cargoLower.includes('qc') || cargoLower.includes('qa')) {
      return 'Qualidade';
    }
    
    // Se não se encaixar em nenhum grupo padrão, usar o cargo como grupo
    // O setor não é usado para agrupamento, apenas como informação adicional
    return cargo;
  };

  // Agrupar todos os usuários por cargo normalizado
  const agruparPorCargo = () => {
    const grupos: Record<string, Usuario[]> = {};
    
    usuarios.forEach(usuario => {
      const grupo = normalizarCargoParaGrupo(usuario.cargo);
      
      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(usuario);
    });
    
    // Ordenar usuários dentro de cada grupo por nome
    Object.keys(grupos).forEach(grupo => {
      grupos[grupo].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    
    return grupos;
  };

  const gruposUsuarios = agruparPorCargo();
  
  // Ordenar grupos: primeiro os principais, depois alfabeticamente
  const gruposPrincipais = ['Engenharia', 'Logística', 'Produção', 'Central de Mecânica', 'TI', 'RH', 'Segurança do Trabalho', 'Qualidade', 'Gestão'];
  const gruposOrdenados = [
    ...gruposPrincipais.filter(g => gruposUsuarios[g]),
    ...Object.keys(gruposUsuarios)
      .filter(g => !gruposPrincipais.includes(g))
      .sort()
  ];

  // Obter lista única de cargos para o datalist
  const cargosUnicos = Array.from(new Set(
    usuarios
      .map(u => u.cargo)
      .filter((cargo): cargo is string => !!cargo)
  )).sort();

  // Filtrar grupos baseado na busca
  // A busca por cargo funciona igual a setor, mas o agrupamento é sempre por CARGO
  const filtrarGrupos = () => {
    if (!searchTerm) return gruposOrdenados;
    
    const termoLower = searchTerm.toLowerCase();
    
    // Verificar se o termo corresponde a um grupo (cargo)
    const gruposFiltrados = gruposOrdenados.filter(grupo => {
      const grupoLower = grupo.toLowerCase();
      
      // Se o termo corresponde ao nome do grupo (cargo), mostrar todos os usuários desse grupo
      if (grupoLower.includes(termoLower) || termoLower.includes(grupoLower)) {
        return true;
      }
      
      // Verificar se algum usuário do grupo corresponde ao termo
      // O setor pode ser usado na busca, mas não no agrupamento
      const usuariosGrupo = gruposUsuarios[grupo];
      return usuariosGrupo.some(u =>
        u.nome.toLowerCase().includes(termoLower) ||
        u.cargo?.toLowerCase().includes(termoLower) ||
        u.matricula?.toLowerCase().includes(termoLower) ||
        u.setor?.toLowerCase().includes(termoLower) || // Setor pode ser usado na busca
        u.email?.toLowerCase().includes(termoLower)
      );
    });
    
    return gruposFiltrados;
  };

  // Filtrar usuários dentro de cada grupo baseado na busca
  // O agrupamento é sempre por CARGO, mas a busca pode incluir setor
  const filtrarUsuariosPorGrupo = (usuariosGrupo: Usuario[]) => {
    if (!searchTerm) return usuariosGrupo;
    
    const termoLower = searchTerm.toLowerCase();
    const grupoNome = normalizarCargoParaGrupo(usuariosGrupo[0]?.cargo);
    const grupoLower = grupoNome.toLowerCase();
    
    // Se o termo corresponde ao nome do grupo (cargo), mostrar todos os usuários
    if (grupoLower.includes(termoLower) || termoLower.includes(grupoLower)) {
      return usuariosGrupo;
    }
    
    // Caso contrário, filtrar usuários individualmente
    // O setor pode ser usado na busca, mas não afeta o agrupamento
    return usuariosGrupo.filter(u =>
      u.nome.toLowerCase().includes(termoLower) ||
      u.cargo?.toLowerCase().includes(termoLower) ||
      u.matricula?.toLowerCase().includes(termoLower) ||
      u.setor?.toLowerCase().includes(termoLower) || // Setor pode ser usado na busca
      u.email?.toLowerCase().includes(termoLower)
    );
  };

  const handleEnviarMensagem = (usuario: Usuario) => {
    // Salvar no localStorage para o Chat abrir automaticamente
    localStorage.setItem('srk_chat_conversa_selecionada', usuario.id);
    navigate('/chat');
  };

  const handleEnviarMensagemGrupo = (grupo: string, usuariosGrupo: Usuario[]) => {
    if (!usuarioLogado) return;
    
    const mensagem = prompt(`Digite a mensagem para enviar a todos de ${grupo} (${usuariosGrupo.length} pessoa(s)):`);
    if (!mensagem) return;

    let enviadas = 0;
    usuariosGrupo.forEach(usuario => {
      if (usuario.id === usuarioLogado.id) return; // Não enviar para si mesmo
      
      // Criar ou obter conversa
      const conversa = conversasStorage.criarOuObter(usuarioLogado.id, usuario.id);
      
      // Criar mensagem
      const novaMensagem: Mensagem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        conversaId: conversa.id,
        remetenteId: usuarioLogado.id,
        destinatarioId: usuario.id,
        tipo: 'texto',
        conteudo: mensagem,
        lida: false,
        dataEnvio: new Date().toISOString(),
      };
      
      mensagensStorage.add(novaMensagem);
      
      // Criar notificação
      const notificacao: Notificacao = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        usuarioId: usuario.id,
        tipo: 'mensagem',
        titulo: `Mensagem de ${usuarioLogado.nome} (${grupo})`,
        mensagem: mensagem,
        lida: false,
        dataCriacao: new Date().toISOString(),
        link: `/chat?conversa=${conversa.id}`,
        dadosExtras: { conversaId: conversa.id },
      };
      notificacoesStorage.add(notificacao);
      
      // Atualizar conversa
      conversasStorage.update(conversa.id, {
        ultimaMensagem: novaMensagem,
        dataUltimaMensagem: novaMensagem.dataEnvio,
      });
      
      enviadas++;
    });
    
    alert(`Mensagem enviada para ${enviadas} pessoa(s) de ${grupo}!`);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-600 mt-1">
            Encontre pessoas por cargo ou setor. {usuarios.length} {usuarios.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'} no total
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            list="cargos-list"
            placeholder="Buscar por nome, cargo, matrícula, setor ou email... (deixe em branco para ver todos)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <datalist id="cargos-list">
            {cargosUnicos.map(cargo => (
              <option key={cargo} value={cargo} />
            ))}
            {gruposPrincipais.map(grupo => (
              <option key={grupo} value={grupo} />
            ))}
          </datalist>
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Mostrando resultados para: <strong>"{searchTerm}"</strong>
          </p>
        )}
      </div>

      {/* Grupos por Cargo */}
      <div className="space-y-6">
        {filtrarGrupos().map((grupo) => {
          const usuariosGrupo = gruposUsuarios[grupo];
          const usuariosFiltradosGrupo = filtrarUsuariosPorGrupo(usuariosGrupo);

          if (usuariosFiltradosGrupo.length === 0) return null;
          
          const totalNoGrupo = usuariosGrupo.length;
          const mostrando = usuariosFiltradosGrupo.length;

          return (
            <div key={grupo} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Cabeçalho do Grupo */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{grupo}</h2>
                    <p className="text-sm text-primary-100">
                      {mostrando === totalNoGrupo 
                        ? `${totalNoGrupo} ${totalNoGrupo === 1 ? 'pessoa' : 'pessoas'}`
                        : `Mostrando ${mostrando} de ${totalNoGrupo} ${totalNoGrupo === 1 ? 'pessoa' : 'pessoas'}`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleEnviarMensagemGrupo(grupo, usuariosFiltradosGrupo)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
                  title={`Enviar mensagem para todos de ${grupo}`}
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar para Todos</span>
                </button>
              </div>

              {/* Lista de Usuários do Grupo */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {usuariosFiltradosGrupo.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                      onClick={() => setUsuarioSelecionado(usuario)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {usuario.fotoPerfil ? (
                            <img
                              src={usuario.fotoPerfil}
                              alt={usuario.nome}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-6 h-6 text-primary-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{usuario.nome}</h3>
                          <p className="text-xs text-gray-600 flex items-center mt-1">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {usuario.cargo}
                          </p>
                          {usuario.setor && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <Building2 className="w-3 h-3 mr-1" />
                              {usuario.setor}
                            </p>
                          )}
                          {usuario.matricula && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <Hash className="w-3 h-3 mr-1" />
                              {usuario.matricula}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnviarMensagem(usuario);
                          }}
                          className="w-full flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {gruposOrdenados.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma pessoa encontrada</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm 
              ? `Nenhum resultado encontrado para "${searchTerm}". Tente buscar com outros termos ou deixe em branco para ver todos os usuários.`
              : 'Não há pessoas cadastradas no sistema'
            }
          </p>
        </div>
      )}
      
      {!searchTerm && gruposOrdenados.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> Não sabe o nome da pessoa? Navegue pelos grupos acima para encontrar pessoas por cargo ou setor. 
            Use a busca para filtrar por nome, matrícula ou qualquer outro termo.
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


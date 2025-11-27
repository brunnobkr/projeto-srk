import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Video, Mic, Search, X, Pause, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mensagensStorage, conversasStorage, usuariosStorage, notificacoesStorage } from '../utils/storage';
import type { Mensagem, Conversa, Usuario, Notificacao } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function Chat() {
  const { usuario } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<'texto' | 'audio' | 'foto' | 'video' | 'pdf'>('texto');
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [audioGravado, setAudioGravado] = useState<string | null>(null);
  const [duracaoAudio, setDuracaoAudio] = useState(0);
  const [nomeArquivoPDF, setNomeArquivoPDF] = useState<string>('');
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const mensagensEndRef = useRef<HTMLDivElement>(null);
  const mensagensContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervaloAudioRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    if (usuario) {
      loadConversas();
      loadUsuarios();
      loadNotificacoes();
      
      // Atualizar a cada 2 segundos para simular tempo real
      const interval = setInterval(() => {
        loadConversas();
        if (conversaSelecionada) {
          loadMensagens(conversaSelecionada.id);
        }
        loadNotificacoes();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [usuario, conversaSelecionada]);

  useEffect(() => {
    // Só fazer scroll automático se o usuário já estava no final
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [mensagens]);

  const loadConversas = () => {
    if (!usuario) return;
    const todasConversas = conversasStorage.getByUsuario(usuario.id);
    
    // Enriquecer com dados dos usuários e última mensagem
    const conversasEnriquecidas = todasConversas.map(conv => {
      const outroUsuarioId = conv.participante1Id === usuario.id 
        ? conv.participante2Id 
        : conv.participante1Id;
      const outroUsuario = usuariosStorage.getById(outroUsuarioId);
      
      const msgs = mensagensStorage.getByConversa(conv.id);
      const ultimaMsg = msgs.sort((a, b) => 
        new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
      )[0];
      
      const naoLidas = msgs.filter(m => 
        m.destinatarioId === usuario.id && !m.lida
      ).length;

      return {
        ...conv,
        participante1: conv.participante1Id === usuario.id 
          ? usuario 
          : (outroUsuario ?? undefined),
        participante2: conv.participante2Id === usuario.id 
          ? usuario 
          : (outroUsuario ?? undefined),
        ultimaMensagem: ultimaMsg,
        naoLidas,
        dataUltimaMensagem: ultimaMsg?.dataEnvio,
      };
    }).sort((a, b) => {
      const dataA = a.dataUltimaMensagem || a.dataCriacao;
      const dataB = b.dataUltimaMensagem || b.dataCriacao;
      return new Date(dataB).getTime() - new Date(dataA).getTime();
    });

    setConversas(conversasEnriquecidas);
  };

  const loadUsuarios = () => {
    const todosUsuarios = usuariosStorage.getAll().filter(u => 
      u.id !== usuario?.id && u.isAtivo
    );
    setUsuarios(todosUsuarios);
  };

  const loadMensagens = (conversaId: string) => {
    const msgs = mensagensStorage.getByConversa(conversaId);
    
    // Verificar se há novas mensagens antes de atualizar
    const quantidadeAnterior = mensagens.length;
    
    // Enriquecer com dados dos usuários
    const msgsEnriquecidas = msgs.map(msg => ({
      ...msg,
      remetente: usuariosStorage.getById(msg.remetenteId) ?? undefined,
      destinatario: usuariosStorage.getById(msg.destinatarioId) ?? undefined,
    })).sort((a, b) => 
      new Date(a.dataEnvio).getTime() - new Date(b.dataEnvio).getTime()
    );

    // Verificar se há novas mensagens recebidas
    const temNovasMensagens = msgsEnriquecidas.length > quantidadeAnterior;
    const ultimaMensagem = msgsEnriquecidas[msgsEnriquecidas.length - 1];
    const isNovaMensagemRecebida = temNovasMensagens && ultimaMensagem?.destinatarioId === usuario?.id;

    setMensagens(msgsEnriquecidas);

    // Se recebeu uma nova mensagem e está no final, permitir scroll automático
    if (isNovaMensagemRecebida) {
      setTimeout(() => {
        if (mensagensContainerRef.current) {
          const container = mensagensContainerRef.current;
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          shouldAutoScrollRef.current = isNearBottom;
        }
      }, 100);
    }

    // Marcar mensagens como lidas
    msgsEnriquecidas.forEach(msg => {
      if (msg.destinatarioId === usuario?.id && !msg.lida) {
        mensagensStorage.marcarComoLida(msg.id);
      }
    });
  };

  const deletarMensagem = (mensagemId: string) => {
    if (!usuario || !conversaSelecionada) return;
    
    const mensagem = mensagensStorage.getAll().find(m => m.id === mensagemId);
    if (!mensagem) return;
    
    // Verificar se o usuário é o remetente da mensagem
    if (mensagem.remetenteId !== usuario.id) {
      alert('Você só pode deletar suas próprias mensagens.');
      return;
    }
    
    // Confirmar antes de deletar
    if (!window.confirm('Tem certeza que deseja deletar esta mensagem?')) {
      return;
    }
    
    // Deletar a mensagem
    mensagensStorage.delete(mensagemId);
    
    // Atualizar a lista de mensagens
    loadMensagens(conversaSelecionada.id);
    
    // Atualizar a lista de conversas para refletir a última mensagem
    loadConversas();
  };

  const loadNotificacoes = () => {
    if (!usuario) return;
    const notifs = notificacoesStorage.getNaoLidas(usuario.id);
    // setNotificacoes(notifs); // Comentado pois não é usado
    
    // Mostrar notificações do navegador
    if (notifs.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      notifs.forEach(notif => {
        new Notification(notif.titulo, {
          body: notif.mensagem,
          icon: '/favicon.ico',
        });
      });
    }
  };


  const solicitarPermissaoNotificacao = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    solicitarPermissaoNotificacao();
  }, []);

  const scrollToBottom = () => {
    // Usar setTimeout para garantir que o DOM foi atualizado
    setTimeout(() => {
      if (mensagensContainerRef.current) {
        mensagensContainerRef.current.scrollTop = mensagensContainerRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleScroll = () => {
    if (!mensagensContainerRef.current) return;
    
    const container = mensagensContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Se o usuário está próximo do final, permitir scroll automático
    shouldAutoScrollRef.current = isNearBottom;
  };

  const iniciarConversa = (outroUsuario: Usuario) => {
    if (!usuario) return;
    
    const conversa = conversasStorage.criarOuObter(usuario.id, outroUsuario.id);
    setConversaSelecionada(conversa);
    shouldAutoScrollRef.current = true; // Permitir scroll ao abrir conversa
    loadMensagens(conversa.id);
    setMostrarUsuarios(false);
  };

  const enviarMensagem = () => {
    if (!usuario || !conversaSelecionada) return;

    const outroUsuarioId = conversaSelecionada.participante1Id === usuario.id
      ? conversaSelecionada.participante2Id
      : conversaSelecionada.participante1Id;

    let conteudo = novaMensagem;
    let audioUrl: string | undefined;
    let fotoUrl: string | undefined;
    let videoUrl: string | undefined;
    let pdfUrl: string | undefined;

    if (tipoMensagem === 'audio' && audioGravado) {
      conteudo = 'Áudio';
      audioUrl = audioGravado;
    } else if (tipoMensagem === 'foto' && audioGravado) {
      conteudo = 'Foto';
      fotoUrl = audioGravado; // Reutilizando o estado para foto
    } else if (tipoMensagem === 'video' && audioGravado) {
      conteudo = 'Vídeo';
      videoUrl = audioGravado; // Reutilizando o estado para vídeo
    } else if (tipoMensagem === 'pdf' && audioGravado) {
      conteudo = nomeArquivoPDF || 'PDF';
      pdfUrl = audioGravado;
    }

    if (!conteudo && !audioUrl && !fotoUrl && !videoUrl && !pdfUrl) return;

    const mensagem: Mensagem = {
      id: Date.now().toString(),
      conversaId: conversaSelecionada.id,
      remetenteId: usuario.id,
      destinatarioId: outroUsuarioId,
      tipo: tipoMensagem,
      conteudo,
      audioUrl,
      fotoUrl,
      videoUrl,
      pdfUrl,
      nomeArquivoPDF: tipoMensagem === 'pdf' ? nomeArquivoPDF : undefined,
      duracaoAudio: tipoMensagem === 'audio' ? duracaoAudio : undefined,
      lida: false,
      dataEnvio: new Date().toISOString(),
    };

    mensagensStorage.add(mensagem);

    // Criar notificação
    const notificacao: Notificacao = {
      id: Date.now().toString(),
      usuarioId: outroUsuarioId,
      tipo: 'mensagem',
      titulo: `Nova mensagem de ${usuario.nome}`,
      mensagem: tipoMensagem === 'texto' ? conteudo : tipoMensagem === 'pdf' ? `Enviou um PDF: ${nomeArquivoPDF || 'documento.pdf'}` : `Enviou um ${tipoMensagem}`,
      lida: false,
      dataCriacao: new Date().toISOString(),
      link: `/chat?conversa=${conversaSelecionada.id}`,
      dadosExtras: { conversaId: conversaSelecionada.id },
    };
    notificacoesStorage.add(notificacao);

    // Atualizar conversa
    conversasStorage.update(conversaSelecionada.id, {
      ultimaMensagem: mensagem,
      dataUltimaMensagem: mensagem.dataEnvio,
    });

    setNovaMensagem('');
    setTipoMensagem('texto');
    setAudioGravado(null);
    setNomeArquivoPDF('');
    setDuracaoAudio(0);
    shouldAutoScrollRef.current = true; // Permitir scroll ao enviar mensagem
    loadMensagens(conversaSelecionada.id);
    loadConversas();
  };

  const iniciarGravacaoAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioGravado(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setGravandoAudio(true);
      setDuracaoAudio(0);

      intervaloAudioRef.current = setInterval(() => {
        setDuracaoAudio(prev => prev + 1);
      }, 1000) as unknown as number;
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  const pararGravacaoAudio = () => {
    if (mediaRecorderRef.current && gravandoAudio) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setGravandoAudio(false);
      
      if (intervaloAudioRef.current) {
        clearInterval(intervaloAudioRef.current);
      }
    }
  };

  const cancelarAudio = () => {
    setAudioGravado(null);
    setDuracaoAudio(0);
    setGravandoAudio(false);
    setNomeArquivoPDF('');
    setTipoMensagem('texto');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'foto' | 'video' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (tipo === 'pdf') {
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione apenas arquivos PDF.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('O arquivo PDF é muito grande. Tamanho máximo: 10MB');
        return;
      }
      setNomeArquivoPDF(file.name);
    } else {
      setNomeArquivoPDF('');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAudioGravado(base64); // Reutilizando o estado
      setTipoMensagem(tipo);
    };
    reader.onerror = () => {
      alert('Erro ao carregar o arquivo. Por favor, tente novamente.');
    };

    reader.readAsDataURL(file);
  };


  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!usuario) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Lista de Conversas */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Mensagens</h2>
            <button
              onClick={() => setMostrarUsuarios(!mostrarUsuarios)}
              className="text-primary-600 hover:text-primary-700"
            >
              {mostrarUsuarios ? <X className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          {mostrarUsuarios && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto">
                {usuariosFiltrados.map(u => (
                  <div
                    key={u.id}
                    onClick={() => iniciarConversa(u)}
                    className="p-2 hover:bg-gray-50 cursor-pointer rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {u.fotoPerfil ? (
                        <img src={u.fotoPerfil} alt={u.nome} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 text-xs font-semibold">
                            {u.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{u.cargo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversas.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhuma conversa ainda. Clique no ícone de mensagem para iniciar uma conversa.
            </div>
          ) : (
            conversas.map(conv => {
              const outroUsuario = conv.participante1Id === usuario.id
                ? conv.participante2
                : conv.participante1;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setConversaSelecionada(conv);
                    shouldAutoScrollRef.current = true; // Permitir scroll ao selecionar conversa
                    loadMensagens(conv.id);
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    conversaSelecionada?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {outroUsuario?.fotoPerfil ? (
                      <img
                        src={outroUsuario.fotoPerfil}
                        alt={outroUsuario.nome}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {outroUsuario?.nome.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {outroUsuario?.nome || 'Usuário'}
                        </p>
                        {conv.ultimaMensagem && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(conv.ultimaMensagem.dataEnvio), 'HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate">
                          {conv.ultimaMensagem
                            ? conv.ultimaMensagem.tipo === 'texto'
                              ? conv.ultimaMensagem.conteudo
                              : conv.ultimaMensagem.tipo === 'pdf'
                              ? `Enviou um PDF: ${conv.ultimaMensagem.nomeArquivoPDF || 'documento.pdf'}`
                              : `Enviou um ${conv.ultimaMensagem.tipo}`
                            : 'Nenhuma mensagem'}
                        </p>
                        {conv.naoLidas > 0 && (
                          <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                            {conv.naoLidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col">
        {conversaSelecionada ? (
          <>
            {/* Header da Conversa */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(() => {
                  const outroUsuario = conversaSelecionada.participante1Id === usuario.id
                    ? conversaSelecionada.participante2
                    : conversaSelecionada.participante1;
                  
                  return (
                    <>
                      {outroUsuario?.fotoPerfil ? (
                        <img
                          src={outroUsuario.fotoPerfil}
                          alt={outroUsuario.nome}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {outroUsuario?.nome.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{outroUsuario?.nome || 'Usuário'}</p>
                        <p className="text-xs text-gray-500">{outroUsuario?.cargo}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Mensagens */}
            <div 
              ref={mensagensContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {mensagens.map(msg => {
                const isRemetente = msg.remetenteId === usuario.id;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isRemetente ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isRemetente
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {isRemetente && (
                        <button
                          onClick={() => deletarMensagem(msg.id)}
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg z-10"
                          title="Deletar mensagem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {msg.tipo === 'texto' && <p className="text-sm">{msg.conteudo}</p>}
                      
                      {msg.tipo === 'audio' && msg.audioUrl && (
                        <div className="flex items-center space-x-2">
                          <audio
                            src={msg.audioUrl}
                            controls
                            className="w-full"
                          />
                          {msg.duracaoAudio && (
                            <span className="text-xs opacity-75">
                              {Math.floor(msg.duracaoAudio / 60)}:{(msg.duracaoAudio % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {msg.tipo === 'foto' && msg.fotoUrl && (
                        <div className="relative">
                          <img src={msg.fotoUrl} alt="Foto enviada" className="max-w-full rounded-lg" />
                        </div>
                      )}
                      
                      {msg.tipo === 'video' && msg.videoUrl && (
                        <video src={msg.videoUrl} controls className="max-w-full rounded-lg" />
                      )}
                      
                      {msg.tipo === 'pdf' && msg.pdfUrl && (
                        <div className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                          <FileText className="w-6 h-6" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{msg.nomeArquivoPDF || 'Documento PDF'}</p>
                            <a
                              href={msg.pdfUrl}
                              download={msg.nomeArquivoPDF || 'documento.pdf'}
                              className="text-xs underline"
                            >
                              Baixar PDF
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${isRemetente ? 'text-white opacity-75' : 'text-gray-500'}`}>
                          {format(new Date(msg.dataEnvio), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensagensEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200">
              {audioGravado && tipoMensagem === 'audio' && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <audio src={audioGravado} controls className="flex-1" />
                    <span className="text-xs text-gray-500">
                      {Math.floor(duracaoAudio / 60)}:{(duracaoAudio % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    onClick={cancelarAudio}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {(audioGravado && (tipoMensagem === 'foto' || tipoMensagem === 'video' || tipoMensagem === 'pdf')) && (
                <div className="mb-2">
                  {tipoMensagem === 'foto' && (
                    <div className="relative">
                      <img src={audioGravado} alt="Preview" className="max-w-xs rounded-lg" />
                      <button
                        onClick={cancelarAudio}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {tipoMensagem === 'video' && (
                    <div className="relative">
                      <video src={audioGravado} controls className="max-w-xs rounded-lg" />
                      <button
                        onClick={cancelarAudio}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {tipoMensagem === 'pdf' && (
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText className="w-6 h-6 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{nomeArquivoPDF || 'Documento PDF'}</p>
                        <p className="text-xs text-gray-500">Pronto para enviar</p>
                      </div>
                      <button
                        onClick={cancelarAudio}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviarMensagem();
                    }
                  }}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  disabled={tipoMensagem !== 'texto'}
                />
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'foto')}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileSelect(e, 'video')}
                  className="hidden"
                />
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileSelect(e, 'pdf')}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Enviar foto"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Enviar vídeo"
                >
                  <Video className="w-5 h-5" />
                </button>

                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Enviar PDF"
                >
                  <FileText className="w-5 h-5" />
                </button>

                {!gravandoAudio && !audioGravado ? (
                  <button
                    onClick={iniciarGravacaoAudio}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Enviar áudio"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                ) : gravandoAudio ? (
                  <button
                    onClick={pararGravacaoAudio}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg animate-pulse"
                    title="Parar gravação"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                ) : null}

                <button
                  onClick={enviarMensagem}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  title="Enviar"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecione uma conversa ou inicie uma nova
          </div>
        )}
      </div>

    </div>
  );
}


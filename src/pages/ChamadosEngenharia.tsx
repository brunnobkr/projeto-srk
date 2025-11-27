import { useState, useEffect } from 'react';
import { Wrench, Clock, Eye, Bell, X } from 'lucide-react';
import { problemasStorage, notificacoesStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ProblemaTecnico } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function ChamadosEngenharia() {
  const { usuario } = useAuth();
  const [chamados, setChamados] = useState<ProblemaTecnico[]>([]);
  const [viewingChamado, setViewingChamado] = useState<ProblemaTecnico | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'aberto' | 'em-andamento' | 'resolvido'>('todos');

  useEffect(() => {
    loadChamados();
    // Atualizar a cada 5 segundos para pegar novos chamados
    const interval = setInterval(loadChamados, 5000);
    return () => clearInterval(interval);
  }, [filtroStatus]);

  const loadChamados = () => {
    const todosProblemas = problemasStorage.getAll();
    // Filtrar apenas problemas com chamado para engenharia
    let chamadosFiltrados = todosProblemas.filter(p => p.engenhariaChamada === true);
    
    // Aplicar filtro de status
    if (filtroStatus !== 'todos') {
      chamadosFiltrados = chamadosFiltrados.filter(p => p.status === filtroStatus);
    }
    
    // Ordenar por data de chamada (mais recentes primeiro)
    chamadosFiltrados.sort((a, b) => {
      const dataA = a.dataChamadaEngenharia ? new Date(a.dataChamadaEngenharia).getTime() : 0;
      const dataB = b.dataChamadaEngenharia ? new Date(b.dataChamadaEngenharia).getTime() : 0;
      return dataB - dataA;
    });
    
    setChamados(chamadosFiltrados);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberto: 'Aberto',
      'em-andamento': 'Em Andamento',
      resolvido: 'Resolvido',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aberto: 'bg-red-100 text-red-800',
      'em-andamento': 'bg-yellow-100 text-yellow-800',
      resolvido: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      mecanico: 'Mecânico',
      eletrico: 'Elétrico',
      sistema: 'Sistema',
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      mecanico: 'bg-orange-100 text-orange-800',
      eletrico: 'bg-yellow-100 text-yellow-800',
      sistema: 'bg-red-100 text-red-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const marcarNotificacaoComoLida = (chamadoId: string) => {
    if (!usuario) return;
    
    const notificacoes = notificacoesStorage.getByUsuario(usuario.id);
    const notificacao = notificacoes.find(n => 
      n.tipo === 'chamado_engenharia' && 
      n.dadosRelacionados?.chamadoId === chamadoId &&
      !n.lida
    );
    
    if (notificacao) {
      notificacoesStorage.update(notificacao.id, { lida: true });
    }
  };

  const handleViewChamado = (chamado: ProblemaTecnico) => {
    setViewingChamado(chamado);
    marcarNotificacaoComoLida(chamado.id);
  };

  const getChamadosNaoLidos = (): number => {
    if (!usuario) return 0;
    const notificacoes = notificacoesStorage.getNaoLidas(usuario.id);
    return notificacoes.filter(n => n.tipo === 'chamado_engenharia').length;
  };

  const chamadosNaoLidos = getChamadosNaoLidos();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Wrench className="w-8 h-8 mr-3 text-primary-600" />
            Chamados para Engenharia
          </h1>
          <p className="mt-2 text-gray-600">
            Visualize e acompanhe os chamados direcionados à engenharia
          </p>
        </div>
        {chamadosNaoLidos > 0 && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <Bell className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-semibold">
              {chamadosNaoLidos} {chamadosNaoLidos === 1 ? 'chamado novo' : 'chamados novos'}
            </span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filtroStatus === 'todos'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({chamados.length})
          </button>
          <button
            onClick={() => setFiltroStatus('aberto')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filtroStatus === 'aberto'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Abertos ({chamados.filter(c => c.status === 'aberto').length})
          </button>
          <button
            onClick={() => setFiltroStatus('em-andamento')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filtroStatus === 'em-andamento'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Em Andamento ({chamados.filter(c => c.status === 'em-andamento').length})
          </button>
          <button
            onClick={() => setFiltroStatus('resolvido')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filtroStatus === 'resolvido'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Resolvidos ({chamados.filter(c => c.status === 'resolvido').length})
          </button>
        </div>
      </div>

      {/* Lista de Chamados */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {chamados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Nenhum chamado encontrado</p>
            <p className="text-sm mt-2">
              {filtroStatus === 'todos' 
                ? 'Não há chamados direcionados à engenharia no momento.'
                : `Não há chamados com status "${getStatusLabel(filtroStatus)}" no momento.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chamados.map((chamado) => {
              const temNotificacaoNaoLida = usuario && notificacoesStorage.getNaoLidas(usuario.id)
                .some(n => n.tipo === 'chamado_engenharia' && n.dadosRelacionados?.chamadoId === chamado.id);
              
              return (
                <div
                  key={chamado.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    temNotificacaoNaoLida ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {chamado.numeroChamado && (
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-primary-600 text-white">
                            {chamado.numeroChamado}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(chamado.tipo)}`}>
                          {getTipoLabel(chamado.tipo)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(chamado.status)}`}>
                          {getStatusLabel(chamado.status)}
                        </span>
                        {temNotificacaoNaoLida && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-600 text-white font-medium flex items-center">
                            <Bell className="w-3 h-3 mr-1" />
                            Novo
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{chamado.maquina}</h3>
                      <p className="text-sm text-gray-600 mb-2">{chamado.descricao}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {chamado.setor && (
                          <span><strong>Setor:</strong> {chamado.setor}</span>
                        )}
                        {chamado.linha && (
                          <span><strong>Linha:</strong> {chamado.linha}</span>
                        )}
                        {chamado.chamadoPor && (
                          <span><strong>Chamado por:</strong> {chamado.chamadoPor}</span>
                        )}
                        {chamado.dataChamadaEngenharia && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(chamado.dataChamadaEngenharia), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewChamado(chamado)}
                      className="ml-4 flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver Detalhes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Chamado */}
      {viewingChamado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Chamado</h2>
              <button
                onClick={() => setViewingChamado(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Informações do Chamado</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {viewingChamado.numeroChamado && (
                    <div>
                      <span className="font-medium text-gray-700">ID do Chamado:</span>
                      <p className="text-gray-900">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-primary-600 text-white">
                          {viewingChamado.numeroChamado}
                        </span>
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(viewingChamado.tipo)}`}>
                        {getTipoLabel(viewingChamado.tipo)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Máquina:</span>
                    <p className="text-gray-900">{viewingChamado.maquina}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(viewingChamado.status)}`}>
                        {getStatusLabel(viewingChamado.status)}
                      </span>
                    </p>
                  </div>
                  {viewingChamado.setor && (
                    <div>
                      <span className="font-medium text-gray-700">Setor:</span>
                      <p className="text-gray-900">{viewingChamado.setor}</p>
                    </div>
                  )}
                  {viewingChamado.linha && (
                    <div>
                      <span className="font-medium text-gray-700">Linha:</span>
                      <p className="text-gray-900">{viewingChamado.linha}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Data/Hora:</span>
                    <p className="text-gray-900">
                      {format(new Date(viewingChamado.data), 'dd/MM/yyyy', { locale: ptBR })} {viewingChamado.hora}
                    </p>
                  </div>
                  {viewingChamado.turno && (
                    <div>
                      <span className="font-medium text-gray-700">Turno:</span>
                      <p className="text-gray-900">
                        {viewingChamado.turno === '1' ? '1º Turno' :
                         viewingChamado.turno === '2' ? '2º Turno' :
                         viewingChamado.turno === '3' ? '3º Turno' : 'Central'}
                      </p>
                    </div>
                  )}
                  {viewingChamado.reportadoPor && (
                    <div>
                      <span className="font-medium text-gray-700">Reportado por:</span>
                      <p className="text-gray-900">{viewingChamado.reportadoPor}</p>
                    </div>
                  )}
                  {viewingChamado.chamadoPor && (
                    <div>
                      <span className="font-medium text-gray-700">Chamado por:</span>
                      <p className="text-gray-900">{viewingChamado.chamadoPor}</p>
                    </div>
                  )}
                  {viewingChamado.dataChamadaEngenharia && (
                    <div>
                      <span className="font-medium text-gray-700">Data do Chamado:</span>
                      <p className="text-gray-900">
                        {format(new Date(viewingChamado.dataChamadaEngenharia), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingChamado.descricao}</p>
              </div>

              {/* Causa */}
              {viewingChamado.causa && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Causa Identificada</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingChamado.causa}</p>
                </div>
              )}

              {/* Observações */}
              {viewingChamado.observacoes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Observações</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingChamado.observacoes}</p>
                </div>
              )}

              {/* Resolução */}
              {viewingChamado.status === 'resolvido' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold mb-2 text-green-900">Resolução</h3>
                  {viewingChamado.resolvidoPor && (
                    <p className="text-sm text-green-800 mb-1">
                      <strong>Resolvido por:</strong> {viewingChamado.resolvidoPor}
                    </p>
                  )}
                  {viewingChamado.dataResolucao && (
                    <p className="text-sm text-green-800">
                      <strong>Data de Resolução:</strong>{' '}
                      {format(new Date(viewingChamado.dataResolucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setViewingChamado(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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


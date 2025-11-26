import { useState, useEffect } from 'react';
import { Monitor, AlertTriangle, Clock, X, CheckCircle, RotateCcw, User, FileText } from 'lucide-react';
import ChamadosManutencao from './ChamadosManutencao';
import { problemasStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ProblemaTecnico } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function ChamadosTI() {
  const { usuario } = useAuth();
  const [problemasSistema, setProblemasSistema] = useState<ProblemaTecnico[]>([]);
  const [problemaSelecionado, setProblemaSelecionado] = useState<ProblemaTecnico | null>(null);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [showNovoChamadoModal, setShowNovoChamadoModal] = useState(false);
  const [formFinalizar, setFormFinalizar] = useState({
    resolvidoPor: '',
    observacoes: '',
    causa: '',
  });
  const [formNovoChamado, setFormNovoChamado] = useState({
    descricao: '',
    causa: '',
  });

  useEffect(() => {
    loadProblemasSistema();
    // Atualizar a cada 2 segundos
    const interval = setInterval(loadProblemasSistema, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadProblemasSistema = () => {
    const todosProblemas = problemasStorage.getAll();
    // Filtrar apenas problemas de sistema que estão abertos ou em andamento
    const problemasAtivos = todosProblemas.filter(p => 
      p.tipo === 'sistema' &&
      (p.status === 'aberto' || p.status === 'em-andamento')
    );
    setProblemasSistema(problemasAtivos);
  };

  const verDetalhes = (problema: ProblemaTecnico) => {
    setProblemaSelecionado(problema);
    setShowDetalhesModal(true);
  };

  const finalizarProblema = () => {
    if (!problemaSelecionado) return;

    const dataInicio = new Date(`${problemaSelecionado.data}T${problemaSelecionado.hora}`);
    const dataFim = new Date();
    const tempoResolucao = Math.floor((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60)); // em minutos

    problemasStorage.update(problemaSelecionado.id, {
      status: 'resolvido',
      resolvidoPor: formFinalizar.resolvidoPor || usuario?.nome || 'Sistema',
      dataResolucao: new Date().toISOString(),
      tempoResolucao,
      observacoes: formFinalizar.observacoes || undefined,
      causa: formFinalizar.causa || undefined,
    });

    alert('Chamado finalizado com sucesso!');
    setShowFinalizarModal(false);
    setShowDetalhesModal(false);
    setFormFinalizar({ resolvidoPor: '', observacoes: '', causa: '' });
    setProblemaSelecionado(null);
    loadProblemasSistema();
  };

  const criarNovoChamado = () => {
    if (!problemaSelecionado) return;

    const novoProblema: ProblemaTecnico = {
      id: Date.now().toString(),
      tipo: problemaSelecionado.tipo,
      maquina: problemaSelecionado.maquina,
      descricao: formNovoChamado.descricao || `Problema reincidente na máquina ${problemaSelecionado.maquina}`,
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm'),
      status: 'aberto',
      reportadoPor: usuario?.nome || 'Sistema',
      causa: formNovoChamado.causa || undefined,
      problemaAnteriorId: problemaSelecionado.id,
    };

    problemasStorage.add(novoProblema);
    alert('Novo chamado criado com sucesso! O problema anterior foi referenciado.');
    setShowNovoChamadoModal(false);
    setShowDetalhesModal(false);
    setFormNovoChamado({ descricao: '', causa: '' });
    setProblemaSelecionado(null);
    loadProblemasSistema();
  };

  const getProblemasAnteriores = (maquina: string) => {
    return problemasStorage.getAll().filter(p => 
      p.maquina === maquina && 
      p.status === 'resolvido' &&
      p.tipo === 'sistema'
    ).sort((a, b) => 
      new Date(b.dataResolucao || b.data).getTime() - new Date(a.dataResolucao || a.data).getTime()
    );
  };

  return (
    <div className="space-y-6">
      {/* Problemas de Sistema */}
      {problemasSistema.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">Problemas de Sistema Pendentes</h2>
          </div>
          <div className="space-y-3">
            {problemasSistema.map((problema) => (
              <div key={problema.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Sistema
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        problema.status === 'aberto' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {problema.status === 'aberto' ? 'Aberto' : 'Em Andamento'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{problema.maquina}</h4>
                    <p className="text-sm text-gray-600 mt-1">{problema.descricao}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(new Date(problema.data), 'dd/MM/yyyy', { locale: ptBR })} às {problema.hora}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => verDetalhes(problema)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver detalhes →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChamadosManutencao
        tipo="sistema"
        titulo="Chamados de TI"
        icone={Monitor}
      />

      {/* Modal de Detalhes do Problema */}
      {showDetalhesModal && problemaSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Chamado</h2>
              <button
                onClick={() => {
                  setShowDetalhesModal(false);
                  setProblemaSelecionado(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informações Básicas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informações do Chamado</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Máquina/Equipamento:</span>
                    <p className="font-medium text-gray-900">{problemaSelecionado.maquina}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <p className="font-medium text-gray-900">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Sistema
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        problemaSelecionado.status === 'aberto' ? 'bg-red-100 text-red-800' :
                        problemaSelecionado.status === 'em-andamento' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {problemaSelecionado.status === 'aberto' ? 'Aberto' :
                         problemaSelecionado.status === 'em-andamento' ? 'Em Andamento' : 'Resolvido'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Data e Hora:</span>
                    <p className="font-medium text-gray-900">
                      {format(new Date(problemaSelecionado.data), 'dd/MM/yyyy', { locale: ptBR })} às {problemaSelecionado.hora}
                    </p>
                  </div>
                  {problemaSelecionado.reportadoPor && (
                    <div>
                      <span className="text-gray-600">Reportado por:</span>
                      <p className="font-medium text-gray-900 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {problemaSelecionado.reportadoPor}
                      </p>
                    </div>
                  )}
                  {problemaSelecionado.resolvidoPor && (
                    <div>
                      <span className="text-gray-600">Resolvido por:</span>
                      <p className="font-medium text-gray-900">{problemaSelecionado.resolvidoPor}</p>
                    </div>
                  )}
                  {problemaSelecionado.dataResolucao && (
                    <div>
                      <span className="text-gray-600">Data de Resolução:</span>
                      <p className="font-medium text-gray-900">
                        {format(new Date(problemaSelecionado.dataResolucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {problemaSelecionado.tempoResolucao && (
                    <div>
                      <span className="text-gray-600">Tempo de Resolução:</span>
                      <p className="font-medium text-gray-900">
                        {Math.floor(problemaSelecionado.tempoResolucao / 60)}h {problemaSelecionado.tempoResolucao % 60}min
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Descrição do Problema
                </h3>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{problemaSelecionado.descricao}</p>
              </div>

              {/* Causa */}
              {problemaSelecionado.causa && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Causa Identificada</h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{problemaSelecionado.causa}</p>
                </div>
              )}

              {/* Observações */}
              {problemaSelecionado.observacoes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{problemaSelecionado.observacoes}</p>
                </div>
              )}

              {/* Problemas Anteriores na Mesma Máquina */}
              {getProblemasAnteriores(problemaSelecionado.maquina).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Histórico de Problemas nesta Máquina</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 mb-2">
                      Esta máquina já teve {getProblemasAnteriores(problemaSelecionado.maquina).length} problema(s) resolvido(s) anteriormente.
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {getProblemasAnteriores(problemaSelecionado.maquina).slice(0, 3).map(p => (
                        <div key={p.id} className="text-xs text-yellow-700">
                          • {format(new Date(p.data), 'dd/MM/yyyy', { locale: ptBR })} - {p.descricao.substring(0, 50)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {problemaSelecionado.status !== 'resolvido' && (
                  <>
                    <button
                      onClick={() => {
                        setShowFinalizarModal(true);
                        setFormFinalizar({
                          resolvidoPor: usuario?.nome || '',
                          observacoes: '',
                          causa: '',
                        });
                      }}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Chamado
                    </button>
                    <button
                      onClick={() => {
                        setShowNovoChamadoModal(true);
                        setFormNovoChamado({
                          descricao: `Problema reincidente: ${problemaSelecionado.descricao}`,
                          causa: problemaSelecionado.causa || '',
                        });
                      }}
                      className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Problema Ocorreu Novamente (Novo Chamado)
                    </button>
                  </>
                )}
                {problemaSelecionado.status === 'resolvido' && (
                  <button
                    onClick={() => {
                      setShowNovoChamadoModal(true);
                      setFormNovoChamado({
                        descricao: `Problema reincidente: ${problemaSelecionado.descricao}`,
                        causa: problemaSelecionado.causa || '',
                      });
                    }}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Abrir Novo Chamado (Problema Ocorreu Novamente)
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetalhesModal(false);
                    setProblemaSelecionado(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Finalizar Chamado */}
      {showFinalizarModal && problemaSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Finalizar Chamado</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              finalizarProblema();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resolvido por *</label>
                <input
                  type="text"
                  required
                  value={formFinalizar.resolvidoPor}
                  onChange={(e) => setFormFinalizar({ ...formFinalizar, resolvidoPor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nome de quem resolveu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Causa Identificada</label>
                <textarea
                  value={formFinalizar.causa}
                  onChange={(e) => setFormFinalizar({ ...formFinalizar, causa: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Descreva a causa do problema..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={formFinalizar.observacoes}
                  onChange={(e) => setFormFinalizar({ ...formFinalizar, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Observações sobre a resolução..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFinalizarModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Finalizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Chamado (Problema Reincidente) */}
      {showNovoChamadoModal && problemaSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Novo Chamado - Problema Reincidente</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> O chamado anterior permanecerá finalizado. Um novo chamado será criado para o problema reincidente na máquina <strong>{problemaSelecionado.maquina}</strong>.
              </p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              criarNovoChamado();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descrição do Problema *</label>
                <textarea
                  required
                  value={formNovoChamado.descricao}
                  onChange={(e) => setFormNovoChamado({ ...formNovoChamado, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Descreva o problema que ocorreu novamente..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Causa (se conhecida)</label>
                <textarea
                  value={formNovoChamado.causa}
                  onChange={(e) => setFormNovoChamado({ ...formNovoChamado, causa: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Causa do problema (se já identificada)..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNovoChamadoModal(false);
                    setFormNovoChamado({ descricao: '', causa: '' });
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Criar Novo Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


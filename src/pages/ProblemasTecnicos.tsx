import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, CheckCircle, Eye, X } from 'lucide-react';
import { problemasStorage, setoresStorage, notificacoesStorage, usuariosStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ProblemaTecnico, Setor, Notificacao } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { determinarTurno } from '../utils/turno';
import { ensureSetoresPadraoAtualizados } from '../utils/setoresConfig';

export default function ProblemasTecnicos() {
  const { usuario, canEdit, canCreate, isCentralMecanica } = useAuth();
  const [problemas, setProblemas] = useState<ProblemaTecnico[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProblema, setEditingProblema] = useState<ProblemaTecnico | null>(null);
  const [viewingProblema, setViewingProblema] = useState<ProblemaTecnico | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [linhas, setLinhas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tipo: 'mecanico' as 'mecanico' | 'eletrico' | 'sistema' | 'ferramentaria',
    maquina: '',
    setor: '',
    linha: '',
    descricao: '',
    causa: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora: format(new Date(), 'HH:mm'),
    turno: determinarTurno() as '1' | '2' | '3' | 'central',
    status: 'aberto' as 'aberto' | 'em-andamento' | 'resolvido',
    resolvidoPor: '',
    observacoes: '',
    engenhariaChamada: false,
  });

  useEffect(() => {
    // Garante que os setores estão no novo padrão (110, 120, 130, 140, 180)
    ensureSetoresPadraoAtualizados(usuario?.nome);
    loadProblemas();
    loadSetores();
    // Atualizar turno a cada minuto
    const interval = setInterval(() => {
      if (!editingProblema) {
        setFormData(prev => ({ ...prev, turno: determinarTurno() }));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [editingProblema]);

  const loadSetores = () => {
    const todosSetores = setoresStorage.getAll();
    // Filtrar apenas setores ativos
    setSetores(todosSetores.filter((s) => s.ativo));
  };

  useEffect(() => {
    if (formData.setor) {
      const setorSelecionado = setores.find(s => s.id === formData.setor);
      if (setorSelecionado) {
        setLinhas(setorSelecionado.linhas || []);
      } else {
        setLinhas([]);
      }
    } else {
      setLinhas([]);
    }
  }, [formData.setor, setores]);

  const loadProblemas = () => {
    setProblemas(problemasStorage.getAll());
  };

  // Gerar número único de chamado
  const gerarNumeroChamado = (): string => {
    const todosProblemas = problemasStorage.getAll();
    // Encontrar o maior número de chamado existente
    let maiorNumero = 0;
    todosProblemas.forEach(p => {
      if (p.numeroChamado) {
        const numero = parseInt(p.numeroChamado.replace('CHAM-', ''));
        if (!isNaN(numero) && numero > maiorNumero) {
          maiorNumero = numero;
        }
      }
    });
    // Gerar próximo número
    const proximoNumero = maiorNumero + 1;
    return `CHAM-${proximoNumero.toString().padStart(4, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Determinar turno se não foi definido
    const turno = formData.turno || determinarTurno(formData.hora);
    
    const problema: ProblemaTecnico = {
      id: editingProblema?.id || Date.now().toString(),
      numeroChamado: editingProblema?.numeroChamado || gerarNumeroChamado(),
      tipo: formData.tipo,
      maquina: formData.maquina,
      setor: formData.setor,
      linha: formData.linha,
      descricao: formData.descricao,
      causa: formData.causa || undefined,
      data: formData.data,
      hora: formData.hora,
      turno: turno,
      status: formData.status,
      reportadoPor: editingProblema?.reportadoPor || usuario?.nome || undefined,
      resolvidoPor: formData.resolvidoPor || undefined,
      dataResolucao: formData.status === 'resolvido' ? new Date().toISOString() : undefined,
      observacoes: formData.observacoes || undefined,
      engenhariaChamada: formData.engenhariaChamada,
      dataChamadaEngenharia: formData.engenhariaChamada && !editingProblema?.engenhariaChamada 
        ? new Date().toISOString() 
        : editingProblema?.dataChamadaEngenharia,
      chamadoPor: formData.engenhariaChamada && !editingProblema?.engenhariaChamada
        ? usuario?.nome || undefined
        : editingProblema?.chamadoPor,
    };

    if (editingProblema) {
      problemasStorage.update(editingProblema.id, problema);
      
      // Se foi marcado para chamar engenharia e antes não estava marcado, criar notificações
      if (formData.engenhariaChamada && !editingProblema.engenhariaChamada) {
        criarNotificacoesEngenharia(problema);
      }
    } else {
      problemasStorage.add(problema);
      
      // Se foi marcado para chamar engenharia, criar notificações
      if (formData.engenhariaChamada) {
        criarNotificacoesEngenharia(problema);
      }
    }

    resetForm();
    loadProblemas();
  };

  // Criar notificações para usuários da engenharia
  const criarNotificacoesEngenharia = (problema: ProblemaTecnico) => {
    const todosUsuarios = usuariosStorage.getAll();
    const usuariosEngenharia = todosUsuarios.filter(u => {
      const cargo = u.cargo?.toLowerCase() || '';
      const setor = u.setor?.toLowerCase() || '';
      return (cargo.includes('engenharia') || setor.includes('engenharia')) && u.isAtivo;
    });

    usuariosEngenharia.forEach(usuario => {
      const notificacao: Notificacao = {
        id: `notif_${Date.now()}_${usuario.id}_${problema.id}`,
        usuarioId: usuario.id,
        tipo: 'chamado_engenharia',
        titulo: `Novo Chamado: ${problema.maquina}`,
        mensagem: `Chamado ${problema.numeroChamado || problema.id} - ${problema.descricao.substring(0, 100)}${problema.descricao.length > 100 ? '...' : ''}`,
        lida: false,
        dataCriacao: new Date().toISOString(),
        dadosRelacionados: {
          chamadoId: problema.id,
          tipoChamado: problema.tipo,
        },
      };
      notificacoesStorage.add(notificacao);
    });
  };

  const handleEdit = (problema: ProblemaTecnico) => {
    // Se o problema não tiver número de chamado, gerar um
    if (!problema.numeroChamado) {
      const problemaComNumero = {
        ...problema,
        numeroChamado: gerarNumeroChamado(),
      };
      problemasStorage.update(problema.id, problemaComNumero);
      setEditingProblema(problemaComNumero);
    } else {
      setEditingProblema(problema);
    }
    setFormData({
      tipo: problema.tipo,
      maquina: problema.maquina,
      setor: problema.setor || '',
      linha: problema.linha || '',
      descricao: problema.descricao,
      causa: problema.causa || '',
      data: problema.data,
      hora: problema.hora,
      turno: problema.turno || determinarTurno(problema.hora),
      status: problema.status,
      resolvidoPor: problema.resolvidoPor || '',
      observacoes: problema.observacoes || '',
      engenhariaChamada: problema.engenhariaChamada || false,
    });
    setShowModal(true);
  };

  const handleResolve = (id: string) => {
    // Verificar permissões: precisa ter permissão de editar ou criar na central de mecânica
    const temPermissao = canEdit('problemasTecnicos') || canCreate('problemasTecnicos') || isCentralMecanica();
    
    if (!temPermissao) {
      alert('Você não tem permissão para marcar problemas técnicos como resolvidos. Apenas usuários com permissão de editar ou criar na Central de Mecânica podem fazer isso.');
      return;
    }
    
    const problema = problemas.find(p => p.id === id);
    if (problema) {
      const resolvidoPor = prompt('Quem resolveu o problema?');
      if (resolvidoPor) {
        problemasStorage.update(id, {
          status: 'resolvido',
          resolvidoPor,
          dataResolucao: new Date().toISOString(),
        });
        loadProblemas();
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este problema?')) {
      problemasStorage.delete(id);
      loadProblemas();
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'mecanico',
      maquina: '',
      setor: '',
      linha: '',
      descricao: '',
      causa: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm'),
      turno: determinarTurno(),
      status: 'aberto',
      resolvidoPor: '',
      observacoes: '',
      engenhariaChamada: false,
    });
    setEditingProblema(null);
    setShowModal(false);
    setLinhas([]);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      mecanico: 'Mecânico',
      eletrico: 'Elétrico',
      sistema: 'Sistema',
      ferramentaria: 'Ferramentaria',
    };
    return labels[tipo] || tipo;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberto: 'Aberto',
      'em-andamento': 'Em Andamento',
      resolvido: 'Resolvido',
    };
    return labels[status] || status;
  };

  const filteredProblemas = problemas.filter(p =>
    p.maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.numeroChamado && p.numeroChamado.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Problemas Técnicos</h1>
          <p className="mt-2 text-gray-600">
            Registre e acompanhe problemas mecânicos, elétricos e de sistema
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Problema
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por ID do chamado, máquina ou descrição..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Chamado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Máquina</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engenharia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolvido Por</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProblemas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    Nenhum problema encontrado
                  </td>
                </tr>
              ) : (
                filteredProblemas.map((problema) => (
                  <tr key={problema.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {problema.numeroChamado ? (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-primary-600 text-white">
                          {problema.numeroChamado}
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-gray-300 text-gray-700">
                          Sem ID
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        problema.tipo === 'mecanico' ? 'bg-orange-100 text-orange-800' :
                        problema.tipo === 'eletrico' ? 'bg-yellow-100 text-yellow-800' :
                        problema.tipo === 'ferramentaria' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getTipoLabel(problema.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{problema.maquina}</td>
                    <td className="px-6 py-4">{problema.descricao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(problema.data), 'dd/MM/yyyy', { locale: ptBR })} {problema.hora}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {problema.turno ? (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          problema.turno === '1' ? 'bg-blue-100 text-blue-800' :
                          problema.turno === '2' ? 'bg-green-100 text-green-800' :
                          problema.turno === '3' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {problema.turno === '1' ? '1º Turno' :
                           problema.turno === '2' ? '2º Turno' :
                           problema.turno === '3' ? '3º Turno' :
                           'Central'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        problema.status === 'aberto' ? 'bg-red-100 text-red-800' :
                        problema.status === 'em-andamento' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getStatusLabel(problema.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {problema.engenhariaChamada ? (
                        <div className="flex flex-col">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                            Chamada
                          </span>
                          {problema.dataChamadaEngenharia && (
                            <span className="text-xs text-gray-500 mt-1">
                              {format(new Date(problema.dataChamadaEngenharia), 'dd/MM HH:mm', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{problema.resolvidoPor || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => setViewingProblema(problema)} className="text-blue-600 hover:text-blue-900 mr-4" title="Ver detalhes">
                        <Eye className="w-5 h-5" />
                      </button>
                      {problema.status !== 'resolvido' && (canEdit('problemasTecnicos') || canCreate('problemasTecnicos') || isCentralMecanica()) && (
                        <button
                          onClick={() => handleResolve(problema.id)}
                          className="text-green-600 hover:text-green-900 mr-4"
                          title="Marcar como resolvido"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(problema)} className="text-primary-600 hover:text-primary-900 mr-4">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(problema.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingProblema ? 'Editar' : 'Novo'} Problema</h2>
            {editingProblema?.numeroChamado && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">ID do Chamado:</span>
                  <span className="px-3 py-1 text-sm font-bold rounded-full bg-primary-600 text-white">
                    {editingProblema.numeroChamado}
                  </span>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <select required value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="mecanico">Mecânico</option>
                    <option value="eletrico">Elétrico</option>
                    <option value="sistema">Sistema</option>
                    <option value="ferramentaria">Ferramentaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Máquina *</label>
                  <input type="text" required value={formData.maquina} onChange={(e) => setFormData({ ...formData, maquina: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Setor *</label>
                  <select required value={formData.setor} onChange={(e) => setFormData({ ...formData, setor: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Selecione um setor</option>
                    {setores.filter(s => s.ativo).map(setor => (
                      <option key={setor.id} value={setor.id}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Linha *</label>
                  <select required value={formData.linha} onChange={(e) => setFormData({ ...formData, linha: e.target.value })} className="w-full px-3 py-2 border rounded-lg" disabled={!formData.setor}>
                    <option value="">Selecione uma linha</option>
                    {linhas.map(linha => (
                      <option key={linha.id} value={linha.nome}>{linha.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data *</label>
                  <input type="date" required value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora *</label>
                  <input 
                    type="time" 
                    required 
                    value={formData.hora} 
                    onChange={(e) => {
                      setFormData({ ...formData, hora: e.target.value, turno: determinarTurno(e.target.value) });
                    }} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Turno *</label>
                  <select
                    required
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value as '1' | '2' | '3' | 'central' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="1">1º Turno (06:30 às 16:18)</option>
                    <option value="2">2º Turno (16:18 às 01:30)</option>
                    <option value="3">3º Turno (01:30 às 06:30)</option>
                    <option value="central">Central</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="aberto">Aberto</option>
                    <option value="em-andamento">Em Andamento</option>
                    <option value="resolvido">Resolvido</option>
                  </select>
                </div>
                {formData.status === 'resolvido' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Resolvido Por</label>
                    <input type="text" value={formData.resolvidoPor} onChange={(e) => setFormData({ ...formData, resolvidoPor: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <textarea required value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Causa (se conhecida)</label>
                <textarea value={formData.causa} onChange={(e) => setFormData({ ...formData, causa: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Descreva a causa do problema, se já identificada..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="engenhariaChamada"
                  checked={formData.engenhariaChamada}
                  onChange={(e) => setFormData({ ...formData, engenhariaChamada: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="engenhariaChamada" className="text-sm font-medium">
                  Chamar Engenharia
                </label>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingProblema ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização Detalhada */}
      {viewingProblema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Detalhes do Problema Técnico</h2>
                {viewingProblema.numeroChamado && (
                  <div className="mt-2">
                    <span className="px-4 py-2 text-sm font-bold rounded-full bg-primary-600 text-white">
                      ID: {viewingProblema.numeroChamado}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewingProblema(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Informações Gerais</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        viewingProblema.tipo === 'mecanico' ? 'bg-orange-100 text-orange-800' :
                        viewingProblema.tipo === 'eletrico' ? 'bg-yellow-100 text-yellow-800' :
                        viewingProblema.tipo === 'ferramentaria' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getTipoLabel(viewingProblema.tipo)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Máquina:</span>
                    <p className="text-gray-900">{viewingProblema.maquina}</p>
                  </div>
                  {viewingProblema.setor && (
                    <div>
                      <span className="font-medium text-gray-700">Setor:</span>
                      <p className="text-gray-900">{viewingProblema.setor}</p>
                    </div>
                  )}
                  {viewingProblema.linha && (
                    <div>
                      <span className="font-medium text-gray-700">Linha:</span>
                      <p className="text-gray-900">{viewingProblema.linha}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Data/Hora:</span>
                    <p className="text-gray-900">{format(new Date(viewingProblema.data), 'dd/MM/yyyy', { locale: ptBR })} {viewingProblema.hora}</p>
                  </div>
                  {viewingProblema.turno && (
                    <div>
                      <span className="font-medium text-gray-700">Turno:</span>
                      <p className="text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          viewingProblema.turno === '1' ? 'bg-blue-100 text-blue-800' :
                          viewingProblema.turno === '2' ? 'bg-green-100 text-green-800' :
                          viewingProblema.turno === '3' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {viewingProblema.turno === '1' ? '1º Turno' :
                           viewingProblema.turno === '2' ? '2º Turno' :
                           viewingProblema.turno === '3' ? '3º Turno' :
                           'Central'}
                        </span>
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        viewingProblema.status === 'aberto' ? 'bg-red-100 text-red-800' :
                        viewingProblema.status === 'em-andamento' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getStatusLabel(viewingProblema.status)}
                      </span>
                    </p>
                  </div>
                  {viewingProblema.reportadoPor && (
                    <div>
                      <span className="font-medium text-gray-700">Reportado por:</span>
                      <p className="text-gray-900">{viewingProblema.reportadoPor}</p>
                    </div>
                  )}
                  {viewingProblema.resolvidoPor && (
                    <div>
                      <span className="font-medium text-gray-700">Resolvido por:</span>
                      <p className="text-gray-900">{viewingProblema.resolvidoPor}</p>
                    </div>
                  )}
                  {viewingProblema.dataResolucao && (
                    <div>
                      <span className="font-medium text-gray-700">Data de Resolução:</span>
                      <p className="text-gray-900">{format(new Date(viewingProblema.dataResolucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Engenharia Chamada:</span>
                    <p className="text-gray-900">
                      {viewingProblema.engenhariaChamada ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Sim</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Não</span>
                      )}
                    </p>
                  </div>
                  {viewingProblema.dataChamadaEngenharia && (
                    <div>
                      <span className="font-medium text-gray-700">Data Chamada Engenharia:</span>
                      <p className="text-gray-900">{format(new Date(viewingProblema.dataChamadaEngenharia), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                    </div>
                  )}
                  {viewingProblema.chamadoPor && (
                    <div>
                      <span className="font-medium text-gray-700">Chamado por:</span>
                      <p className="text-gray-900">{viewingProblema.chamadoPor}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Descrição:</span>
                    <p className="text-gray-900">{viewingProblema.descricao}</p>
                  </div>
                  {viewingProblema.causa && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Causa:</span>
                      <p className="text-gray-900">{viewingProblema.causa}</p>
                    </div>
                  )}
                  {viewingProblema.observacoes && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Observações:</span>
                      <p className="text-gray-900">{viewingProblema.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setViewingProblema(null)}
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


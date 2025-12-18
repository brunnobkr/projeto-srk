import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Save, X, Building2, List, AlertTriangle, Clock } from 'lucide-react';
import { setoresStorage, problemasStorage, chamadosStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { Setor, Linha, ProblemaTecnico, ChamadoManutencao } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function GerenciarSetoresLinhas() {
  const { isEngenharia, usuario } = useAuth();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [showLinhaModal, setShowLinhaModal] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [editingLinha, setEditingLinha] = useState<{ setor: Setor; linha: Linha } | null>(null);
  const [setorSelecionado, setSetorSelecionado] = useState<string>('');
  const [formDataSetor, setFormDataSetor] = useState({
    nome: '',
    descricao: '',
  });
  const [formDataLinha, setFormDataLinha] = useState({
    nome: '',
    descricao: '',
  });
  const [problemasTecnicos, setProblemasTecnicos] = useState<ProblemaTecnico[]>([]);
  const [chamadosManutencao, setChamadosManutencao] = useState<ChamadoManutencao[]>([]);

  useEffect(() => {
    if (isEngenharia()) {
      loadSetores();
      loadProblemasTecnicos();
      loadChamadosManutencao();
      // Inicializar setores padrão se não existirem
      const todosSetores = setoresStorage.getAll();
      if (todosSetores.length === 0 && usuario) {
        inicializarSetoresPadrao();
      }
    }
  }, [usuario]);

  const loadProblemasTecnicos = () => {
    const todosProblemas = problemasStorage.getAll();
    // Filtrar apenas problemas abertos ou em andamento
    const problemasAtivos = todosProblemas.filter(p => 
      p.status === 'aberto' || p.status === 'em-andamento'
    );
    setProblemasTecnicos(problemasAtivos);
  };

  const loadChamadosManutencao = () => {
    const todosChamados = chamadosStorage.getAll();
    // Filtrar chamados de mecânica e elétrica que estão abertos ou em andamento
    const chamadosAtivos = todosChamados.filter(c => 
      (c.tipo === 'mecanica' || c.tipo === 'eletrica') &&
      (c.status === 'aberto' || c.status === 'em-andamento')
    );
    setChamadosManutencao(chamadosAtivos);
  };

  const inicializarSetoresPadrao = () => {
    const agora = new Date().toISOString();
    const criadoPor = usuario?.nome || 'Sistema';

    // Setor Tecalon (Linhas 52-68)
    const linhasTecalon: Linha[] = [];
    for (let i = 52; i <= 68; i++) {
      linhasTecalon.push({
        id: `tecalon_${i}`,
        nome: i.toString(),
        setorId: 'setor_tecalon',
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    }

    const setorTecalon: Setor = {
      id: 'setor_tecalon',
      nome: 'Tecalon',
      descricao: 'Setor Tecalon',
      linhas: linhasTecalon,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Setor Fiat (Linhas 01-20 e CO)
    const linhasFiat: Linha[] = [];
    for (let i = 1; i <= 20; i++) {
      linhasFiat.push({
        id: `fiat_${i.toString().padStart(2, '0')}`,
        nome: i.toString().padStart(2, '0'),
        setorId: 'setor_fiat',
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    }
    linhasFiat.push({
      id: 'fiat_co',
      nome: 'CO',
      setorId: 'setor_fiat',
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    });

    const setorFiat: Setor = {
      id: 'setor_fiat',
      nome: 'Fiat',
      descricao: 'Setor Fiat',
      linhas: linhasFiat,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Setor Jeep (Linhas 30, 31, 32, 35, 70, 71, 73)
    const linhasJeep: Linha[] = [30, 31, 32, 35, 70, 71, 73].map(num => ({
      id: `jeep_${num}`,
      nome: num.toString(),
      setorId: 'setor_jeep',
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    }));

    const setorJeep: Setor = {
      id: 'setor_jeep',
      nome: 'Jeep',
      descricao: 'Setor Jeep',
      linhas: linhasJeep,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Setor Japonesa (Linhas 90-94)
    const linhasJaponesa: Linha[] = [];
    for (let i = 90; i <= 94; i++) {
      linhasJaponesa.push({
        id: `japonesa_${i}`,
        nome: i.toString(),
        setorId: 'setor_japonesa',
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    }

    const setorJaponesa: Setor = {
      id: 'setor_japonesa',
      nome: 'Japonesa',
      descricao: 'Setor Japonesa',
      linhas: linhasJaponesa,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Setor Caminhões (C1-C6, CL, CI, CG, CH, CK, CJ)
    const linhasCaminhoes: Linha[] = [];
    for (let i = 1; i <= 6; i++) {
      linhasCaminhoes.push({
        id: `caminhoes_c${i}`,
        nome: `C${i}`,
        setorId: 'setor_caminhoes',
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    }
    ['CL', 'CI', 'CG', 'CH', 'CK', 'CJ'].forEach(cod => {
      linhasCaminhoes.push({
        id: `caminhoes_${cod.toLowerCase()}`,
        nome: cod,
        setorId: 'setor_caminhoes',
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    });

    const setorCaminhoes: Setor = {
      id: 'setor_caminhoes',
      nome: 'Caminhões',
      descricao: 'Setor Caminhões',
      linhas: linhasCaminhoes,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Linha OGIS (1, 2, 3, 5, 6, 7, 8, 9, 10)
    const linhasOGIS: Linha[] = [1, 2, 3, 5, 6, 7, 8, 9, 10].map(num => ({
      id: `ogis_${num}`,
      nome: num.toString(),
      setorId: 'setor_ogis',
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    }));

    const setorOGIS: Setor = {
      id: 'setor_ogis',
      nome: 'OGIS',
      descricao: 'Linha OGIS',
      linhas: linhasOGIS,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Linha Canister (Máquinas 1-20)
    const linhasCanister: Linha[] = [];
    for (let i = 1; i <= 20; i++) {
      linhasCanister.push({
        id: `canister_${i}`,
        nome: i.toString(),
        setorId: 'setor_canister',
        descricao: `Máquina ${i}`,
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    }

    const setorCanister: Setor = {
      id: 'setor_canister',
      nome: 'Canister',
      descricao: 'Linha Canister',
      linhas: linhasCanister,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Pré Reformatura (M1-M18)
    const linhasPreReform: Linha[] = [];
    for (let i = 1; i <= 18; i++) {
      linhasPreReform.push({
        id: `prereform_m${i}`,
        nome: `M${i}`,
        setorId: 'setor_prereform',
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    }

    const setorPreReform: Setor = {
      id: 'setor_prereform',
      nome: 'Pré Reformatura',
      descricao: 'Pré Reformatura',
      linhas: linhasPreReform,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Pintura Pré Reformatura (M1-M6)
    const linhasPinturaPreReform: Linha[] = [];
    for (let i = 1; i <= 6; i++) {
      linhasPinturaPreReform.push({
        id: `pinturaprereform_m${i}`,
        nome: `M${i}`,
        setorId: 'setor_pinturaprereform',
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      });
    }

    const setorPinturaPreReform: Setor = {
      id: 'setor_pinturaprereform',
      nome: 'Pintura Pré Reformatura',
      descricao: 'Pintura Pré Reformatura',
      linhas: linhasPinturaPreReform,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };

    // Adicionar todos os setores
    [
      setorTecalon,
      setorFiat,
      setorJeep,
      setorJaponesa,
      setorCaminhoes,
      setorOGIS,
      setorCanister,
      setorPreReform,
      setorPinturaPreReform,
    ].forEach(setor => setoresStorage.add(setor));

    loadSetores();
  };

  const loadSetores = () => {
    setSetores(setoresStorage.getAll());
  };

  const handleSubmitSetor = (e: React.FormEvent) => {
    e.preventDefault();
    const agora = new Date().toISOString();
    const criadoPor = usuario?.nome || 'Engenharia';

    if (editingSetor) {
      setoresStorage.update(editingSetor.id, {
        nome: formDataSetor.nome,
        descricao: formDataSetor.descricao || undefined,
      });
      alert('Setor atualizado com sucesso!');
    } else {
      const novoSetor: Setor = {
        id: `setor_${Date.now()}`,
        nome: formDataSetor.nome,
        descricao: formDataSetor.descricao || undefined,
        linhas: [],
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      };
      setoresStorage.add(novoSetor);
      alert('Setor criado com sucesso!');
    }

    resetFormSetor();
    loadSetores();
  };

  const handleSubmitLinha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorSelecionado && !editingLinha) {
      alert('Selecione um setor primeiro!');
      return;
    }

    const agora = new Date().toISOString();
    const criadoPor = usuario?.nome || 'Engenharia';
    const setorId = editingLinha ? editingLinha.setor.id : setorSelecionado;

    if (editingLinha) {
      setoresStorage.updateLinha(setorId, editingLinha.linha.id, {
        nome: formDataLinha.nome,
        descricao: formDataLinha.descricao || undefined,
      });
      alert('Linha atualizada com sucesso!');
    } else {
      const novaLinha: Linha = {
        id: `linha_${Date.now()}`,
        nome: formDataLinha.nome,
        descricao: formDataLinha.descricao || undefined,
        setorId,
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        criadoPor,
      };
      setoresStorage.addLinha(setorId, novaLinha);
      alert('Linha criada com sucesso!');
    }

    resetFormLinha();
    loadSetores();
  };

  const handleEditSetor = (setor: Setor) => {
    setEditingSetor(setor);
    setFormDataSetor({
      nome: setor.nome,
      descricao: setor.descricao || '',
    });
    setShowSetorModal(true);
  };

  const handleEditLinha = (setor: Setor, linha: Linha) => {
    setEditingLinha({ setor, linha });
    setFormDataLinha({
      nome: linha.nome,
      descricao: linha.descricao || '',
    });
    setShowLinhaModal(true);
  };

  const handleDeleteSetor = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este setor? Todas as linhas serão excluídas também.')) {
      setoresStorage.delete(id);
      loadSetores();
    }
  };

  const handleDeleteLinha = (setorId: string, linhaId: string) => {
    if (confirm('Tem certeza que deseja excluir esta linha?')) {
      setoresStorage.deleteLinha(setorId, linhaId);
      loadSetores();
    }
  };

  const resetFormSetor = () => {
    setFormDataSetor({ nome: '', descricao: '' });
    setEditingSetor(null);
    setShowSetorModal(false);
  };

  const resetFormLinha = () => {
    setFormDataLinha({ nome: '', descricao: '' });
    setEditingLinha(null);
    setSetorSelecionado('');
    setShowLinhaModal(false);
  };

  const filteredSetores = setores.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isEngenharia()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <X className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas o setor de Engenharia pode gerenciar setores e linhas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Setores e Linhas</h1>
          <p className="mt-2 text-gray-600">
            Configure os setores e linhas da empresa
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowLinhaModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Linha
          </button>
          <button
            onClick={() => setShowSetorModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Setor
          </button>
        </div>
      </div>

      {/* Chamados e Problemas Técnicos */}
      {(problemasTecnicos.length > 0 || chamadosManutencao.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Chamados e Problemas Técnicos Pendentes</h2>
          </div>

          {/* Problemas Técnicos */}
          {problemasTecnicos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Problemas Técnicos</h3>
              <div className="space-y-3">
                {problemasTecnicos.map((problema) => (
                  <div key={problema.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            problema.tipo === 'mecanico' ? 'bg-red-100 text-red-800' :
                            problema.tipo === 'eletrico' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {problema.tipo === 'mecanico' ? 'Mecânico' :
                             problema.tipo === 'eletrico' ? 'Elétrico' : 'Sistema'}
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
                            {(() => {
                              try {
                                const data = new Date(problema.data);
                                if (isNaN(data.getTime())) return problema.data || '-';
                                return `${format(data, 'dd/MM/yyyy', { locale: ptBR })} às ${problema.hora || '-'}`;
                              } catch {
                                return problema.data || '-';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      <a
                        href="/problemas-tecnicos"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Ver detalhes →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chamados de Manutenção */}
          {chamadosManutencao.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Chamados de Manutenção</h3>
              <div className="space-y-3">
                {chamadosManutencao.map((chamado) => (
                  <div key={chamado.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            chamado.tipo === 'mecanica' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {chamado.tipo === 'mecanica' ? 'Mecânica' : 'Elétrica'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            chamado.status === 'aberto' ? 'bg-red-100 text-red-800' :
                            chamado.status === 'em-andamento' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {chamado.status === 'aberto' ? 'Aberto' :
                             chamado.status === 'em-andamento' ? 'Em Andamento' :
                             'Aguardando'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            chamado.prioridade === 'critica' ? 'bg-red-600 text-white' :
                            chamado.prioridade === 'alta' ? 'bg-orange-500 text-white' :
                            chamado.prioridade === 'media' ? 'bg-yellow-500 text-white' :
                            'bg-green-500 text-white'
                          }`}>
                            {chamado.prioridade.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{chamado.titulo}</h4>
                        <p className="text-sm text-gray-600 mt-1">{chamado.descricao}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {chamado.setor && <span><strong>Setor:</strong> {chamado.setor}</span>}
                          {chamado.linha && <span><strong>Linha:</strong> {chamado.linha}</span>}
                          {chamado.maquina && <span><strong>Máquina:</strong> {chamado.maquina}</span>}
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {(() => {
                              try {
                                const data = new Date(chamado.dataSolicitacao);
                                if (isNaN(data.getTime())) return chamado.dataSolicitacao || '-';
                                return `${format(data, 'dd/MM/yyyy', { locale: ptBR })} às ${chamado.horaSolicitacao || '-'}`;
                              } catch {
                                return chamado.dataSolicitacao || '-';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      <a
                        href="/central-mecanica"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Ver detalhes →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSetores.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhum setor encontrado
          </div>
        ) : (
          filteredSetores.map((setor) => (
            <div key={setor.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-primary-600" />
                    {setor.nome}
                  </h3>
                  {setor.descricao && (
                    <p className="text-sm text-gray-600 mt-1">{setor.descricao}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditSetor(setor)}
                    className="text-primary-600 hover:text-primary-900"
                    title="Editar Setor"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSetor(setor.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Excluir Setor"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <List className="w-4 h-4 mr-1" />
                    Linhas ({setor.linhas.length})
                  </h4>
                </div>
                {setor.linhas.length === 0 ? (
                  <p className="text-xs text-gray-500">Nenhuma linha cadastrada</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {setor.linhas.map((linha) => (
                      <div
                        key={linha.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{linha.nome}</span>
                          {linha.descricao && (
                            <span className="text-xs text-gray-500 ml-2">({linha.descricao})</span>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditLinha(setor, linha)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Editar Linha"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLinha(setor.id, linha.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir Linha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Setor */}
      {showSetorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingSetor ? 'Editar' : 'Novo'} Setor
              </h2>
              <button onClick={resetFormSetor} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitSetor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Setor *</label>
                <input
                  type="text"
                  required
                  value={formDataSetor.nome}
                  onChange={(e) => setFormDataSetor({ ...formDataSetor, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Tecalon, Fiat, Jeep"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={formDataSetor.descricao}
                  onChange={(e) => setFormDataSetor({ ...formDataSetor, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Descrição opcional do setor"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetFormSetor}
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

      {/* Modal Linha */}
      {showLinhaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingLinha ? 'Editar' : 'Nova'} Linha
              </h2>
              <button onClick={resetFormLinha} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitLinha} className="space-y-4">
              {!editingLinha && (
                <div>
                  <label className="block text-sm font-medium mb-1">Setor *</label>
                  <select
                    required
                    value={setorSelecionado}
                    onChange={(e) => setSetorSelecionado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione um setor...</option>
                    {setores.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Linha *</label>
                <input
                  type="text"
                  required
                  value={formDataLinha.nome}
                  onChange={(e) => setFormDataLinha({ ...formDataLinha, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: 52, C1, M1, 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  value={formDataLinha.descricao}
                  onChange={(e) => setFormDataLinha({ ...formDataLinha, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Descrição opcional da linha"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetFormLinha}
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


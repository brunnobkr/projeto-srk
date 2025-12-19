import { useState, useEffect } from 'react';
import { Edit, Trash2, X, Eye, Search } from 'lucide-react';
import { instrucoesStorage, setoresStorage } from '../utils/storage';
import type { InstrucaoTrabalho, Setor } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useAuth } from '../contexts/AuthContext';

export default function InstrucoesTrabalho() {
  const { usuario } = useAuth();
  const [instrucoes, setInstrucoes] = useState<InstrucaoTrabalho[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroLinha, setFiltroLinha] = useState('');
  const [viewingInstrucao, setViewingInstrucao] = useState<InstrucaoTrabalho | null>(null);

  useEffect(() => {
    loadInstrucoes();
    loadSetores();
  }, []);

  // Para usuários que têm um setor configurado, já aplicar como filtro padrão de visualização
  useEffect(() => {
    if (usuario?.setor) {
      setFiltroSetor(usuario.setor);
    }
  }, [usuario]);

  const loadSetores = () => {
    const todosSetores = setoresStorage.getAll();
    // Filtrar apenas setores ativos
    setSetores(todosSetores.filter(s => s.ativo));
  };

  const loadInstrucoes = () => {
    const todasInstrucoes = instrucoesStorage.getAll();
    // Migrar instruções antigas que não têm tipoInstrucao
    const instrucoesMigradas = todasInstrucoes.map(inst => ({
      ...inst,
      tipoInstrucao: inst.tipoInstrucao || 'insercao',
    }));
    setInstrucoes(instrucoesMigradas);
  };

  const handleEdit = () => {
    // setEditingInstrucao(instrucao); // Não usado
    // Migrar passos antigos que usam "ordem" para "letra"
    // const passosMigrados = ...; // Não usado
    // setFormData({ ... }); // Não usado
    // setAnexosPDF(instrucao.anexosPDF || []); // Não usado
    // setFotosGerais(instrucao.fotos || []); // Não usado
    // setShowModal(true); // Modal não usado
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta instrução?')) {
      instrucoesStorage.delete(id);
      loadInstrucoes();
    }
  };

  const getTipoInstrucaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      insercao: 'Inserção',
      fechamento: 'Fechamento',
      emergencia: 'Emergência',
      marcacao: 'Marcação',
      start: 'Start na Máquina',
      botao: 'Botão',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const filteredInstrucoes = instrucoes.filter((i) => {
    const termo = searchTerm.toLowerCase().trim();

    const matchesTexto =
      !termo ||
      i.codigoProduto.toLowerCase().includes(termo) ||
      i.titulo.toLowerCase().includes(termo) ||
      getTipoInstrucaoLabel(i.tipoInstrucao || 'insercao').toLowerCase().includes(termo);

    const matchesSetor = !filtroSetor || (i.setor || '').toLowerCase() === filtroSetor.toLowerCase();
    const matchesLinha = !filtroLinha || (i.linha || '').toLowerCase() === filtroLinha.toLowerCase();

    return matchesTexto && matchesSetor && matchesLinha;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instruções de Trabalho</h1>
          <p className="mt-2 text-gray-600">
            Instruções para preparadores e funcionários por produto
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {/* setShowModal(true); // Modal não usado */}}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Nova Instrução
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código, título ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Filtros por setor e linha para facilitar a consulta dos funcionários autorizados a apenas visualizar */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Setor</label>
            <select
              value={filtroSetor}
              onChange={(e) => {
                setFiltroSetor(e.target.value);
                setFiltroLinha('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todos os setores</option>
              {setores
                .filter((s) => s.ativo)
                .map((setor) => (
                  <option key={setor.id} value={setor.nome}>
                    {setor.nome}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Linha</label>
            <select
              value={filtroLinha}
              onChange={(e) => setFiltroLinha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled={!filtroSetor}
            >
              <option value="">Todas as linhas</option>
              {setores
                .find((s) => s.nome === filtroSetor)
                ?.linhas.filter((l) => l.ativo)
                .map((linha) => (
                  <option key={linha.id} value={linha.nome}>
                    {linha.nome}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end">
            {(filtroSetor || filtroLinha) && (
              <button
                type="button"
                onClick={() => {
                  setFiltroSetor('');
                  setFiltroLinha('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-full md:w-auto"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
        {searchTerm.trim() && filteredInstrucoes.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredInstrucoes.length} {filteredInstrucoes.length === 1 ? 'instrução encontrada' : 'instruções encontradas'}.
          </p>
        )}
      </div>

      {/* Lista de Instruções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstrucoes.map((instrucao) => (
          <div key={instrucao.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{instrucao.titulo}</h3>
                <p className="text-sm text-gray-600">Código: {instrucao.codigoProduto}</p>
                {(instrucao.setor || instrucao.linha) && (
                  <p className="text-sm text-gray-600">
                    Setor: {instrucao.setor || '-'} | Linha: {instrucao.linha || '-'}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingInstrucao(instrucao)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit()}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(instrucao.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                instrucao.tipoInstrucao === 'insercao' ? 'bg-blue-100 text-blue-800' :
                instrucao.tipoInstrucao === 'fechamento' ? 'bg-green-100 text-green-800' :
                instrucao.tipoInstrucao === 'emergencia' ? 'bg-red-100 text-red-800' :
                instrucao.tipoInstrucao === 'marcacao' ? 'bg-purple-100 text-purple-800' :
                instrucao.tipoInstrucao === 'start' ? 'bg-orange-100 text-orange-800' :
                instrucao.tipoInstrucao === 'botao' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getTipoInstrucaoLabel(instrucao.tipoInstrucao || 'insercao')}
              </span>
            </div>
            <p className="text-gray-700 text-sm mb-4 line-clamp-3">{instrucao.titulo}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Criado: {format(new Date(instrucao.dataCriacao), 'dd/MM/yyyy', { locale: ptBR })}</span>
              <span>Passos: {instrucao.passos?.length || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Visualização */}
      {viewingInstrucao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Instrução</h2>
                <button
                  onClick={() => setViewingInstrucao(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Código: {viewingInstrucao.codigoProduto}</h3>
                  {(viewingInstrucao.setor || viewingInstrucao.linha) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Setor: {viewingInstrucao.setor || '-'} | Linha: {viewingInstrucao.linha || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-700">{viewingInstrucao.titulo}</p>
                </div>
                {viewingInstrucao.fotos && viewingInstrucao.fotos.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Fotos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {viewingInstrucao.fotos.map((foto, index) => (
                        <img key={index} src={foto} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-300" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setViewingInstrucao(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

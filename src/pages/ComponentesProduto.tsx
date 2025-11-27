import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, PlusCircle, X, Eye } from 'lucide-react';
import { componentesStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { ComponenteProduto, Presilha, Marcacao, CorComponente } from '../types';

export default function ComponentesProduto() {
  const { canCreate, canEdit, isEngenharia } = useAuth();
  const [componentes, setComponentes] = useState<ComponenteProduto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingComponente, setEditingComponente] = useState<ComponenteProduto | null>(null);
  const [viewingComponente, setViewingComponente] = useState<ComponenteProduto | null>(null);
  
  const podeCriarEditar = canCreate('componentesProduto') || canEdit('componentesProduto') || isEngenharia();
  const [formData, setFormData] = useState({
    codigo: '',
    tubos: [] as { nome: string; quantidade: number; codigos?: string[] }[],
    conectores: [] as { nome: string; quantidade: number; codigos?: string[] }[],
    presilhas: [] as Presilha[],
    fitas: [] as { nome: string; quantidade: number; codigos?: string[] }[],
    guianas: [] as { nome: string; quantidade: number; codigos?: string[] }[],
    aneis: [] as { nome: string; quantidade: number; codigos?: string[] }[],
    marcacoes: [] as Marcacao[],
    recalques: '',
    cores: [] as CorComponente[],
    valvulas: [] as { nome: string; quantidade: number; tipo?: 'A' | 'B' | 'AB'; codigos?: string[] }[],
    filtros: [] as { nome: string; quantidade: number; codigos?: string[] }[],
    observacoes: '',
  });

  const [novoTubo, setNovoTubo] = useState({ nome: '', quantidade: '', codigos: '' });
  const [novoConector, setNovoConector] = useState({ nome: '', quantidade: '', codigos: '' });
  const [novaFita, setNovaFita] = useState({ nome: '', quantidade: '', codigos: '' });
  const [novaGuiana, setNovaGuiana] = useState({ nome: '', quantidade: '', codigos: '' });
  const [novoAnei, setNovoAnei] = useState({ nome: '', quantidade: '', codigos: '' });
  const [novaValvula, setNovaValvula] = useState({ nome: '', quantidade: '', tipo: 'AB' as 'A' | 'B' | 'AB', codigos: '' });
  const [novoFiltro, setNovoFiltro] = useState({ nome: '', quantidade: '', codigos: '' });

  const [novaPresilha, setNovaPresilha] = useState({ tipo: 'plastico' as 'plastico' | 'metal', quantidade: '', descricao: '' });
  const [novaMarcacao, setNovaMarcacao] = useState({ tipo: 'pincel' as 'pincel' | 'tinta' | 'outro', descricao: '', localizacao: '' });
  const [novaCor, setNovaCor] = useState({ componente: '', cor: '' });

  useEffect(() => {
    loadComponentes();
  }, []);

  const loadComponentes = () => {
    setComponentes(componentesStorage.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const componente: ComponenteProduto = {
      id: editingComponente?.id || Date.now().toString(),
      codigo: formData.codigo,
      tubos: formData.tubos,
      conectores: formData.conectores,
      presilhas: formData.presilhas,
      fitas: formData.fitas,
      guianas: formData.guianas,
      aneis: formData.aneis,
      marcacoes: formData.marcacoes,
      recalques: parseInt(formData.recalques) || 0,
      cores: formData.cores,
      valvulas: formData.valvulas,
      filtros: formData.filtros,
      observacoes: formData.observacoes || undefined,
    };

    if (editingComponente) {
      componentesStorage.update(editingComponente.id, componente);
    } else {
      componentesStorage.add(componente);
    }

    alert(editingComponente ? 'Componente atualizado com sucesso!' : 'Componente salvo com sucesso!');
    resetForm();
    loadComponentes();
  };

  const handleEdit = (componente: ComponenteProduto) => {
    setEditingComponente(componente);
    // Migrar dados antigos (arrays de strings) para nova estrutura
    const migrarArray = (arr: any[]): { nome: string; quantidade: number; codigos?: string[] }[] => {
      if (arr.length === 0) return [];
      if (typeof arr[0] === 'string') {
        return arr.map(item => ({ nome: item, quantidade: 1 }));
      }
      // Preservar códigos se existirem
      return arr.map(item => ({
        ...item,
        codigos: item.codigos || undefined
      }));
    };
    
    const migrarValvulas = (arr: any[]): { nome: string; quantidade: number; tipo?: 'A' | 'B' | 'AB'; codigos?: string[] }[] => {
      if (arr.length === 0) return [];
      if (typeof arr[0] === 'string') {
        return arr.map(item => ({ nome: item, quantidade: 1, tipo: 'AB' as 'A' | 'B' | 'AB' }));
      }
      // Preservar códigos se existirem
      return arr.map(item => ({
        ...item,
        codigos: item.codigos || undefined
      }));
    };

    setFormData({
      codigo: componente.codigo,
      tubos: migrarArray(componente.tubos as any),
      conectores: migrarArray(componente.conectores as any),
      presilhas: componente.presilhas,
      fitas: migrarArray(componente.fitas as any),
      guianas: migrarArray(componente.guianas as any),
      aneis: migrarArray(componente.aneis as any),
      marcacoes: componente.marcacoes,
      recalques: componente.recalques.toString(),
      cores: componente.cores,
      valvulas: migrarValvulas(componente.valvulas as any),
      filtros: migrarArray(componente.filtros as any),
      observacoes: componente.observacoes || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este componente?')) {
      componentesStorage.delete(id);
      loadComponentes();
    }
  };

  const addPresilha = () => {
    if (novaPresilha.quantidade) {
      setFormData({
        ...formData,
        presilhas: [...formData.presilhas, {
          tipo: novaPresilha.tipo,
          quantidade: parseInt(novaPresilha.quantidade),
          descricao: novaPresilha.descricao || undefined,
        }],
      });
      setNovaPresilha({ tipo: 'plastico', quantidade: '', descricao: '' });
    }
  };

  const removePresilha = (index: number) => {
    setFormData({ ...formData, presilhas: formData.presilhas.filter((_, i) => i !== index) });
  };

  const addMarcacao = () => {
    if (novaMarcacao.descricao) {
      setFormData({
        ...formData,
        marcacoes: [...formData.marcacoes, {
          tipo: novaMarcacao.tipo,
          descricao: novaMarcacao.descricao,
          localizacao: novaMarcacao.localizacao || undefined,
        }],
      });
      setNovaMarcacao({ tipo: 'pincel', descricao: '', localizacao: '' });
    }
  };

  const removeMarcacao = (index: number) => {
    setFormData({ ...formData, marcacoes: formData.marcacoes.filter((_, i) => i !== index) });
  };

  const addCor = () => {
    if (novaCor.componente && novaCor.cor) {
      setFormData({
        ...formData,
        cores: [...formData.cores, { ...novaCor }],
      });
      setNovaCor({ componente: '', cor: '' });
    }
  };

  const removeCor = (index: number) => {
    setFormData({ ...formData, cores: formData.cores.filter((_, i) => i !== index) });
  };

  const addTubo = () => {
    if (novoTubo.nome && novoTubo.quantidade) {
      const codigos = novoTubo.codigos ? novoTubo.codigos.split(',').map(c => c.trim()).filter(c => c) : undefined;
      setFormData({
        ...formData,
        tubos: [...formData.tubos, { 
          nome: novoTubo.nome, 
          quantidade: parseInt(novoTubo.quantidade) || 1,
          codigos: codigos && codigos.length > 0 ? codigos : undefined
        }],
      });
      setNovoTubo({ nome: '', quantidade: '', codigos: '' });
    }
  };

  const removeTubo = (index: number) => {
    setFormData({ ...formData, tubos: formData.tubos.filter((_, i) => i !== index) });
  };

  const addConector = () => {
    if (novoConector.nome && novoConector.quantidade) {
      const codigos = novoConector.codigos ? novoConector.codigos.split(',').map(c => c.trim()).filter(c => c) : undefined;
      setFormData({
        ...formData,
        conectores: [...formData.conectores, { 
          nome: novoConector.nome, 
          quantidade: parseInt(novoConector.quantidade) || 1,
          codigos: codigos && codigos.length > 0 ? codigos : undefined
        }],
      });
      setNovoConector({ nome: '', quantidade: '', codigos: '' });
    }
  };

  const removeConector = (index: number) => {
    setFormData({ ...formData, conectores: formData.conectores.filter((_, i) => i !== index) });
  };

  const addFita = () => {
    if (novaFita.nome && novaFita.quantidade) {
      const codigos = novaFita.codigos ? novaFita.codigos.split(',').map(c => c.trim()).filter(c => c) : undefined;
      setFormData({
        ...formData,
        fitas: [...formData.fitas, { 
          nome: novaFita.nome, 
          quantidade: parseInt(novaFita.quantidade) || 1,
          codigos: codigos && codigos.length > 0 ? codigos : undefined
        }],
      });
      setNovaFita({ nome: '', quantidade: '', codigos: '' });
    }
  };

  const removeFita = (index: number) => {
    setFormData({ ...formData, fitas: formData.fitas.filter((_, i) => i !== index) });
  };

  const addGuiana = () => {
    if (novaGuiana.nome && novaGuiana.quantidade) {
      const codigos = novaGuiana.codigos ? novaGuiana.codigos.split(',').map(c => c.trim()).filter(c => c) : undefined;
      setFormData({
        ...formData,
        guianas: [...formData.guianas, { 
          nome: novaGuiana.nome, 
          quantidade: parseInt(novaGuiana.quantidade) || 1,
          codigos: codigos && codigos.length > 0 ? codigos : undefined
        }],
      });
      setNovaGuiana({ nome: '', quantidade: '', codigos: '' });
    }
  };

  const removeGuiana = (index: number) => {
    setFormData({ ...formData, guianas: formData.guianas.filter((_, i) => i !== index) });
  };

  const addAnei = () => {
    if (novoAnei.nome && novoAnei.quantidade) {
      const codigos = novoAnei.codigos ? novoAnei.codigos.split(',').map(c => c.trim()).filter(c => c) : undefined;
      setFormData({
        ...formData,
        aneis: [...formData.aneis, { 
          nome: novoAnei.nome, 
          quantidade: parseInt(novoAnei.quantidade) || 1,
          codigos: codigos && codigos.length > 0 ? codigos : undefined
        }],
      });
      setNovoAnei({ nome: '', quantidade: '', codigos: '' });
    }
  };

  const removeAnei = (index: number) => {
    setFormData({ ...formData, aneis: formData.aneis.filter((_, i) => i !== index) });
  };

  const addValvula = () => {
    if (novaValvula.nome && novaValvula.quantidade) {
      const codigos = novaValvula.codigos ? novaValvula.codigos.split(',').map(c => c.trim()).filter(c => c) : undefined;
      setFormData({
        ...formData,
        valvulas: [...formData.valvulas, { 
          nome: novaValvula.nome, 
          quantidade: parseInt(novaValvula.quantidade) || 1,
          tipo: novaValvula.tipo,
          codigos: codigos && codigos.length > 0 ? codigos : undefined
        }],
      });
      setNovaValvula({ nome: '', quantidade: '', tipo: 'AB', codigos: '' });
    }
  };

  const removeValvula = (index: number) => {
    setFormData({ ...formData, valvulas: formData.valvulas.filter((_, i) => i !== index) });
  };

  const addFiltro = () => {
    if (novoFiltro.nome && novoFiltro.quantidade) {
      const codigos = novoFiltro.codigos ? novoFiltro.codigos.split(',').map(c => c.trim()).filter(c => c) : undefined;
      setFormData({
        ...formData,
        filtros: [...formData.filtros, { 
          nome: novoFiltro.nome, 
          quantidade: parseInt(novoFiltro.quantidade) || 1,
          codigos: codigos && codigos.length > 0 ? codigos : undefined
        }],
      });
      setNovoFiltro({ nome: '', quantidade: '', codigos: '' });
    }
  };

  const removeFiltro = (index: number) => {
    setFormData({ ...formData, filtros: formData.filtros.filter((_, i) => i !== index) });
  };


  const resetForm = () => {
    setFormData({
      codigo: '',
      tubos: [],
      conectores: [],
      presilhas: [],
      fitas: [],
      guianas: [],
      aneis: [],
      marcacoes: [],
      recalques: '',
      cores: [],
      valvulas: [],
      filtros: [],
      observacoes: '',
    });
    setNovaPresilha({ tipo: 'plastico', quantidade: '', descricao: '' });
    setNovaMarcacao({ tipo: 'pincel', descricao: '', localizacao: '' });
    setNovaCor({ componente: '', cor: '' });
    setNovoTubo({ nome: '', quantidade: '', codigos: '' });
    setNovoConector({ nome: '', quantidade: '', codigos: '' });
    setNovaFita({ nome: '', quantidade: '', codigos: '' });
    setNovaGuiana({ nome: '', quantidade: '', codigos: '' });
    setNovoAnei({ nome: '', quantidade: '', codigos: '' });
    setNovaValvula({ nome: '', quantidade: '', tipo: 'AB', codigos: '' });
    setNovoFiltro({ nome: '', quantidade: '', codigos: '' });
    setEditingComponente(null);
    setShowModal(false);
  };

  // Obter lista única de códigos para o datalist
  const codigosUnicos = Array.from(new Set(componentes.map(c => c.codigo))).sort();

  const filteredComponentes = componentes.filter(c =>
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Componentes por Código</h1>
          <p className="mt-2 text-gray-600">
            Consulta de componentes necessários para cada código final de produto. A engenharia cadastra os detalhes para consulta dos preparadores.
          </p>
        </div>
        {podeCriarEditar && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Componente
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            list="codigos-list"
            placeholder="Buscar por código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <datalist id="codigos-list">
            {codigosUnicos.map(codigo => (
              <option key={codigo} value={codigo} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredComponentes.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Nenhum componente encontrado
          </div>
        ) : (
          filteredComponentes.map((componente) => (
            <div key={componente.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Código: {componente.codigo}</h3>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setViewingComponente(componente)} className="text-blue-600 hover:text-blue-900" title="Ver detalhes">
                    <Eye className="w-5 h-5" />
                  </button>
                  {podeCriarEditar && (
                    <>
                      <button onClick={() => handleEdit(componente)} className="text-primary-600 hover:text-primary-900">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(componente.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div><strong>Tubos:</strong> {
                  Array.isArray(componente.tubos) && typeof componente.tubos[0] === 'object' 
                    ? componente.tubos.map((t: any) => `${t.quantidade}x ${t.nome}${t.codigos && t.codigos.length > 0 ? ` (Códigos: ${t.codigos.join(', ')})` : ''}`).join(', ') || '-'
                    : (componente.tubos as any).join(', ') || '-'
                }</div>
                <div><strong>Conectores:</strong> {
                  Array.isArray(componente.conectores) && typeof componente.conectores[0] === 'object'
                    ? componente.conectores.map((c: any) => `${c.quantidade}x ${c.nome}${c.codigos && c.codigos.length > 0 ? ` (Códigos: ${c.codigos.join(', ')})` : ''}`).join(', ') || '-'
                    : (componente.conectores as any).join(', ') || '-'
                }</div>
                <div><strong>Presilhas:</strong> {componente.presilhas.length > 0 ? componente.presilhas.map(p => `${p.quantidade}x ${p.tipo}`).join(', ') : '-'}</div>
                <div><strong>Fitas:</strong> {
                  Array.isArray(componente.fitas) && typeof componente.fitas[0] === 'object'
                    ? componente.fitas.map((f: any) => `${f.quantidade}x ${f.nome}${f.codigos && f.codigos.length > 0 ? ` (Códigos: ${f.codigos.join(', ')})` : ''}`).join(', ') || '-'
                    : (componente.fitas as any).join(', ') || '-'
                }</div>
                <div><strong>Guianas e Borrachas:</strong> {
                  Array.isArray(componente.guianas) && typeof componente.guianas[0] === 'object'
                    ? componente.guianas.map((g: any) => `${g.quantidade}x ${g.nome}${g.codigos && g.codigos.length > 0 ? ` (Códigos: ${g.codigos.join(', ')})` : ''}`).join(', ') || '-'
                    : (componente.guianas as any).join(', ') || '-'
                }</div>
                <div><strong>Anéis:</strong> {
                  Array.isArray(componente.aneis) && typeof componente.aneis[0] === 'object'
                    ? componente.aneis.map((a: any) => `${a.quantidade}x ${a.nome}${a.codigos && a.codigos.length > 0 ? ` (Códigos: ${a.codigos.join(', ')})` : ''}`).join(', ') || '-'
                    : (componente.aneis as any).join(', ') || '-'
                }</div>
                <div><strong>Recalques:</strong> {componente.recalques}</div>
                <div><strong>Válvulas:</strong> {
                  Array.isArray(componente.valvulas) && typeof componente.valvulas[0] === 'object'
                    ? componente.valvulas.map((v: any) => `${v.quantidade}x ${v.nome}${v.tipo ? ` (${v.tipo === 'A' ? 'A' : v.tipo === 'B' ? 'B' : 'A e B'})` : ''}${v.codigos && v.codigos.length > 0 ? ` - Códigos: ${v.codigos.join(', ')}` : ''}`).join(', ') || '-'
                    : (componente.valvulas as any).join(', ') || '-'
                }</div>
                <div><strong>Filtros:</strong> {
                  Array.isArray(componente.filtros) && typeof componente.filtros[0] === 'object'
                    ? componente.filtros.map((f: any) => `${f.quantidade}x ${f.nome}${f.codigos && f.codigos.length > 0 ? ` (Códigos: ${f.codigos.join(', ')})` : ''}`).join(', ') || '-'
                    : (componente.filtros as any).join(', ') || '-'
                }</div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingComponente ? 'Editar' : 'Novo'} Componente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código do Produto Final *</label>
                <input type="text" required value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: JKDND" />
                <p className="text-xs text-gray-500 mt-1">Código final do produto que será construído</p>
              </div>

              {/* Tubos */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Tubos</h3>
                <div className="space-y-2 mb-3">
                  {formData.tubos.map((t, i) => {
                    const tWithCodigos = t as { nome: string; quantidade: number; codigos?: string[] };
                    return (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{t.quantidade}x {t.nome}{tWithCodigos.codigos && tWithCodigos.codigos.length > 0 ? ` (Códigos: ${tWithCodigos.codigos.join(', ')})` : ''}</span>
                      <button type="button" onClick={() => removeTubo(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" placeholder="Nome do tubo" value={novoTubo.nome} onChange={(e) => setNovoTubo({ ...novoTubo, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Quantidade" value={novoTubo.quantidade} onChange={(e) => setNovoTubo({ ...novoTubo, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Códigos (ex: Z, N)" value={novoTubo.codigos} onChange={(e) => setNovoTubo({ ...novoTubo, codigos: e.target.value })} className="px-3 py-2 border rounded-lg" title="Separe múltiplos códigos por vírgula" />
                  <button type="button" onClick={addTubo} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              {/* Conectores */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Conectores</h3>
                <div className="space-y-2 mb-3">
                  {formData.conectores.map((c, i) => {
                    const cWithCodigos = c as { nome: string; quantidade: number; codigos?: string[] };
                    return (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{c.quantidade}x {c.nome}{cWithCodigos.codigos && cWithCodigos.codigos.length > 0 ? ` (Códigos: ${cWithCodigos.codigos.join(', ')})` : ''}</span>
                      <button type="button" onClick={() => removeConector(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" placeholder="Nome do conector" value={novoConector.nome} onChange={(e) => setNovoConector({ ...novoConector, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Quantidade" value={novoConector.quantidade} onChange={(e) => setNovoConector({ ...novoConector, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Códigos (ex: Z, N)" value={novoConector.codigos} onChange={(e) => setNovoConector({ ...novoConector, codigos: e.target.value })} className="px-3 py-2 border rounded-lg" title="Separe múltiplos códigos por vírgula" />
                  <button type="button" onClick={addConector} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              {/* Válvulas */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Válvulas</h3>
                <div className="space-y-2 mb-3">
                  {formData.valvulas.map((v, i) => {
                    const vWithCodigos = v as { nome: string; quantidade: number; tipo?: 'A' | 'B' | 'AB'; codigos?: string[] };
                    return (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{v.quantidade}x {v.nome} {v.tipo === 'A' ? '(A)' : v.tipo === 'B' ? '(B)' : '(A e B)'}{vWithCodigos.codigos && vWithCodigos.codigos.length > 0 ? ` - Códigos: ${vWithCodigos.codigos.join(', ')}` : ''}</span>
                      <button type="button" onClick={() => removeValvula(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <input type="text" placeholder="Nome da válvula" value={novaValvula.nome} onChange={(e) => setNovaValvula({ ...novaValvula, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Quantidade" value={novaValvula.quantidade} onChange={(e) => setNovaValvula({ ...novaValvula, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <select value={novaValvula.tipo} onChange={(e) => setNovaValvula({ ...novaValvula, tipo: e.target.value as any })} className="px-3 py-2 border rounded-lg">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">A e B</option>
                  </select>
                  <input type="text" placeholder="Códigos (ex: Z, N)" value={novaValvula.codigos} onChange={(e) => setNovaValvula({ ...novaValvula, codigos: e.target.value })} className="px-3 py-2 border rounded-lg" title="Separe múltiplos códigos por vírgula" />
                  <button type="button" onClick={addValvula} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              {/* Fitas */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Fitas</h3>
                <div className="space-y-2 mb-3">
                  {formData.fitas.map((f, i) => {
                    const fWithCodigos = f as { nome: string; quantidade: number; codigos?: string[] };
                    return (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{f.quantidade}x {f.nome}{fWithCodigos.codigos && fWithCodigos.codigos.length > 0 ? ` (Códigos: ${fWithCodigos.codigos.join(', ')})` : ''}</span>
                      <button type="button" onClick={() => removeFita(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" placeholder="Nome da fita" value={novaFita.nome} onChange={(e) => setNovaFita({ ...novaFita, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Quantidade" value={novaFita.quantidade} onChange={(e) => setNovaFita({ ...novaFita, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Códigos (ex: Z, N)" value={novaFita.codigos} onChange={(e) => setNovaFita({ ...novaFita, codigos: e.target.value })} className="px-3 py-2 border rounded-lg" title="Separe múltiplos códigos por vírgula" />
                  <button type="button" onClick={addFita} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              {/* Guianas */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Guianas e Borrachas</h3>
                <div className="space-y-2 mb-3">
                  {formData.guianas.map((g, i) => {
                    const gWithCodigos = g as { nome: string; quantidade: number; codigos?: string[] };
                    return (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{g.quantidade}x {g.nome}{gWithCodigos.codigos && gWithCodigos.codigos.length > 0 ? ` (Códigos: ${gWithCodigos.codigos.join(', ')})` : ''}</span>
                      <button type="button" onClick={() => removeGuiana(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" placeholder="Nome da guiana" value={novaGuiana.nome} onChange={(e) => setNovaGuiana({ ...novaGuiana, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Quantidade" value={novaGuiana.quantidade} onChange={(e) => setNovaGuiana({ ...novaGuiana, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Códigos (ex: Z, N)" value={novaGuiana.codigos} onChange={(e) => setNovaGuiana({ ...novaGuiana, codigos: e.target.value })} className="px-3 py-2 border rounded-lg" title="Separe múltiplos códigos por vírgula" />
                  <button type="button" onClick={addGuiana} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              {/* Anéis */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Anéis</h3>
                <div className="space-y-2 mb-3">
                  {formData.aneis.map((a, i) => {
                    const aWithCodigos = a as { nome: string; quantidade: number; codigos?: string[] };
                    return (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{a.quantidade}x {a.nome}{aWithCodigos.codigos && aWithCodigos.codigos.length > 0 ? ` (Códigos: ${aWithCodigos.codigos.join(', ')})` : ''}</span>
                      <button type="button" onClick={() => removeAnei(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" placeholder="Nome do anel" value={novoAnei.nome} onChange={(e) => setNovoAnei({ ...novoAnei, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Quantidade" value={novoAnei.quantidade} onChange={(e) => setNovoAnei({ ...novoAnei, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Códigos (ex: Z, N)" value={novoAnei.codigos} onChange={(e) => setNovoAnei({ ...novoAnei, codigos: e.target.value })} className="px-3 py-2 border rounded-lg" title="Separe múltiplos códigos por vírgula" />
                  <button type="button" onClick={addAnei} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              {/* Filtros */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Filtros</h3>
                <div className="space-y-2 mb-3">
                  {formData.filtros.map((f, i) => {
                    const fWithCodigos = f as { nome: string; quantidade: number; codigos?: string[] };
                    return (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{f.quantidade}x {f.nome}{fWithCodigos.codigos && fWithCodigos.codigos.length > 0 ? ` (Códigos: ${fWithCodigos.codigos.join(', ')})` : ''}</span>
                      <button type="button" onClick={() => removeFiltro(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input type="text" placeholder="Nome do filtro" value={novoFiltro.nome} onChange={(e) => setNovoFiltro({ ...novoFiltro, nome: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Quantidade" value={novoFiltro.quantidade} onChange={(e) => setNovoFiltro({ ...novoFiltro, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Códigos (ex: Z, N)" value={novoFiltro.codigos} onChange={(e) => setNovoFiltro({ ...novoFiltro, codigos: e.target.value })} className="px-3 py-2 border rounded-lg" title="Separe múltiplos códigos por vírgula" />
                  <button type="button" onClick={addFiltro} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Recalques</label>
                <input type="number" value={formData.recalques} onChange={(e) => setFormData({ ...formData, recalques: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Presilhas</h3>
                <div className="space-y-2 mb-3">
                  {formData.presilhas.map((p, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{p.quantidade}x {p.tipo} {p.descricao && `- ${p.descricao}`}</span>
                      <button type="button" onClick={() => removePresilha(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={novaPresilha.tipo} onChange={(e) => setNovaPresilha({ ...novaPresilha, tipo: e.target.value as any })} className="px-3 py-2 border rounded-lg">
                    <option value="plastico">Plástico</option>
                    <option value="metal">Metal</option>
                  </select>
                  <input type="number" placeholder="Quantidade" value={novaPresilha.quantidade} onChange={(e) => setNovaPresilha({ ...novaPresilha, quantidade: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <div className="flex">
                    <input type="text" placeholder="Descrição" value={novaPresilha.descricao} onChange={(e) => setNovaPresilha({ ...novaPresilha, descricao: e.target.value })} className="flex-1 px-3 py-2 border rounded-l-lg" />
                    <button type="button" onClick={addPresilha} className="px-3 bg-primary-600 text-white rounded-r-lg"><PlusCircle className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Marcações</h3>
                <div className="space-y-2 mb-3">
                  {formData.marcacoes.map((m, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{m.tipo}: {m.descricao} {m.localizacao && `(${m.localizacao})`}</span>
                      <button type="button" onClick={() => removeMarcacao(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={novaMarcacao.tipo} onChange={(e) => setNovaMarcacao({ ...novaMarcacao, tipo: e.target.value as any })} className="px-3 py-2 border rounded-lg">
                    <option value="pincel">Pincel</option>
                    <option value="tinta">Tinta</option>
                    <option value="outro">Outro</option>
                  </select>
                  <input type="text" placeholder="Descrição" value={novaMarcacao.descricao} onChange={(e) => setNovaMarcacao({ ...novaMarcacao, descricao: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <div className="flex">
                    <input type="text" placeholder="Localização" value={novaMarcacao.localizacao} onChange={(e) => setNovaMarcacao({ ...novaMarcacao, localizacao: e.target.value })} className="flex-1 px-3 py-2 border rounded-l-lg" />
                    <button type="button" onClick={addMarcacao} className="px-3 bg-primary-600 text-white rounded-r-lg"><PlusCircle className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Cores</h3>
                <div className="space-y-2 mb-3">
                  {formData.cores.map((c, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <span>{c.componente}: {c.cor}</span>
                      <button type="button" onClick={() => removeCor(i)} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Componente" value={novaCor.componente} onChange={(e) => setNovaCor({ ...novaCor, componente: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="text" placeholder="Cor" value={novaCor.cor} onChange={(e) => setNovaCor({ ...novaCor, cor: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <button type="button" onClick={addCor} className="px-3 bg-primary-600 text-white rounded-lg"><PlusCircle className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingComponente ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização Detalhada */}
      {viewingComponente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Componente</h2>
              <div className="flex items-center space-x-2">
                {podeCriarEditar && (
                  <button
                    onClick={() => {
                      handleEdit(viewingComponente);
                      setViewingComponente(null);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => setViewingComponente(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código do Produto Final *</label>
                <input
                  type="text"
                  value={viewingComponente.codigo}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Código final do produto que será construído</p>
              </div>

              {/* Tubos */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Tubos</h3>
                <div className="space-y-2">
                  {viewingComponente.tubos && viewingComponente.tubos.length > 0 ? (
                    viewingComponente.tubos.map((t, i) => {
                      const tWithCodigos = t as { nome: string; quantidade: number; codigos?: string[] };
                      return (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span>{t.quantidade}x {t.nome}{tWithCodigos.codigos && tWithCodigos.codigos.length > 0 ? ` (Códigos: ${tWithCodigos.codigos.join(', ')})` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum tubo cadastrado</p>
                  )}
                </div>
              </div>

              {/* Conectores */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Conectores</h3>
                <div className="space-y-2">
                  {viewingComponente.conectores && viewingComponente.conectores.length > 0 ? (
                    viewingComponente.conectores.map((c, i) => {
                      const cWithCodigos = c as { nome: string; quantidade: number; codigos?: string[] };
                      return (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span>{c.quantidade}x {c.nome}{cWithCodigos.codigos && cWithCodigos.codigos.length > 0 ? ` (Códigos: ${cWithCodigos.codigos.join(', ')})` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum conector cadastrado</p>
                  )}
                </div>
              </div>

              {/* Válvulas */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Válvulas</h3>
                <div className="space-y-2">
                  {viewingComponente.valvulas && viewingComponente.valvulas.length > 0 ? (
                    viewingComponente.valvulas.map((v, i) => {
                      const vWithCodigos = v as { nome: string; quantidade: number; tipo?: 'A' | 'B' | 'AB'; codigos?: string[] };
                      return (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span>{v.quantidade}x {v.nome} {v.tipo === 'A' ? '(A)' : v.tipo === 'B' ? '(B)' : '(A e B)'}{vWithCodigos.codigos && vWithCodigos.codigos.length > 0 ? ` - Códigos: ${vWithCodigos.codigos.join(', ')}` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma válvula cadastrada</p>
                  )}
                </div>
              </div>

              {/* Fitas */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Fitas</h3>
                <div className="space-y-2">
                  {viewingComponente.fitas && viewingComponente.fitas.length > 0 ? (
                    viewingComponente.fitas.map((f, i) => {
                      const fWithCodigos = f as { nome: string; quantidade: number; codigos?: string[] };
                      return (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span>{f.quantidade}x {f.nome}{fWithCodigos.codigos && fWithCodigos.codigos.length > 0 ? ` (Códigos: ${fWithCodigos.codigos.join(', ')})` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma fita cadastrada</p>
                  )}
                </div>
              </div>

              {/* Guianas */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Guianas e Borrachas</h3>
                <div className="space-y-2">
                  {viewingComponente.guianas && viewingComponente.guianas.length > 0 ? (
                    viewingComponente.guianas.map((g, i) => {
                      const gWithCodigos = g as { nome: string; quantidade: number; codigos?: string[] };
                      return (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span>{g.quantidade}x {g.nome}{gWithCodigos.codigos && gWithCodigos.codigos.length > 0 ? ` (Códigos: ${gWithCodigos.codigos.join(', ')})` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma guiana cadastrada</p>
                  )}
                </div>
              </div>

              {/* Anéis */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Anéis</h3>
                <div className="space-y-2">
                  {viewingComponente.aneis && viewingComponente.aneis.length > 0 ? (
                    viewingComponente.aneis.map((a, i) => {
                      const aWithCodigos = a as { nome: string; quantidade: number; codigos?: string[] };
                      return (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span>{a.quantidade}x {a.nome}{aWithCodigos.codigos && aWithCodigos.codigos.length > 0 ? ` (Códigos: ${aWithCodigos.codigos.join(', ')})` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum anel cadastrado</p>
                  )}
                </div>
              </div>

              {/* Filtros */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Filtros</h3>
                <div className="space-y-2">
                  {viewingComponente.filtros && viewingComponente.filtros.length > 0 ? (
                    viewingComponente.filtros.map((f, i) => {
                      const fWithCodigos = f as { nome: string; quantidade: number; codigos?: string[] };
                      return (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span>{f.quantidade}x {f.nome}{fWithCodigos.codigos && fWithCodigos.codigos.length > 0 ? ` (Códigos: ${fWithCodigos.codigos.join(', ')})` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum filtro cadastrado</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Recalques</label>
                <input
                  type="text"
                  value={viewingComponente.recalques || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Presilhas</h3>
                <div className="space-y-2">
                  {viewingComponente.presilhas && viewingComponente.presilhas.length > 0 ? (
                    viewingComponente.presilhas.map((p, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg">
                        <span>{p.quantidade}x {p.tipo} {p.descricao && `- ${p.descricao}`}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma presilha cadastrada</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Marcações</h3>
                <div className="space-y-2">
                  {viewingComponente.marcacoes && viewingComponente.marcacoes.length > 0 ? (
                    viewingComponente.marcacoes.map((m, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg">
                        <span>{m.tipo}: {m.descricao} {m.localizacao && `(${m.localizacao})`}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma marcação cadastrada</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Cores</h3>
                <div className="space-y-2">
                  {viewingComponente.cores && viewingComponente.cores.length > 0 ? (
                    viewingComponente.cores.map((c, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg">
                        <span>{c.componente}: {c.cor}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma cor cadastrada</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={viewingComponente.observacoes || ''}
                  readOnly
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setViewingComponente(null)}
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


import { useState, useEffect } from 'react';
import { Wrench, Zap, Hammer, AlertTriangle, Clock, Eye, X, Building2, Hash, User } from 'lucide-react';
import ChamadosManutencao from './ChamadosManutencao';
import { problemasStorage } from '../utils/storage';
import type { ProblemaTecnico } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getTurnoBadgeColor } from '../utils/turno';

export default function CentralMecanica() {
  const [tipoSelecionado, setTipoSelecionado] = useState<'mecanica' | 'eletrica' | 'ferramentaria'>('mecanica');
  const [problemasTecnicos, setProblemasTecnicos] = useState<ProblemaTecnico[]>([]);

  const tipos = [
    { tipo: 'mecanica' as const, titulo: 'Mecânica', icone: Wrench },
    { tipo: 'eletrica' as const, titulo: 'Elétrica', icone: Zap },
    { tipo: 'ferramentaria' as const, titulo: 'Ferramentaria', icone: Hammer },
  ];

  const tipoAtual = tipos.find(t => t.tipo === tipoSelecionado)!;

  useEffect(() => {
    loadProblemasTecnicos();
  }, []);

  const loadProblemasTecnicos = () => {
    const todosProblemas = problemasStorage.getAll();
    // Filtrar problemas mecânicos e elétricos que estão abertos ou em andamento
    const problemasAtivos = todosProblemas.filter(p => 
      (p.tipo === 'mecanico' || p.tipo === 'eletrico') &&
      (p.status === 'aberto' || p.status === 'em-andamento')
    );
    setProblemasTecnicos(problemasAtivos);
  };

  return (
    <div className="space-y-6">
      {/* Problemas Técnicos Relacionados */}
      {problemasTecnicos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Problemas Técnicos Pendentes</h2>
          </div>
          <div className="space-y-3">
            {problemasTecnicos.map((problema) => (
              <div key={problema.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        problema.tipo === 'mecanico' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {problema.tipo === 'mecanico' ? 'Mecânico' : 'Elétrico'}
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
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                      {problema.setor && (
                        <span className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1" />
                          {problema.setor}
                        </span>
                      )}
                      {problema.linha && (
                        <span className="flex items-center">
                          <Hash className="w-4 h-4 mr-1" />
                          Linha: {problema.linha}
                        </span>
                      )}
                      {problema.reportadoPor && (
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {problema.reportadoPor}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(new Date(problema.data), 'dd/MM/yyyy', { locale: ptBR })} às {problema.hora}
                      </span>
                      {problema.turno && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTurnoBadgeColor(problema.turno)}`}>
                          {problema.turno === '1' ? '1º Turno' :
                           problema.turno === '2' ? '2º Turno' :
                           problema.turno === '3' ? '3º Turno' :
                           'Central'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {/* Ver detalhes do problema */}}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Central de Mecânica</h2>
        <div className="flex space-x-4">
          {tipos.map(({ tipo, titulo, icone: Icone }) => (
            <button
              key={tipo}
              onClick={() => setTipoSelecionado(tipo)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                tipoSelecionado === tipo
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icone className="w-5 h-5" />
              <span>{titulo}</span>
            </button>
          ))}
        </div>
      </div>

      <ChamadosManutencao
        tipo={tipoAtual.tipo}
        titulo={tipoAtual.titulo}
        icone={tipoAtual.icone}
      />
    </div>
  );
}


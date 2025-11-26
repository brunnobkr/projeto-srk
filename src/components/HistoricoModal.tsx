import { useEffect, useState } from 'react';
import { X, History } from 'lucide-react';
import type { HistoricoVersao } from '../types';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface HistoricoModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  historico: HistoricoVersao<T>[];
  titulo: string;
}

export default function HistoricoModal<T extends { id: string }>({
  isOpen,
  onClose,
  historico,
  titulo,
}: HistoricoModalProps<T>) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Histórico de Alterações</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{titulo}</p>

        {historico.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma alteração registrada
          </div>
        ) : (
          <div className="space-y-4">
            {historico.map((versao, index) => (
              <div
                key={versao.id}
                className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-r-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        Versão {versao.versao}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Versão Atual
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Alterado por: <strong>{versao.alteradoPor}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      Data: {format(new Date(versao.dataAlteracao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    {versao.motivo && (
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>Motivo:</strong> {versao.motivo}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(versao.dados, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}


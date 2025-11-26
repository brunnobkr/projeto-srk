import { useState, useEffect } from 'react';
import { User, Camera, Save, X } from 'lucide-react';
import { perfilStorage, usuariosStorage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { PerfilUsuario } from '../types';

export default function MeuPerfil() {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefoneCorporativo: '',
    emailCorporativo: '',
    cargo: '',
    fotoPerfil: '',
    isAdmin: false,
  });
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  useEffect(() => {
    loadPerfil();
  }, []);

  useEffect(() => {
    // Sincronizar com dados do usuário logado
    if (usuario) {
      const perfilAtual = perfilStorage.get();
      if (!perfilAtual || perfilAtual.id !== usuario.id) {
        // Criar perfil a partir do usuário
        const novoPerfil: PerfilUsuario = {
          id: usuario.id,
          nome: usuario.nome,
          fotoPerfil: usuario.fotoPerfil,
          telefoneCorporativo: usuario.telefoneCorporativo,
          emailCorporativo: usuario.emailCorporativo || usuario.email,
          cargo: usuario.cargo,
          isAdmin: usuario.isAdmin,
          dataAtualizacao: new Date().toISOString(),
        };
        perfilStorage.set(novoPerfil);
        loadPerfil();
      } else {
        loadPerfil();
      }
    }
  }, [usuario]);

  const loadPerfil = () => {
    const perfilAtual = perfilStorage.get();
    if (perfilAtual) {
      setPerfil(perfilAtual);
      setFormData({
        nome: perfilAtual.nome || '',
        telefoneCorporativo: perfilAtual.telefoneCorporativo || '',
        emailCorporativo: perfilAtual.emailCorporativo || '',
        cargo: perfilAtual.cargo || '',
        fotoPerfil: perfilAtual.fotoPerfil || '',
        isAdmin: perfilAtual.isAdmin || false,
      });
      setPreviewFoto(perfilAtual.fotoPerfil || null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, fotoPerfil: base64String });
        setPreviewFoto(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, selecione uma imagem válida.');
    }
  };

  const removeFoto = () => {
    setFormData({ ...formData, fotoPerfil: '' });
    setPreviewFoto(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      alert('Por favor, preencha o nome.');
      return;
    }

    const perfilAtualizado: PerfilUsuario = {
      id: usuario?.id || perfil?.id || 'perfil_usuario',
      nome: formData.nome,
      fotoPerfil: formData.fotoPerfil || undefined,
      telefoneCorporativo: formData.telefoneCorporativo || undefined,
      emailCorporativo: formData.emailCorporativo || undefined,
      cargo: formData.cargo || undefined,
      isAdmin: formData.isAdmin,
      dataAtualizacao: new Date().toISOString(),
    };

    perfilStorage.set(perfilAtualizado);
    
    // Sincronizar com usuário se existir
    if (usuario) {
      usuariosStorage.update(usuario.id, {
        nome: formData.nome,
        fotoPerfil: formData.fotoPerfil || undefined,
        telefoneCorporativo: formData.telefoneCorporativo || undefined,
        emailCorporativo: formData.emailCorporativo || undefined,
        cargo: formData.cargo || undefined,
        isAdmin: formData.isAdmin,
      });
    }
    
    setPerfil(perfilAtualizado);
    alert('Perfil atualizado com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-2 text-gray-600">
          Gerencie suas informações pessoais e de contato
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {previewFoto ? (
                <img
                  src={previewFoto}
                  alt="Foto de perfil"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              {previewFoto && (
                <button
                  type="button"
                  onClick={removeFoto}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  title="Remover foto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col items-center space-y-2">
              <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <Camera className="w-5 h-5" />
                <span>{previewFoto ? 'Alterar Foto' : 'Adicionar Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500">JPG, PNG ou GIF (máx. 5MB)</p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Seu nome completo"
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo
            </label>
            <input
              type="text"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Engenheiro, Preparador, Operador"
            />
          </div>

          {/* Telefone Corporativo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone Corporativo
            </label>
            <input
              type="tel"
              value={formData.telefoneCorporativo}
              onChange={(e) => setFormData({ ...formData, telefoneCorporativo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(31) 99999-9999"
            />
          </div>

          {/* Email Corporativo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Corporativo
            </label>
            <input
              type="email"
              value={formData.emailCorporativo}
              onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="seu.email@sumitomo.com.br"
            />
          </div>

          {/* Acesso Administrativo */}
          <div className="border-t pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Acesso Administrativo</span>
                <p className="text-xs text-gray-500 mt-1">
                  Permite acesso ao Dashboard Administrativo com controle detalhado
                </p>
              </div>
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={loadPerfil}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


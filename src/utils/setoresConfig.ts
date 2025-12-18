import { setoresStorage } from './storage';
import type { Setor, Linha } from '../types';

/**
 * Garante que a estrutura de setores/linhas esteja atualizada
 * para o novo modelo:
 *
 * - 110 Extrusora
 * - 120 OGI
 * - 130 pre-reformatura
 * - 130 - Pintura
 * - 140-montagem (integra Tecalon, Fiat, Jeep, Japonesa e Caminhões)
 * - 180-canister
 *
 * Pode ser chamado em qualquer tela antes de carregar setores.
 * É idempotente (não duplica dados se chamado várias vezes).
 */
export const ensureSetoresPadraoAtualizados = (criadoPor?: string) => {
  const autor = criadoPor || 'Sistema';
  let setores = setoresStorage.getAll();

  // Se não existir nenhum setor, criar direto na estrutura nova
  if (setores.length === 0) {
    criarEstruturaNovaPadrao(autor);
    return;
  }

  // Se já existir o novo setor 140-montagem, assumimos que já está migrado
  const jaMigrado = setores.some((s) =>
    s.nome.toLowerCase().includes('140') && s.nome.toLowerCase().includes('montagem'),
  );

  if (!jaMigrado) {
    migrarSetoresAntigosParaNovoModelo(setores, autor);
  } else {
    // Mesmo já migrado, garantir renomes de setores especiais e criação da Extrusora
    aplicarRenomesEspeciaisESetorExtrusora(setores, autor);
  }
};

const criarEstruturaNovaPadrao = (criadoPor: string) => {
  const agora = new Date().toISOString();

  const criarLinha = (id: string, nome: string, setorId: string, descricao?: string): Linha => ({
    id,
    nome,
    setorId,
    ativo: true,
    descricao,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  });

  // 140-montagem: integra Tecalon, Fiat, Jeep, Japonesa e Caminhões
  const linhasMontagem: Linha[] = [];

  // Tecalon (52–68)
  for (let i = 52; i <= 68; i++) {
    linhasMontagem.push(
      criarLinha(`montagem_tecalon_${i}`, i.toString(), 'setor_140_montagem', 'Tecalon'),
    );
  }

  // Fiat (01–20 e CO)
  for (let i = 1; i <= 20; i++) {
    const nomeLinha = i.toString().padStart(2, '0');
    linhasMontagem.push(
      criarLinha(`montagem_fiat_${nomeLinha}`, nomeLinha, 'setor_140_montagem', 'Fiat'),
    );
  }
  linhasMontagem.push(
    criarLinha('montagem_fiat_CO', 'CO', 'setor_140_montagem', 'Fiat'),
  );

  // Jeep (30, 31, 32, 35, 70, 71, 73)
  [30, 31, 32, 35, 70, 71, 73].forEach((num) => {
    linhasMontagem.push(
      criarLinha(`montagem_jeep_${num}`, num.toString(), 'setor_140_montagem', 'Jeep'),
    );
  });

  // Japonesa (90–94)
  for (let i = 90; i <= 94; i++) {
    linhasMontagem.push(
      criarLinha(`montagem_japonesa_${i}`, i.toString(), 'setor_140_montagem', 'Japonesa'),
    );
  }

  // Caminhões (C1–C6, CL, CI, CG, CH, CK, CJ)
  for (let i = 1; i <= 6; i++) {
    const nome = `C${i}`;
    linhasMontagem.push(
      criarLinha(`montagem_caminhoes_${nome.toLowerCase()}`, nome, 'setor_140_montagem', 'Caminhões'),
    );
  }
  ['CL', 'CI', 'CG', 'CH', 'CK', 'CJ'].forEach((cod) => {
    linhasMontagem.push(
      criarLinha(
        `montagem_caminhoes_${cod.toLowerCase()}`,
        cod,
        'setor_140_montagem',
        'Caminhões',
      ),
    );
  });

  const setorMontagem: Setor = {
    id: 'setor_140_montagem',
    nome: '140-montagem',
    descricao: 'Setor de montagem (Fiat, Japonesa, Tecalon, Caminhões e Jeep)',
    linhas: linhasMontagem,
    ativo: true,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  };

  // 110 Extrusora (sem linhas pré-definidas)
  const setorExtrusora: Setor = {
    id: 'setor_extrusora',
    nome: '110 Extrusora',
    descricao: 'Setor 110 Extrusora',
    linhas: [],
    ativo: true,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  };

  // 120 OGI (antigo OGIS – linhas 1,2,3,5,6,7,8,9,10)
  const linhasOGI: Linha[] = [1, 2, 3, 5, 6, 7, 8, 9, 10].map((num) =>
    criarLinha(`ogi_${num}`, num.toString(), 'setor_ogis'),
  );

  const setorOGI: Setor = {
    id: 'setor_ogis',
    nome: '120 OGI',
    descricao: 'Setor 120 OGI',
    linhas: linhasOGI,
    ativo: true,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  };

  // 180-canister (máquinas 1–20)
  const linhasCanister: Linha[] = [];
  for (let i = 1; i <= 20; i++) {
    linhasCanister.push(
      criarLinha(
        `canister_${i}`,
        i.toString(),
        'setor_canister',
        `Máquina ${i}`,
      ),
    );
  }

  const setorCanister: Setor = {
    id: 'setor_canister',
    nome: '180-canister',
    descricao: 'Setor 180-canister',
    linhas: linhasCanister,
    ativo: true,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  };

  // 130 pre-reformatura (M1–M18)
  const linhasPreReform: Linha[] = [];
  for (let i = 1; i <= 18; i++) {
    const nome = `M${i}`;
    linhasPreReform.push(
      criarLinha(`prereform_${nome.toLowerCase()}`, nome, 'setor_prereform'),
    );
  }

  const setorPreReform: Setor = {
    id: 'setor_prereform',
    nome: '130 pre-reformatura',
    descricao: 'Setor 130 pre-reformatura',
    linhas: linhasPreReform,
    ativo: true,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  };

  // 130 - Pintura (M1–M6)
  const linhasPintura: Linha[] = [];
  for (let i = 1; i <= 6; i++) {
    const nome = `M${i}`;
    linhasPintura.push(
      criarLinha(
        `pintura_${nome.toLowerCase()}`,
        nome,
        'setor_pinturaprereform',
      ),
    );
  }

  const setorPintura: Setor = {
    id: 'setor_pinturaprereform',
    nome: '130 - Pintura',
    descricao: 'Setor 130 - Pintura',
    linhas: linhasPintura,
    ativo: true,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  };

  [
    setorMontagem,
    setorExtrusora,
    setorOGI,
    setorPreReform,
    setorPintura,
    setorCanister,
  ].forEach((setor) => setoresStorage.add(setor));
};

const migrarSetoresAntigosParaNovoModelo = (setores: Setor[], criadoPor: string) => {
  const agora = new Date().toISOString();

  aplicarRenomesEspeciaisESetorExtrusora(setores, criadoPor);

  // Recarregar após renomes/criação da Extrusora
  setores = setoresStorage.getAll();

  const lower = (s: string) => s.toLowerCase();

  // Se já existir 140-montagem após renomes, não recriar
  const existeMontagem = setores.some(
    (s) => lower(s.nome).includes('140') && lower(s.nome).includes('montagem'),
  );
  if (existeMontagem) return;

  const nomesMontagemOrigem = ['tecalon', 'fiat', 'jeep', 'japonesa', 'caminhões', 'caminhoes'];
  const setoresOrigem = setores.filter((s) =>
    nomesMontagemOrigem.includes(lower(s.nome)),
  );

  if (setoresOrigem.length === 0) {
    // Nada para migrar – apenas cria o setor vazio
    const setorMontagemVazio: Setor = {
      id: 'setor_140_montagem',
      nome: '140-montagem',
      descricao: 'Setor de montagem',
      linhas: [],
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };
    setoresStorage.add(setorMontagemVazio);
    return;
  }

  const setorMontagem: Setor = {
    id: 'setor_140_montagem',
    nome: '140-montagem',
    descricao:
      'Setor de montagem (integra Tecalon, Fiat, Jeep, Japonesa e Caminhões)',
    linhas: [],
    ativo: true,
    dataCriacao: agora,
    dataAtualizacao: agora,
    criadoPor,
  };

  setoresStorage.add(setorMontagem);

  // Copiar linhas dos setores antigos para o novo 140-montagem
  setoresOrigem.forEach((setorOrigem) => {
    (setorOrigem.linhas || []).forEach((linhaOrigem) => {
      const novaLinha: Linha = {
        ...linhaOrigem,
        id: `140_${setorOrigem.id}_${linhaOrigem.id}`,
        setorId: 'setor_140_montagem',
        dataAtualizacao: agora,
        criadoPor: linhaOrigem.criadoPor || criadoPor,
      };
      setoresStorage.addLinha('setor_140_montagem', novaLinha);
    });

    // Desativar setor antigo para ele não aparecer mais nas telas
    if (setorOrigem.ativo) {
      setoresStorage.update(setorOrigem.id, {
        ativo: false,
        dataAtualizacao: agora,
      });
    }
  });
};

const aplicarRenomesEspeciaisESetorExtrusora = (setores: Setor[], criadoPor: string) => {
  const agora = new Date().toISOString();
  const lower = (s: string) => s.toLowerCase();

  const renomearSeNecessario = (
    predicate: (s: Setor) => boolean,
    novoNome: string,
    novaDescricao: string,
  ) => {
    const setor = setores.find(predicate);
    if (setor && (setor.nome !== novoNome || setor.descricao !== novaDescricao)) {
      setoresStorage.update(setor.id, {
        nome: novoNome,
        descricao: novaDescricao,
        dataAtualizacao: agora,
      });
    }
  };

  // 120 OGI (antigo OGIS)
  renomearSeNecessario(
    (s) => s.id === 'setor_ogis' || lower(s.nome) === 'ogis',
    '120 OGI',
    'Setor 120 OGI',
  );

  // 180-canister (antigo Canister)
  renomearSeNecessario(
    (s) => s.id === 'setor_canister' || lower(s.nome) === 'canister',
    '180-canister',
    'Setor 180-canister',
  );

  // 130 pre-reformatura
  renomearSeNecessario(
    (s) =>
      s.id === 'setor_prereform' ||
      lower(s.nome).includes('pré reformatura') ||
      lower(s.nome).includes('pre reformatura'),
    '130 pre-reformatura',
    'Setor 130 pre-reformatura',
  );

  // 130 - Pintura (antiga Pintura Pré Reformatura)
  renomearSeNecessario(
    (s) =>
      s.id === 'setor_pinturaprereform' ||
      lower(s.nome).includes('pintura pré reformatura') ||
      lower(s.nome).includes('pintura pre reformatura'),
    '130 - Pintura',
    'Setor 130 - Pintura',
  );

  // Garantir existência do setor 110 Extrusora
  setores = setoresStorage.getAll();
  const existeExtrusora = setores.some(
    (s) => s.id === 'setor_extrusora' || lower(s.nome).includes('extrusora'),
  );

  if (!existeExtrusora) {
    const setorExtrusora: Setor = {
      id: 'setor_extrusora',
      nome: '110 Extrusora',
      descricao: 'Setor 110 Extrusora',
      linhas: [],
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
      criadoPor,
    };
    setoresStorage.add(setorExtrusora);
  }
}



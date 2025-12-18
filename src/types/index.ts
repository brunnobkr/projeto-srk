// Tipos principais do sistema

export interface PerfilUsuario {
  id: string;
  nome: string;
  fotoPerfil?: string; // base64
  telefoneCorporativo?: string;
  emailCorporativo?: string;
  cargo?: string;
  isAdmin?: boolean; // Se o usuário tem acesso ao dashboard admin
  dataAtualizacao: string;
}

export interface Usuario {
  id: string;
  username: string; // Nome de usuário para login
  senha: string; // Hash da senha (em produção, usar hash real)
  nome: string;
  email: string;
  cargo: string;
  setor?: string;
  matricula?: string;
  fotoPerfil?: string; // base64
  telefoneCorporativo?: string;
  emailCorporativo?: string;
  isAdmin: boolean;
  isAtivo: boolean;
  permissoes: Permissoes;
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor?: string;
  statusAprovacao?: 'pendente' | 'aprovado' | 'rejeitado'; // Status de aprovação pelo admin
  motivoRejeicao?: string; // Motivo da rejeição se aplicável
  aprovadoPor?: string; // Quem aprovou o cadastro
  dataAprovacao?: string; // Data da aprovação
}

// Mapeamento de funções para permissões automáticas
export interface MapeamentoFuncao {
  id: string;
  funcao: string; // preparador, engenharia, logistica, lider, coordenador, gerencia
  permissoes: Permissoes;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor: string;
}

export interface PermissoesModulo {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

export interface Permissoes {
  // Módulos principais com permissões granulares
  receitasMaquina: PermissoesModulo;
  controleProducao: PermissoesModulo;
  controleFuncionarios: PermissoesModulo;
  problemasTecnicos: PermissoesModulo;
  mudancasMelhorias: PermissoesModulo;
  instrucoesTrabalho: PermissoesModulo;
  componentesProduto: PermissoesModulo;
  segurancaTrabalho: PermissoesModulo;
  dashboardAdmin: boolean; // Acesso ao dashboard admin
  gerenciarUsuarios: boolean; // Gerenciar usuários
  programarPedidos: boolean; // Logística pode programar pedidos
  atualizarProducaoHora: boolean; // Permissão para atualizar produção hora a hora (preparadores ou autorizados pelo admin)
  
  // Compatibilidade com versão antiga (deprecated - manter por enquanto)
  criar?: boolean;
  editar?: boolean;
  excluir?: boolean;
  visualizar?: boolean;
}

export interface ProgramacaoPedido {
  id: string;
  codigoProduto: string;
  setor: string;
  linha: string;
  quantidadeProgramada: number;
  dataProgramacao: string;
  turno?: '1' | '2' | '3'; // Turno da programação (apenas 1, 2 ou 3, excluindo central)
  atencao?: string; // Observações/atenções
  importadoDe?: 'excel' | 'email' | 'manual' | 'ia';
  arquivoOrigem?: string; // Nome do arquivo Excel ou assunto do email
  anexosPDF?: AnexoPDF[];
  criadoPor: string;
  dataCriacao: string;
  estadoPedido?: 'critico' | 'alerta' | 'normal'; // Estado do pedido identificado pela IA
  revisado?: boolean; // Se foi revisado pelo usuário
  dadosExtraidosIA?: DadosExtraidosIA; // Dados extraídos pela IA antes da revisão
}

export interface DadosExtraidosIA {
  codigoProduto?: string;
  quantidade?: number;
  setor?: string;
  linha?: string;
  turno?: '1' | '2' | '3'; // Turno extraído pela IA
  estadoPedido?: 'critico' | 'alerta' | 'normal';
  confianca?: number; // Nível de confiança da extração (0-100)
  observacoes?: string;
}

export interface Linha {
  id: string;
  nome: string; // Ex: "52", "C1", "M1", "1"
  descricao?: string;
  setorId: string; // ID do setor ao qual pertence
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor: string;
}

export interface Setor {
  id: string;
  nome: string; // Ex: "Tecalon", "Fiat", "Jeep", "Japonesa", "Caminhões", "OGIS", "Canister", "Pré Reformatura", "Pintura Pré Reformatura"
  descricao?: string;
  linhas: Linha[]; // Linhas pertencentes a este setor
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor: string;
}

export interface Acidente {
  id: string;
  numeroChamado?: string; // Código único do chamado (ex: ACID-0001)
  data: string;
  hora: string;
  funcionarioId: string;
  funcionario?: Funcionario;
  setor: string;
  tipo: 'leve' | 'moderado' | 'grave';
  descricao: string;
  localizacao: string;
  causas?: string;
  medidasPreventivas?: string;
  fotos?: string[]; // Fotos do acidente (armazenadas em base64)
  anexosPDF?: AnexoPDF[]; // PDFs relacionados ao acidente
  dataRegistro: string;
  registradoPor: string;
}

export interface ReceitaMaquina {
  id: string;
  codigoTubo: string;
  setor?: string;
  linha?: string;
  angulacao: number;
  velocidade: number;
  distancia: number;
  conectores: string[];
  vazaoLado1: number;
  vazaoLado2: number;
  // Novos campos de inserção
  anguloInsercaoLadoA?: number;
  anguloInsercaoLadoB?: number;
  velocidadeLadoA?: number;
  velocidadeLadoB?: number;
  velocidadeMaquinaLadoA?: number;
  velocidadeMaquinaLadoB?: number;
  limiteInsercaoLadoA?: number;
  limiteInsercaoLadoB?: number;
  // Mão de obra e tempo
  maoObraNecessaria?: number;
  tempoMontagem?: number; // em minutos
  // Informações do responsável
  nomeResponsavel: string;
  matriculaResponsavel: string;
  // Fotos (armazenadas em base64)
  fotos?: string[];
  fotosLadoA?: string[];
  fotosLadoB?: string[];
  anexosPDF?: AnexoPDF[];
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor: string;
}

export interface AtualizacaoHora {
  id: string;
  hora: string; // Hora da atualização (ex: "08:00", "09:00")
  quantidadeRealizada: number; // Quantidade realizada nessa hora
  dataAtualizacao: string; // Data/hora completa da atualização
  atualizadoPor: string; // Nome do preparador que atualizou
}

export interface CodigoAtivoLinha {
  id: string; // ID do controle de produção ou programação
  codigoProduto: string;
  quantidadePedida: number;
  quantidadeRealizada: number;
  eficiencia?: number;
  atualizacoesHora?: AtualizacaoHora[];
  dataInicio: string; // Quando começou a rodar este código
  status: 'rodando' | 'pausado' | 'finalizado';
  pausaAlmoco?: {
    inicio: string; // Hora de início da pausa
    fim?: string; // Hora de fim da pausa (se já retornou)
    duracaoMinutos?: number; // Duração da pausa em minutos
  };
}

export interface ControleProducao {
  id: string;
  codigoTubo: string;
  setor?: string;
  linha?: string;
  data: string;
  hora: string;
  turno?: '1' | '2' | '3' | 'central'; // Turno do registro
  quantidade30min: number;
  quantidadeHora: number;
  tempoMontagem: number; // em minutos (preenchido automaticamente da receita)
  maoObra: number; // (preenchido automaticamente da receita)
  maoObraPorLinha: number; // Mão de obra necessária por linha (substitui pessoasPorMaquina)
  processo: string;
  // Novos campos
  quantidadeTotalLogistica?: number; // Quantidade pedida pela logística
  quantidadeFinalRealizada?: number; // Quantidade final realizada (soma de todas as horas)
  atualizacoesHora?: AtualizacaoHora[]; // Histórico de atualizações por hora
  eficiencia?: number; // Eficiência calculada (quantidadeFinalRealizada / quantidadeTotalLogistica * 100)
  preparador?: string;
  atualizacaoHora?: boolean;
  observacoes?: string;
  justificativaFaltaFuncionario?: string; // Justificativa para não realização do programado por falta de funcionário
}

export interface Funcionario {
  id: string;
  nome: string;
  matricula: string;
  setor: string;
  cargo: string;
}

export interface ControleFuncionarios {
  id: string;
  funcionarioId: string;
  funcionario?: Funcionario;
  data: string; // Data do registro (dia/mês/ano)
  horaRegistro: string; // horário que foi feito o registro
  turno: '1' | '2' | '3' | 'central'; // Turno do registro
  tipo: 'falta' | 'ausente' | 'tempo-ocioso' | 'transferencia' | 'chegada-atrasado' | 'presente' | 'saida-cedo' | 'chegada-tarde' | 'atestado' | 'afastado';
  inicio?: string;
  fim?: string;
  horaChegada?: string; // horário que o funcionário chegou (para chegada atrasada)
  horaSaida?: string; // horário que o funcionário saiu (para saída mais cedo)
  tempoOcioso?: number; // em minutos
  tempoAtraso?: number; // em minutos - tempo de atraso na chegada
  tempoAntecipacao?: number; // em minutos - tempo de antecipação na saída
  setorOrigem?: string;
  setorDestino?: string;
  // Campos específicos para atestado
  tipoAtestado?: 'medico' | 'odontologico' | 'psicologico' | 'outro';
  dataInicioAtestado?: string;
  dataFimAtestado?: string;
  diasAtestado?: number;
  // Campos específicos para afastado
  motivoAfastamento?: string;
  dataInicioAfastamento?: string;
  dataFimAfastamento?: string;
  observacoes?: string;
}

export interface ProblemaTecnico {
  id: string;
  numeroChamado?: string; // ID único do chamado (ex: CHAM-001, CHAM-002)
  tipo: 'mecanico' | 'eletrico' | 'sistema' | 'ferramentaria';
  maquina: string;
  descricao: string;
  data: string; // Data do registro (dia/mês/ano)
  hora: string;
  turno: '1' | '2' | '3' | 'central'; // Turno do registro
  status: 'aberto' | 'em-andamento' | 'resolvido';
  reportadoPor?: string; // Quem reportou o problema
  setor: string; // Setor onde ocorreu o problema (obrigatório)
  linha: string; // Linha onde ocorreu o problema (obrigatório)
  causa?: string; // Causa do problema
  resolvidoPor?: string; // Nome de quem resolveu
  matriculaResolvidoPor?: string; // Matrícula de quem resolveu
  dataResolucao?: string;
  tempoResolucao?: number; // em minutos
  observacoes?: string;
  problemaAnteriorId?: string; // ID do problema anterior se for reincidência
  engenhariaChamada?: boolean; // Se a engenharia foi chamada
  dataChamadaEngenharia?: string; // Data/hora que a engenharia foi chamada
  chamadoPor?: string; // Quem chamou a engenharia
  anexosPDF?: AnexoPDF[];
}

export interface MudancaMelhoria {
  id: string;
  tipo: 'atualizacao' | 'ajuste-receita' | 'correcao-problema';
  titulo: string;
  descricao: string;
  data: string; // Data do registro (dia/mês/ano)
  hora: string;
  turno: '1' | '2' | '3' | 'central'; // Turno do registro
  interrompeuProducao: boolean;
  engenheiro: string;
  status: 'planejado' | 'em-execucao' | 'concluido';
  dataConclusao?: string;
  observacoes?: string;
  anexosPDF?: AnexoPDF[];
}

export interface AnexoPDF {
  nome: string;
  conteudo: string; // base64
  dataUpload: string;
  tamanho?: number; // em bytes
}

export interface InstrucaoTrabalho {
  id: string;
  codigoProduto: string;
  setor?: string;
  linha?: string;
  tipoInstrucao: 'insercao' | 'fechamento' | 'emergencia' | 'marcacao' | 'start' | 'botao' | 'outro';
  titulo: string;
  passos: PassoInstrucao[];
  preparador: boolean;
  funcionario: boolean;
  fotos?: string[]; // Fotos gerais da instrução (armazenadas em base64)
  anexosPDF?: AnexoPDF[];
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor: string;
  atualizadoPor?: string; // Quem atualizou a instrução
}

export interface PassoInstrucao {
  letra: string; // A, B, C, D, etc.
  descricao: string;
  tipo: 'insercao' | 'marcacao' | 'botao' | 'emergencia' | 'fechamento';
  detalhes?: string;
  fotos?: string[]; // Fotos do passo (armazenadas em base64)
  criadoPor?: string; // Quem criou o passo
  dataCriacao?: string; // Data de criação do passo
}

export interface ComponenteProduto {
  id: string;
  codigo: string;
  // Componentes com quantidade e códigos
  tubos: { nome: string; quantidade: number; codigos?: string[] }[];
  conectores: { nome: string; quantidade: number; codigos?: string[] }[];
  presilhas: Presilha[];
  fitas: { nome: string; quantidade: number; codigos?: string[] }[];
  guianas: { nome: string; quantidade: number; codigos?: string[] }[];
  aneis: { nome: string; quantidade: number; codigos?: string[] }[];
  marcacoes: Marcacao[];
  recalques: number;
  cores: CorComponente[];
  valvulas: { nome: string; quantidade: number; tipo?: 'A' | 'B' | 'AB'; codigos?: string[] }[];
  filtros: { nome: string; quantidade: number; codigos?: string[] }[];
  observacoes?: string;
  anexosPDF?: AnexoPDF[];
  // Quantidade programada para produção
  quantidadeProgramada?: number;
  // Status e notificações (Logística)
  status?: 'ok' | 'atencao' | 'critico'; // verde, amarelo, vermelho
  notificacao?: string; // Notificação do setor de logística
  dataStatus?: string; // Data da última atualização de status
  atualizadoPor?: string; // Quem atualizou o status
}

export interface Presilha {
  tipo: 'plastico' | 'metal';
  quantidade: number;
  descricao?: string;
}

export interface Marcacao {
  tipo: 'pincel' | 'tinta' | 'outro';
  descricao: string;
  localizacao?: string;
}

export interface CorComponente {
  componente: string;
  cor: string;
}

export interface SegurancaTrabalho {
  id: string;
  codigoProduto: string;
  titulo: string;
  passosMontagem: PassoSeguranca[];
  sequenciaBotoes: BotaoMaquina[];
  checkups: CheckupSeguranca[];
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor: string;
}

export interface PassoSeguranca {
  ordem: number;
  descricao: string;
  tipo: 'montagem' | 'verificacao' | 'obrigatorio';
}

export interface BotaoMaquina {
  ordem: number;
  nome: string;
  funcionalidade: string;
  obrigatorio: boolean;
}

export interface CheckupSeguranca {
  item: string;
  frequencia: string;
  responsavel: string;
  obrigatorio: boolean;
}

// Sistema de Histórico
export interface HistoricoVersao<T> {
  id: string;
  itemId: string;
  versao: number;
  dados: T;
  dataAlteracao: string;
  alteradoPor: string;
  motivo?: string;
}

export type TipoItem = 
  | 'receita' 
  | 'producao' 
  | 'funcionario' 
  | 'controle-funcionario' 
  | 'problema' 
  | 'mudanca' 
  | 'instrucao' 
  | 'componente' 
  | 'seguranca'
  | 'chamado'
  | 'mensagem'
  | 'conversa'
  | 'notificacao'
  | 'chamada';

// Chamados de Manutenção
export interface ChamadoManutencao {
  id: string;
  tipo: 'mecanica' | 'eletrica' | 'ferramentaria' | 'sistema'; // sistema = TI
  categoria: string; // Ex: "Máquina", "Sistema", "Ferramenta", etc.
  titulo: string;
  descricao: string;
  setor: string; // Setor que solicitou
  linha?: string; // Linha que solicitou
  maquina?: string; // Máquina/equipamento relacionado
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberto' | 'em-andamento' | 'aguardando-peca' | 'aguardando-aprovacao' | 'resolvido' | 'cancelado';
  solicitadoPor: string; // ID do usuário que solicitou
  solicitadoPorNome?: string; // Nome do usuário
  dataSolicitacao: string; // Data do registro (dia/mês/ano)
  horaSolicitacao: string;
  turno: '1' | '2' | '3' | 'central'; // Turno do registro
  atribuidoPara?: string; // ID do técnico/responsável
  atribuidoParaNome?: string; // Nome do técnico
  dataAtribuicao?: string;
  dataInicio?: string; // Quando começou a trabalhar
  dataResolucao?: string;
  tempoResolucao?: number; // em minutos
  solucao?: string; // Descrição da solução
  observacoes?: string;
  fotos?: string[]; // Fotos do problema (base64)
  pecasUtilizadas?: PecaUtilizada[];
  custoEstimado?: number;
  custoReal?: number;
  // Auditoria de exclusão/cancelamento
  excluido?: boolean;
  exclusaoAutorizadaPorNome?: string;
  exclusaoAutorizadaPorMatricula?: string;
  dataExclusao?: string;
}

export interface PecaUtilizada {
  nome: string;
  quantidade: number;
  custo?: number;
}

// Sistema de Chat e Mensagens
export interface Mensagem {
  id: string;
  conversaId: string;
  remetenteId: string;
  remetente?: Usuario;
  destinatarioId: string;
  destinatario?: Usuario;
  tipo: 'texto' | 'audio' | 'foto' | 'video' | 'pdf';
  conteudo: string; // Texto ou base64 para mídia
  audioUrl?: string; // URL do áudio (base64)
  fotoUrl?: string; // URL da foto (base64)
  videoUrl?: string; // URL do vídeo (base64)
  pdfUrl?: string; // URL do PDF (base64)
  nomeArquivoPDF?: string; // Nome do arquivo PDF
  duracaoAudio?: number; // Duração do áudio em segundos
  lida: boolean;
  dataEnvio: string;
  dataLeitura?: string;
}

export interface Conversa {
  id: string;
  participante1Id: string;
  participante1?: Usuario;
  participante2Id: string;
  participante2?: Usuario;
  ultimaMensagem?: Mensagem;
  naoLidas: number; // Número de mensagens não lidas
  dataUltimaMensagem?: string;
  dataCriacao: string;
}

export interface Notificacao {
  id: string;
  usuarioId: string;
  tipo: 'mensagem' | 'chamada' | 'sistema' | 'chamado_engenharia';
  titulo: string;
  mensagem: string;
  lida: boolean;
  dataCriacao: string;
  link?: string; // Link para onde redirecionar ao clicar
  dadosExtras?: Record<string, any>; // Dados adicionais (ex: conversaId, chamadaId)
  dadosRelacionados?: {
    chamadoId?: string;
    tipoChamado?: string;
    [key: string]: any;
  }; // Dados relacionados ao chamado ou outros eventos
}

export interface Chamada {
  id: string;
  chamadorId: string;
  chamador?: Usuario;
  recebedorId: string;
  recebedor?: Usuario;
  tipo: 'audio' | 'video';
  status: 'chamando' | 'em-andamento' | 'finalizada' | 'recusada' | 'perdida';
  dataInicio: string;
  dataFim?: string;
  duracao?: number; // Duração em segundos
}


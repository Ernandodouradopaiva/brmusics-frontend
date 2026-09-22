export interface Grupo {
  id: number;
  codigo: string;
  nome: string;
  permissoes?: Permissao[];
}

export interface Permissao {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  chave?: string;
  modulo?: string;
  recurso?: string;
  acao?: string;
  ordem?: number;
}

export interface PermissaoArvoreNodeModel {
  chave?: string;
  descricao?: string;
  modulo?: string;
  recurso?: string;
  acao?: string;
  filhos?: PermissaoArvoreNodeModel[];
}

export interface GrupoInput {
  nome: string;
  permissoesCodigos?: string[];
}

export interface UsuarioLocal {
  id: number;
  codigo: string;
  nome: string;
  cpf: string;
  email?: string | null;
  cargo?: string | null;
  ativo?: boolean;
  grupos?: Grupo[];
}

export interface UsuarioInput {
  nome: string;
  cpf: string;
  email: string;
  senha?: string;
  cargo?: string | null;
  ativo?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface SenhaInput {
  senhaAtual: string;
  novaSenha: string;
}

export interface RecuperarSenhaInput {
  cpf: string;
  email: string;
}

export interface SenhaTemporariaResponse {
  senhaTemporaria: string;
}

export interface Musico {
  id: number;
  codigo: string;
  nome: string;
  nomeArtistico?: string | null;
  telefone?: string | null;
  whatsapp: string;
  email?: string | null;
  observacao?: string | null;
  ativo?: boolean;
  usuarioCodigo?: string | null;
  usuarioNome?: string | null;
  instrumentos?: Instrumento[];
}

export interface MusicoInput {
  nome: string;
  nomeArtistico?: string | null;
  telefone?: string | null;
  whatsapp: string;
  email?: string | null;
  observacao?: string | null;
  ativo?: boolean;
  usuarioCodigo?: string | null;
  instrumentosCodigos?: string[] | null;
}

export interface Instrumento {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
  ordem?: number;
}

export interface InstrumentoInput {
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
  ordem?: number | null;
}

export interface Local {
  id: number;
  codigo: string;
  nome: string;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}

export interface LocalInput {
  nome: string;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}

export type CelebracaoStatus = 'RASCUNHO' | 'PUBLICADA' | 'CANCELADA' | 'REALIZADA';
export type CelebracaoTipo = 'FIXA' | 'EXTRAORDINARIA';

export interface Celebracao {
  id: number;
  codigo: string;
  localCodigo?: string | null;
  localNome?: string | null;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  descricao?: string | null;
  observacao?: string | null;
  status: CelebracaoStatus;
  tipo?: CelebracaoTipo | null;
  serieCodigo?: string | null;
  quantidadeGerada?: number | null;
}

export interface CelebracaoInput {
  localCodigo: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  descricao?: string | null;
  observacao?: string | null;
  status?: CelebracaoStatus;
  tipo?: CelebracaoTipo;
}

export type EscalaStatus = 'RASCUNHO' | 'PUBLICADA';
export type EscalaConfirmacaoStatus = 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO';

export interface EscalaMusico {
  codigo?: string;
  musicoCodigo: string;
  musicoNome?: string;
  instrumentoCodigo: string;
  instrumentoNome?: string;
  observacao?: string | null;
  statusConfirmacao: EscalaConfirmacaoStatus;
  ordem?: number;
  instrumentoDoMusico?: boolean;
}

export interface EscalaMusicoInput {
  musicoCodigo: string;
  instrumentoCodigo: string;
  observacao?: string | null;
  statusConfirmacao?: EscalaConfirmacaoStatus;
}

export interface EscalaInput {
  celebracaoCodigo: string;
  participacoes: EscalaMusicoInput[];
}

export interface Escala {
  codigo: string;
  status: EscalaStatus;
  celebracaoCodigo: string;
  celebracaoTitulo?: string;
  data?: string;
  horaInicio?: string;
  horaFim?: string | null;
  localNome?: string | null;
  diaSemana?: string | null;
  celebracaoStatus?: CelebracaoStatus;
  participacoes: EscalaMusico[];
  alertas: string[];
}

export interface EscalaMensalItem {
  celebracaoCodigo: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  localNome?: string | null;
  diaSemana?: string | null;
  celebracaoStatus: CelebracaoStatus;
  celebracaoTipo?: CelebracaoTipo | null;
  escalaCodigo?: string | null;
  escalaStatus?: EscalaStatus | null;
  quantidadeMusicos: number;
  participacoes: EscalaMusico[];
  repertorio?: RepertorioItem[];
  alertas: string[];
}

export interface MinhaEscalaEquipeItem {
  musicoNome: string;
  instrumentoNome?: string | null;
}

export interface MinhaEscalaItem {
  escalaCodigo: string;
  celebracaoCodigo: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  diaSemana?: string | null;
  localNome?: string | null;
  status?: EscalaStatus | string | null;
  minhaFuncao?: string | null;
  repertorioCodigo?: string | null;
  equipe: MinhaEscalaEquipeItem[];
}

export interface MinhaEscalaAgenda {
  nomeMusico: string;
  proxima?: MinhaEscalaItem | null;
  proximas: MinhaEscalaItem[];
  historico: MinhaEscalaItem[];
}

export interface DashboardCelebracaoResumo {
  celebracaoCodigo: string;
  escalaCodigo?: string | null;
  titulo: string;
  data: string;
  horaInicio: string;
  localNome?: string | null;
  quantidadeMusicos: number;
  repertorioCompleto: boolean;
  escalaPublicada: boolean;
}

export interface DashboardCoordenador {
  proximaCelebracao?: DashboardCelebracaoResumo | null;
  musicosEscaladosProxima: number;
  escalasRascunho: number;
  whatsappPendentes: number;
  whatsappErros: number;
  repertoriosIncompletos: number;
  confirmacoesPendentes: number;
  alertas: string[];
  proximasCelebracoes: DashboardCelebracaoResumo[];
}

export type EscalaPublicacaoAlteracaoTipo =
  | 'MUSICO_ADICIONADO'
  | 'MUSICO_REMOVIDO'
  | 'FUNCAO_ALTERADA'
  | 'HORARIO_ALTERADO'
  | 'REPERTORIO_ALTERADO'
  | 'CELEBRACAO_CANCELADA';

export interface EscalaPublicacaoAlteracao {
  celebracaoCodigo?: string | null;
  celebracaoTitulo?: string | null;
  tipo: EscalaPublicacaoAlteracaoTipo;
  descricao: string;
}

export interface EscalaPublicacaoPrevia {
  ano: number;
  mes: number;
  competencia: string;
  versaoAtual?: number | null;
  proximaVersao: number;
  publicadoEm?: string | null;
  publicadoPorNome?: string | null;
  quantidadeCelebracoes: number;
  quantidadeMusicos: number;
  quantidadeEscalas: number;
  podePublicar: boolean;
  impedimentos: string[];
  alteracoes: EscalaPublicacaoAlteracao[];
}

export interface EscalaPublicacao {
  codigo: string;
  ano: number;
  mes: number;
  versao: number;
  publicadoEm: string;
  publicadoPorCodigo?: string | null;
  publicadoPorNome?: string | null;
  quantidadeCelebracoes: number;
  quantidadeMusicos: number;
  quantidadeEscalas: number;
  alteracoes: EscalaPublicacaoAlteracao[];
}

export interface CategoriaLiturgica {
  codigo: string;
  rotulo: string;
}

export interface Musica {
  id: number;
  codigo: string;
  titulo: string;
  autor?: string | null;
  interpreteReferencia?: string | null;
  tomPadrao?: string | null;
  categoriaLiturgica?: string | null;
  categoriaLiturgicaRotulo?: string | null;
  letra?: string | null;
  cifra?: string | null;
  linkReferencia?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}

export interface MusicaInput {
  titulo: string;
  autor?: string | null;
  interpreteReferencia?: string | null;
  tomPadrao?: string | null;
  categoriaLiturgica?: string | null;
  letra?: string | null;
  cifra?: string | null;
  linkReferencia?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}

export interface RepertorioItem {
  codigo?: string;
  musicaCodigo: string;
  musicaTitulo: string;
  musicaAutor?: string | null;
  tomPadraoMusica?: string | null;
  momentoLiturgico: string;
  momentoLiturgicoRotulo?: string | null;
  ordem: number;
  tom?: string | null;
  observacao?: string | null;
}

export interface RepertorioItemInput {
  codigo?: string | null;
  musicaCodigo: string;
  momentoLiturgico: string;
  ordem?: number | null;
  tom?: string | null;
  observacao?: string | null;
}

export type RepertorioStatus = 'RASCUNHO' | 'PUBLICADA';

export interface RepertorioInput {
  celebracaoCodigo: string;
  observacao?: string | null;
  itens: RepertorioItemInput[];
}

export interface Repertorio {
  codigo?: string | null;
  status?: RepertorioStatus | null;
  observacao?: string | null;
  celebracaoCodigo: string;
  celebracaoTitulo?: string;
  data?: string;
  horaInicio?: string;
  horaFim?: string | null;
  localNome?: string | null;
  diaSemana?: string | null;
  celebracaoStatus?: CelebracaoStatus;
  itens: RepertorioItem[];
}

export interface RepertorioMensalItem {
  celebracaoCodigo: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  localNome?: string | null;
  diaSemana?: string | null;
  celebracaoStatus: CelebracaoStatus;
  repertorioCodigo?: string | null;
  repertorioStatus?: RepertorioStatus | null;
  observacao?: string | null;
  quantidadeItens: number;
  itens: RepertorioItem[];
}

export type FrequenciaStatus = 'PRESENTE' | 'FALTOU' | 'DISPENSADO' | 'NAO_MINISTERIO';

export interface FrequenciaMensalItem {
  codigo?: string | null;
  musicoCodigo: string;
  musicoNome: string;
  musicoAtivo?: boolean | null;
  semana1?: FrequenciaStatus | null;
  semana2?: FrequenciaStatus | null;
  semana3?: FrequenciaStatus | null;
  semana4?: FrequenciaStatus | null;
}

export interface FrequenciaMensalPrevia {
  ano: number;
  mes: number;
  competencia: string;
  itens: FrequenciaMensalItem[];
}

export type WhatsAppTipoMensagem =
  | 'PUBLICACAO_ESCALA'
  | 'NOVA_ESCALA'
  | 'ALTERACAO_ESCALA'
  | 'REMOCAO_ESCALA'
  | 'ALTERACAO_REPERTORIO'
  | 'CELEBRACAO_CANCELADA'
  | 'LEMBRETE';

export type WhatsAppEnvioStatus = 'PENDENTE' | 'PROCESSANDO' | 'ENVIADO' | 'ERRO';

export interface WhatsAppEnvio {
  codigo: string;
  musicoCodigo?: string | null;
  musicoNome?: string | null;
  telefone: string;
  tipoMensagem: WhatsAppTipoMensagem;
  tipoMensagemRotulo?: string | null;
  mensagem: string;
  status: WhatsAppEnvioStatus;
  statusRotulo?: string | null;
  providerMessageId?: string | null;
  tentativas: number;
  erro?: string | null;
  dataSolicitacao: string;
  dataEnvio?: string | null;
}

export interface WhatsAppComunicacaoItem {
  musicoCodigo: string;
  musicoNome: string;
  tipo: WhatsAppTipoMensagem;
  tipoRotulo?: string | null;
  resumo: string;
  data?: string | null;
  celebracaoTitulo?: string | null;
  statusEnvio?: WhatsAppEnvioStatus | null;
}

export interface WhatsAppComunicacaoPrevia {
  publicacaoCodigo?: string | null;
  versao?: number | null;
  ano: number;
  mes: number;
  competencia: string;
  jaComunicada: boolean;
  itens: WhatsAppComunicacaoItem[];
}



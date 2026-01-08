
export interface Entity {
  id: string;
  nombre: string;
  documento: string; // DNI/NIF o Código Identificador
  telefono?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  codigoPostal?: string;
  provincia?: string;
  cuentaBancaria?: string;
  observaciones?: string;
}

export type Client = Entity;
export type Opponent = Entity;
export type Lawyer = Entity & { colegio?: string; numeroColegiado?: string };
export type Solicitor = Entity & { colegio?: string; numeroColegiado?: string };

export interface Court extends Entity {
  ciudad?: string;
}

export interface CaseType {
  id: string;
  nombre: string;
}

export interface ProcedureType {
  id: string;
  nombre: string;
}

export interface TimelineEvent {
  id: string;
  fecha: string;
  descripcion: string;
  archivoLink?: string;
}

export interface FinancialEntry {
  id: string;
  fecha: string;
  tipo: 'ingreso' | 'gasto' | 'suplido';
  descripcion: string;
  monto: number;
}

export interface CaseFile {
  id: string;
  numeroExpediente: string; // Format: YYYY/N
  fechaApertura: string;
  fechaArchivo?: string;
  clienteIds: string[]; // Soporta múltiples clientes
  abogadoId: string;
  procuradorId: string;
  contrarioIds: string[]; // Soporta múltiples contrarios
  contrarioAbogadoId?: string;
  contrarioProcuradorId?: string;
  juzgadoId: string;
  tipoExpedienteId: string;
  tipoProcedimientoId: string;
  numeroProcedimiento: string;
  evolutivo: TimelineEvent[];
  cuentas: FinancialEntry[];
  observaciones: string;
  estado: 'abierto' | 'archivado' | 'archivado provisionalmente';
  relatedCaseIds?: string[]; // IDs de expedientes vinculados
}

export type EntityType = 'cliente' | 'contrario' | 'abogado' | 'procurador' | 'juzgado' | 'tipo_expediente' | 'tipo_procedimiento';

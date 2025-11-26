// Utilitário para gerenciar turnos do sistema
// Turnos: 1º (06:30-16:18), 2º (16:18-01:30), 3º (01:30-06:30), Central

export type Turno = '1' | '2' | '3' | 'central';

/**
 * Determina o turno baseado no horário atual ou fornecido
 * @param hora - Horário no formato HH:mm (opcional, usa horário atual se não fornecido)
 * @returns O turno correspondente
 */
export function determinarTurno(hora?: string): Turno {
  let horaAtual: number;
  let minutosAtual: number;

  if (hora) {
    const [horaStr, minStr] = hora.split(':');
    horaAtual = parseInt(horaStr);
    minutosAtual = parseInt(minStr);
  } else {
    const agora = new Date();
    horaAtual = agora.getHours();
    minutosAtual = agora.getMinutes();
  }

  const horaMinutos = horaAtual * 60 + minutosAtual; // Converter para minutos desde meia-noite

  // 1º turno: 06:30 (390 min) às 16:18 (978 min)
  // 2º turno: 16:18 (978 min) às 01:30 do dia seguinte (90 min do próximo dia)
  // 3º turno: 01:30 (90 min) às 06:30 (390 min)

  if (horaMinutos >= 390 && horaMinutos < 978) {
    return '1'; // 1º Turno
  } else if (horaMinutos >= 978 || horaMinutos < 90) {
    return '2'; // 2º Turno
  } else if (horaMinutos >= 90 && horaMinutos < 390) {
    return '3'; // 3º Turno
  }

  return 'central'; // Central (fallback)
}

/**
 * Obtém o label do turno
 */
export function getTurnoLabel(turno: Turno): string {
  const labels: Record<Turno, string> = {
    '1': '1º Turno (06:30-16:18)',
    '2': '2º Turno (16:18-01:30)',
    '3': '3º Turno (01:30-06:30)',
    'central': 'Central',
  };
  return labels[turno] || turno;
}

/**
 * Obtém a cor do badge do turno
 */
export function getTurnoBadgeColor(turno: Turno): string {
  const colors: Record<Turno, string> = {
    '1': 'bg-blue-100 text-blue-800',
    '2': 'bg-green-100 text-green-800',
    '3': 'bg-purple-100 text-purple-800',
    'central': 'bg-orange-100 text-orange-800',
  };
  return colors[turno] || 'bg-gray-100 text-gray-800';
}


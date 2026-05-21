// Paleta secundaria compartida — no cambiar
export const C = {
  bg:      '#f6f7f9',  // secondary-50
  white:   '#ffffff',
  border:  '#d0dbe6',  // secondary-200
  border2: '#ecf0f4',  // secondary-100
  text:    '#1e2b39',  // secondary-900
  text2:   '#305373',  // secondary-700
  muted:   '#89a8c8',  // secondary-400
  s100:    '#ecf0f4',
  s200:    '#d0dbe6',
  s300:    '#afc4d9',
  s500:    '#5280ad',
  s600:    '#3c6690',
  s700:    '#305373',
  s800:    '#273d53',
  s900:    '#1e2b39',
};

export const card = {
  background:   C.white,
  borderRadius: 10,
  border:       `1px solid ${C.border}`,
  boxShadow:    '0 1px 3px rgba(30,43,57,0.07)',
};

export const STATUS_CFG = {
  draft:    { label: 'Borrador',  color: C.s700,    bg: C.s100 },
  sent:     { label: 'Enviado',   color: '#1d4ed8',  bg: '#dbeafe' },
  accepted: { label: 'Aceptado', color: '#15803d',  bg: '#dcfce7' },
  rejected: { label: 'Rechazado', color: '#b91c1c', bg: '#fee2e2' },
  expired:  { label: 'Vencido',  color: '#92400e',  bg: '#fef3c7' },
};

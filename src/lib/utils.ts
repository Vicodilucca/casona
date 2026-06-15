export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function getNights(inicio: string, fin: string): number {
  const a = new Date(inicio + 'T00:00:00');
  const b = new Date(fin + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCurrentMonth(): { desde: string; hasta: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    desde: `${year}-${month}-01`,
    hasta: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const months = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

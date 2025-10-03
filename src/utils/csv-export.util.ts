export function exportPosterCsv(
  groupTitle: string,
  surveys: { judgeName: string; answers: string[] }[],
  filename: string
): void {
  if (!surveys || surveys.length === 0) {
    console.warn('[CSV Export] No surveys to export.');
    return;
  }

  const headers = [
    'Judge',
    'Statement of Problem',
    'Methodology',
    'Results/Solution',
    'Oral Presentation',
    'Poster Layout',
    'Impact',
    'Comments'
  ];

  const rows = surveys.map(s => [s.judgeName, ...s.answers.map(a => `"${a}"`)]);

  const csvContent = [headers, ...rows]
    .map(e => e.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportJSurveyCSV(filename: string, surveys: any[], title: string): void {
  const header = [
    'ID',
    'Poster Name',
    'Statement of Problem',
    'Methodology',
    'Results/Solution',
    'Oral Presentation',
    'Poster Layout',
    'Impact',
    'Total',
    'Additional Comments'
  ];

  const rows = surveys.map(r => [
    r.groupId,
    r.groupName,
    r.answers[0],
    r.answers[1],
    r.answers[2],
    r.answers[3],
    r.answers[4],
    r.answers[5],
    String(r.total),
    `"${String(r.answers[6] ?? '').replace(/"/g, '""')}"`
  ]);

  const csv = [header, ...rows].map(cols => cols.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${title.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportFinalReportCSV(filename: string, surveys: any[]): void {
  const header = [
    'Judge Name',
    'Poster ID',
    'Poster Name',
    'Statement of Problem',
    'Methodology',
    'Results/Solution',
    'Oral Presentation',
    'Poster Layout',
    'Impact',
    'Additional Comments'
  ];

  const rows = surveys.map(r => [
    r.judgeName,
    r.groupId,
    r.groupName,
    r.answers[0] ?? '',
    r.answers[1] ?? '',
    r.answers[2] ?? '',
    r.answers[3] ?? '',
    r.answers[4] ?? '',
    r.answers[5] ?? '',
    `"${String(r.answers[6] ?? '').replace(/"/g, '""')}"`
  ]);

  const csv = [header, ...rows].map(cols => cols.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

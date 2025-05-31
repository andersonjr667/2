// ATENÇÃO: Altere para true para ativar o modo manutenção
const maintenanceMode = false;

if (maintenanceMode && !window.location.pathname.endsWith('maintenance.html')) {
  window.location.href = '/maintenance.html';
}

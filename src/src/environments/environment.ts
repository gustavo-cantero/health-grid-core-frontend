export const environment = {
  production: true,
  apiBaseUrl: 'https://api.healthcare.cantero.ar',
  // Callbacks SSO de los módulos que viven en otros dominios: reciben el ticket
  // y abren la sesión allá.
  patientPortalSsoUrl: 'https://da2frontend.onrender.com/auth/sso',
  medicalRecordsSsoUrl: 'https://healthgrid-hce-frontend-olive.vercel.app/auth/sso',
  appointmentsSsoUrl: 'https://turnos.solefrancisco.com/auth/sso',
  imagingSsoUrl: 'https://uade-da-2-frontend.vercel.app/auth/sso',
  pharmacySsoUrl: 'https://front-modulo3-farmacia.vercel.app/auth/sso',
  inpatientSsoUrl: 'https://internaciones-y-camas.vercel.app/auth/sso',
  labSsoUrl: 'https://modulo-laboratorio.up.railway.app/auth/sso',
  billingSsoUrl: 'https://modulo7-frontend.onrender.com/auth/sso',
  // OJO: el ALB de monitoreo no tiene listener TLS, así que esto va por HTTP y el
  // ticket viaja en texto plano. Pasar a https apenas el módulo lo soporte.
  monitoringSsoUrl:
    'http://m9-monitoring-alb-1949535151.us-east-1.elb.amazonaws.com/api/v1/auth/sso',
};

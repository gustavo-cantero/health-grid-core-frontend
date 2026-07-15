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
};

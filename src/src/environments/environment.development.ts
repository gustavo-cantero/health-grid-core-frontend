export const environment = {
  production: false,
  apiBaseUrl: '',
  // Callbacks SSO de los módulos que viven en otros dominios: reciben el ticket
  // y abren la sesión allá.
  patientPortalSsoUrl: 'https://da2frontend.onrender.com/auth/sso',
  medicalRecordsSsoUrl: 'https://healthgrid-hce-frontend-olive.vercel.app/auth/sso',
  appointmentsSsoUrl: 'https://turnos.solefrancisco.com/auth/sso',
};

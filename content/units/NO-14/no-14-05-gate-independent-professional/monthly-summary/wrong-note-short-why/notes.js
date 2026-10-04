// Which focused labs this feature uses, and where a lab skill does not apply.
export const labs = {
  used: ['sql', 'ssr'], // lab ids: 'sql' | 'auth' | 'ssr'
  notUsed: [{ lab: 'auth', why: 'There is one user.' }], // { lab, why }
};

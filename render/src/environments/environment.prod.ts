export const environment = {
  production: true,

  build: {
    when: new Date().toISOString(),
    sha: processEnv.SHA || 'no-sha',
  },
};

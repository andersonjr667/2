const venom = require('venom-bot');
venom.create({ headless: 'new', session: 'test-session' })
  .then(client => console.log('Venom OK!'))
  .catch(e => console.error('Erro Venom:', e));
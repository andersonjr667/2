const { execSync } = require('child_process');

try {
  // Skip Puppeteer postinstall script in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping Puppeteer installation in production');
    process.exit(0);
  }

  // Only run Puppeteer installation in development
  console.log('Installing Puppeteer browser...');
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: Puppeteer browser installation failed');
  console.warn('This is not critical if running in production');
  // Exit successfully anyway
  process.exit(0);
}

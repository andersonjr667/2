const { exec } = require('child_process');
const path = require('path');

function cleanup() {
    // Remove session files
    const sessionPath = path.join(__dirname, 'church-system.json');
    require('fs').unlink(sessionPath, () => {
        console.log('🧹 Removed old session file');
    });
}

cleanup();

const { exec } = require('child_process');
const net = require('net');

async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        resolve();
        return;
      }

      const lines = stdout.trim().split('\n');
      let killedAny = false;

      for (const line of lines) {
        const match = line.match(/\s+(\d+)$/);
        if (match) {
          const pid = match[1];
          console.log(`Killing process ${pid} on port ${port}...`);
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (killError) {
              console.error(`Failed to kill process ${pid}:`, killError.message);
            } else {
              console.log(`Successfully killed process ${pid}`);
              killedAny = true;
            }
          });
        }
      }

      // Wait for processes to be killed
      setTimeout(() => resolve(killedAny), 1000);
    });
  });
}

async function startBackend() {
  try {
    console.log('🔍 Checking port 4000...');

    // Check if port is available
    const portAvailable = await checkPort(4000);

    if (!portAvailable) {
      console.log('⚠️  Port 4000 is in use, killing existing process...');
      await killProcessOnPort(4000);

      // Wait longer for the port to be released
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check again
      const portNowAvailable = await checkPort(4000);
      if (!portNowAvailable) {
        console.log('⚠️  Port still in use, trying again...');
        await killProcessOnPort(4000);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const finalCheck = await checkPort(4000);
        if (!finalCheck) {
          console.error('❌ Failed to free port 4000 after multiple attempts');
          console.log('💡 Try manually killing processes or restart your terminal');
          process.exit(1);
        }
      }
    }

    console.log('✅ Port 4000 is available, starting backend...');

    // Start the backend
    const { spawn } = require('child_process');
    const backend = spawn('node', ['src/server.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    backend.on('error', (error) => {
      console.error('❌ Failed to start backend:', error.message);
      process.exit(1);
    });

    backend.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      process.exit(code);
    });

  } catch (error) {
    console.error('❌ Startup error:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Starting backend with port management...');
startBackend();

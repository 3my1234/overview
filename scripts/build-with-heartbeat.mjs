import { spawn } from 'node:child_process';

function runWithHeartbeat(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    const heartbeat = setInterval(() => {
      console.log(`[build] ${label} still running...`);
    }, 15000);

    child.on('error', (error) => {
      clearInterval(heartbeat);
      reject(error);
    });

    child.on('close', (code) => {
      clearInterval(heartbeat);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

async function main() {
  await runWithHeartbeat('npm', ['run', 'migrate'], 'migration');
  await runWithHeartbeat('npx', ['next', 'build', '--webpack'], 'next build');
}

main().catch((error) => {
  console.error(`[build] ${error.message}`);
  process.exit(1);
});

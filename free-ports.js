import { execSync } from 'child_process';

const ports = [3001, 5173];

for (const port of ports) {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: 'ignore' }
      );
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch {}
}

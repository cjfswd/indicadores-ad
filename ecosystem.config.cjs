module.exports = {
  apps: [
    {
      name: 'indicadores-api',
      script: './backend/dist/backend/src/app.js',
      cwd: '/app/indicadores',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_file: '/app/indicadores/.env',
      max_memory_restart: '256M',
      error_file: '/var/log/indicadores/error.log',
      out_file: '/var/log/indicadores/out.log',
      merge_logs: true,
      time: true,
    },
  ],
}

module.exports = {
  apps: [{
    name: 'chefos-backend',
    script: 'server.js',
    instances: process.env.NODE_ENV === 'production' ? 2 : 1,
    exec_mode: 'cluster',
    watch: process.env.NODE_ENV !== 'production',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_restarts: 10,
    restart_delay: 4000,
  }],
}

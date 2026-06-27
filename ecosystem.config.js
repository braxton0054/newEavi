module.exports = {
  apps: [{
    name: 'eavi-college',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 4000',
    cwd: '/root/eavi-college',
    env: {
      NODE_ENV: 'production',
      PORT: '4000'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/root/eavi-college/logs/error.log',
    out_file: '/root/eavi-college/logs/out.log',
    max_restarts: 10,
    restart_delay: 3000
  }]
};

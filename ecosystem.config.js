module.exports = {
  apps: [
    {
      name: "eavi-college",
      script: "npx",
      args: "next start -p 4000",
      cwd: "/root/eavi-college",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "4000"
      }
    }
  ]
};

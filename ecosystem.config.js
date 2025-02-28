module.exports = {
  apps: [
    {
      name: "insightNotes-api",
      script: "./dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        instances: 1,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      exp_backoff_restart_delay: 100,
      restart_delay: 3000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      max_restarts: 10,
      min_uptime: "1m",
    },
  ],
};

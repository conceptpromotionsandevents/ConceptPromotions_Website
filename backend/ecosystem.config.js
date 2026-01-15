// backend/ecosystem.config.js
export default {
    apps: [
        {
            name: "concept-promotions-api",
            script: "./server.js",

            // Cluster mode for better performance
            instances: 2,
            exec_mode: "cluster",

            // Environment variables
            env_production: {
                NODE_ENV: "production",
                PORT: 5000,
            },

            // Logging
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,

            // Process management
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            max_memory_restart: "500M",

            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 3000,
            shutdown_with_message: true,

            // Advanced features
            watch: false,
            ignore_watch: ["node_modules", "logs"],

            // Exponential backoff restart delay
            exp_backoff_restart_delay: 100,

            // Source map support for better error traces
            source_map_support: true,

            // Instance var for load balancing
            instance_var: "INSTANCE_ID",
        },
    ],
};

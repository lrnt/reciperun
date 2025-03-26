import type { ServerType } from "@hono/node-server";
import { serve } from "@hono/node-server";

import { app } from "./index";

let server: ServerType | undefined;
let isShuttingDown = false;

const startServer = () => {
  try {
    server = serve(
      {
        fetch: app.fetch,
        port: 3000,
      },
      (info) => {
        console.log("✅ Server is running on http://localhost:" + info.port);
      },
    );

    return true;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    return false;
  }
};

const shutdownServer = (signal: string) => {
  if (isShuttingDown) {
    console.log("Shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal} signal, shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });

    // Force close after 5 seconds if server doesn't close gracefully
    setTimeout(() => {
      console.log("Forcing server shutdown after timeout");
      process.exit(1);
    }, 5000);
  } else {
    process.exit(0);
  }
};

// Start the server
void startServer();

// Handle graceful shutdown
process.once("SIGINT", () => void shutdownServer("SIGINT"));
process.once("SIGTERM", () => void shutdownServer("SIGTERM"));

// Handle uncaught exceptions to prevent crashes
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});
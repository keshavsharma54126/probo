import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import { createClient } from "redis";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Redis clients

const app = express();
const httpServer = app.listen(8080);

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data, isBinary) {
    myQueue.on("ready", async () => {
      console.log("Connected to Redis queue 'myQueue'");
      try {
        const counts = await myQueue.getJobCounts();
        ws.send(JSON.stringify(counts));
        console.log("Current job counts:", counts);
      } catch (error) {
        console.error("Error getting job counts:", error);
      }
    });
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data + "lol", { binary: isBinary });
      }
    });
  });

  ws.send("Hello! Message From Server!!");
});

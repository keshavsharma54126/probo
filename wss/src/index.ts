import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import Redis from "ioredis";
import Bull from "bull";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Redis clients
const redisConfig = {
  redis: {
    host: "redis-12599.c256.us-east-1-2.ec2.redns.redis-cloud.com",
    port: 12599,
    password: "pLcSvcN6ayctQYflT3RPY8gcEOKxRHh3",
  },
};
const myQueue = new Bull("myQueue", redisConfig);
myQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

myQueue.on("ready", async () => {
  console.log("Connected to Redis queue 'myQueue'");
  try {
    const counts = await myQueue.getJobCounts();
    console.log("Current job counts:", counts);
  } catch (error) {
    console.error("Error getting job counts:", error);
  }
});

const app = express();
const httpServer = app.listen(8080);

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data + "lol", { binary: isBinary });
      }
    });
  });

  ws.send("Hello! Message From Server!!");
});

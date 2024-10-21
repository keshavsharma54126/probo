import WebSocket, { WebSocketServer } from "ws";
import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Redis clients
const redisPublisher = new Redis(process.env.REDIS_URL || "");
const redisSubscriber = new Redis(process.env.REDIS_URL || "");

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Handle messages from WebSocket clients
  ws.on("message", (message: string) => {
    console.log(`Received: ${message}`);

    // Publish message to Redis queue
    redisPublisher.publish("message_queue", message);
  });

  // Subscribe to Redis messages
  redisSubscriber.subscribe("message_queue", () => {
    console.log("Subscribed to Redis queue.");
  });

  redisSubscriber.on("message", (channel: string, message: string) => {
    console.log(`Message from Redis: ${message}`);

    // Send Redis message back to WebSocket clients
    ws.send(`Redis says: ${message}`);
  });
});

console.log("WebSocket server running on ws://localhost:8080");

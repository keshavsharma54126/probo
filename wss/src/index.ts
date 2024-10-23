import { WebSocketServer, WebSocket } from "ws";
import Redis from "ioredis";
import Bull from "bull";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Redis clients
const redisConfig = {
  redis: {
    host: 'redis-12599.c256.us-east-1-2.ec2.redns.redis-cloud.com',
    port: 12599,
    password: 'pLcSvcN6ayctQYflT3RPY8gcEOKxRHh3'
  }
};

const myQueue = new Bull("myQueue", redisConfig);
if(myQueue){
  console.log("connected to redis queue");
  console.log(myQueue.getJobCounts());
}

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");
  // Handle messages from WebSocket clients
  ws.addEventListener("message", (event) => {
    console.log(`Received: ${event.data}`);
  });

  // Log when the WebSocket server is running
  console.log("WebSocket server running on ws://localhost:8080");

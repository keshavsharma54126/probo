//@ts-ignore
import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager.js";

const wss = new WebSocketServer({ port: 8080 });
console.log("Server started on port 8080");
//@ts-ignore
wss.on("connection", (ws) => {
  console.log("New connection");
  UserManager.getInstance().addUser(ws);
});

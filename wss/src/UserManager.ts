import { WebSocket } from "ws";
import { User } from "./User";
import { SubscriptionManager } from "./SubscriptionManager";

export class UserManager {
  private static instance: UserManager;
  private users: Map<string, User> = new Map();

  private constructior() {}
  private static getInstance() {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public addUser(ws: WebSocket) {
    const userId = this.getRandomId();
    const user = new User(ws, userId);
    this.users.set(userId, user);
    this.registerOnClose(ws, id);
    return user;
  }
  public registerOnClose(ws: WebSocket, userId: string) {
    ws.on("close", () => {
      this.users.delete(userId);
      SubscriptionManager.getInstance().userLeft(userId);
    });
  }

  public getUser(userId: string) {
    return this.users.get(userId);
  }

  public getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

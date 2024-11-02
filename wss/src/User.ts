import { WebSocket } from "ws";
import { SubscriptionManager } from "./SubscriptionManager";

export class User {
  private id: string;
  private ws: WebSocket;

  constructor(ws: WebSocket, id: string) {
    this.id = id;
    this.ws = ws;
    this.addListener();
  }

  private subscriptions: string[] = [];

  public subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  public unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
  }

  emit(message: any) {
    this.ws.send(JSON.stringify(message));
  }

  private addListener() {
    this.ws.on("message", (message: string) => {
      const parsedMessage: any = JSON.parse(message);
      if (parsedMessage.method === "subscribe") {
        parsedMessage.params.forEach((s: any) =>
          SubscriptionManager.getInstance().subscribe(this.id, s)
        );
      }
      if (parsedMessage.method === "unsubscribe") {
        parsedMessage.params.forEach((s: any) =>
          SubscriptionManager.getInstance().unsubscribe(this.id, s)
        );
      }
    });
  }
}

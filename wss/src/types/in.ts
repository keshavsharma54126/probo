export const SUBSCRIBE = "subscribe";
export const UNSUBSCRIBE = "unsubscribe";

export type SubscribeMessage = {
  method: typeof SUBSCRIBE;
  params: string[];
};

export type UnsubscribeMessage = {
  method: typeof UNSUBSCRIBE;
  params: string[];
};

export type IncomingMessage = SubscribeMessage | UnsubscribeMessage;

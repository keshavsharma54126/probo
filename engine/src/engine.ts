import fs from "fs";
import { RedisManager } from "./redisManager";

interface INR_BALANCES {
  [key: string]: {
    balance: number;
    locked: number;
  };
}
interface OrderDetails {
  total: number;
  orders: {
    [userId: string]: number;
  };
}

interface OrderSide {
  [price: string]: OrderDetails;
}

interface Symbol {
  yes: OrderSide;
  no: OrderSide;
}

interface ORDERBOOK {
  [symbol: string]: Symbol;
}

interface STOCK_BALANCES {
  [key: string]: {
    [key: string]: {
      quantity: number;
      locked: number;
    };
  };
}

let INR_BALANCES: INR_BALANCES = {
  //   user1: {
  //     balance: 10,
  //     locked: 0,
  //   },
  //   user2: {
  //     balance: 20,
  //     locked: 10,
  //   },
};

let ORDERBOOK: any = {
  //   BTC_USDT_10_Oct_2024_9_30: {
  //     yes: {
  //       "9.5": {
  //         total: 12,
  //         orders: {
  //           user1: 10,
  //           user2: 2,
  //         },
  //       },
  //       "8.5": {
  //         total: 12,
  //         orders: {
  //           user1: 3,
  //           user2: 6,
  //           user3: 3,
  //         },
  //       },
  //     },
  //     no: {
  //       "7.5": {
  //         total: 12,
  //         orders: {
  //           user1: 3,
  //           user2: 2,
  //           user3: 7,
  //         },
  //       },
  //     },
  //   },
};

let STOCK_BALANCES: any = {
  //   user1: {
  //     BTC_USDT_10_Oct_2024_9_30: {
  //       yes: {
  //         quantity: 1,
  //         locked: 0,
  //       },
  //     },
  //   },
  //   user2: {
  //     BTC_USDT_10_Oct_2024_9_30: {
  //       no: {
  //         quantity: 3,
  //         locked: 4,
  //       },
  //     },
  //   },
};

export class Engine {
  private ORDERBOOK: ORDERBOOK = {};
  private INR_BALANCES: INR_BALANCES = {};
  private STOCK_BALANCES: STOCK_BALANCES = {};

  constructor() {
    let snapshot = null;
    try {
      snapshot = fs.readFileSync("./snapshot.json");
    } catch (e) {
      console.log("No snapshot found");
    }

    if (snapshot) {
      const snapshotSnapshot = JSON.parse(snapshot.toString());
      this.ORDERBOOK = snapshotSnapshot.ORDERBOOK;
      this.INR_BALANCES = snapshotSnapshot.INR_BALANCES;
      this.STOCK_BALANCES = snapshotSnapshot.STOCK_BALANCES;
    } else {
      this.ORDERBOOK = {};
      this.INR_BALANCES = {};
      this.STOCK_BALANCES = {};
    }
    setInterval(() => {
      this.saveSnapshot();
    }, 3000);
  }

  saveSnapshot() {
    const snapshotSnapshot = {
      ORDERBOOK: this.ORDERBOOK,
      INR_BALANCES: this.INR_BALANCES,
      STOCK_BALANCES: this.STOCK_BALANCES,
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
  }

  process({ message, clientId }: { message: any; clientId: string }) {
    const { type, data } = message;
    switch (type) {
      case "ORDER":
        break;
    }
  }
}

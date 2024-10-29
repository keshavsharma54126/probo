import { createClient } from "redis";
import { Engine } from "./engine";

async function main() {
  const engine = new Engine();
  const redisClient = createClient();
  await redisClient.connect();
  console.log("Connected to Redis");

  while (true) {
    const response = await redisClient.rPop("message" as string);
    if (response) {
      console.log("Received message from Redis:", response);
      engine.process(JSON.parse(response));
    }
  }
}

main();

import { MongoClient, Db } from "mongodb";

const DB_NAME = "datedrop";

type GlobalMongo = typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
};

export function mongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local. Database name is always datedrop.",
    );
  }
  const g = globalThis as GlobalMongo;
  if (!g._mongoClientPromise) {
    const client = new MongoClient(uri);
    g._mongoClient = client;
    g._mongoClientPromise = client.connect();
  }
  return g._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(DB_NAME);
}

export async function ensureIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ clerkId: 1 }, { unique: true }),
    db.collection("places").createIndex({ googlePlaceId: 1 }, { unique: true }),
    db.collection("captures").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("boards").createIndex({ userId: 1, city: 1 }),
    db.collection("boardPlaces").createIndex({ boardId: 1, placeId: 1 }, { unique: true }),
    db.collection("plans").createIndex({ boardId: 1 }, { unique: true }),
    db.collection("climateCache").createIndex({ key: 1 }, { unique: true }),
    db.collection("rateLimits").createIndex({ key: 1, windowStart: 1 }),
  ]);
}

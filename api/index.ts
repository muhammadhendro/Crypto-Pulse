import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

let initialized = false;
let setupPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (initialized) return;
  if (!setupPromise) {
    setupPromise = (async () => {
      await registerRoutes(createServer(app), app);
      app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        if (res.headersSent) return next(err);
        return res.status(status).json({ message });
      });
      initialized = true;
    })();
  }
  await setupPromise;
}

export default async function handler(req: Request, res: Response) {
  await ensureInitialized();
  return app(req, res);
}

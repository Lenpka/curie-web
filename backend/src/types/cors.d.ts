declare module "cors" {
  import type { RequestHandler } from "express";
  interface CorsOptions {
    origin?: boolean | string | string[] | ((origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => void);
    credentials?: boolean;
    [key: string]: unknown;
  }
  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}

import type { MiddlewareHandler } from "hono";
export declare const cacheControlMiddleware: MiddlewareHandler;
export declare function cacheConfigSetter(keySliceIndex: number): MiddlewareHandler;

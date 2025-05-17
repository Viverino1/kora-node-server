export declare class AniwatchAPICache {
    private _client;
    isOptional: boolean;
    static DEFAULT_CACHE_EXPIRY_SECONDS: 60;
    static CACHE_EXPIRY_HEADER_NAME: "X-ANIWATCH-CACHE-EXPIRY";
    constructor();
    set(key: string | Buffer, value: string | Buffer | number): Promise<"OK"> | undefined;
    get(key: string | Buffer): Promise<string | null> | undefined;
    getOrSet<T>(setCB: () => Promise<T>, key: string | Buffer, expirySeconds?: number): Promise<T>;
}
export declare const cache: AniwatchAPICache;

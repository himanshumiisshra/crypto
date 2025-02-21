export interface byBitFutureMarketModel {
    symbol: string;     // Use lowercase `string` instead of `String`
    interval: string;
    openTime: number;   // Changed to `number`
    open: string;       // If you keep them as strings in the schema, leave as `string`
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;  // Changed to `number`
}

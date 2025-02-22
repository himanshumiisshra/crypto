export interface mexcFutureMarketModel {
    symbol: string;
    openTime: number; // The timestamp of the deal
    open: string;     // The opening price
    high: string;     // The highest price
    low: string;      // The lowest price
    close: string;    // The closing price
    volume: string;   // The volume of the deal
    closeTime: number; // The closing timestamp of the deal
}

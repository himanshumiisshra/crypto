import { Request, Response } from "express";
import { Server } from "socket.io";
import binanceFutureMarketService from "../../modules/futureMarket/binance/service";
import byBitFutureMarketService from "../../modules/futureMarket/byBit/service";
import kuCoinFutureMarketService from "../../modules/futureMarket/kuCoin/service";
import mexCFutureMarketService from "../../modules/futureMarket/mexc/service";

export class futureMarketController {
    private binance_market_service: binanceFutureMarketService;
    private byBit_market_service: byBitFutureMarketService;
    private kuCoin_future_market_service: kuCoinFutureMarketService;
    private mexc_future_market_service: mexCFutureMarketService;
    private io: Server;

    constructor(server: any) {
        this.io = new Server(server, { cors: { origin: "*" } });
        this.binance_market_service = new binanceFutureMarketService(server);
        this.byBit_market_service = new byBitFutureMarketService(server);
        this.kuCoin_future_market_service = new kuCoinFutureMarketService(server)
        this.mexc_future_market_service = new mexCFutureMarketService(server);
    }
    public async getAllOHLCV(req: Request, res: Response) {
        try {
            console.log("Checking for query", req.query);
            const { symbol, limit = 100 } = req.query;
            const filter: any = {};
            if (symbol) {
                filter.symbol = symbol;
            }
            const byBitData = await this.byBit_market_service.find(filter);
            const binanceData = await this.binance_market_service.find(filter);
            const kuCoinData = await this.kuCoin_future_market_service.find(filter);
            const mexcData = await this.mexc_future_market_service.find(filter);
            const allData = [
                ...byBitData,
                ...binanceData,
                ...kuCoinData,
                ...mexcData,
            ];
            if (allData.length === 0) {
                return res.status(404).json({ message: "No data found" });
            }

            const sortedData = this.sortAndLimitData(allData, Number(limit));
            return res.status(200).json(sortedData);

        } catch (error) {
            console.error("Error fetching Futures OHLCV Data:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    private sortAndLimitData(data: any[], limit: number) {
        return data.sort((a, b) => b.openTime - a.openTime).slice(0, limit);
    }

}
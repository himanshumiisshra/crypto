// import { Request, Response } from 'express';
// import { binanceFutureMarketModel } from "../../modules/futureMarket/binance/model";
// import binance_future_market_schema from "../../modules/futureMarket/binance/schema";
// import binanceFutureMarketService from "../../modules/futureMarket/binance/service";
// import { createServer } from "http";

// export class futureMarketController {
//     private binance_market_service: binanceFutureMarketService;

//     constructor(server: any) {
//         this.binance_market_service = new binanceFutureMarketService(server);
//     }

//     public async getAllOHLCV(req: Request, res: Response) {
//         try {
//             const { symbol, limit = 100 } = req.query;

//             const filter: any = {};
//             if (symbol) filter.symbol = symbol;

//             // Fetch data from MongoDB
//             const data = await binance_future_market_schema.find(filter)
//                 .sort({ openTime: -1 })
//                 .limit(Number(limit));

//             return res.status(200).json(data);
//         } catch (error) {
//             console.error("❌ Error fetching Futures OHLCV Data:", error);
//             return res.status(500).json({ message: "Internal Server Error" });
//         }
//     }
// }

import { Request, Response } from "express";
import { Server } from "socket.io";
import binanceFutureMarketService from "../../modules/futureMarket/binance/service";
import byBitFutureMarketService from "../../modules/futureMarket/byBit/service";
// import kuCoinFutureMarketService from "../../modules/futureMarket/kuCoin/service";

export class futureMarketController {
    // private binance_market_service: binanceFutureMarketService;
    private byBit_market_service: byBitFutureMarketService;
    private io: Server;

    constructor(server: any) {
        this.io = new Server(server, { cors: { origin: "*" } });
        // this.binance_market_service = new binanceFutureMarketService(server);
        this.byBit_market_service = new byBitFutureMarketService(server);
    }

    public async getAllOHLCV(req: Request, res: Response) {
        try {
            console.log("cheking for query",req.query)
            // Destructuring query parameters
        const { symbol, limit = 100 } = req.query;
        
        // Initialize the filter object
        const filter: any = {};
        
        // If symbol is provided in the query, add it to the filter
        if (symbol) {
            filter.symbol = symbol;
        }

        // Fetch the data using the filter
        const data = await this.byBit_market_service.find(filter);

        // Sort the data by openTime in descending order and limit it to the specified amount
        const sortedData = data.sort((a, b) => b.openTime - a.openTime).slice(0, Number(limit));

        // Return the sorted and sliced data as the response
        return res.status(200).json(sortedData);


            //binance

            // const { symbol, limit = 100 } = req.query;
            // const filter: any = {};

            // if (symbol) filter.symbol = symbol;

            // const data = await this.binance_market_service.find(filter);
            // const sortedData = data.sort((a, b) => b.openTime - a.openTime).slice(0, Number(limit));

            // return res.status(200).json(sortedData);

        } catch (error) {
            console.error("Error fetching Futures OHLCV Data:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
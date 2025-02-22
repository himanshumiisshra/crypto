import { Server } from "socket.io";
import { mexcFutureMarketModel } from "./model";
import mexc_future_market_schema from "./schema";
import { Server as HttpServer } from "http";


const MEXC_WS_URL = "wss://wbs.mexc.com/ws";


export default class mexCFutureMarketService {
    private io: Server;
    private socket: WebSocket | null = null;

    constructor(server: HttpServer) {
        this.io = new Server(server, {
            cors: { origin: "*" },
        });

        this.initializeWebSocket();
    }

    private initializeWebSocket() {

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log("✅ WebSocket already connected, no need to reconnect.");
            return;
        }


        this.socket = new WebSocket(MEXC_WS_URL);

        this.socket.onopen = () => {
            console.log("✅ Connected to MEXC WebSocket");

            this.subscribeToChannel("BTCUSDT");
        };

        this.socket.onmessage = async (event) => {
            console.log("Received data from MEXC:", event.data);
            try {
                const json = JSON.parse(event.data.toString());
                console.log("checking for JSON Data", json);

                if (json.d.e === "spot@public.deals.v3.api") {
                    console.log("✅ Processing spot deals", json.d);


                    const deal = json.d.deals[0];
                    console.log("📊 Deal Data:", deal);

                    const ohlcvData = {
                        symbol: json.s,
                        openTime: deal.t,
                        open: deal.p,
                        high: deal.p,
                        low: deal.p,
                        close: deal.p,
                        volume: deal.v,
                        closeTime: deal.t,
                    };

                    console.log("📊 Extracted OHLCV Data:", ohlcvData);

                    await this.create(ohlcvData);
                    console.log("✅ Futures OHLCV Data Saved Successfully");

                    this.io.emit("ohlcv_update", ohlcvData);
                    console.log("📡 Data Emitted to Clients:", ohlcvData);
                } else {
                    console.log("⚠️ No valid deals found or invalid data received");
                }

            } catch (error) {
                console.error("❌ WebSocket Data Error:", error);
            }
        };

        this.socket.onerror = (error) => {
            console.error("❌ WebSocket Error: ", error);
        };

        this.socket.onclose = (event) => {
            console.log("⚠️ MEXC WebSocket Disconnected. Reconnecting...");
            if (event.code !== 1000) {
                console.log("⚠️ WebSocket closed with error code:", event.code, event.reason);
            }
            setTimeout(() => this.initializeWebSocket(), 5000);
        };
    }

    private subscribeToChannel(symbol: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.log("⚠️ WebSocket is not open. Unable to subscribe.");
            return;
        }

        console.log(`Subscribing to ${symbol} on MEXC WebSocket`);
        const subscribeMessage = JSON.stringify({
            method: "SUBSCRIPTION",
            params: [`spot@public.deals.v3.api@${symbol}`],
            id: 1,
        });

        this.socket.send(subscribeMessage);
    }

    async create(data: mexcFutureMarketModel) {
        console.log("Saving data to database:", data);

        try {
            if (!data.symbol || !data.openTime || !data.closeTime) {
                console.error("❌ Invalid data, missing required fields:", data);
                return;
            }

            const bfm = new mexc_future_market_schema(data);
            console.log("Checking the data to be saved", bfm);

            const validationError = bfm.validateSync();
            if (validationError) {
                console.error("❌ Data validation failed:", validationError);
                return;
            }

            const savedData = await bfm.save();
            console.log("Data saved successfully to MongoDB:", savedData);
        } catch (error: any) {
            console.error(`❌ Error saving OHLCV Data: ${error.message}`);
            console.error("Detailed error info:", error);
        }
    }


    async find(filter: any) {
        try {
            return await mexc_future_market_schema.find(filter);
        } catch (error: any) {
            console.error(`❌ Error fetching OHLCV Data: ${error.message}`);
            throw error;
        }
    }
}

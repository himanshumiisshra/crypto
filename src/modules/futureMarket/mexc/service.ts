import {mexcFutureMarketModel} from "./model";
import mexc_future_market_schema from "./schema";
import { Server } from "socket.io";

const MEXC_FUTURE_WS = "wss://wbs.mexc.com/ws";

export default class mexCFutureMarketService {
    private io: Server;
    private socket: WebSocket | null = null;

    constructor(server: any) {
        this.io = new Server(server, {
            cors: { origin: "*" },
        });

        this.initializeWebSocket();
    }

    private initializeWebSocket() {
            this.socket = new WebSocket(MEXC_FUTURE_WS);
    
            this.socket.onopen = () => console.log("✅ Connected to Binance Futures WebSocket");
    
            this.socket.onmessage = async (event) => {
                try {
                    const json = JSON.parse(event.data.toString());
    
                    if (json.e === "kline") {
                        const kline = json.k;
    
                        const ohlcvData = {
                            symbol: json.s,
                            interval: kline.i,
                            openTime: kline.t,
                            open: kline.o,
                            high: kline.h,
                            low: kline.l,
                            close: kline.c,
                            volume: kline.v,
                            closeTime: kline.T,
                        };
    
                        // Save to MongoDB
                        await this.create(ohlcvData);
    
                        // Emit live OHLCV data to clients
                        this.io.emit("ohlcv_update", ohlcvData);
    
                        console.log("📊 Futures OHLCV Data Saved & Emitted:", ohlcvData);
                    }
                } catch (error) {
                    console.error("❌ WebSocket Data Error:", error);
                }
            };
    
            this.socket.onerror = (error) => {
                console.error("❌ WebSocket Error:", error);
            };
    
            this.socket.onclose = () => {
                console.log("⚠️ Binance WebSocket Disconnected. Reconnecting...");
                setTimeout(() => this.initializeWebSocket(), 5000); // Auto-reconnect
            };
        }
    
        async create(data: mexcFutureMarketModel) {
            try {
                const bfm = new mexc_future_market_schema(data);
                return await bfm.save();
            } catch (error: any) {
                throw new Error(`❌ Error saving OHLCV Data: ${error.message}`);
            }
        }
    
        // ✅ Add the missing `find` method
        async find(filter: any) {
            try {
                return await mexc_future_market_schema.find(filter);
            } catch (error: any) {
                throw new Error(`❌ Error fetching OHLCV Data: ${error.message}`);
            }
        }
}

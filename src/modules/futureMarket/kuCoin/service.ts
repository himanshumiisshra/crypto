import { Server } from "socket.io";
import kuCoinFutureMarketSchema from "./schema";
import { kuCoinFutureMarketModel } from "./model";
import axios from "axios";

// Function to get the KuCoin WebSocket token
async function getKuCoinToken() {
    let retries = 3;
    while (retries > 0) {
        try {
            const response = await axios.post('https://api.kucoin.com/api/v1/bullet-public');
            return response.data.data.token;
        } catch (error: any) {
            console.error(`❌ Failed to get KuCoin WebSocket token (attempt ${4 - retries}):`, error.message);
            retries--;
            if (retries === 0) {
                console.error('❌ All attempts failed. Returning null.');
                return null;
            }
            // Wait for a second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return null;
}


export default class kuCoinFutureMarketService {
    private io: Server;
    private socket: WebSocket | null = null;

    constructor(server: any) {
        this.io = new Server(server, {
            cors: { origin: "*" }
        });
        this.initializeKuCoinWebSocket();
    }

    // Initialize KuCoin WebSocket connection and fetch OHLCV data
    private async initializeKuCoinWebSocket() {
        const token = await getKuCoinToken();
        if (!token) {
            console.error("❌ Failed to get KuCoin WebSocket token");
            return;
        }

        const kuCoinWsUrl = `wss://ws-api.kucoin.com/endpoint?token=${token}`;
        this.socket = new WebSocket(kuCoinWsUrl);

        this.socket.onopen = () => {
            console.log("✅ Connected to KuCoin WebSocket");

            // Subscribe to BTC-USDT 1-minute candles (can replace with dynamic symbol if needed)
            this.socket?.send(JSON.stringify({
                id: Date.now(),
                type: "subscribe",
                topic: "/market/candles:BTC-USDT_1min",
                privateChannel: false,
                response: true
            }));
        };

        this.socket.onmessage = async (event) => {
            try {
                const json = JSON.parse(event.data.toString());

                // Process Kline (OHLCV) data
                if (json.e === "kline") {
                    const kline = json.k;

                    // Prepare OHLCV data
                    const ohlcvData: kuCoinFutureMarketModel = {
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

                    // Save OHLCV data to MongoDB
                    await this.create(ohlcvData);

                    // Emit live OHLCV data to clients using socket.io
                    this.io.emit("ohlcv_update", ohlcvData);
                    console.log("📊 KuCoin Futures OHLCV Data Saved & Emitted:", ohlcvData);
                }
            } catch (error) {
                console.error("❌ WebSocket Data Error:", error);
            }
        };

        this.socket.onerror = (error) => {
            console.error("❌ WebSocket Error:", error);
        };

        this.socket.onclose = () => {
            console.log("⚠️ KuCoin WebSocket Disconnected. Reconnecting...");
            setTimeout(() => this.initializeKuCoinWebSocket(), 5000); // Auto-reconnect on disconnect
        };
    }

    // Method to save the OHLCV data to MongoDB
    async create(data: kuCoinFutureMarketModel) {
        try {
            const ohlcvRecord = new kuCoinFutureMarketSchema(data);
            return await ohlcvRecord.save(); // Save the data to MongoDB
        } catch (error: any) {
            throw new Error(`❌ Error saving OHLCV Data: ${error.message}`);
        }
    }

    // Method to find data from the database (if needed)
    async find(filter: any) {
        try {
            return await kuCoinFutureMarketSchema.find(filter);
        } catch (error: any) {
            throw new Error(`❌ Error fetching OHLCV Data: ${error.message}`);
        }
    }
}

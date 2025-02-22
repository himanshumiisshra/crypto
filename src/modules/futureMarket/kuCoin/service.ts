import { Server } from "socket.io";
import { kuCoinFutureMarketModel } from "./model";
import kuCoinFutureMarketSchema from "./schema";
import { Server as HttpServer } from "http";
import axios from "axios";


const KUCOIN_WS_URL = "wss://ws-api.kucoin.com/endpoint";


export default class kuCoinFutureMarketService {
    private io: Server;
    private socket: WebSocket | null = null;
    private symbols: string[];

    constructor(server: HttpServer, symbols: string[] = ['XBTUSDTM', 'BTC-USDT']) {
        this.io = new Server(server, {
            cors: { origin: "*" },
        });
        this.symbols = symbols;
        this.initializeKuCoinWebSocket();
    }


    private async initializeKuCoinWebSocket() {
        console.log("Initializing KuCoin WebSocket...");

        const token = await this.getKuCoinToken();
        if (!token) {
            console.error("❌ Failed to get KuCoin WebSocket token");
            return;
        }

        const kuCoinWsUrl = `wss://ws-api.kucoin.com/endpoint?token=${token}`;
        this.socket = new WebSocket(kuCoinWsUrl);

        this.socket.onopen = () => {
            console.log("✅ Connected to KuCoin WebSocket");

            // Initial message to acknowledge the connection
            this.socket?.send(JSON.stringify({
                id: Date.now(),
                type: "subscribe",
                topic: "/contractMarket/limitCandle:XBTUSDTM_1hour", // Example topic
                response: true
            }));
            console.log(`Subscribed to: /contractMarket/limitCandle:XBTUSDTM_1hour`);
        };

        this.socket.onmessage = async (event) => {
            try {
                const json = JSON.parse(event.data.toString());
                console.log("Received data from KuCoin:", json);

                // Handling acknowledgment message
                if (json.type === "ack" && json.id) {
                    console.log(`Acknowledgment received for id: ${json.id}`);
                    // Send subscription message again using the received id
                    this.socket?.send(JSON.stringify({
                        id: json.id,
                        type: "subscribe",
                        topic: "/contractMarket/limitCandle:XBTUSDTM_1hour",
                        response: true
                    }));
                    console.log(`Re-subscribed with id: ${json.id}`);
                }

                // Handling incoming message data (candlestick data)
                if (json.type === "message" && json.subject === "candle.stick" && json.data) {
                    const { symbol, candles } = json.data;

                    // Process the received Kline (candlestick) data
                    const kline = candles;
                    const ohlcvData: kuCoinFutureMarketModel = {
                        symbol,            // Symbol (e.g., BTC-USDT or XBTUSDTM)
                        interval: "1hour", // Interval (e.g., 1 hour)
                        openTime: kline[0], // Start time of the candle cycle
                        open: kline[1],     // Open price
                        high: kline[2],     // High price
                        low: kline[3],      // Low price
                        close: kline[4],    // Close price
                        volume: kline[5],   // Volume (not to use in this case)
                        closeTime: kline[6] // Close time (not to be used)
                    };

                    // Save OHLCV data to MongoDB
                    await this.create(ohlcvData);

                    // Emit the OHLCV data to clients using socket.io
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
            setTimeout(() => this.initializeKuCoinWebSocket(), 5000);
        };
    }


    private async create(data: kuCoinFutureMarketModel) {
        try {
            const ohlcvRecord = new kuCoinFutureMarketSchema(data);
            return await ohlcvRecord.save();
        } catch (error: any) {
            console.error(`❌ Error saving OHLCV Data: ${error.message}`);
            throw new Error(`❌ Error saving OHLCV Data: ${error.message}`);
        }
    }

    private async getKuCoinToken() {
        try {

            const response = await axios.post('https://api.kucoin.com/api/v1/bullet-public');
            return response.data.data.token;
        } catch (error: any) {
            console.error("❌ Error fetching KuCoin WebSocket token:", error.message);
            return null;
        }
    }



    public async find(filter: any) {
        try {

            return await kuCoinFutureMarketSchema.find(filter).sort({ openTime: -1 });
        } catch (error: any) {
            console.error(`❌ Error fetching OHLCV Data: ${error.message}`);
            throw new Error(`❌ Error fetching OHLCV Data: ${error.message}`);
        }
    }
}

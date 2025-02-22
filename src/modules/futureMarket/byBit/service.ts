import { Server } from "socket.io";
import byBit_future_market_schema from "./schema";
import { byBitFutureMarketModel } from "./model";


const BYBIT_SPOT_WS = "wss://stream.bybit.com/v5/public/spot";

export default class ByBitSpotService {
    private io: Server;
    private socket: WebSocket | null = null;

    constructor(server: any) {
        this.io = new Server(server, {
            cors: { origin: "*" }
        });

        this.startByBitSpotWebSocket();
    }

    private startByBitSpotWebSocket() {
        console.log('🚀 Starting ByBit Spot WebSocket Stream...');

        this.socket = new WebSocket(BYBIT_SPOT_WS);

        this.socket.onopen = () => {
            console.log('✅ Connected to ByBit Spot WebSocket');

            const subscriptionMessage = JSON.stringify({
                op: "subscribe",
                args: ["publicTrade.BTCUSDT"]
            });
            this.socket?.send(subscriptionMessage);
        };

        this.socket.onmessage = async (event) => {
            try {
                const parsedData = JSON.parse(event.data);

                if (parsedData.topic !== "publicTrade.BTCUSDT" || !parsedData.data) {
                    console.warn("⚠️ Unexpected data format:", parsedData);
                    return;
                }

                for (const trade of parsedData.data) {
                    const { s: symbol, p: price, v: volume, S: side, T: timestamp } = trade;

                    console.log(`🔹 ByBit Spot - Symbol: ${symbol}, Price: ${price}, Volume: ${volume}, Side: ${side}`);


                    const interval = '1m';
                    const openTime = timestamp;
                    const open = price;
                    const high = price;
                    const low = price;
                    const close = price;
                    const closeTime = timestamp + 60000;

                    const ohlcvData = {
                        exchange: 'ByBit',
                        symbol,
                        price,
                        volume: volume.toString(),
                        side,
                        timestamp: new Date(timestamp),
                        interval,
                        openTime,
                        open,
                        high,
                        low,
                        close,
                        closeTime,
                    };

                    await new byBit_future_market_schema(ohlcvData).save();

                    console.log('💾 Spot Data Saved');

                    this.io.emit("spot_trade_update", {
                        symbol,
                        price,
                        volume,
                        side,
                        timestamp
                    });

                    console.log('📡 Emitted Spot Trade Update to Clients');
                }
            } catch (error) {
                console.error('❌ Error Processing ByBit Spot Data:', error);
                console.debug('📩 Raw WebSocket data:', event.data);
            }
        };

        this.socket.onclose = () => {
            console.log('❌ ByBit Spot WebSocket Disconnected. Reconnecting in 5s...');
            setTimeout(() => this.startByBitSpotWebSocket(), 5000);
        };

        this.socket.onerror = (error: any) => {
            console.error('❌ WebSocket Error:', error);
        };
    }

    async find(filter: any) {
        try {
            return await byBit_future_market_schema.find(filter);
        } catch (error: any) {
            throw new Error(`❌ Error fetching Spot data: ${error.message}`);
        }
    }

    async create(data: byBitFutureMarketModel) {
        try {
            const record = new byBit_future_market_schema(data);
            return await record.save();
        } catch (error: any) {
            throw new Error(`❌ Error saving Spot data: ${error.message}`);
        }
    }
}

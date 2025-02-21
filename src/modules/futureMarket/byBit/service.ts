import { Server } from "socket.io";
import byBit_future_market_schema from "./schema"; // Assuming the schema is correctly defined
import { byBitFutureMarketModel } from "./model"; // Assuming the model is correctly defined

// WebSocket URL for ByBit Spot
const BYBIT_SPOT_WS = "wss://stream.bybit.com/v5/public/spot"; // ByBit Spot WebSocket URL

export default class ByBitSpotService {
    private io: Server;
    private socket: WebSocket | null = null;

    constructor(server: any) {
        this.io = new Server(server, {
            cors: { origin: "*" }
        });

        this.startByBitSpotWebSocket(); // Initialize the Spot WebSocket
    }

    private startByBitSpotWebSocket() {
        console.log('🚀 Starting ByBit Spot WebSocket Stream...');

        // Establish the native WebSocket connection to ByBit Spot
        this.socket = new WebSocket(BYBIT_SPOT_WS); 

        this.socket.onopen = () => {
            console.log('✅ Connected to ByBit Spot WebSocket');

            // Subscribe to publicTrade topic for BTC/USDT
            const subscriptionMessage = JSON.stringify({
                op: "subscribe",
                args: ["publicTrade.BTCUSDT"]
            });
            this.socket?.send(subscriptionMessage); // Send subscription message
        };

        this.socket.onmessage = async (event) => {
            try {
                const parsedData = JSON.parse(event.data);

                // Check if the topic matches and data exists
                if (parsedData.topic !== "publicTrade.BTCUSDT" || !parsedData.data) {
                    console.warn("⚠️ Unexpected data format:", parsedData);
                    return;
                }

                // Process each trade in the snapshot
                for (const trade of parsedData.data) {
                    const { s: symbol, p: price, v: volume, S: side, T: timestamp } = trade;

                    console.log(`🔹 ByBit Spot - Symbol: ${symbol}, Price: ${price}, Volume: ${volume}, Side: ${side}`);

                    // Mock OHLC data, this is just an example, you might need to implement your own logic
                    const interval = '1m';  // Example: set a fixed interval
                    const openTime = timestamp;
                    const open = price;  // Assuming the open price is the trade price
                    const high = price;  // For simplicity, setting high = price (you can calculate from multiple trades)
                    const low = price;   // For simplicity, setting low = price (you can calculate from multiple trades)
                    const close = price; // Assuming close price is the trade price
                    const closeTime = timestamp + 60000;  // Example: close time is 1 minute after open

                    // Create the object to save to the database
                    const ohlcvData = {
                        exchange: 'ByBit',      // Static exchange name
                        symbol,                // From the trade data
                        price,                 // Price from the trade data
                        volume: volume.toString(), // Convert volume to string if it's numeric
                        side,                  // Side (buy/sell) from the trade data
                        timestamp: new Date(timestamp), // Convert timestamp to Date
                        interval,              // Example interval, should be dynamic if needed
                        openTime,              // Trade timestamp as open time
                        open,                  // Open price from the trade
                        high,                  // High price (you can calculate from multiple trades)
                        low,                   // Low price (you can calculate from multiple trades)
                        close,                 // Close price from the trade
                        closeTime,             // Close time (1 minute after open for example)
                    };

                    // Save to MongoDB using the schema
                    await new byBit_future_market_schema(ohlcvData).save();

                    console.log('💾 Spot Data Saved');

                    // Emit live data to clients using socket.io
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
            setTimeout(() => this.startByBitSpotWebSocket(), 5000); // Reconnect after disconnection
        };

        this.socket.onerror = (error: any) => {
            console.error('❌ WebSocket Error:', error);
        };
    }

    // Add the find method for querying data from the database
    async find(filter: any) {
        try {
            return await byBit_future_market_schema.find(filter); // Query the ByBit future market data
        } catch (error: any) {
            throw new Error(`❌ Error fetching Spot data: ${error.message}`);
        }
    }

    // You can add other utility methods, like creating new records, etc.
    async create(data: byBitFutureMarketModel) {
        try {
            const record = new byBit_future_market_schema(data); // Assuming you're saving to MongoDB
            return await record.save(); // Save the data to the database
        } catch (error: any) {
            throw new Error(`❌ Error saving Spot data: ${error.message}`);
        }
    }
}

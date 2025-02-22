import { Server } from "socket.io";
import { mexcFutureMarketModel } from "./model";
import mexc_future_market_schema from "./schema";
import { Server as HttpServer } from "http"; // Import the socket.io-client properly

// MEXC WebSocket URL
const MEXC_WS_URL = "wss://wbs.mexc.com/ws";

// MEXC Future Market Service Class
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
        // Only initialize the WebSocket if it doesn't exist
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log("✅ WebSocket already connected, no need to reconnect.");
            return;
        }

        // Initialize WebSocket connection to MEXC
        this.socket = new WebSocket(MEXC_WS_URL);

        this.socket.onopen = () => {
            console.log("✅ Connected to MEXC WebSocket");
            // You can subscribe to the symbol or channel after the connection is open
            this.subscribeToChannel("BTCUSDT"); // Example, subscribe to BTCUSDT
        };

        this.socket.onmessage = async (event) => {
            console.log("Received data from MEXC:", event.data);
            try {
                const json = JSON.parse(event.data.toString());
                console.log("checking for JSON Data", json);

                // Handling data for 'spot' deals
                // Handling data for 'spot' deals
                if (json.d.e === "spot@public.deals.v3.api") {
                    console.log("✅ Processing spot deals",json.d);

                    // Extracting the first deal (assuming you want to work with the first deal)
                    const deal = json.d.deals[0];
                    console.log("📊 Deal Data:", deal);

                    const ohlcvData = {
                        symbol: json.s,               // The symbol, e.g., 'BTCUSDT'
                        openTime: deal.t,             // Timestamp for the deal (open time)
                        open: deal.p,                 // Price from deal (this is assumed to be the "close" price)
                        high: deal.p,                 // Since no high/low provided, using the same value for simplicity
                        low: deal.p,                  // Same assumption for "low" price
                        close: deal.p,                // Assuming the close price is the same as deal price
                        volume: deal.v,               // Volume of the deal
                        closeTime: deal.t,            // Using the same timestamp as "close time" for now
                    };

                    // Log the data being processed before saving to MongoDB
                    console.log("📊 Extracted OHLCV Data:", ohlcvData);

                    // try {
                        // Save the extracted OHLCV data to MongoDB
                        await this.create(ohlcvData);
                        console.log("✅ Futures OHLCV Data Saved Successfully");

                        // Emit the data to connected clients in real-time
                        this.io.emit("ohlcv_update", ohlcvData);
                        console.log("📡 Data Emitted to Clients:", ohlcvData);
                    // } catch (error) {
                    //     console.error("❌ Error Saving OHLCV Data:", error);
                    // }
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
            if (event.code !== 1000) { // Check if the closure is unexpected
                console.log("⚠️ WebSocket closed with error code:", event.code, event.reason);
            }
            setTimeout(() => this.initializeWebSocket(), 5000); // Auto-reconnect
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

    // Method to save the OHLCV data to MongoDB
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

    // Method to find data from the database (if needed)
    async find(filter: any) {
        try {
            return await mexc_future_market_schema.find(filter);
        } catch (error: any) {
            console.error(`❌ Error fetching OHLCV Data: ${error.message}`);
            throw error;
        }
    }
}

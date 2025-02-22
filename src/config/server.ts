import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
var bodyParser = require('body-parser');
import { futureMarketRoute } from "../routes/futureMarketRoute/futureMarketRoute";


class App {
    public app: express.Application;
    public server: any;
    public io: Server;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, { cors: { origin: "*" } });

        this.config();
        this.mongoSetup();
        this.socketSetup();
        this.routes();
    }

    private config(): void {
        this.app.use(cors({ origin: "*" }));
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(bodyParser.json({ limit: "60mb" }));
    }


    private mongoSetup(): void {
        const mongoUri = "mongodb+srv://himanshu90210:Bhumbumbhole1@cluster90210.1phpfjw.mongodb.net/balkan_tech_solution"; // Fallback URI

        mongoose.connect(mongoUri)
            .then(() => {
                console.log("DATABASE is CONNECTED! 🚀");
            })
            .catch((error: any) => {
                console.log("Error DATABASE =>", error);
            });
    }

    private socketSetup(): void {
        this.io.on("connection", (socket) => {
            console.log("⚡ New WebSocket Connection:", socket.id);

            socket.on("disconnect", () => {
                console.log("❌ WebSocket Disconnected:", socket.id);
            });
        });
    }

    private routes(): void {
        const futureMarket = new futureMarketRoute(this.server);
        futureMarket.route(this.app);
    }
}
const appInstance = new App();
export const app = appInstance.app;
export const server = appInstance.server;
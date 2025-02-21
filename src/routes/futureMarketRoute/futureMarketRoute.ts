import { Application, Request, Response } from "express";
import { futureMarketController } from "../../controller/futureMarketController/futureMarketController";

export class futureMarketRoute {
    private future_market_controller: futureMarketController;

    constructor(server: any) {
        this.future_market_controller = new futureMarketController(server); // Pass server instance
    }

    public route(app: Application): void {
        app.get("/futures/ohlcv", async (req: Request, res: Response) => {
            await this.future_market_controller.getAllOHLCV(req, res);
        });
    }
}
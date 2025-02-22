import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        symbol: {
            type: String,
            required: true, // Required field for the market symbol
        },
        openTime: {
            type: Number,
            required: true, // Required field for the opening timestamp
        },
        open: {
            type: String,
            required: true, // Required field for the opening price
        },
        high: {
            type: String,
            required: true, // Required field for the highest price
        },
        low: {
            type: String,
            required: true, // Required field for the lowest price
        },
        close: {
            type: String,
            required: true, // Required field for the closing price
        },
        volume: {
            type: String,
            required: true, // Required field for the volume of the deal
        },
        closeTime: {
            type: Number,
            required: true, // Required field for the closing timestamp
        },
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt fields
    }
);

export default mongoose.model("mexc_future_market_schema", schema);

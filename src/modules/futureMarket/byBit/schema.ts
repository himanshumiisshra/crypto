import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

const byBitFutureMarketSchema = new Schema({
    symbol: {
        type: String,
        required: true,  // Fixed typo from `requires` to `required`
    },
    interval: {
        type: String,
        required: true,
    },
    openTime: {
        type: Number,
        required: true,
    },
    open: {
        type: String,  // Can also be a Number if desired
        required: true,
    },
    high: {
        type: String,  // Can also be a Number if desired
        required: true,
    },
    low: {
        type: String,  // Can also be a Number if desired
        required: true,
    },
    close: {
        type: String,  // Can also be a Number if desired
        required: true,
    },
    volume: {
        type: String,  // Can also be a Number if desired
        required: true,
    },
    closeTime: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true  // Automatically adds `createdAt` and `updatedAt` fields
});

export default mongoose.model('ByBitFutureMarketSchema', byBitFutureMarketSchema);  // The model name can be anything you like

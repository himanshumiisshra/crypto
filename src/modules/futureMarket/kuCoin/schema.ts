import mongoose, { Schema, Document } from 'mongoose';

// Define the schema for KuCoin futures OHLCV data
const kuCoinFutureMarketSchema = new Schema({
    symbol: { type: String, required: true },
    interval: { type: String, required: true },
    openTime: { type: Number, required: true },
    open: { type: String, required: true },
    high: { type: String, required: true },
    low: { type: String, required: true },
    close: { type: String, required: true },
    volume: { type: String, required: true },
    closeTime: { type: Number, required: true },
}, {
    timestamps: true
});

export default mongoose.model('KuCoinFutureMarketSchema', kuCoinFutureMarketSchema);

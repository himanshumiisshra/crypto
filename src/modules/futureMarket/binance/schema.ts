import *  as mongoose from "mongoose";


const Schema = mongoose.Schema;
const schema = new Schema ({
    symbol:{
        type: String,
        requires: true,
    },
    interval: {
        type: String,
        required: true
    },
    openTime: {
        type: Number,
        required: true
    },
    open: {
        type: String,
        required: true
    },
    high: {
        type: String,
        required: true
    },
    low: {
        type: String,
        required: true
    },
    close:{
        type: String,
        required: true
    },
    volume: {
        type: String,
        required: true
    },
    closeTime: {
        type: Number,
        required: true
    },
},{
    timestamps: true, 
})

export default mongoose.model('binance_future_market_schema',schema)
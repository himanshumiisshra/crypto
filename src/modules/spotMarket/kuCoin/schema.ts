import *  as mongoose from "mongoose";


const Schema = mongoose.Schema;
const schema = new Schema ({
    symbol:{
        type: String,
        requires: true,
    },
    interval: {
        type: Number,
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
    createdAt : {
        timestamps : true,
        required: true
    }
})

export default mongoose.model('kuCoin_spot_market_schema',schema)
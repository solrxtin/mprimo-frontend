import mongoose from "mongoose"


const CountrySchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    currency: {type: String, required: true},
    currencySymbol: {type: String, required: true},
    exchangeRate: {type: Number, required: true, default: 1}, // Rate to USD
    lastExchangeUpdate: {type: Date, default: Date.now},
    delisted: {type: Boolean, default: false},
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

const Country = mongoose.model("Country", CountrySchema);

export default Country;
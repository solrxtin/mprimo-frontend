import mongoose from "mongoose"


const CountrySchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    currency: {type: String, required: true},
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
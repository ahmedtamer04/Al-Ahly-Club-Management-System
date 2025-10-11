import mongoose from "mongoose";

const conferenceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter conference name"]
    },

    start_date: {
        type: Date,
        required: true
    },

    end_date: {
        type: Date,
        required: true
    },

    description: {
        type: String,
        required: [true, "Please enter a short description"]
    },

    agenda: {
        type: String,
        required: [true, "Please enter full agenda"]
    },

    website: {
        type: String,
        required: [true, "Please enter conference website link"]
    },

    budget: {
        type: Number,
        required: [true, "Please enter the required budget"]
    },

    funding_source: {
        type: String,
        required: [true, "Please enter the source of funding"],
        enum: ["External", "GUC"]
    },

    resources: {
        type: String,
        required: [true, "Please enter any extra required resources"]
    },
});

export default mongoose.model("Conference", conferenceSchema);
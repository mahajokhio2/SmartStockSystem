const mongoose = require('mongoose');

// Define the schema for sensor data
const sensorSchema = new mongoose.Schema({
    itemId: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create and export the model
const Sensor = mongoose.model('Sensor', sensorSchema);
module.exports = Sensor;

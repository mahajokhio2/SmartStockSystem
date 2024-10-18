const mqtt = require('mqtt');
const mongoose = require('mongoose');
const request = require('request');
const express = require('express');
const http = require('http');


const numberOfSensors = 1; 

// Express.js setup
const app = express();
const server = http.createServer(app);
// Set up the MQTT broker connection
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// Listen for incoming MQTT messages

mqttClient.subscribe('inventory/stock');
mqttClient.subscribe('restock/notification');
console.log('Subscribed to MQTT topics: inventory/stock, restock/notification');


// MongoDB connection with Mongoose
mongoose.connect('mongodb+srv://mahajokhio:Mahaj123@rfidsensor.6zket.mongodb.net/RFIDSensor')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Access Token from Amazon Cognito
const accessToken = 'eyJraWQiOiJuN0x2RFp1djNpVk1BMWxhOEVyYVZhZWVtRWE1MWcyMzNUMmYzM3JDYW5jPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI5NGU4ZjQ5OC04MGExLTcwMjEtZWNiNy05ZmJjMGNjYjgzODEiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9yaU93ZEJOWmkiLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiIycXIwdjhmNjZoNHE4ZjZkYXAzMXFmcmRicyIsImV2ZW50X2lkIjoiOWQ1MDE1N2ItN2JiZS00NjU4LTk0NzktNmYwYTQ0ZWYxOWJlIiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJwaG9uZSBvcGVuaWQgZW1haWwiLCJhdXRoX3RpbWUiOjE3MjkyMDg2MzQsImV4cCI6MTcyOTI5NTAzNCwiaWF0IjoxNzI5MjA4NjM0LCJqdGkiOiJhM2NiOGIxZS1jNDc5LTQxMTItOTQ2OC05OTgwYjQ2OWFiYmMiLCJ1c2VybmFtZSI6Im1haGFqb2toaW8ifQ.pyxYdgA5eN8I15nZkJhRt5IrGE8eyVANGEWHdjUHSgBawuKxUVb-QNWW1P35YSp7bvl3TokIlANZRjOzgS6kIo_dOHMC-F0q4QXr0FL9TE2G0ZTbcnrhFo_7GiGmHxWWmj2jZBkIpT5E-4Pbl6Cym1jX8b5-t7NcMyLrZACbxaCVXvYCg3ZeMWQLs7ddNhbCIh0Tj9V4WN4ELh6hE2253sMw7l4OUvZIn1pcpdhxRzMcfQoG2axmIFvGBqFFRkbdVUVtrvvOn0wxZxMSWkAOL_T0t7wHO2-JnnKP0vkxjPu_lhduKFNujYHjtXejKzKM3U3cbupRQklCwH8d8knDsw';

// Function to send sensor data to API Gateway
const sendSensorDataToAPI = async (data, token) => {
    const options = {
        url: 'https://zn9oywdsa7.execute-api.us-east-1.amazonaws.com/dev/sensor-data',
        method: 'POST',
        json: true,
        body: data,
        headers: {
            Authorization: token,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                console.log('Data successfully sent to API Gateway:', body);
                resolve(body);
            } else if (response) {
                console.error(`Error creating data: StatusCode ${response.statusCode}, Body:`, body);
                reject(body);
            } else {
                console.error('Unknown error:', error);
                reject(error);
            }
        });
    });
};

// Function to simulate sensor data
const simulateSensorData = (sensorId) => {
    return {
        sensorId,
        itemId: Math.floor(Math.random() * 1000),
        quantity: Math.floor(Math.random() * 100),
        location: "Aisle " + (Math.floor(Math.random() * 10) + 1),
        timestamp: new Date().toISOString()
    };
};

// Simulate sensors and publish data every 5 seconds
const simulateSensors = async () => {
    for (let sensorId = 1; sensorId <= numberOfSensors; sensorId++) {
        setInterval(async () => {
            const data = simulateSensorData(sensorId);

            // Publish sensor data to MQTT broker
            mqttClient.publish('inventory/stock', JSON.stringify(data));
            console.log(`Published to MQTT by sensor_${sensorId}:`, JSON.stringify(data));

            // Edge processing: send data to API Gateway if quantity < 50
            if (data.quantity < 50) {
                console.log(`Edge processing by sensor_${sensorId}: Data passed the filter (Quantity < 50)`);
                try {
                    await sendSensorDataToAPI(data, accessToken);
                } catch (error) {
                    console.error(`Failed to send data from sensor_${sensorId}:`, error);
                }
            } else {
                console.log(`Edge processing by sensor_${sensorId}: Data discarded (Quantity >= 50)`);
            }
        }, 5000);
    }
};

// Start sensor simulation
simulateSensors();

mqttClient.on('message', (topic, message) => {
    const parsedMessage = JSON.parse(message.toString());

    if (topic === 'inventory/stock') {
        console.log('Received sensor data from MQTT:', parsedMessage);
    } else if (topic === 'restock/notification') {
        console.log('Received restock notification from MQTT:', parsedMessage);
    }
});

// Express route for serving index.html
app.get('/public', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start Express server for local website
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
   



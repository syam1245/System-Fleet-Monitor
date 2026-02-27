const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Telemetry = require('../models/Telemetry');

// Middleware to verify agent API key
const agentAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.AGENT_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Agent API Key' });
    }
    next();
};

// @route POST /api/telemetry
// @desc  Ingest telemetry data from Python Agent
router.post('/', agentAuth, async (req, res) => {
    try {
        const { deviceData, telemetryData } = req.body;

        if (!deviceData || !deviceData.deviceId) {
            return res.status(400).json({ error: 'Missing device data' });
        }

        // 1. Upsert Device Information
        await Device.findOneAndUpdate(
            { deviceId: deviceData.deviceId },
            {
                $set: {
                    hostname: deviceData.hostname,
                    specs: deviceData.specs,
                    status: 'Online',
                    lastSeen: Date.now()
                }
            },
            { upsert: true, new: true }
        );

        // 2. Insert Telemetry Document
        const telemetry = new Telemetry({
            metadata: { deviceId: deviceData.deviceId },
            measurements: telemetryData
        });

        await telemetry.save();

        // 3. Emit Real-time Update via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('telemetryUpdate', {
                device: deviceData,
                telemetry: telemetry
            });
        }

        res.status(201).json({ message: 'Telemetry logged successfully' });
    } catch (error) {
        console.error('Error ingesting telemetry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// @route GET /api/telemetry/:deviceId
// @desc  Get recent telemetry for a device (for React Dashboard)
router.get('/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        // Fetch the latest N telemetry readings for the given device
        const telemetry = await Telemetry.find({ 'metadata.deviceId': deviceId })
            .sort({ timestamp: -1 })
            .limit(limit);

        res.json(telemetry);
    } catch (error) {
        console.error('Error fetching telemetry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

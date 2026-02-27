const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

// @route GET /api/devices
// @desc Get all devices for the React Dashboard
router.get('/', async (req, res) => {
    try {
        const devices = await Device.find()
            .select('-__v')
            .sort({ lastSeen: -1 });

        res.json(devices);
    } catch (error) {
        console.error('Error fetching devices', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route GET /api/devices/:id
// @desc Get single device
router.get('/:id', async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.id });
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;

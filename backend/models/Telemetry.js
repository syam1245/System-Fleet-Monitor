const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    metadata: {
        deviceId: { type: String, required: true }
    },
    measurements: {
        // Hardware & Health
        batteryHealthPercent: Number,
        isCharging: Boolean,
        cpuTempAvg: Number,
        isThermalThrottling: Boolean,
        diskFreePct: Number,
        diskSmartPass: Boolean,
        ramUsagePct: Number,

        // Network
        pingLatencyMs: Number,
        packetLossPct: Number,

        // OS
        systemUptimeHours: Number,
    }
}, {
    // This explicitly creates a time-series collection in MongoDB
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes'
    }
});

module.exports = mongoose.model('Telemetry', telemetrySchema);

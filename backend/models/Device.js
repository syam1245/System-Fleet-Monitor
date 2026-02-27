const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true
    },
    hostname: {
        type: String,
        required: true
    },
    assignedUser: {
        type: String,
        default: 'Unknown'
    },
    specs: {
        os: String,
        cpu: String,
        totalRamGb: Number,
    },
    status: {
        type: String,
        enum: ['Online', 'Offline', 'Alert'],
        default: 'Online'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);

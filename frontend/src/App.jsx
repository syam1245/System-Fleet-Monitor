import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  Server, ShieldAlert, Cpu, HardDrive,
  Activity, Thermometer, Battery, Wifi
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function App() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef();

  // Initialize WebSockets for real-time live data streaming
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('telemetryUpdate', (payload) => {
      const { device, telemetry } = payload;

      // Update device list Last Seen status dynamically
      setDevices(prevDevices => {
        const existing = prevDevices.find(d => d.deviceId === device.deviceId);
        if (existing) {
          return prevDevices.map(d => d.deviceId === device.deviceId ? { ...d, lastSeen: Date.now() } : d);
        } else {
          // New device joined the fleet!
          return [{ ...device, lastSeen: Date.now() }, ...prevDevices];
        }
      });

      // If this telemetry update belongs to the CURRENTLY selected device, append it to the chart directly!
      setSelectedDevice(currSelected => {
        if (currSelected && currSelected.deviceId === device.deviceId) {
          const d = telemetry;
          const newPoint = {
            time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temp: d.measurements.cpuTempAvg || 45,
            ram: d.measurements.ramUsagePct,
            ping: d.measurements.pingLatencyMs || 0
          };

          setTelemetry(prevChartData => {
            const updated = [...prevChartData, newPoint];
            if (updated.length > 20) return updated.slice(updated.length - 20);
            return updated;
          });
        }
        return currSelected;
      });

    });

    return () => socketRef.current.disconnect();
  }, []);

  // Fetch all devices on load
  useEffect(() => {
    fetch('http://localhost:5000/api/devices')
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching devices", err);
        setLoading(false);
      });
  }, []);

  // Fetch telemetry when a device is selected
  useEffect(() => {
    if (selectedDevice) {
      fetch(`http://localhost:5000/api/telemetry/${selectedDevice.deviceId}?limit=20`)
        .then(res => res.json())
        .then(data => {
          // Reformat time for chart
          const chartData = data.reverse().map(d => ({
            time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temp: d.measurements.cpuTempAvg || 45, // Fallback if no temp sensor
            ram: d.measurements.ramUsagePct,
            ping: d.measurements.pingLatencyMs || 0
          }));
          setTelemetry(chartData);
        });
    }
  }, [selectedDevice]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="text-blue-400" size={28} />
          <h1 className="text-2xl font-bold tracking-tight">System Fleet Monitor</h1>
        </div>
        <div className="text-sm font-medium text-slate-300">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Device List */}
        <div className="w-1/3 border-r bg-white overflow-y-auto hidden md:block">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center">
              <Server className="mr-2" size={20} /> Monitored Agents ({devices.length})
            </h2>
          </div>
          <ul>
            {loading ? (
              <li className="p-4 text-center text-gray-500">Loading Fleet...</li>
            ) : devices.map(device => (
              <li
                key={device.deviceId}
                className={`p-4 border-b cursor-pointer transition-colors ${selectedDevice?.deviceId === device.deviceId ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                onClick={() => setSelectedDevice(device)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{device.hostname}</h3>
                    <p className="text-xs text-gray-500">{device.specs?.os}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${device.status === 'Alert' ? 'bg-red-100 text-red-800' : device.status === 'Offline' ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                    {device.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-400 flex items-center">
                  ID: {device.deviceId}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content Area: Device Details */}
        <div className="flex-1 bg-gray-50 overflow-y-auto p-6 md:p-8">
          {selectedDevice ? (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    {selectedDevice.hostname}
                  </h2>
                  <span className="text-sm text-gray-500">Last seen: {new Date(selectedDevice.lastSeen).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-blue-50 flex items-center space-x-3">
                    <Cpu className="text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Processor</p>
                      <p className="text-sm font-medium text-gray-800 truncate" title={selectedDevice.specs?.cpu}>{selectedDevice.specs?.cpu || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-indigo-50 flex items-center space-x-3">
                    <HardDrive className="text-indigo-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Memory</p>
                      <p className="text-sm font-medium text-gray-800">{selectedDevice.specs?.totalRamGb} GB RAM</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50 flex items-center space-x-3">
                    <Thermometer className="text-rose-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Thermal Status</p>
                      <p className="text-sm font-medium text-gray-800">
                        {telemetry.length > 0 ? `${telemetry[telemetry.length - 1].temp}°C` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 flex items-center space-x-3">
                    <Wifi className="text-emerald-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Network Ping</p>
                      <p className="text-sm font-medium text-gray-800">
                        {telemetry.length > 0 ? `${telemetry[telemetry.length - 1].ping} ms` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Activity className="mr-2 text-blue-500" size={20} /> Hardware Stress (RAM & Temp)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={telemetry}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={10} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="ram" name="RAM %" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="temp" name="Temp °C" stroke="#EF4444" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Wifi className="mr-2 text-emerald-500" size={20} /> Network Latency
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={telemetry}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="ping" name="Ping (ms)" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShieldAlert size={64} className="text-gray-200 mb-4" />
              <p className="text-xl font-semibold">Select a device from the fleet</p>
              <p className="text-sm mt-2">Waiting for telemetry data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

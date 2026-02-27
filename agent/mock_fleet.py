import time
import random
import requests
import uuid
import threading

API_ENDPOINT = "http://localhost:5000/api/telemetry"
API_KEY = "supersecretkey"

MOCK_DEVICES = [
    {
        "deviceId": "00:1A:2B:3C:4D:5E",
        "hostname": "HR-LAPTOP-01",
        "specs": {"os": "Windows 11", "cpu": "Intel Core i5-12400", "totalRamGb": 16.0}
    },
    {
        "deviceId": "00:1B:3C:4D:5E:6F",
        "hostname": "DEV-MACBOOK-PRO",
        "specs": {"os": "macOS 14.2", "cpu": "Apple M2 Pro", "totalRamGb": 32.0}
    },
    {
        "deviceId": "00:1C:4D:5E:6F:7A",
        "hostname": "MKT-DESKTOP-04",
        "specs": {"os": "Windows 10", "cpu": "AMD Ryzen 7 5800X", "totalRamGb": 16.0}
    },
    {
        "deviceId": "00:1D:5E:6F:7A:8B",
        "hostname": "EXEC-SURFACE-02",
        "specs": {"os": "Windows 11", "cpu": "Intel Core i7-1165G7", "totalRamGb": 16.0}
    },
    {
        "deviceId": "00:1E:6F:7A:8B:9C",
        "hostname": "IT-SERVER-MAIN",
        "specs": {"os": "Windows Server 2022", "cpu": "Intel Xeon Silver 4210", "totalRamGb": 128.0}
    }
]

def generate_telemetry(device):
    # Base profiles for simulation
    if "SERVER" in device["hostname"]:
        return {
            "batteryHealthPercent": None,
            "isCharging": True,
            "cpuTempAvg": random.uniform(40.0, 55.0),
            "isThermalThrottling": False,
            "diskFreePct": random.uniform(45.0, 50.0), # Stable storage
            "diskSmartPass": True,
            "ramUsagePct": random.uniform(60.0, 85.0), # Working hard
            "pingLatencyMs": random.randint(1, 5), # Fast wired connection
            "packetLossPct": 0,
            "systemUptimeHours": 1440.0 # 60 days
        }
    elif "MACBOOK" in device["hostname"]:
        return {
            "batteryHealthPercent": 95,
            "isCharging": random.choice([True, False]),
            "cpuTempAvg": random.uniform(35.0, 45.0), # Cool Apple Silicon
            "isThermalThrottling": False,
            "diskFreePct": random.uniform(10.0, 20.0), # Getting full
            "diskSmartPass": True,
            "ramUsagePct": random.uniform(30.0, 50.0),
            "pingLatencyMs": random.randint(15, 45), # WiFi
            "packetLossPct": 0,
            "systemUptimeHours": 48.0
        }
    else:
        # Standard struggling windows laptop
        temp = random.uniform(60.0, 95.0)
        return {
            "batteryHealthPercent": random.uniform(40.0, 85.0),
            "isCharging": random.choice([True, False]),
            "cpuTempAvg": temp,
            "isThermalThrottling": temp > 90.0,
            "diskFreePct": random.uniform(5.0, 60.0), 
            "diskSmartPass": True,
            "ramUsagePct": random.uniform(70.0, 95.0), # Chrome eating RAM
            "pingLatencyMs": random.randint(20, 200), # Spotty WiFi
            "packetLossPct": random.randint(0, 5),
            "systemUptimeHours": random.uniform(2.0, 200.0)
        }

def simulate_device(device):
    print(f"[{device['hostname']}] Agent Initialized. Sending telemetry every 10 seconds.")
    # Send historical data to populate the charts immediately!
    for _ in range(5):
        try:
            telemetry = generate_telemetry(device)
            payload = {"deviceData": device, "telemetryData": telemetry}
            headers = {"Content-Type": "application/json", "x-api-key": API_KEY}
            requests.post(API_ENDPOINT, json=payload, headers=headers)
        except Exception:
            pass
            
    while True:
        try:
            telemetry = generate_telemetry(device)
            payload = {"deviceData": device, "telemetryData": telemetry}
            headers = {"Content-Type": "application/json", "x-api-key": API_KEY}
            
            requests.post(API_ENDPOINT, json=payload, headers=headers)
            print(f"[{device['hostname']}] Sent update.")
        except Exception as e:
            print(f"[{device['hostname']}] Error: {e}")
        time.sleep(10) # Fast updates for simulation

if __name__ == "__main__":
    print("Starting Mock Fleet Simulator...")
    threads = []
    for d in MOCK_DEVICES:
        t = threading.Thread(target=simulate_device, args=(d,))
        t.daemon = True
        t.start()
        threads.append(t)
        
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping simulator.")

import os
import sys
import time
import socket
import platform
import subprocess
import requests
import psutil

try:
    import wmi
    HAS_WMI = True
except ImportError:
    HAS_WMI = False

API_ENDPOINT = "http://localhost:5000/api/telemetry"
API_KEY = "supersecretkey"
COLLECTION_INTERVAL = 300 # 5 minutes

import uuid

def get_device_info():
    """Get static metadata about the device."""
    # Try to get a unique identifier (like MAC address)
    node = uuid.getnode()
    mac = ':'.join(['{:02x}'.format((node >> elements) & 0xff) 
                   for elements in range(0, 2*6, 2)][::-1])
    
    # Simple fallback if mac address is somehow zero or fails
    if not mac or mac == "00:00:00:00:00:00":
        mac = str(socket.gethostname())

    cpu_info = "Unknown"
    if platform.system() == "Windows" and HAS_WMI:
        try:
            c = wmi.WMI()
            cpu_info = c.Win32_Processor()[0].Name
        except Exception:
            cpu_info = platform.processor()
    else:
        cpu_info = platform.processor()

    return {
        "deviceId": mac.upper(),
        "hostname": socket.gethostname(),
        "specs": {
            "os": f"{platform.system()} {platform.release()}",
            "cpu": cpu_info,
            "totalRamGb": round(psutil.virtual_memory().total / (1024 ** 3), 2)
        }
    }

def ping_latency(host="8.8.8.8"):
    """Ping a host to get latency."""
    try:
        if platform.system() == "Windows":
            output = subprocess.check_output(["ping", "-n", "1", host], universal_newlines=True)
            if "time=" in output:
                # Extract time=XXms
                ms = int(output.split("time=")[1].split("ms")[0])
                return ms
        else:
            output = subprocess.check_output(["ping", "-c", "1", host], universal_newlines=True)
            if "time=" in output:
                ms = float(output.split("time=")[1].split(" ")[0])
                return ms
    except Exception:
        pass
    return None

def get_telemetry():
    """Gather dynamic system health data."""
    # Battery
    battery_health = None
    is_charging = False
    if hasattr(psutil, "sensors_battery"):
        bat = psutil.sensors_battery()
        if bat:
            battery_health = bat.percent
            is_charging = bat.power_plugged

    # Disk Status
    disk_free_pct = None
    try:
        disk_usage = psutil.disk_usage('/') if platform.system() != "Windows" else psutil.disk_usage('C:\\')
        disk_free_pct = 100 - disk_usage.percent
    except Exception:
        pass

    # RAM
    ram_usage_pct = psutil.virtual_memory().percent

    # CPU Temp (often complex on windows, psutil sometimes supports it on Linux)
    cpu_temp = None
    is_throttling = False
    if platform.system() != "Windows" and hasattr(psutil, "sensors_temperatures"):
        try:
            temps = psutil.sensors_temperatures()
            if temps and 'coretemp' in temps:
                cpu_temp = temps['coretemp'][0].current
        except Exception:
            pass

    # Basic network check
    latency = ping_latency()

    # Uptime
    uptime_hours = (time.time() - psutil.boot_time()) / 3600

    return {
        "batteryHealthPercent": battery_health,
        "isCharging": is_charging,
        "cpuTempAvg": cpu_temp,
        "isThermalThrottling": is_throttling,
        "diskFreePct": disk_free_pct,
        "diskSmartPass": True, # Placeholder, true SMART requires elevated privileged access to disk drives
        "ramUsagePct": ram_usage_pct,
        "pingLatencyMs": latency,
        "packetLossPct": 0 if latency is not None else 100,
        "systemUptimeHours": round(uptime_hours, 2)
    }

def main():
    print(f"Starting System Fleet Monitor Agent on [{socket.gethostname()}]")
    print(f"Posting to: {API_ENDPOINT} every {COLLECTION_INTERVAL}s")
    
    device_info = get_device_info()
    print(f"Device Identity: {device_info['deviceId']}")

    while True:
        try:
            telemetry_data = get_telemetry()
            payload = {
                "deviceData": device_info,
                "telemetryData": telemetry_data
            }
            
            headers = {
                "Content-Type": "application/json",
                "x-api-key": API_KEY
            }
            
            response = requests.post(API_ENDPOINT, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 201:
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Telemetry synced successfully.")
            else:
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Failed to sync: {response.text}")
                
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Connection Error: {e}")
            
        time.sleep(COLLECTION_INTERVAL)

if __name__ == "__main__":
    main()

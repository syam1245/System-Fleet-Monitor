# System Fleet Monitor 🖥️📊

A comprehensive, full-stack IT infrastructure monitoring solution built to proactively track the hardware health and network stability of a massive fleet of client computers (Windows/macOS). 

Unlike traditional passive monitoring, this system relies on a lightweight, autonomous **Python Agent** running on edge devices that securely transmits high-frequency telemetry back to a centralized **Node.js/MongoDB Backend**, which is visualized on a real-time **React/Vite Dashboard**.

## Key Features 🚀

- **Proactive Hardware Diagnostics:** Avoid helpdesk tickets by monitoring CPU thermal throttling, RAM spikes, and SSD/HDD capacity limits.
- **Network Quality Tracing:** Track latency and packet loss using native ICMP pinging to differentiate between "bad Wi-Fi" and real routing issues.
- **Real-Time Triage Dashboard:** Built with React and Recharts, the UI categorizes devices by health status allowing technicians to drill down into 7-day historical hardware trends.
- **Time-Series Database:** Engineered using MongoDB's Time-Series collections, the backend effortlessly scales to ingest thousands of high-velocity metrics per minute without crashing.

---

## System Architecture 🏗️

The project is broken into three distinct services:

1. **Agent (`/agent`)**: A locally-installed Python daemon that uses `psutil` and `wmi` to scrape hardware sensors and network states every 5 minutes.
2. **Backend (`/backend`)**: A robust Express.js REST API that ingests agent payloads, updates device metadata, and writes metrics into a MongoDB Time-Series collection.
3. **Frontend (`/frontend`)**: A Vite-powered React dashboard utilizing TailwindCSS v4 and Lucide-React icons for an ultra-modern, responsive triage experience.

---

## Local Development & Setup 🛠️

### Prerequisites
- Node.js (v18+)
- Python (3.12+)
- MongoDB Atlas (or Local MongoDB Server running on port `27017`)

### 1. Backend Setup
```bash
cd backend
npm install

# The .env file uses MongoDB on localhost by default
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/system_fleet_monitor
# AGENT_API_KEY=supersecretkey

npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# The Dashboard will run at http://localhost:5173/
```

### 3. Agent Subsystem
The agent requires a Python virtual environment to install OS-level sensor libraries safely.
```bash
cd agent
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
# source venv/bin/activate

pip install -r requirements.txt

# To run the actual agent monitoring your local machine:
python agent.py

# To run the Fleet Simulator (generates 5 fake machines pushing traffic):
python mock_fleet.py
```

---

## Future Roadmap 🗺️
- [ ] Implement Socket.io to push real-time alerting events to the React UI instantly.
- [ ] Add PyInstaller scripts to compile the `agent.py` into a silent, hidden `.exe` for deployment via Group Policy.
- [ ] Add an Admin Authentication layer (JWT) to secure the React dashboard.
- [ ] Integrate a Rules Engine to automatically flag batteries with <40% design capacity.

## License
MIT License

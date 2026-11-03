import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");
  const [status, setStatus] = useState("Checking");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.status);
        setStatus("Connected");
      })
      .catch(() => {
        setMessage("Unable to connect to backend");
        setStatus("Disconnected");
      });
  }, []);

  return (
    <div className="App">
      <h1>STOCK AI V2</h1>
      <h2>Backend Connection Test</h2>

      <p>Status: {status}</p>
      <p>Backend Response: {message}</p>
    </div>
  );
}

export default App;
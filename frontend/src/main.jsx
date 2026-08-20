import React from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ImagePlus,
  Leaf,
  Loader2,
  Microscope,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Server,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import "./styles.css";

const API_BASE_KEY = "potato-diagnostics-api-base";
const DEFAULT_API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

const CLASS_DETAILS = {
  "Potato___Early_blight": {
    label: "Early blight",
    status: "Treatment window",
    tone: "warning",
    icon: AlertTriangle,
    summary:
      "Concentric brown lesions are commonly associated with early blight pressure.",
    action:
      "Remove heavily affected leaves, improve airflow, avoid overhead irrigation, and confirm field treatment timing.",
    accent: "#d88a1f",
  },
  "Potato___Late_blight": {
    label: "Late blight",
    status: "High urgency",
    tone: "danger",
    icon: AlertTriangle,
    summary:
      "Water-soaked dark patches can spread quickly in humid conditions.",
    action:
      "Isolate suspect plants, reduce leaf wetness, and get rapid local agronomy confirmation before the next spray decision.",
    accent: "#c2412d",
  },
  "Potato___healthy": {
    label: "Healthy",
    status: "Low concern",
    tone: "good",
    icon: CheckCircle2,
    summary:
      "The model sees a healthy leaf pattern without strong disease indicators.",
    action:
      "Keep monitoring new growth, soil moisture, and nearby plants for early changes.",
    accent: "#2f8a5b",
  },
};

const quickStats = [
  { label: "Model classes", value: "3", icon: Microscope },
  { label: "Input size", value: "256px", icon: ImagePlus },
  { label: "API route", value: "/predict", icon: Activity },
];

function normalizeConfidence(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number.parseFloat(String(value).replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatClassName(className) {
  return CLASS_DETAILS[className]?.label || className?.replace("Potato___", "").replace(/_/g, " ") || "Pending";
}

function App() {
  const [apiBase, setApiBase] = React.useState(() => localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE);
  const [apiStatus, setApiStatus] = React.useState("checking");
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem(API_BASE_KEY, apiBase);
  }, [apiBase]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const checkApi = React.useCallback(async () => {
    setApiStatus("checking");
    try {
      const response = await fetch(`${apiBase.replace(/\/$/, "")}/ping`);
      if (!response.ok) throw new Error("API ping failed");
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  }, [apiBase]);

  React.useEffect(() => {
    checkApi();
  }, [checkApi]);

  const selectFile = React.useCallback(
    (nextFile) => {
      if (!nextFile) return;
      if (!nextFile.type.startsWith("image/")) {
        setError("Choose a JPG, PNG, or WEBP leaf image.");
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setResult(null);
      setError("");
    },
    [previewUrl],
  );

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
  };

  const analyze = async () => {
    if (!file || isAnalyzing) return;

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch(`${apiBase.replace(/\/$/, "")}/predict`, {
        method: "POST",
        body,
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "The model could not analyze this image.");
      }

      setResult(data.prediction);
    } catch (err) {
      setError(err.message || "Prediction failed. Check the backend server and try again.");
      setApiStatus("offline");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const diagnosis = result?.class ? CLASS_DETAILS[result.class] : null;
  const confidence = normalizeConfidence(result?.confidence);
  const StatusIcon = apiStatus === "online" ? CheckCircle2 : apiStatus === "offline" ? X : Loader2;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Leaf size={22} />
          </span>
          <div>
            <p className="eyebrow">Leaf lab</p>
            <h1>Potato Disease Diagnostics</h1>
          </div>
        </div>

        <div className={`api-pill ${apiStatus}`}>
          <StatusIcon size={17} className={apiStatus === "checking" ? "spin" : ""} />
          <span>{apiStatus === "online" ? "API online" : apiStatus === "offline" ? "API offline" : "Checking API"}</span>
        </div>
      </header>

      <section className="workspace" aria-label="Potato disease classifier">
        <aside className="upload-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Image intake</p>
              <h2>Leaf sample</h2>
            </div>
            {file && (
              <button className="icon-button" type="button" onClick={reset} aria-label="Clear image" title="Clear image">
                <RotateCcw size={18} />
              </button>
            )}
          </div>

          <label
            className={`dropzone ${isDragging ? "dragging" : ""} ${previewUrl ? "has-preview" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              selectFile(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />

            {previewUrl ? (
              <img className="leaf-preview" src={previewUrl} alt={file?.name || "Selected leaf"} />
            ) : (
              <div className="dropzone-empty">
                <ImagePlus size={42} />
                <span>Choose leaf image</span>
                <small>JPG, PNG, WEBP</small>
              </div>
            )}
          </label>

          <div className="file-meta">
            <div>
              <span className="meta-label">Selected file</span>
              <strong>{file?.name || "No image selected"}</strong>
            </div>
            <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Ready"}</span>
          </div>

          <div className="action-row">
            <label className="button secondary">
              <Upload size={18} />
              <span>Browse</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => selectFile(event.target.files?.[0])}
              />
            </label>
            <button className="button primary" type="button" disabled={!file || isAnalyzing} onClick={analyze}>
              {isAnalyzing ? <Loader2 size={18} className="spin" /> : <ScanLine size={18} />}
              <span>{isAnalyzing ? "Analyzing" : "Analyze"}</span>
            </button>
          </div>

          {error && (
            <div className="message error" role="alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
        </aside>

        <section className="results-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Model output</p>
              <h2>Diagnosis</h2>
            </div>
            <ShieldCheck size={24} />
          </div>

          <div className={`diagnosis-card ${diagnosis?.tone || "empty"}`}>
            <div className="diagnosis-main">
              <div>
                <span className="status-label">{diagnosis?.status || "Awaiting sample"}</span>
                <h3>{formatClassName(result?.class)}</h3>
              </div>
              <div className="confidence-meter" style={{ "--confidence": `${confidence}%`, "--accent": diagnosis?.accent || "#3b6f8f" }}>
                <span>{result?.confidence || "--"}</span>
              </div>
            </div>

            <div className="bar-track" aria-label="Prediction confidence">
              <span style={{ width: `${confidence}%`, background: diagnosis?.accent || "#3b6f8f" }} />
            </div>

            <p>{diagnosis?.summary || "Select a clear potato leaf image and run the classifier."}</p>
          </div>

          <div className="recommendation">
            <ClipboardCheck size={20} />
            <div>
              <span className="meta-label">Next action</span>
              <p>{diagnosis?.action || "The model result will appear here with a practical field note."}</p>
            </div>
          </div>

          <div className="stats-grid">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div className="stat-card" key={stat.label}>
                  <Icon size={20} />
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      <section className="config-band" aria-label="Connection settings">
        <div>
          <p className="eyebrow">Backend connection</p>
          <h2>FastAPI endpoint</h2>
        </div>
        <div className="endpoint-control">
          <Server size={18} />
          <input
            value={apiBase}
            onChange={(event) => setApiBase(event.target.value)}
            aria-label="API base URL"
            spellCheck="false"
          />
          <button className="icon-button" type="button" onClick={checkApi} aria-label="Check API" title="Check API">
            <RefreshCw size={18} />
          </button>
        </div>
      </section>

      <section className="class-band" aria-label="Disease classes">
        {Object.entries(CLASS_DETAILS).map(([className, item]) => {
          const Icon = item.icon;
          return (
            <article className={`class-card ${item.tone}`} key={className}>
              <div>
                <Icon size={19} />
                <h3>{item.label}</h3>
              </div>
              <p>{item.summary}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

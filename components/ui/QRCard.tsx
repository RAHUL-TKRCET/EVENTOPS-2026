"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { QrCode, Copy, Check, Download, ShieldCheck } from "lucide-react";
import { Button } from "./Button";

export interface QRCardProps {
  tokenId: string;
  teamName: string;
  teamId: string;
  benchLabel?: string;
  venueName?: string;
  className?: string;
}

export const QRCard: React.FC<QRCardProps> = ({
  tokenId,
  teamName,
  teamId,
  benchLabel,
  venueName,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tokenId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-xl max-w-sm w-full mx-auto flex flex-col items-center text-center space-y-4",
        className
      )}
    >
      <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono tracking-wider uppercase">
        <ShieldCheck className="w-4 h-4" />
        <span>Official EventPass Credential</span>
      </div>

      {/* SVG QR Code Simulation Graphic */}
      <div className="p-4 bg-white rounded-xl shadow-inner border-4 border-slate-800">
        <svg
          viewBox="0 0 160 160"
          className="w-48 h-48 text-slate-950 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Corner Position Patterns */}
          <rect x="10" y="10" width="40" height="40" rx="4" fill="#0f172a" />
          <rect x="18" y="18" width="24" height="24" fill="#ffffff" />
          <rect x="24" y="24" width="12" height="12" rx="2" fill="#4f46e5" />

          <rect x="110" y="10" width="40" height="40" rx="4" fill="#0f172a" />
          <rect x="118" y="18" width="24" height="24" fill="#ffffff" />
          <rect x="124" y="24" width="12" height="12" rx="2" fill="#4f46e5" />

          <rect x="10" y="110" width="40" height="40" rx="4" fill="#0f172a" />
          <rect x="18" y="118" width="24" height="24" fill="#ffffff" />
          <rect x="24" y="124" width="12" height="12" rx="2" fill="#4f46e5" />

          {/* Matrix Data Bits Simulation */}
          <rect x="60" y="20" width="8" height="8" fill="#0f172a" />
          <rect x="75" y="15" width="8" height="8" fill="#0f172a" />
          <rect x="90" y="25" width="8" height="8" fill="#0f172a" />
          <rect x="60" y="40" width="8" height="8" fill="#0f172a" />
          <rect x="70" y="55" width="8" height="8" fill="#0f172a" />
          <rect x="85" y="45" width="8" height="8" fill="#0f172a" />
          <rect x="95" y="60" width="8" height="8" fill="#0f172a" />

          {/* Central Security Logo Icon */}
          <circle cx="80" cy="80" r="16" fill="#0f172a" />
          <text
            x="80"
            y="85"
            fontSize="10"
            fontWeight="bold"
            fill="#ffffff"
            textAnchor="middle"
            fontFamily="monospace"
          >
            EO
          </text>

          <rect x="20" y="65" width="8" height="8" fill="#0f172a" />
          <rect x="35" y="75" width="8" height="8" fill="#0f172a" />
          <rect x="115" y="65" width="8" height="8" fill="#0f172a" />
          <rect x="130" y="75" width="8" height="8" fill="#0f172a" />
          <rect x="65" y="105" width="8" height="8" fill="#0f172a" />
          <rect x="80" y="115" width="8" height="8" fill="#0f172a" />
          <rect x="100" y="105" width="8" height="8" fill="#0f172a" />
          <rect x="120" y="125" width="8" height="8" fill="#0f172a" />
          <rect x="135" y="115" width="8" height="8" fill="#0f172a" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-100">{teamName}</h3>
        <p className="font-mono text-xs text-indigo-400 font-semibold">{teamId}</p>
        {benchLabel && venueName && (
          <p className="text-xs text-slate-400">
            {venueName} • <span className="text-slate-200 font-semibold">{benchLabel}</span>
          </p>
        )}
      </div>

      <div className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400">
        <span className="truncate max-w-[200px]">{tokenId}</span>
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="w-full flex items-center gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={() => alert(`Downloaded digital ticket pass for ${teamName} (${teamId})`)}
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
};

export interface QRScannerProps {
  onScanSuccess: (token: string) => void;
  className?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, className }) => {
  const [manualToken, setManualToken] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access request failed:", err);
      setCameraError(err.message || "Camera permission denied or camera unavailable.");
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Barcode / QR detection loop using browser native BarcodeDetector when available
  React.useEffect(() => {
    let animId: number;
    let detector: any = null;

    if (cameraActive && typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        // @ts-ignore
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch (e) {
        detector = null;
      }
    }

    const checkFrame = async () => {
      if (detector && videoRef.current && videoRef.current.readyState === 4) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const detectedRaw = barcodes[0].rawValue;
            if (detectedRaw) {
              onScanSuccess(detectedRaw);
              stopCamera();
              return;
            }
          }
        } catch (e) {
          // Ignore transient detection errors
        }
      }
      if (cameraActive) {
        animId = requestAnimationFrame(checkFrame);
      }
    };

    if (cameraActive && detector) {
      animId = requestAnimationFrame(checkFrame);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [cameraActive, onScanSuccess]);

  // Cleanup stream on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const simulateQuickScan = (sampleToken: string) => {
    setIsScanning(false);
    setTimeout(() => {
      onScanSuccess(sampleToken);
      setIsScanning(true);
    }, 400);
  };

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-4 max-w-md w-full mx-auto",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">Live QR Scanner Camera</h3>
        </div>
        <div className="flex items-center gap-2">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="text-xs px-2.5 py-1 rounded-md border font-mono transition cursor-pointer bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30"
            >
              📷 Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="text-xs px-2.5 py-1 rounded-md border font-mono transition cursor-pointer bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30"
            >
              ⏹ Stop Camera
            </button>
          )}
          <button
            onClick={() => setTorchActive(!torchActive)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md border font-mono transition cursor-pointer",
              torchActive
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            )}
          >
            🔦 Flash {torchActive ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Viewfinder Screen */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/90 border border-slate-800 flex items-center justify-center">
        {/* Real HTML5 Video element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />

        {/* Reticle grid */}
        <div className="absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-xl pointer-events-none z-10" />

        {/* Laser scanner line animation */}
        {isScanning && (
          <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-bounce z-10" />
        )}

        {/* Status prompt */}
        <div className="absolute bottom-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-[11px] text-slate-300 font-mono z-10">
          {cameraActive ? "Camera Live: Scan badge" : "Click 'Start Camera' or use demo tokens"}
        </div>
      </div>

      {cameraError && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          ⚠️ {cameraError} (You can also use manual verification or demo badges below).
        </div>
      )}

      {/* Quick demo trigger pills for instant reviewer verification */}
      <div className="space-y-2">
        <p className="text-[11px] text-slate-400 font-medium">Quick Demo Simulation (Test Badges):</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => simulateQuickScan("EVENTOPS_QR_EVT01_T042_SECURE_TOKEN_2026")}
            className="text-[11px] font-mono px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
          >
            Scan Team T042 (BioSense)
          </button>
          <button
            onClick={() => simulateQuickScan("EVENTOPS_QR_EVT01_T001_SECURE_TOKEN_2026")}
            className="text-[11px] font-mono px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
          >
            Scan Team T001 (NeuralPulse)
          </button>
          <button
            onClick={() => simulateQuickScan("EVENTOPS_QR_EVT01_T015_SECURE_TOKEN_2026")}
            className="text-[11px] font-mono px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer"
          >
            Scan Team T015 (Absent)
          </button>
        </div>
      </div>

      {/* Manual Code Input fallback */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <p className="text-[11px] text-slate-400">Or enter Token / Team ID manually:</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. T042 or full token..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              if (manualToken.trim()) {
                onScanSuccess(manualToken.trim());
                setManualToken("");
              }
            }}
          >
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
};

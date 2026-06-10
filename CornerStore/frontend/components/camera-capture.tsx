"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

type CameraCaptureProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function CameraCaptureModal({ open, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Could not access the camera. Allow camera permission or use Upload image instead.");
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, stopStream]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopStream();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture, onClose, stopStream]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Take a photo</h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-lg text-text-muted hover:bg-surface-2"
            onClick={() => {
              stopStream();
              onClose();
            }}
            aria-label="Close camera"
          >
            ×
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        ) : (
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => { stopStream(); onClose(); }}>
            Cancel
          </Button>
          <Button type="button" disabled={!ready} onClick={takePhoto}>
            Capture
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Opens native camera on mobile; desktop opens getUserMedia modal. */
export function useCameraCapture(onFile: (file: File) => void) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openGallery = useCallback(() => {
    galleryRef.current?.click();
  }, []);

  const openCamera = useCallback(() => {
    if (isMobileDevice()) {
      cameraInputRef.current?.click();
    } else {
      setModalOpen(true);
    }
  }, []);

  const inputs = (
    <>
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <CameraCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCapture={onFile}
      />
    </>
  );

  return { openGallery, openCamera, inputs };
}

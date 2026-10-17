import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Check, SwitchCamera, Smartphone, Upload } from 'lucide-react';
import { compressImageFile } from '../services/imageUtils';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      setStream(null);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    stopStream();
    setErrorMsg(null);
    setCapturedPreview(null);
    setIsLoadingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(
        'El visor web directo no está soportado en este entorno. Puedes usar la cámara nativa de tu dispositivo directamente.'
      );
      setIsLoadingCamera(false);
      return;
    }

    try {
      // 1. First attempt with requested facingMode
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
    } catch (err: any) {
      console.warn('First getUserMedia attempt failed, trying basic video constraint:', err);
      try {
        // 2. Fallback attempt with simplest constraint
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(fallbackStream);
      } catch (err2: any) {
        console.error('All camera attempts failed:', err2);
        if (err2?.name === 'NotAllowedError' || err2?.name === 'PermissionDeniedError') {
          setErrorMsg(
            'El navegador bloqueó el permiso de la cámara o está en un entorno restringido. Presiona "Abrir Cámara del Dispositivo" a continuación para tomar la foto con tu aplicación de cámara habitual.'
          );
        } else if (err2?.name === 'NotFoundError' || err2?.name === 'DevicesNotFoundError') {
          setErrorMsg('No se detectó cámara web en el sistema. Puedes subir una foto o tomarla con tu teléfono.');
        } else {
          setErrorMsg(
            'No se pudo inicializar la cámara web en vivo. Puedes usar el botón "Abrir Cámara del Dispositivo" para tomar la foto directamente.'
          );
        }
      }
    } finally {
      setIsLoadingCamera(false);
    }
  };

  // Manage camera lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedPreview(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  // Connect stream to video element whenever stream changes or video is mounted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().catch((e) => console.log('Video autoplay prevented:', e));
      };
      video.play().catch((e) => console.log('Video play direct:', e));
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Flip Front/Rear Camera
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Take Snapshot from video element
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // Limit max dimension to 800px for optimal storage and speed
      const maxDim = 800;
      let targetWidth = width;
      let targetHeight = height;

      if (width > height) {
        if (width > maxDim) {
          targetHeight = Math.round((height * maxDim) / width);
          targetWidth = maxDim;
        }
      } else {
        if (height > maxDim) {
          targetWidth = Math.round((width * maxDim) / height);
          targetHeight = maxDim;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPreview(dataUrl);
      }
    } catch (err) {
      console.error('Snapshot error:', err);
      alert('Error al capturar el cuadro de video.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Confirm Picture
  const handleConfirmPhoto = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      onClose();
    }
  };

  // Retake Picture
  const handleRetake = () => {
    setCapturedPreview(null);
    if (!stream) {
      startCamera();
    }
  };

  // Native camera / device capture handler (works on 100% of mobile and PC devices)
  const handleNativeCaptureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageFile(file, 700, 0.85);
      onCapture(compressedDataUrl);
      onClose();
    } catch (err) {
      console.error('Error processing captured image:', err);
      // Fallback direct read
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (res) {
          onCapture(res);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-950 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Captura de Foto para Producto</h3>
              <p className="text-[11px] text-slate-400">
                {capturedPreview
                  ? 'Revisa la foto capturada'
                  : stream
                  ? 'Encuadra el producto y presiona el obturador'
                  : 'Cámara lista para capturar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative w-full aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Usar Cámara del Dispositivo</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{errorMsg}</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Abrir Cámara de mi Teléfono / PC</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Seleccionar Foto de la Galería</span>
                </button>
              </div>
            </div>
          ) : capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Foto capturada"
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <>
              {isLoadingCamera && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs text-slate-300">Iniciando cámara...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Shutter flash animation */}
              {isCapturing && <div className="absolute inset-0 bg-white animate-ping" />}

              {/* Grid guide overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3 opacity-25" />

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                title="Cambiar cámara frontal / trasera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Hidden File Inputs for Direct Native Camera and Gallery */}
        <input
          type="file"
          ref={nativeCameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeCaptureChange}
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleNativeCaptureChange}
        />

        {/* Bottom Control Dock */}
        <div className="p-4 bg-slate-900 flex items-center justify-between border-t border-slate-800">
          {capturedPreview ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Repetir Foto
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                Usar esta Foto
              </button>
            </>
          ) : (
            <>
              {/* Native device camera quick trigger */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                title="Abre la cámara oficial de tu teléfono"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Cámara del Celular</span>
              </button>

              {/* Main Shutter Button for Live Stream */}
              <button
                type="button"
                disabled={!stream || isCapturing}
                onClick={handleTakeSnapshot}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 text-slate-900 flex items-center justify-center p-1 shadow-lg active:scale-90 transition-transform disabled:opacity-40"
                title="Capturar foto ahora"
              >
                <div className="w-full h-full rounded-full border-4 border-slate-900 bg-white flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-900" />
                </div>
              </button>

              {/* Gallery button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Galería</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

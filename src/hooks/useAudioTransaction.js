import { useEffect, useRef, useState } from "react";
import {
  processTextWithGemini,
  processVoiceAudio,
} from "../services/backendApi";
import { getUserFacingError, logApiError } from "../utils/userFacingError";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
];

function extensionFromMimeType(mimeType) {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("webm")) return "webm";
  return "audio";
}

function useAudioTransaction() {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const onCompleteRef = useRef(null);
  const speechTextRef = useRef("");

  const secureContext =
    typeof window !== "undefined" ? window.isSecureContext : true;
  const supported = Boolean(
    SpeechRecognition ||
    (navigator.mediaDevices?.getUserMedia && window.MediaRecorder),
  );

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const start = async (onComplete) => {
    if (!secureContext) {
      setError("Perekaman suara perlu koneksi HTTPS.");
      return;
    }

    if (!supported) {
      setError(
        "Browser ini belum mendukung mikrofon. Gunakan Google Chrome atau Edge.",
      );
      return;
    }

    setError("");
    setTranscript("");
    speechTextRef.current = "";
    onCompleteRef.current = onComplete;

    // Metode 1: Web Speech Recognition (otomatis transkrip suara bahasa Indonesia & kirim ke AI Gemini)
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "id-ID";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let currentText = "";
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript + " ";
          }
          currentText = currentText.trim();
          speechTextRef.current = currentText;
          setTranscript(currentText);
        };

        recognition.onerror = (event) => {
          if (event.error === "not-allowed") {
            setError(
              "Izin mikrofon ditolak. Izinkan akses mikrofon di browser.",
            );
          } else if (event.error !== "no-speech") {
            logApiError("SpeechRecognition error", event.error);
          }
          setRecording(false);
        };

        recognition.onend = async () => {
          setRecording(false);
          const text = speechTextRef.current.trim();
          if (!text) {
            setError(
              "Suara belum terdengar jelas. Coba bicara lebih dekat ke mikrofon.",
            );
            return;
          }

          setProcessing(true);
          try {
            const result = await processTextWithGemini(text);
            setTranscript(result.transcript);
            onCompleteRef.current?.(result);
          } catch (requestError) {
            logApiError("Pemrosesan teks AI gagal", requestError);
            setError(getUserFacingError(requestError));
          } finally {
            setProcessing(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setRecording(true);
        return;
      } catch (speechErr) {
        logApiError("Fallback to MediaRecorder", speechErr);
      }
    }

    // Metode 2: MediaRecorder fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MIME_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        stopTracks();
        setRecording(false);
        setError("Perekaman suara gagal. Coba rekam lagi.");
      };

      recorder.onstop = async () => {
        stopTracks();
        setRecording(false);
        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || "application/octet-stream",
        });
        chunksRef.current = [];

        if (!audio.size) {
          setError("Suara belum terekam. Coba tekan mikrofon lalu bicara.");
          return;
        }

        setProcessing(true);
        try {
          const result = await processVoiceAudio(
            audio,
            `noka-recording.${extensionFromMimeType(audio.type)}`,
          );
          setTranscript(result.transcript);
          onCompleteRef.current?.(result);
        } catch (requestError) {
          logApiError("Pemrosesan suara gagal", requestError);
          setError(getUserFacingError(requestError));
        } finally {
          setProcessing(false);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (recordingError) {
      stopTracks();
      if (
        recordingError.name === "NotAllowedError" ||
        recordingError.name === "SecurityError"
      ) {
        setError(
          "Izin mikrofon ditolak. Izinkan akses mikrofon dan pastikan halaman dibuka lewat HTTPS.",
        );
      } else {
        setError(
          "Mikrofon tidak dapat digunakan. Periksa izin dan perangkat audio.",
        );
      }
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  useEffect(
    () => () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      stopTracks();
    },
    [],
  );

  return { recording, processing, transcript, error, supported, start, stop };
}

export default useAudioTransaction;

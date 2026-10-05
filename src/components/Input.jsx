import { useId, useState } from "react";
import useSpeech from "../hooks/useSpeech";
import { EyeIcon, EyeOffIcon, MicIcon, ChevronDown } from "./Icons";

// Tombol mic kecil di dalam input: isi field pakai suara (STT)
function VoiceButton({ onResult, disabled }) {
  const { listening, start, stop, supported } = useSpeech();
  if (!supported) return null;
  return (
    <button
      type="button"
      className={`input-icon ${listening ? "listening" : ""}`}
      disabled={disabled}
      aria-label="Isi dengan suara"
      onClick={() => (listening ? stop() : start(onResult))}
    >
      <MicIcon size={16} />
    </button>
  );
}

/**
 * props:
 * - type: 'text' | 'password' | 'number' | ...
 * - voice: true -> tampilkan mic untuk isi pakai suara
 * - onVoice(teks): callback hasil suara (default: isi value via onChange)
 * - options: [{value,label}] -> render sebagai <select>
 */
function Input({
  label,
  type = "text",
  value,
  onChange,
  voice,
  onVoice,
  options,
  disabled,
  id: providedId,
  ...rest
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const generatedId = useId();
  const id = providedId || generatedId;

  const handleVoice = (teks) => {
    if (onVoice) return onVoice(teks);
    onChange?.({ target: { value: teks } });
  };

  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-wrap">
        {options ? (
          <>
            <select
              id={id}
              value={value}
              onChange={onChange}
              disabled={disabled}
              {...rest}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="input-icon static">
              <ChevronDown />
            </span>
          </>
        ) : (
          <input
            id={id}
            type={isPassword && show ? "text" : type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            {...rest}
          />
        )}
        {isPassword && (
          <button
            type="button"
            className="input-icon"
            onClick={() => setShow(!show)}
            aria-label="Lihat sandi"
          >
            {show ? <EyeIcon size={18} /> : <EyeOffIcon size={18} />}
          </button>
        )}
        {voice && !options && !isPassword && (
          <VoiceButton onResult={handleVoice} disabled={disabled} />
        )}
      </div>
    </div>
  );
}

export default Input;

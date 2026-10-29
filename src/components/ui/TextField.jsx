import { useEffect, useRef, useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";


export default function TextField({ icon: Icon, type = "text", error, shakeTick = 0, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const boxRef = useRef(null);
  const isPassword = type === "password";

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !error || !shakeTick) return;
    el.classList.remove("shake");
    void el.offsetWidth; // restart animation
    el.classList.add("shake");
  }, [shakeTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // The hide is delayed one tick so the browser can finish copying the text first
  // (a type="password" input can't be copied, so switching too early would copy nothing).
  const hideAfterCopy = (e) => {
    if (e.target.selectionStart === e.target.selectionEnd) return; // nothing selected, nothing copied
    setTimeout(() => setVisible(false), 0);
  };

  return (
    <div>
      <div ref={boxRef} className={`field ${error ? "field--error" : ""}`}>
        <Icon className="field__icon" />
        <input
          className="field__input"
          type={isPassword && visible ? "text" : type}
          onCopy={isPassword ? hideAfterCopy : undefined}
          onCut={isPassword ? hideAfterCopy : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="field__eye"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <LuEyeOff /> : <LuEye />}
          </button>
        )}
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
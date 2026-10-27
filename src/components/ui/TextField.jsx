import { useEffect, useRef, useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

/**
 * Input واحد: أيقونة على الشمال + (لو password) زرار العين.
 * shakeTick: كل ما يزيد والحقل فيه error بيهتز.
 * hideOnPaste: لو الحقل password واتعمله paste وهو ظاهر، بيرجع مخفي (نقط) تلقائي.
 */
export default function TextField({ icon: Icon, type = "text", error, shakeTick = 0, hideOnPaste = false, ...inputProps }) {
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

  return (
    <div>
      <div ref={boxRef} className={`field ${error ? "field--error" : ""}`}>
        <Icon className="field__icon" />
        <input
          className="field__input"
          type={isPassword && visible ? "text" : type}
          onPaste={hideOnPaste ? () => setVisible(false) : undefined}
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

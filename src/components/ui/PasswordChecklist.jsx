import { LuCheck, LuCircle } from "react-icons/lu";
import { passwordRules } from "../../utils/validators";

export default function PasswordChecklist({ password }) {
  if (!password) return null;
  return (
    <ul className="checklist">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.id} className={ok ? "checklist__item is-ok" : "checklist__item"}>
            {ok ? <LuCheck /> : <LuCircle />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

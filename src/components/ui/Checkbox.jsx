/** Remember me */
export default function Checkbox({ children, ...props }) {
  return (
    <label className="check">
      <input type="checkbox" className="check__input" {...props} />
      <span className="check__box" aria-hidden="true" />
      {children}
    </label>
  );
}

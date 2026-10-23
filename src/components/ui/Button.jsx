/** variant: "gold" (Sign Up / Login) | "outline" (Google) */
export default function Button({ variant = "gold", children, ...props }) {
  return (
    <button className={`btn btn--${variant}`} {...props}>
      {children}
    </button>
  );
}

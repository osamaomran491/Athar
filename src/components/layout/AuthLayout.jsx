import Logo from "../ui/Logo";
import templeBg from "../../assets/images/temple-bg.jpg";

/**
 * هيكل الصفحة (Register / Login / Dashboard):
 *  - .auth__bg    : صورة المعبد (ثابتة، بتتعرض كاملة بالطول)
 *  - .auth__panel : العمود الشمال
 *  variant="left"   → فورم على الشمال (Register)
 *  variant="center" → فورم متوسّط في العمود (Login)
 */
export default function AuthLayout({ variant = "left", children }) {
  return (
    <main className={`auth auth--${variant}`}>
      <div className="auth__bg" aria-hidden="true">
        <img className="auth__bg-img" src={templeBg} alt="" />
      </div>

      <section className="auth__panel">
        <Logo />
        <div className="auth__column">{children}</div>
      </section>
    </main>
  );
}

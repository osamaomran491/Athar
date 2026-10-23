export default function Divider({ children = "or" }) {
  return (
    <div className="divider">
      <span>{children}</span>
    </div>
  );
}

import logo2x from "../../assets/images/logo@2x.png";
import logo3x from "../../assets/images/logo@3x.png";

export default function Logo() {
  return (
    <img
      className="logo"
      src={logo2x}
      srcSet={`${logo2x} 2x, ${logo3x} 3x`}
      alt="ATHAR"
    />
  );
}

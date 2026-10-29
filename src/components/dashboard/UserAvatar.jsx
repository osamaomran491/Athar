import { useState } from "react";

export function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function UserAvatar({ name, picture, className = "" }) {
  const [broken, setBroken] = useState(false);

  if (picture && !broken) {
    return (
      <img
        className={`avatar ${className}`}
        src={picture}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span className={`avatar ${className}`} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}
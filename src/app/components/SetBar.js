// components/SetBar.jsx
"use client";

export default function SetBar({
  items,                    // [{ code, name, icon, total, ownedUnique }]
  selectedCode,
  onSelect,                 // (code) => void
  classes = {},             // { container, item, active }
}) {
  if (!items || items.length === 0) return null;

  const { container, item, active } = classes;

  return (
    <div className={container}>
      {items.map(({ code, name, icon, total, ownedUnique }) => (
        <div
          key={code}
          className={`${item} ${selectedCode === code ? active : ""}`}
          onClick={() => onSelect(code)}
        >
          {icon && <img src={icon} alt={name} />}
          <p>{name}</p>
          <p>{ownedUnique}/{total}</p>
        </div>
      ))}
    </div>
  );
}

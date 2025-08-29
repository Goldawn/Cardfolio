"use client";
export default function Masonry({ cols = 2, className, style, children }) {
  return (
    <div className={className} style={{ "--cols": cols, ...style }}>
      {children}
    </div>
  );
}
"use client";
import { splitIntoN } from "@/lib/mtgSorts";

export default function MultiCols({ items, cols=2, render, className, style }) {
  const buckets = splitIntoN(items, cols);
  return (
    <div className={className} style={{ ...style, ["--list-cols"]: cols }}>
      {buckets.map((col, i) => (
        <div key={i} className="listCol">
          {render ? render(col, i) : col}
        </div>
      ))}
    </div>
  );
}
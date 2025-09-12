// components/SetBar.jsx
'use client'

interface SetItem {
  code: string
  name: string
  icon?: string
  total: number
  ownedUnique: number
}

interface SetBarProps {
  items: SetItem[] // [{ code, name, icon, total, ownedUnique }]
  selectedCode: string
  onSelect: (code: string) => void // (code) => void
  classes?: {
    container?: string
    item?: string
    active?: string
  } // { container, item, active }
}

export default function SetBar({
  items, // [{ code, name, icon, total, ownedUnique }]
  selectedCode,
  onSelect, // (code) => void
  classes = {}, // { container, item, active }
}: SetBarProps) {
  if (!items || items.length === 0) return null

  const { container, item, active } = classes

  return (
    <div className={container}>
      {items.map(({ code, name, icon, total, ownedUnique }) => (
        <div
          key={code}
          className={`${item} ${selectedCode === code ? active : ''}`}
          onClick={() => onSelect(code)}
        >
          {icon && <img src={icon} alt={name} />}
          <p>{name}</p>
          <p>
            {ownedUnique}/{total}
          </p>
        </div>
      ))}
    </div>
  )
}

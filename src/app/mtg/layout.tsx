import type { ReactNode } from 'react';
import CardMenu from '../components/CardMenu';

export default function MtgLayout({ children }: { children: ReactNode }) {
  return (
    <div>
        <CardMenu />
    {children}
    </div>
  );
}
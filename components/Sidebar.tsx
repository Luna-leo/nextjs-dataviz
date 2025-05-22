'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/', label: 'ユニットタグマスター' },
  { href: '/data-selection', label: 'データ選択' },
  { href: '/db-list', label: 'DB化済みデータ' },
  { href: '/formula-section', label: '数式エディタ' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-900 p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              pathname === item.href ? 'font-bold text-blue-600' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

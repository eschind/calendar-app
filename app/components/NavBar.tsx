'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Calendar' },
  { href: '/news', label: 'News' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={{ backgroundColor: '#DA291C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/manutd-logo.svg"
              alt="Manchester United"
              width={36}
              height={36}
            />
            <span className="text-lg font-bold text-white tracking-wide uppercase">Man Utd Hub</span>
          </Link>
          <div className="flex items-center gap-0">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-5 h-14 flex items-center text-sm font-semibold uppercase tracking-wider transition-colors"
                  style={{
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                    borderBottom: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
                    backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

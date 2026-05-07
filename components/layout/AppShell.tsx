'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <main className="min-h-full w-full">{children}</main>
  }

  return (
    <div className="bookbrain-app-shell h-full flex w-full text-[#f7fbff]">
      <div className="app-shell-noise" />
      <div className="app-shell-orbit" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} style={{ ['--i' as string]: index }} />
        ))}
      </div>
      <aside
        className="app-sidebar w-[220px] flex-shrink-0 flex flex-col"
      >
        <div className="p-5">
          <h1 className="text-lg font-bold tracking-tight text-[#f7fbff] flex items-center gap-1.5">
            <span className="app-brand-glow">Book</span>
            <span>Brain</span>
          </h1>
          <p className="text-[10px] text-[#a7dcff] mt-0.5">智能书签管理</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          <SidebarLink href="/bookmarks" icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 2h10a1 1 0 011 1v11l-6-3-6 3V3a1 1 0 011-1z"/>
            </svg>
          }>书签库</SidebarLink>
          <SidebarLink href="/search" icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
            </svg>
          }>搜索</SidebarLink>
          <SidebarLink href="/dashboard" icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="2" y="9" width="3" height="5" rx="0.5"/><rect x="6.5" y="5" width="3" height="9" rx="0.5"/>
              <rect x="11" y="2" width="3" height="12" rx="0.5"/>
            </svg>
          }>统计</SidebarLink>
          <SidebarLink href="/import" icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M8 2v8M4.5 6.5L8 2l3.5 4.5"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
            </svg>
          }>导入</SidebarLink>
        </nav>

        <div className="app-user-panel p-3 m-3 rounded-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[#07121d] app-user-avatar">ZYH</div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate text-[#f7fbff]">User Admin</p>
              <p className="text-[10px] text-[#a7dcff] truncate">Session Active</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-content flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

function SidebarLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="app-nav-link flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-[13px] font-medium"
    >
      <span className="opacity-60">{icon}</span>
      <span>{children}</span>
    </Link>
  )
}

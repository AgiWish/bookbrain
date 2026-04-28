import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookBrain - 智能书签管理系统",
  description: "AI 驱动的知识库与书签管理专家",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body
        className="h-full flex text-[#E8EAF0]"
        style={{ backgroundColor: "#0F1117", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {/* Sidebar Navigation */}
        <aside
          className="w-[240px] flex-shrink-0 flex flex-col border-r border-[#2E3347]"
          style={{ backgroundColor: "#1A1D27" }}
        >
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span style={{ color: "#4F8EF7" }}>Book</span>
              <span>Brain</span>
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <SidebarLink href="/bookmarks" icon="🔖">书签库</SidebarLink>
            <SidebarLink href="/search" icon="🔍">搜索</SidebarLink>
            <SidebarLink href="/graph" icon="🕸️">知识图谱</SidebarLink>
            <SidebarLink href="/dashboard" icon="📊">统计</SidebarLink>
            <SidebarLink href="/import" icon="📥">导入</SidebarLink>
          </nav>

          <div className="p-4 border-t border-[#2E3347]">
            <div className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: "#22263A" }}>
              <div className="w-8 h-8 rounded-full bg-[#4F8EF7] flex items-center justify-center text-xs font-bold">ZYH</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">User Admin</p>
                <p className="text-xs text-[#9099B5] truncate">Free Plan</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}

function SidebarLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-[#9099B5] hover:text-[#E8EAF0] hover:bg-[#2A2F45]"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </Link>
  );
}

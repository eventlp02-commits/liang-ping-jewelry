import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Liang Ping | Atelier Onde",
  description: "Atelier Onde 季度新品视觉提案",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

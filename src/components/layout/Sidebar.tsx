import Link from "next/link";
import { navigationItems } from "@/lib/constants";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">Care Circle<span>Family health agent</span></Link>
      <nav className="nav-list" aria-label="Primary navigation">
        {navigationItems.map((item) => <Link className="nav-link" href={item.href} key={item.href}>{item.label}</Link>)}
      </nav>
    </aside>
  );
}

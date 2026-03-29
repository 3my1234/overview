'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROLE_BASED_MENU } from '@/lib/constants';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Calculator,
  FileText,
  CheckCircle,
  Eye,
  Settings,
  BookOpen,
  TrendingDown,
  ArrowRightLeft,
  CreditCard,
  Home,
  Briefcase,
  Scale,
  List,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
}

const iconMap: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  ShoppingCart: <ShoppingCart className="h-5 w-5" />,
  Calculator: <Calculator className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  Eye: <Eye className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  TrendingDown: <TrendingDown className="h-5 w-5" />,
  ArrowRightLeft: <ArrowRightLeft className="h-5 w-5" />,
  CreditCard: <CreditCard className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
  List: <List className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
};

export default function Sidebar({ isOpen, onOpenChange, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const menu = (ROLE_BASED_MENU as Record<string, any>)[userRole] || ROLE_BASED_MENU['ceo'];

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    );
  };

  // Group menu items by parent route
  const groupedMenu = menu.reduce((acc: any, item: any) => {
    const parent = item.href.split('/')[1];
    const existing = acc.find((g: any) => g.parent === parent);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ parent, label: item.label.split('/')[0], items: [item] });
    }
    return acc;
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              P
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">PalmOps</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {groupedMenu.map((group: any) => (
            <div key={group.parent}>
              {group.items.length === 1 ? (
                <Link
                  href={group.items[0].href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith(group.items[0].href)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
                  )}
                  onClick={() => onOpenChange(false)}
                >
                  {iconMap[group.items[0].icon] || <Package className="h-5 w-5" />}
                  <span>{group.items[0].label}</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleExpanded(group.parent)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      expandedItems.includes(group.parent)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {iconMap[group.items[0].icon] || <Package className="h-5 w-5" />}
                      {group.label}
                    </span>
                    {expandedItems.includes(group.parent) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {expandedItems.includes(group.parent) && (
                    <div className="ml-4 space-y-1">
                      {group.items.map((item: any) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm transition-colors',
                            pathname === item.href
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
                          )}
                          onClick={() => onOpenChange(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60">
            Palm Oil Operations Platform
          </p>
          <p className="text-xs text-sidebar-foreground/60">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

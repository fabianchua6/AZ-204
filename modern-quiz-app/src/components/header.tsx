'use client';

import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Moon, Sun, BookOpen, BarChart3, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const getThemeIcon = () =>
    theme === 'light' ? (
      <Moon className='h-4 w-4' />
    ) : (
      <Sun className='h-4 w-4' />
    );

  const isOnDashboard = pathname?.startsWith('/dashboard') ?? false;
  const navigationButton = isOnDashboard
    ? { href: '/', icon: Brain, srText: 'Go to Quiz' }
    : { href: '/dashboard', icon: BarChart3, srText: 'Dashboard' };

  return (
    <header className='sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm'>
      <div className='container mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          <Link
            href='/'
            className='flex items-center space-x-3 transition-opacity hover:opacity-80'
          >
            <div className='rounded-xl border border-primary/20 bg-primary/10 p-2'>
              <BookOpen className='h-6 w-6 text-primary' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-foreground'>
                AZ-204 Quiz App
              </h1>
            </div>
          </Link>

          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              asChild
              className='relative h-9 w-9 border border-border bg-background/50 p-0 transition-colors hover:bg-accent'
            >
              <Link href={navigationButton.href}>
                {isOnDashboard ? (
                  <Brain className='h-4 w-4' />
                ) : (
                  <BarChart3 className='h-4 w-4' />
                )}
                <span className='sr-only'>{navigationButton.srText}</span>
              </Link>
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={toggleTheme}
              className='relative h-9 w-9 border border-border bg-background/50 p-0 transition-colors hover:bg-accent'
            >
              {getThemeIcon()}
              <span className='sr-only'>Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

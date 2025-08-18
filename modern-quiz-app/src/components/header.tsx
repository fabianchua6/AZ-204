'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getThemeIcon = () => {
    return theme === 'light' ? (
      <Moon className='h-4 w-4' />
    ) : (
      <Sun className='h-4 w-4' />
    );
  };

  return (
    <header className='border-border-light via-card-secondary/90 shadow-xs sticky top-0 z-50 border-b bg-gradient-to-r from-card/90 to-card/90 backdrop-blur-md'>
      <div className='container mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='to-primary-light/20 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 p-2 shadow-md'>
              <BookOpen className='h-6 w-6 text-primary' />
            </div>
            <div>
              <h1 className='bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-xl font-bold text-transparent'>
                AZ-204 Quiz App
              </h1>
              <p className='text-sm text-muted-foreground'>
                Azure Developer Associate Practice
              </p>
            </div>
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={toggleTheme}
            className='hover:bg-accent-light border-border-light relative h-9 w-9 border bg-background/80 p-0 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95'
          >
            {getThemeIcon()}
            <span className='sr-only'>Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

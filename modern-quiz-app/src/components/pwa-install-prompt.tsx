'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    const isIOSInstalled = (
      window.navigator as Navigator & { standalone?: boolean }
    ).standalone;

    if (isStandalone || isIOSInstalled) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom install prompt
      setShowInstallPrompt(true);
    };

    // Listen for the app being installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt so it can only be used once
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Hide for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed this session, or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  // Check if dismissed this session
  if (sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <Card className='fixed bottom-4 left-4 right-4 z-50 border-primary/20 bg-primary/5 backdrop-blur-sm md:left-auto md:right-4 md:w-80'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
            <Download className='h-5 w-5 text-primary' />
          </div>
          <div className='flex-1'>
            <h3 className='text-sm font-semibold'>Install AZ-204 Quiz App</h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              Install this app on your device for offline access and a better
              experience.
            </p>
            <div className='mt-3 flex gap-2'>
              <Button
                onClick={handleInstallClick}
                size='sm'
                className='h-8 text-xs'
              >
                Install
              </Button>
              <Button
                onClick={handleDismiss}
                variant='ghost'
                size='sm'
                className='h-8 text-xs'
              >
                Not now
              </Button>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant='ghost'
            size='icon'
            className='h-6 w-6 shrink-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

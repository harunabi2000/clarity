import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

let deferredPrompt: any = null;

export function InstallPWA() {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      setIsInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      // Clear the deferredPrompt so it can be garbage collected
      deferredPrompt = null;
      setIsInstallable(false);
      console.log('PWA was installed');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Installation prompt not available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferredPrompt so it can be garbage collected
    deferredPrompt = null;
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 bg-purple-600 text-white hover:bg-purple-700"
      onClick={handleInstallClick}
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}

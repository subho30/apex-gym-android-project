import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface UseNativeMobileOptions {
  onBackPress?: () => boolean; // return true if handled, false to exit
}

export function useNativeMobile(options?: UseNativeMobileOptions) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Hide splash screen smoothly after app is ready
    SplashScreen.hide().catch(() => {});

    // 2. Set dark status bar style
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#09090b' }).catch(() => {});

    // 3. Hardware Back Button Listener (Android)
    const backListener = CapApp.addListener('backButton', () => {
      if (options?.onBackPress) {
        const handled = options.onBackPress();
        if (!handled) {
          CapApp.exitApp();
        }
      }
    });

    return () => {
      backListener.then((sub) => sub.remove()).catch(() => {});
    };
  }, [options]);

  const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      if (style === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (style === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (style === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (style === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch {
      // Haptics not available or permission denied
    }
  };

  return { triggerHaptic };
}

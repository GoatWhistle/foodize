import { useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export interface NetworkStatus {
  isOnline: boolean;
  justReconnected: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
      setIsOnline(online);
      if (online && wasOffline.current) {
        setJustReconnected(true);
        setTimeout(() => {
          setJustReconnected(false);
        }, 2500);
      }
      wasOffline.current = !online;
    });
    return unsubscribe;
  }, []);

  return { isOnline, justReconnected };
}

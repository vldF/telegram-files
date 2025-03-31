"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface LocalStorageContextType {
  getItem: <T>(key: string, initialValue: T) => T;
  setItem: <T>(key: string, value: T | ((prev: T) => T)) => void;
  removeItem: (key: string) => void;
}

const LocalStorageContext = createContext<LocalStorageContextType | null>(null);

export const LocalStorageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storageMap, setStorageMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const map: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            map[key] = JSON.parse(localStorage.getItem(key) ?? "") as unknown;
          } catch {}
        }
      }
      setStorageMap(map);
    }
  }, []);

  const getItem = <T,>(key: string, initialValue: T): T => {
    if (key in storageMap) {
      return storageMap[key] as T;
    }
    return initialValue;
  };

  const setItem = <T,>(key: string, valueOrUpdater: T | ((prev: T) => T)) => {
    setStorageMap((prev) => {
      const currentValue = key in prev ? (prev[key] as T) : undefined;
      const newValue =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (prev: T) => T)(currentValue as T)
          : valueOrUpdater;

      const newMap = { ...prev, [key]: newValue };

      try {
        if (newValue === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(newValue));
        }
      } catch (error) {
        console.error("Error writing to localStorage", error);
      }

      return newMap;
    });
  };

  const removeItem = (key: string) => {
    setStorageMap((prev) => {
      const newMap = { ...prev };
      delete newMap[key];
      localStorage.removeItem(key);
      return newMap;
    });
  };

  return (
    <LocalStorageContext.Provider value={{ getItem, setItem, removeItem }}>
      {children}
    </LocalStorageContext.Provider>
  );
};

export const useLocalStorage = <T,>(
  key: string,
  initialValue: T,
): [T, (valueOrUpdater: T | ((prev: T) => T)) => void, () => void] => {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error(
      "useLocalStorageContext must be used within LocalStorageProvider",
    );
  }

  const value = context.getItem(key, initialValue);

  const setValue = (valueOrUpdater: T | ((prev: T) => T)) => {
    context.setItem(key, valueOrUpdater);
  };

  const clearValue = () => context.removeItem(key);

  return [value, setValue, clearValue];
};

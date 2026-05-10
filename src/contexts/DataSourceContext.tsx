/**
 * Context API - Zarządzanie źródłem danych
 *
 * Możliwość przełączania między:
 * Dynamiczny wybór źródła danych między:
 * - Local JSON (LocalStorageService)
 * - REST API (ApiService)
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

/**
 * Typ źródła danych
 */
export type DataSource = 'local-json' | 'rest-api';

interface DataSourceContextType {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  isLoading: boolean;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

interface DataSourceProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'medicalApp_dataSource';

export const DataSourceProvider: React.FC<DataSourceProviderProps> = ({ children }) => {
  // Wczytaj zapisane źródło z localStorage lub użyj domyślnie REST API
  const [dataSource, setDataSourceState] = useState<DataSource>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'local-json' || stored === 'rest-api') {
        return stored as DataSource;
      }
    } catch (error) {
      console.error('Failed to load data source from localStorage:', error);
    }
    return 'rest-api'; // Domyślnie REST API 
  });

  const [isLoading, setIsLoading] = useState(false);

  // Zapisz wybór do localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, dataSource);
    } catch (error) {
      console.error('Failed to save data source to localStorage:', error);
    }
  }, [dataSource]);

  const setDataSource = async (source: DataSource) => {
    setIsLoading(true);
    try {
      setDataSourceState(source);

      // Odśwież stronę aby przeładować dane z nowego źródła
      // TODO: W przyszłości można by to zrobić bez odświeżania
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Failed to change data source:', error);
      setIsLoading(false);
    }
  };

  const value: DataSourceContextType = {
    dataSource,
    setDataSource,
    isLoading,
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = (): DataSourceContextType => {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
};

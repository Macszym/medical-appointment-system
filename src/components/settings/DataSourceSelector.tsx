/**
 * Komponent do wyboru źródła danych
 *
 * Pozwala dynamicznie przełączać się między:
 * - Local JSON (LocalStorageService)
 * - REST API (ApiService)
 */

import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { useDataSource, type DataSource } from '../../contexts/DataSourceContext';

const DataSourceSelector: React.FC = () => {
  const { dataSource, setDataSource, isLoading } = useDataSource();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSource = event.target.value as DataSource;
    if (newSource !== dataSource) {
      if (confirm(`Czy na pewno chcesz przełączyć źródło danych na "${getSourceLabel(newSource)}"? Strona zostanie odświeżona.`)) {
        setDataSource(newSource);
      }
    }
  };

  const getSourceLabel = (source: DataSource): string => {
    switch (source) {
      case 'local-json':
        return 'Local JSON ';
      case 'rest-api':
        return 'REST API + MongoDB ';
      default:
        return source;
    }
  };

  const getSourceDescription = (source: DataSource): string => {
    switch (source) {
      case 'local-json':
        return 'Dane przechowywane lokalnie w localStorage przeglądarki.';
      case 'rest-api':
        return 'Dane przechowywane w MongoDB Atlas przez REST API.';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Źródło danych
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Wybierz backend z którego aplikacja ma pobierać dane
        </Typography>
      </Box>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="dataSource-label">Aktywne źródło</InputLabel>
        <Select
          labelId="dataSource-label"
          id="dataSource"
          value={dataSource}
          label="Aktywne źródło"
          onChange={(e) => {
            const newSource = e.target.value as DataSource;
            if (newSource !== dataSource) {
              if (
                confirm(
                  `Czy na pewno chcesz przełączyć źródło danych na "${getSourceLabel(newSource)}"? Strona zostanie odświeżona.`
                )
              ) {
                setDataSource(newSource);
              }
            }
          }}
          disabled={isLoading}
        >
          <MenuItem value="rest-api">REST API + MongoDB </MenuItem>
          <MenuItem value="local-json">Local JSON </MenuItem>
        </Select>
      </FormControl>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Aktualnie używane:</strong> {getSourceLabel(dataSource)}
          <br />
          {getSourceDescription(dataSource)}
        </Typography>
      </Alert>

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Przełączanie źródła danych...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default DataSourceSelector;

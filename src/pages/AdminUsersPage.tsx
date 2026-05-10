/**
 * Strona zarządzania użytkownikami (Admin)
 *
 * Widok dla administratora - zarządzanie użytkownikami
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import type { User } from '../models';
import styles from './AdminUsersPage.module.css';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/users');

      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        setError('Nie udało się pobrać użytkowników');
      }
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.response?.data?.message || 'Błąd pobierania użytkowników');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await apiClient.put(`/users/${userId}`, { isBanned: !isBanned });

      // Odśwież listę użytkowników
      fetchUsers();
    } catch (err: any) {
      console.error('Ban user error:', err);
      alert('Nie udało się zmienić statusu użytkownika');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      return;
    }

    try {
      await apiClient.delete(`/users/${userId}`);

      // Odśwież listę użytkowników
      fetchUsers();
    } catch (err: any) {
      console.error('Delete user error:', err);
      alert('Nie udało się usunąć użytkownika');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: '#d93025',
      doctor: '#1a73e8',
      patient: '#34a853',
    };

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: `${colors[role]}20`,
          color: colors[role],
        }}
      >
        {role === 'admin' ? 'Administrator' : role === 'doctor' ? 'Lekarz' : 'Pacjent'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Ładowanie użytkowników...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>⚠️ Błąd</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <h1 className={styles.title}>Zarządzanie użytkownikami</h1>
        <p className={styles.subtitle}>
          Łącznie użytkowników: <strong>{users.length}</strong>
        </p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles['stat-value']}>
            {users.filter((u) => u.role === 'patient').length}
          </div>
          <div className={styles['stat-label']}>Pacjenci</div>
        </div>
        <div className={styles.stat}>
          <div className={styles['stat-value']}>
            {users.filter((u) => u.role === 'doctor').length}
          </div>
          <div className={styles['stat-label']}>Lekarze</div>
        </div>
        <div className={styles.stat}>
          <div className={styles['stat-value']}>
            {users.filter((u) => u.role === 'admin').length}
          </div>
          <div className={styles['stat-label']}>Administratorzy</div>
        </div>
        <div className={styles.stat}>
          <div className={styles['stat-value']}>
            {users.filter((u) => u.isBanned).length}
          </div>
          <div className={styles['stat-label']}>Zbanowani</div>
        </div>
      </div>

      <div className={styles['table-container']}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Imię i nazwisko</th>
              <th>Email</th>
              <th>PESEL</th>
              <th>Rola</th>
              <th>Status</th>
              <th>Data rejestracji</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={user.isBanned ? styles.banned : ''}>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{user.pesel}</td>
                <td>{getRoleBadge(user.role)}</td>
                <td>
                  {user.isBanned ? (
                    <span className={styles['status-banned']}>Zbanowany</span>
                  ) : user.isActive ? (
                    <span className={styles['status-active']}>Aktywny</span>
                  ) : (
                    <span className={styles['status-inactive']}>Nieaktywny</span>
                  )}
                </td>
                <td>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('pl-PL')
                    : '-'}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleBanUser(user.id, user.isBanned)}
                      className={
                        user.isBanned
                          ? styles['button-unban']
                          : styles['button-ban']
                      }
                      disabled={user.role === 'admin'}
                    >
                      {user.isBanned ? 'Odbanuj' : 'Zbanuj'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className={styles['button-delete']}
                      disabled={user.role === 'admin'}
                    >
                      Usuń
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className={styles.empty}>
          <p>Brak użytkowników w systemie</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

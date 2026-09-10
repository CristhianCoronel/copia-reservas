import { useState } from 'react';
import { TextInput, PasswordInput, Button, Text, Group, Divider, Anchor } from '@mantine/core';
import { IconMail, IconLock, IconUser, IconBrandGoogle } from '@tabler/icons-react';
import { apiCall } from '../api';

interface AuthViewProps {
  onLogin: () => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    setErrorMsg('');

    if (!email) {
      setErrorMsg("Ingresa un usuario o correo electrónico.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiCall('/api/v1/auth/login', 'POST', { email, password });
      if (res.status && res.data.token) {
        localStorage.setItem('token', res.data.token);
        onLogin();
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Credenciales incorrectas o error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <img src="/separaaltoke_icono.svg" alt="Separa Altoke Logo" style={{ width: 120, height: 120, marginBottom: 16 }} />
        <Text fw={800} size="h1" mb="xs">
          Separa <Text span c="dimmed">Altoke</Text>
        </Text>
        <Text c="dimmed" size="sm" px="xl">
          {isRegister ? 'Crea una cuenta para unirte a los partidos' : 'Inicia sesión para gestionar tus reservas o tu cancha'}
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isRegister ? (
          <div style={{ textAlign: 'center' }}>
            <Text mb="xl" c="dimmed">El registro desde la aplicación está deshabilitado por ahora. Consulta en recepción.</Text>
            <Button fullWidth variant="outline" color="dark" onClick={() => setIsRegister(false)}>
              Volver al Login
            </Button>
          </div>
        ) : (
          <>
            <TextInput
              placeholder="Usuario o Correo"
              leftSection={<IconUser size={18} color="#94A3B8" />}
              size="md"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={errorMsg !== ''}
            />

            <PasswordInput
              placeholder="Contraseña"
              leftSection={<IconLock size={18} color="#94A3B8" />}
              size="md"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              error={errorMsg !== ''}
            />

            {errorMsg && (
              <Text c="red" size="sm" ta="center">
                {errorMsg}
              </Text>
            )}

            <Group justify="flex-end">
              <Anchor component="button" size="xs" c="dimmed" style={{ textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Anchor>
            </Group>

            <Button fullWidth size="md" color="dark" mt="sm" onClick={handleAuth} loading={loading}>
              INGRESAR
            </Button>

            <Divider my="md" label="O" labelPosition="center" />

            <Button
              fullWidth
              variant="default"
              size="md"
              leftSection={<IconBrandGoogle size={18} />}
              mb="sm"
            >
              Iniciar con Google
            </Button>

            <Button
              fullWidth
              variant="outline"
              color="dark"
              size="md"
              onClick={() => setIsRegister(true)}
            >
              Crear una cuenta nueva
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

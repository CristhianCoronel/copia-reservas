import { useState } from 'react';
import { TextInput, PasswordInput, Button, Text, Group, Divider, Anchor, Select } from '@mantine/core';
import { IconMail, IconLock, IconUser, IconBrandGoogle } from '@tabler/icons-react';
import { apiCall } from '../api';
import { storage } from '../storage';

interface AuthViewProps {
  onLogin: () => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Register fields
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [tipoDoc, setTipoDoc] = useState('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

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
        storage.setItem('separaaltokeid', res.data.token);
        onLogin();
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Credenciales incorrectas o error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrorMsg('');

    if (!regEmail.startsWith('sauser_')) {
      setErrorMsg("El registro no está habilitado para este correo.");
      setLoading(false);
      return;
    }
    
    if (!nombres || !apellidos || !numDoc || !regEmail || !regPassword) {
      setErrorMsg("Completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: regEmail,
        password: regPassword,
        username: regEmail.split('@')[0],
        persona: {
          nombres,
          apellidos,
          tipo_documento: tipoDoc,
          numero_documento: numDoc
        }
      };
      
      const res = await apiCall('/api/v1/auth/register', 'POST', payload);
      
      // Auto-login after register
      if (res.id) {
        const loginRes = await apiCall('/api/v1/auth/login', 'POST', { email: regEmail, password: regPassword });
        if (loginRes.status && loginRes.data.token) {
          storage.setItem('separaaltokeid', loginRes.data.token);
          onLogin();
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Error al registrar la cuenta.");
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
          <>
            <Group grow mb="sm">
              <TextInput
                placeholder="Nombres"
                size="md"
                value={nombres}
                onChange={(e) => setNombres(e.currentTarget.value)}
              />
              <TextInput
                placeholder="Apellidos"
                size="md"
                value={apellidos}
                onChange={(e) => setApellidos(e.currentTarget.value)}
              />
            </Group>
            <Group grow mb="sm">
              <Select
                data={['DNI', 'CE', 'PASAPORTE']}
                value={tipoDoc}
                onChange={(val) => setTipoDoc(val || 'DNI')}
                size="md"
              />
              <TextInput
                placeholder="Nº Documento"
                size="md"
                value={numDoc}
                onChange={(e) => setNumDoc(e.currentTarget.value)}
              />
            </Group>
            <TextInput
              placeholder="Correo electrónico"
              size="md"
              leftSection={<IconMail size={18} color="#94A3B8" />}
              value={regEmail}
              onChange={(e) => setRegEmail(e.currentTarget.value)}
            />
            <PasswordInput
              placeholder="Contraseña (mín 8 car.)"
              size="md"
              leftSection={<IconLock size={18} color="#94A3B8" />}
              value={regPassword}
              onChange={(e) => setRegPassword(e.currentTarget.value)}
            />
            {errorMsg && (
              <Text c="red" size="sm" ta="center">
                {errorMsg}
              </Text>
            )}
            <Button fullWidth size="md" color="dark" mt="sm" onClick={handleRegister} loading={loading}>
              CREAR CUENTA
            </Button>
            <Button fullWidth variant="subtle" color="gray" onClick={() => { setIsRegister(false); setErrorMsg(''); }}>
              Volver al Login
            </Button>
          </>
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

import { useState, useEffect } from 'react';
import { Card, Text, Group, Avatar, Button, ActionIcon, CopyButton, Divider, SegmentedControl, useMantineColorScheme, Center, Loader } from '@mantine/core';
import { IconStar, IconWallet, IconGift, IconCopy, IconCheck, IconCalendarEvent, IconSettings, IconLogout, IconChevronRight } from '@tabler/icons-react';
import { apiCall } from '../api';

interface ProfileProps {
  onLogout?: () => void;
}

export function ProfileView({ onLogout }: ProfileProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiCall('/api/v1/player/profile/me/accounts');
        if (res.status === undefined || res.data) {
          setProfile(res.data.personal);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading || !profile) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  const referralCode = profile.referral?.code || '---';

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <Avatar size="xl" color="dark" radius="100%" mb="sm">
          {profile.fullName.substring(0, 2).toUpperCase()}
        </Avatar>
        <Text fw={800} size="xl">{profile.fullName}</Text>
        <Text size="xs" c="dimmed">{profile.role} Activo • DNI {profile.document}</Text>
      </div>

      <Card padding="lg" radius="md" withBorder mb="xl">
        <Group gap="xs" mb="sm">
          <IconCheck size={20} color="#10B981" />
          <Text fw={800}>Verificar Cuenta</Text>
        </Group>
        <Text size="xs" c="dimmed" mb="md">
          Vincula tu número de celular para poder realizar reservas y unirte a partidos abiertos.
        </Text>
        <Group gap="sm" wrap="nowrap">
          <div style={{ width: 100 }}>
            <Text size="sm" fw={500} mb={4}>País</Text>
            <Button variant="default" fullWidth>+51</Button>
          </div>
          <div style={{ flexGrow: 1 }}>
            <Text size="sm" fw={500} mb={4}>Celular</Text>
            <input 
              type="tel" 
              placeholder="999 999 999" 
              style={{ width: '100%', padding: '6px 12px', borderRadius: 4, border: '1px solid #ced4da', height: 36 }}
            />
          </div>
        </Group>
        <Button fullWidth mt="md" color="dark">Enviar SMS de Verificación</Button>
      </Card>

      <Card padding="lg" radius="md" withBorder mb="xl">
        <Group gap="xs" mb="sm">
          <IconGift size={20} color="#025865" />
          <Text fw={800}>Programa "Jugador Invita Jugador" B2C</Text>
        </Group>

        <Text size="xs" c="dimmed" mb="md">
          Comparte tu código dinámico. Si un amigo se registra y completa su 1er partido, ambos reciben S/. 15.00 de saldo virtual.
        </Text>

        <Group justify="space-between" mb="lg">
          <Text fw={800} size="lg" c="dark" style={{ letterSpacing: 2 }}>{referralCode}</Text>
          <CopyButton value={referralCode} timeout={2000}>
            {({ copied, copy }) => (
              <Button color={copied ? 'teal' : 'dark'} onClick={copy} size="xs">
                {copied ? '¡Copiado! ✓' : 'Copiar Código'}
              </Button>
            )}
          </CopyButton>
        </Group>

        <Group grow align="center">
          <Card padding="sm" radius="md" withBorder style={{ textAlign: 'center' }}>
            <Text fw={800} size="lg">{profile.referral?.successfulReferrals}</Text>
            <Text size="xs" c="dimmed">Referidos Exitosos</Text>
          </Card>
          <Card padding="sm" radius="md" withBorder style={{ textAlign: 'center' }}>
            <Text fw={800} size="lg">S/. {profile.referral?.totalEarned?.toFixed(2)}</Text>
            <Text size="xs" c="dimmed">Ganados en Total</Text>
          </Card>
        </Group>
      </Card>

      <Card padding="lg" radius="md" withBorder mb="xl" style={{ backgroundColor: 'var(--mantine-color-dark-8)', color: 'white' }}>
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text fw={800} size="lg" c="white">¿Eres dueño de una cancha?</Text>
            <Text size="xs" c="gray.4" mt={4}>Únete como aliado y gestiona tus reservas.</Text>
          </div>
          <Button color="white" c="dark" radius="md" size="xs" onClick={() => {
            window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'registro_empresa' }));
          }}>
            Registrar
          </Button>
        </Group>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Card padding="md" radius="md" withBorder>
          <Group justify="space-between" wrap="nowrap" mb="sm">
            <Group gap="md">
              <IconSettings size={20} color="#94A3B8" />
              <Text size="sm" fw={600}>Apariencia de la App</Text>
            </Group>
          </Group>
          <SegmentedControl
            fullWidth
            value={colorScheme}
            onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
            data={[
              { label: 'Claro', value: 'light' },
              { label: 'Adaptativo', value: 'auto' },
              { label: 'Oscuro', value: 'dark' },
            ]}
            color="dark"
          />
        </Card>

        <Card padding="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={onLogout}>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md">
              <IconLogout size={20} color="#EF4444" />
              <Text size="sm" fw={600} c="#EF4444">Cerrar Sesión</Text>
            </Group>
          </Group>
        </Card>
      </div>
    </div>
  );
}

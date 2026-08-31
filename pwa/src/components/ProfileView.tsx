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
        const res = await apiCall('/player/profile/me');
        if (res.status) {
          setProfile(res.data);
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
    return <Center p="xl"><Loader color="tocaOrange" /></Center>;
  }

  const referralCode = profile.referral?.code || '---';

  return (
    <div style={{ padding: 16 }}>
      {/* Header Perfil */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <Avatar size="xl" color="tocaOrange" radius="100%" mb="sm">
          {profile.fullName.substring(0, 2).toUpperCase()}
        </Avatar>
        <Text fw={800} size="xl">{profile.fullName}</Text>
        <Text size="xs" c="dimmed">{profile.role} Activo • DNI {profile.document}</Text>

        <Group gap="xs" mt="md" style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--mantine-color-default-border)' }}>
          <IconStar size={16} color="#FFD700" style={{ fill: '#FFD700' }} />
          <Text size="xs" fw={700} c="#FFD700">Reputación: {profile.reputation?.score}/5.0 ({profile.reputation?.completedMatches} Partidos)</Text>
        </Group>
      </div>

      {/* Monedero Virtual */}
      <Card padding="lg" radius="md" withBorder mb="lg">
        <Group gap="xs" mb="sm">
          <IconWallet size={20} color="#ee5e00" />
          <Text fw={800}>Monedero Virtual</Text>
        </Group>
        
        <Card padding="md" radius="md" withBorder style={{ textAlign: 'center' }}>
          <Text fw={800} size="xl" c="tocaOrange">S/. {profile.walletBalance?.toFixed(2)}</Text>
          <Text size="xs" c="dimmed">Crédito disponible para reservas</Text>
        </Card>
      </Card>

      {/* Programa Jugador Invita Jugador */}
      <Card padding="lg" radius="md" withBorder mb="xl">
        <Group gap="xs" mb="sm">
          <IconGift size={20} color="#025865" />
          <Text fw={800}>Programa "Jugador Invita Jugador" B2C</Text>
        </Group>

        <Text size="xs" c="dimmed" mb="md">
          Comparte tu código dinámico. Si un amigo se registra y completa su 1er partido, ambos reciben S/. 15.00 de saldo virtual.
        </Text>

        <Group justify="space-between" mb="lg">
          <Text fw={800} size="lg" c="tocaTeal" style={{ letterSpacing: 2 }}>{referralCode}</Text>
          <CopyButton value={referralCode} timeout={2000}>
            {({ copied, copy }) => (
              <Button color={copied ? 'teal' : 'tocaOrange'} onClick={copy} size="xs">
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

      {/* Menú Adicional */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Card padding="md" radius="md" withBorder style={{ cursor: 'pointer' }}>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md">
              <IconCalendarEvent size={20} color="#94A3B8" />
              <Text size="sm" fw={600}>Historial de Partidos y Comprobantes</Text>
            </Group>
            <IconChevronRight size={16} color="#475569" />
          </Group>
        </Card>

        <Card padding="md" radius="md" withBorder style={{ cursor: 'pointer' }}>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md">
              <IconStar size={20} color="#94A3B8" />
              <Text size="sm" fw={600}>Mis Calificaciones y Reseñas</Text>
            </Group>
            <IconChevronRight size={16} color="#475569" />
          </Group>
        </Card>

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
            color="tocaOrange"
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

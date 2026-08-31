import { useState, useEffect } from 'react';
import { Tabs, Card, Text, Group, Badge, Button, Progress, TextInput, ActionIcon, Divider, Avatar, Center, Loader } from '@mantine/core';
import { IconUsers, IconShieldCheck, IconUserCircle, IconCheck, IconX, IconSend, IconPlus } from '@tabler/icons-react';
import { apiCall } from '../api';

interface OpenGroup {
  id: string;
  title: string;
  organizer: string;
  organizerRating: number;
  courtName: string;
  date: string;
  time: string;
  maxPlayers: number;
  currentPlayers: number;
  totalCourtPrice: number;
  sport: string;
}

function JuntasTab() {
  const [groups, setGroups] = useState<OpenGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await apiCall('/player/social/groups');
        if (res.status) {
          setGroups(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  const handleJoinGroup = async (groupId: string) => {
    try {
      const res = await apiCall(`/player/social/groups/${groupId}/join`, 'POST');
      if (res.status) {
        setGroups(prev => prev.map(g => {
          if (g.id === groupId && g.currentPlayers < g.maxPlayers) {
            return { ...g, currentPlayers: res.data.currentPlayers };
          }
          return g;
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <Center p="xl"><Loader color="tocaOrange" /></Center>;
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <Text fw={800} size="xl">Juntas & Partidos Abiertos ⚽🎾</Text>
      <Text c="dimmed" size="sm" mb="lg">
        Únete a partidos organizados por otros jugadores cerca de ti y divide los gastos automáticamente.
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map((group) => {
          const splitPrice = (group.totalCourtPrice / group.maxPlayers).toFixed(2);
          const isFull = group.currentPlayers >= group.maxPlayers;
          const progressPercent = (group.currentPlayers / group.maxPlayers) * 100;

          return (
            <Card key={group.id} padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Badge color="gray" variant="light">{group.sport}</Badge>
                <Badge color={isFull ? 'red' : 'green'} variant="light">
                  {isFull ? '🔒 COMPLETO' : '🟢 BUSCANDO JUGADORES'}
                </Badge>
              </Group>
              
              <Text fw={800} size="lg" mb="sm">{group.title}</Text>

              <Group gap="xs" mb="sm">
                <Avatar size="sm" color="tocaTeal" radius="xl"><IconUserCircle size={16} /></Avatar>
                <Text size="sm" c="dimmed">Org: {group.organizer} (⭐ {group.organizerRating})</Text>
              </Group>

              <Text size="sm" c="dimmed">📍 {group.courtName}</Text>
              <Text size="sm" c="dimmed" mb="md">📅 {group.date} • ⏰ {group.time}</Text>

              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700}>Cupo de Asistentes:</Text>
                <Text size="xs" fw={700} c="tocaTeal">{group.currentPlayers} / {group.maxPlayers} Jugadores</Text>
              </Group>
              <Progress 
                value={progressPercent} 
                color={isFull ? 'red' : 'tocaTeal'} 
                size="md" 
                radius="xl" 
                mb="md" 
              />

              <Divider mb="md" />

              <Group justify="space-between" align="center">
                <div>
                  <Text size="xs" c="dimmed">Cuota por jugador:</Text>
                  <Text fw={800} size="lg" c="tocaOrange">S/. {splitPrice}</Text>
                </div>
                <Button 
                  disabled={isFull} 
                  onClick={() => handleJoinGroup(group.id)}
                  color="tocaOrange"
                >
                  {isFull ? 'Cupo Lleno' : '¡Unirme al Partido! 🤝'}
                </Button>
              </Group>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function EquiposTab() {
  return (
    <div style={{ paddingTop: 16 }}>
      <Text fw={800} size="xl">Tus Equipos 🛡️</Text>
      <Text c="dimmed" size="sm" mb="lg">
        Gestiona tus equipos, invita amigos y revisa invitaciones pendientes.
      </Text>

      <Button fullWidth leftSection={<IconPlus size={16} />} color="tocaTeal" variant="light" mb="xl">
        CREAR NUEVO EQUIPO
      </Button>

      <Text fw={700} mb="sm">Invitaciones Pendientes (1)</Text>
      <Card padding="md" radius="md" withBorder mb="xl">
        <Group justify="space-between">
          <div>
            <Text fw={800}>Los Galácticos FC</Text>
            <Text size="xs" c="dimmed">Invitado por: Mario Vargas</Text>
          </div>
          <Group gap="xs">
            <ActionIcon color="green" variant="light" radius="xl" size="lg"><IconCheck size={18} /></ActionIcon>
            <ActionIcon color="red" variant="light" radius="xl" size="lg"><IconX size={18} /></ActionIcon>
          </Group>
        </Group>
      </Card>

      <Text fw={700} mb="sm">Mis Equipos</Text>
      <Card padding="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={800} size="lg">Deportivo Los Pinos</Text>
            <Text size="sm" c="dimmed">Fútbol 7 • 12 Miembros</Text>
          </div>
          <Badge color="tocaOrange" variant="filled">ADMIN</Badge>
        </Group>
        
        <Divider mb="md" />
        
        <Text size="xs" fw={700} c="dimmed" mb="xs">Invitar jugador por correo:</Text>
        <Group wrap="nowrap">
          <TextInput 
            placeholder="correo@ejemplo.com" 
            flex={1}
          />
          <ActionIcon size={36} color="tocaOrange" variant="filled"><IconSend size={18} /></ActionIcon>
        </Group>
      </Card>
    </div>
  );
}

export function SocialView() {
  return (
    <div style={{ padding: 16 }}>
      <Tabs defaultValue="juntas" color="tocaOrange" variant="pills" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="juntas" leftSection={<IconUsers size={16} />}>Juntas</Tabs.Tab>
          <Tabs.Tab value="equipos" leftSection={<IconShieldCheck size={16} />}>Equipos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="juntas">
          <JuntasTab />
        </Tabs.Panel>

        <Tabs.Panel value="equipos">
          <EquiposTab />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

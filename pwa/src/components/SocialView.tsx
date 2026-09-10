import { useState, useEffect } from 'react';
import { Tabs, Card, Text, Group, Badge, Button, Progress, TextInput, ActionIcon, Divider, Avatar, Center, Loader, Modal, Select } from '@mantine/core';
import { IconUsers, IconShieldCheck, IconUserCircle, IconCheck, IconX, IconSend, IconPlus, IconLock, IconStarFilled, IconMapPin, IconCalendar, IconClock, IconBallFootball, IconBallTennis, IconMessageCircle, IconChevronRight } from '@tabler/icons-react';
import { apiCall } from '../api';
import { ChatView } from './ChatView';

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

function PartidasAbiertasTab() {
  const [groups, setGroups] = useState<OpenGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createMatchOpened, setCreateMatchOpened] = useState(false);

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await apiCall('/api/v1/player/social/groups');
        if (res.status && res.data) {
          setGroups(res.data);
        } else { throw new Error(); }
      } catch (error) {
        setGroups([
          {
            id: '1',
            title: 'Falta 1 para Padel',
            organizer: 'Juan Perez',
            organizerRating: 4.8,
            courtName: 'Padel Club Sur',
            date: 'Hoy',
            time: '20:00',
            maxPlayers: 4,
            currentPlayers: 3,
            totalCourtPrice: 120,
            sport: 'PADEL'
          },
          {
            id: '2',
            title: 'Fulbito de Jueves',
            organizer: 'Carlos M.',
            organizerRating: 5.0,
            courtName: 'Canchas El Barrio',
            date: 'Jue 4',
            time: '19:00',
            maxPlayers: 10,
            currentPlayers: 10,
            totalCourtPrice: 150,
            sport: 'FUTBOL5'
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  const handleJoinGroup = async (groupId: string) => {
    // ::!todo!::Conectar con API real
    setGroups(prev => prev.map(g => {
      if (g.id === groupId && g.currentPlayers < g.maxPlayers) {
        return { ...g, currentPlayers: g.currentPlayers + 1 };
      }
      return g;
    }));
  };

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <Group gap="xs" mb="xs"><IconBallFootball size={24}/><IconBallTennis size={24}/><Text fw={800} size="xl">Partidas Abiertas</Text></Group>
      <Text c="dimmed" size="sm" mb="lg">
        Únete a partidos organizados por otros jugadores cerca de ti y divide los gastos automáticamente.
      </Text>

      <Button fullWidth leftSection={<IconPlus size={16} />} color="dark" variant="filled" mb="xl" onClick={() => setCreateMatchOpened(true)}>
        ORGANIZAR PARTIDO
      </Button>

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
                  {isFull ? <Group gap={4}><IconLock size={14}/> <span>COMPLETO</span></Group> : <Group gap={4}><IconCheck size={14}/> <span>BUSCANDO JUGADORES</span></Group>}
                </Badge>
              </Group>
              
              <Text fw={800} size="lg" mb="sm">{group.title}</Text>

              <Group gap="xs" mb="sm">
                <Avatar size="sm" color="dark" radius="xl"><IconUserCircle size={16} /></Avatar>
                <Group gap={4}><Text size="sm" c="dimmed">Org: {group.organizer} (</Text><IconStarFilled size={12} color="#F59E0B" /><Text size="sm" c="dimmed">{group.organizerRating})</Text></Group>
              </Group>

              <Group gap={6} mb={4}><IconMapPin size={16} color="gray" /><Text size="sm" c="dimmed">{group.courtName}</Text></Group>
              <Group gap={6} mb="md"><IconCalendar size={16} color="gray" /><Text size="sm" c="dimmed">{group.date} •</Text><IconClock size={16} color="gray" /><Text size="sm" c="dimmed">{group.time}</Text></Group>

              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700}>Cupo de Asistentes:</Text>
                <Text size="xs" fw={700} c="dark">{group.currentPlayers} / {group.maxPlayers} Jugadores</Text>
              </Group>
              <Progress 
                value={progressPercent} 
                color={isFull ? 'red' : 'dark'} 
                size="md" 
                radius="xl" 
                mb="md" 
              />

              <Divider mb="md" />

              <Group justify="space-between" align="center">
                <div>
                  <Text size="xs" c="dimmed">Cuota por jugador:</Text>
                  <Text fw={800} size="lg" c="dark">S/. {splitPrice}</Text>
                </div>
                <Button 
                  disabled={isFull} 
                  onClick={() => handleJoinGroup(group.id)}
                  color="dark"
                >
                  {isFull ? 'Cupo Lleno' : '¡Unirme al Partido!'}
                </Button>
              </Group>
            </Card>
          );
        })}
      </div>

      <Modal opened={createMatchOpened} onClose={() => setCreateMatchOpened(false)} title={<Text fw={800} size="lg">Organizar Partido</Text>} centered>
        <TextInput label="Título de la partida" placeholder="Ej. Falta 1 para Padel" mb="md" data-autofocus />
        <Select label="Deporte" placeholder="Selecciona un deporte" data={['Fútbol 5', 'Fútbol 7', 'Fútbol 11', 'Pádel', 'Básquet']} mb="md" />
        <TextInput label="Sede o Cancha" placeholder="Ej. Padel Club Sur" mb="md" />
        <Group grow mb="md">
          <TextInput label="Fecha" placeholder="DD/MM" />
          <TextInput label="Hora" placeholder="HH:MM" />
        </Group>
        <Group grow mb="xl">
          <TextInput label="Jugadores Totales" placeholder="Ej. 4" type="number" />
          <TextInput label="Costo Total (S/.)" placeholder="Ej. 120" type="number" />
        </Group>
        <Button fullWidth color="dark" onClick={() => {
          setGroups([{
            id: Date.now().toString(),
            title: 'Falta 1 para Padel (Nuevo)',
            organizer: 'Juan Perez (Tú)',
            organizerRating: 5.0,
            courtName: 'Padel Club Sur',
            date: 'Hoy',
            time: '20:00',
            maxPlayers: 4,
            currentPlayers: 1,
            totalCourtPrice: 120,
            sport: 'PADEL'
          }, ...groups]);
          setCreateMatchOpened(false);
        }}>Publicar Partido</Button>
      </Modal>
    </div>
  );
}

function EquiposTab() {
  const [invitations, setInvitations] = useState([
    { id: 'inv1', teamName: 'Los Galácticos FC', inviter: 'Mario Vargas' }
  ]);
  const [myTeams, setMyTeams] = useState([
    { id: 'team1', name: 'Deportivo Los Pinos', sport: 'Fútbol 7', members: 12, role: 'ADMIN' },
    { id: 'team2', name: 'Viernes de Fulbito', sport: 'Fútbol 5', members: 8, role: 'MIEMBRO' }
  ]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [createTeamOpened, setCreateTeamOpened] = useState(false);

  const handleAcceptInvite = (id: string, teamName: string) => {
    setInvitations(invitations.filter(inv => inv.id !== id));
    setMyTeams([{ id: `new_${id}`, name: teamName, sport: 'Fútbol', members: 1, role: 'MIEMBRO' }, ...myTeams]);
  };

  const handleRejectInvite = (id: string) => {
    setInvitations(invitations.filter(inv => inv.id !== id));
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <Group gap="xs" mb="xs"><IconShieldCheck size={24}/><Text fw={800} size="xl">Tus Equipos</Text></Group>
      <Text c="dimmed" size="sm" mb="lg">
        Gestiona tus equipos, invita amigos y revisa invitaciones pendientes.
      </Text>

      <Button fullWidth leftSection={<IconPlus size={16} />} color="dark" variant="filled" mb="xl" onClick={() => setCreateTeamOpened(true)}>
        CREAR NUEVO EQUIPO
      </Button>

      {invitations.length > 0 && (
        <>
          <Text fw={700} mb="sm">Invitaciones Pendientes ({invitations.length})</Text>
          {invitations.map(inv => (
            <Card key={inv.id} padding="md" radius="md" withBorder mb="xl">
              <Group justify="space-between">
                <div>
                  <Text fw={800}>{inv.teamName}</Text>
                  <Text size="xs" c="dimmed">Invitado por: {inv.inviter}</Text>
                </div>
                <Group gap="xs">
                  <ActionIcon onClick={() => handleAcceptInvite(inv.id, inv.teamName)} color="green" variant="light" radius="xl" size="lg"><IconCheck size={18} /></ActionIcon>
                  <ActionIcon onClick={() => handleRejectInvite(inv.id)} color="red" variant="light" radius="xl" size="lg"><IconX size={18} /></ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </>
      )}

      <Text fw={700} mb="sm">Mis Equipos</Text>
      <Card padding="md" radius="md" withBorder>
        {myTeams.map((team, index) => (
          <div key={team.id}>
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={800} size="lg">{team.name}</Text>
                <Text size="sm" c="dimmed">{team.sport} • {team.members} Miembros</Text>
              </div>
              <Group gap="xs">
                <Badge color={team.role === 'ADMIN' ? 'dark' : 'gray'} variant={team.role === 'ADMIN' ? 'filled' : 'light'}>
                  {team.role}
                </Badge>
                <ActionIcon variant="default" onClick={() => setSelectedTeam(team)}>
                  <IconChevronRight size={18} />
                </ActionIcon>
              </Group>
            </Group>
            {index < myTeams.length - 1 && <Divider mb="md" />}
          </div>
        ))}
      </Card>

      <Modal 
        opened={!!selectedTeam} 
        onClose={() => setSelectedTeam(null)} 
        title={<Text fw={800} size="lg">{selectedTeam?.name}</Text>}
        centered
      >
        <Text size="sm" c="dimmed" mb="md">Gestiona los miembros del equipo y la participación.</Text>

        {selectedTeam?.role === 'ADMIN' && (
          <Card padding="sm" radius="md" withBorder mb="lg">
            <Text size="xs" fw={700} mb="xs">Invitar nuevo jugador:</Text>
            <Group wrap="nowrap">
              <TextInput placeholder="correo@ejemplo.com" flex={1} />
              <ActionIcon size={36} color="dark" variant="filled"><IconSend size={18} /></ActionIcon>
            </Group>
          </Card>
        )}

        <Text fw={700} mb="sm">Integrantes ({selectedTeam?.members})</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Group wrap="nowrap">
            <Avatar color="blue" radius="xl">JP</Avatar>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={700}>Juan Pérez (Tú)</Text>
              <Text size="xs" c="dimmed">{selectedTeam?.role}</Text>
            </div>
          </Group>
          <Group wrap="nowrap">
            <Avatar color="gray" radius="xl">MV</Avatar>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={700}>Mario Vargas</Text>
              <Text size="xs" c="dimmed">MIEMBRO</Text>
            </div>
          </Group>
        </div>
      </Modal>

      <Modal opened={createTeamOpened} onClose={() => setCreateTeamOpened(false)} title={<Text fw={800} size="lg">Crear Nuevo Equipo</Text>} centered>
        <TextInput label="Nombre del Equipo" placeholder="Ej. Los Galácticos" mb="md" data-autofocus />
        <Select label="Deporte principal" placeholder="Selecciona un deporte" data={['Fútbol 5', 'Fútbol 7', 'Fútbol 11', 'Pádel', 'Básquet']} mb="xl" />
        <Button fullWidth color="dark" onClick={() => setCreateTeamOpened(false)}>Crear Equipo</Button>
      </Modal>
    </div>
  );
}

export function SocialView() {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  if (activeChat) {
    return (
      <div style={{ padding: 0 }}>
        <ChatView activeChat={activeChat} setActiveChat={setActiveChat} />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Tabs defaultValue="chat" color="dark" variant="pills" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="chat" leftSection={<IconMessageCircle size={16} />}>Chat</Tabs.Tab>
          <Tabs.Tab value="equipos" leftSection={<IconShieldCheck size={16} />}>Equipos</Tabs.Tab>
          <Tabs.Tab value="partidas" leftSection={<IconUsers size={16} />}>Partidas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="chat" pt="xs">
          <ChatView activeChat={activeChat} setActiveChat={setActiveChat} />
        </Tabs.Panel>

        <Tabs.Panel value="equipos">
          <EquiposTab />
        </Tabs.Panel>

        <Tabs.Panel value="partidas">
          <PartidasAbiertasTab />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

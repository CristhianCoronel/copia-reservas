import { Group, Text, UnstyledButton, Center, ScrollArea, Modal, Avatar, Card, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlayFootball, IconUsers, IconCalendarEvent, IconUser, IconBusinessplan, IconMapPin, IconBuilding } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import classes from './App.module.css';

import { CourtsView } from './components/CourtsView';
import { SocialView } from './components/SocialView';
import { PlayerReservationsView } from './components/PlayerReservationsView';
import { ProfileView } from './components/ProfileView';

import { CompanyReservationsView } from './components/CompanyReservationsView';
import { CompanyCourtsView } from './components/CompanyCourtsView';
import { CompanyEditView } from './components/CompanyEditView';
import { AuthView } from './components/AuthView';

export default function App() {
  const [activeTab, setActiveTab] = useState('canchas');
  const [appMode, setAppMode] = useState<'jugador' | 'empresa'>('jugador');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // Verificar si hay token al montar la aplicación
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const switchToJugador = () => {
    setAppMode('jugador');
    setActiveTab('canchas');
    closeModal();
  };

  const switchToEmpresa = () => {
    setAppMode('empresa');
    setActiveTab('reservas');
    closeModal();
  };

  if (!isAuthenticated) {
    return (
      <Center style={{ minHeight: '100vh', backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-8))' }}>
        <div className={classes.shellConstrain}>
          <AuthView onLogin={() => setIsAuthenticated(true)} />
        </div>
      </Center>
    );
  }

  return (
    <Center style={{ minHeight: '100vh', backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-8))' }}>
      
      {/* Contenedor Principal Flexbox */}
      <div className={classes.shellConstrain} style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        
        {/* Header */}
        <header style={{ height: 60, borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <img src="/logo.png" alt="Separa Altoke" height={24} />
            </Group>
            
            {/* Avatar interactivo en lugar del botón */}
            <UnstyledButton onClick={openModal}>
              {appMode === 'jugador' ? (
                <Avatar color="dark" radius="xl" size="sm">JP</Avatar>
              ) : (
                <Avatar src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=100&q=80" radius="md" size="sm" />
              )}
            </UnstyledButton>
          </Group>
        </header>

        {/* Contenido Principal con Scroll Interno */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <ScrollArea type="hover" style={{ height: '100%' }}>
            {appMode === 'jugador' && activeTab === 'canchas' && <CourtsView />}
            {appMode === 'jugador' && activeTab === 'social' && <SocialView />}
            {appMode === 'jugador' && activeTab === 'reservas' && <PlayerReservationsView />}
            {appMode === 'jugador' && activeTab === 'perfil' && <ProfileView onLogout={handleLogout} />}

            {appMode === 'empresa' && activeTab === 'reservas' && <CompanyReservationsView />}
            {appMode === 'empresa' && activeTab === 'canchas' && <CompanyCourtsView />}
            {appMode === 'empresa' && activeTab === 'empresa' && <CompanyEditView />}
            
            {appMode === 'empresa' && !['reservas', 'canchas', 'empresa'].includes(activeTab) && (
              <div style={{ padding: 16 }}>
                <Text c="dimmed">Selecciona una pestaña válida en el menú inferior.</Text>
              </div>
            )}
          </ScrollArea>
        </main>

        {/* Footer */}
        <footer style={{ height: 70, borderTop: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}>
          <Group h="100%" grow px="md" gap={0}>
            {appMode === 'jugador' ? (
              <>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('canchas')}>
                  <IconPlayFootball size={24} color={activeTab === 'canchas' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'canchas' ? 800 : 600} c={activeTab === 'canchas' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Explorar</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('social')}>
                  <IconUsers size={24} color={activeTab === 'social' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'social' ? 800 : 600} c={activeTab === 'social' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Social</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('reservas')}>
                  <IconCalendarEvent size={24} color={activeTab === 'reservas' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'reservas' ? 800 : 600} c={activeTab === 'reservas' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Reservas</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('perfil')}>
                  <IconUser size={24} color={activeTab === 'perfil' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'perfil' ? 800 : 600} c={activeTab === 'perfil' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Perfil</Text>
                </UnstyledButton>
              </>
            ) : (
              <>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('reservas')}>
                  <IconCalendarEvent size={24} color={activeTab === 'reservas' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'reservas' ? 800 : 600} c={activeTab === 'reservas' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Reservas</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('canchas')}>
                  <IconPlayFootball size={24} color={activeTab === 'canchas' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'canchas' ? 800 : 600} c={activeTab === 'canchas' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Explorar</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('empresa')}>
                  <IconBusinessplan size={24} color={activeTab === 'empresa' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'empresa' ? 800 : 600} c={activeTab === 'empresa' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Empresa</Text>
                </UnstyledButton>
              </>
            )}
          </Group>
        </footer>

      </div>

      {/* Modal de Selector de Roles */}
      <Modal 
        opened={modalOpened} 
        onClose={closeModal} 
        title={<Text fw={800} size="lg">Cambiar de Cuenta</Text>}
        centered
        overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
      >
        <Text fw={700} size="sm" c="dimmed" mb="xs">TU PERFIL PERSONAL</Text>
        <Card 
          padding="md" 
          radius="md" 
          withBorder 
          mb="xl" 
          style={{ cursor: 'pointer', borderColor: appMode === 'jugador' ? 'var(--mantine-color-text)' : undefined }}
          onClick={switchToJugador}
        >
          <Group wrap="nowrap">
            <Avatar color="dark" radius="xl" size="md">JP</Avatar>
            <div style={{ flex: 1 }}>
              <Text fw={800}>Juan Pérez</Text>
              <Text size="xs" c="dimmed">Jugador</Text>
            </div>
            {appMode === 'jugador' && <Badge color="dark" variant="filled">ACTIVO</Badge>}
          </Group>
        </Card>

        <Text fw={700} size="sm" c="dimmed" mb="xs">EMPRESAS Y SEDES</Text>
        <Group gap={6} mb="xs"><IconBuilding size={16}/><Text size="xs" fw={800}>Separa Altoke Norte</Text></Group>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Card 
            padding="sm" 
            radius="md" 
            withBorder 
            style={{ cursor: 'pointer', borderColor: appMode === 'empresa' ? 'var(--mantine-color-text)' : undefined }}
            onClick={switchToEmpresa}
          >
            <Group wrap="nowrap">
              <Avatar src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=100&q=80" radius="md" size="md" />
              <div style={{ flex: 1 }}>
                <Text fw={800} size="sm">Complejo Triple Doble</Text>
                <Text size="xs" c="dimmed"><IconMapPin size={10} /> Av. Principal 123</Text>
              </div>
              {appMode === 'empresa' && <Badge color="dark" variant="filled">ACTIVO</Badge>}
            </Group>
          </Card>
          
          <Card 
            padding="sm" 
            radius="md" 
            withBorder 
            style={{ cursor: 'pointer' }}
            onClick={switchToEmpresa}
          >
            <Group wrap="nowrap">
              <Avatar src="https://images.unsplash.com/photo-1518605368461-1e1e1fd51ed4?auto=format&fit=crop&w=100&q=80" radius="md" size="md" />
              <div style={{ flex: 1 }}>
                <Text fw={800} size="sm">Canchas El Golazo</Text>
                <Text size="xs" c="dimmed"><IconMapPin size={10} /> Surco 456</Text>
              </div>
            </Group>
          </Card>
        </div>
      </Modal>

    </Center>
  );
}

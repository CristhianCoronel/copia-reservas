import { Group, Text, UnstyledButton, Center, ScrollArea, Modal, Avatar, Card, Badge, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlayFootball, IconCompass, IconUsers, IconCalendarEvent, IconUser, IconBusinessplan, IconMapPin, IconBuilding, IconMessageCircle, IconWallet } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import classes from './App.module.css';
import { apiCall } from './api';

import { CourtsView } from './components/CourtsView';
import { SocialView } from './components/SocialView';
import { PlayerReservationsView } from './components/PlayerReservationsView';
import { ProfileView } from './components/ProfileView';
import { ChatView } from './components/ChatView';
import { WalletView } from './components/WalletView';

import { CompanyReservationsView } from './components/CompanyReservationsView';
import { CompanyCourtsView } from './components/CompanyCourtsView';
import { CompanyEditView } from './components/CompanyEditView';
import { AuthView } from './components/AuthView';
import { SuperAdminView } from './components/SuperAdminView';
import { CompanyRegistrationView } from './components/CompanyRegistrationView';

export default function App() {
  const [activeTab, setActiveTab] = useState('canchas');
  const [appMode, setAppMode] = useState<'jugador' | 'empresa' | 'superadmin'>('jugador');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const { colorScheme } = useMantineColorScheme();
  
  const [accountsData, setAccountsData] = useState<any>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(localStorage.getItem('activeCompanyId'));
  const [activeVenueId, setActiveVenueId] = useState<string | null>(localStorage.getItem('activeVenueId'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const savedMode = localStorage.getItem('appMode') as 'jugador' | 'empresa' | 'superadmin';
      if (savedMode) setAppMode(savedMode);
      
      apiCall('/api/v1/player/profile/me/accounts').then(res => {
        if (res.status === undefined || res.data) {
          setAccountsData(res.data);
        }
      }).catch(console.error);
    }
  }, []);

  const handleOpenModal = () => {
    apiCall('/api/v1/player/profile/me/accounts').then(res => {
      if (res.status === undefined || res.data) {
        setAccountsData(res.data);
      }
    }).catch(console.error);
    openModal();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('appMode');
    localStorage.removeItem('activeCompanyId');
    localStorage.removeItem('activeVenueId');
    setIsAuthenticated(false);
  };

  const switchToJugador = () => {
    setAppMode('jugador');
    localStorage.setItem('appMode', 'jugador');
    setActiveTab('canchas');
    closeModal();
  };

  const switchToEmpresa = (companyId: string, venueId: string) => {
    setAppMode('empresa');
    localStorage.setItem('appMode', 'empresa');
    setActiveCompanyId(companyId);
    localStorage.setItem('activeCompanyId', companyId);
    setActiveVenueId(venueId);
    localStorage.setItem('activeVenueId', venueId);
    setActiveTab('reservas');
    closeModal();
  };

  const switchToSuperAdmin = () => {
    setAppMode('superadmin');
    localStorage.setItem('appMode', 'superadmin');
    setActiveTab('admin');
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
      
      <div className={classes.shellConstrain} style={{ backgroundColor: 'var(--mantine-color-body)' }}>
        
        <header style={{ height: 60, backgroundColor: 'var(--mantine-color-cancha-9)', flexShrink: 0 }}>
          <Group h="100%" px="md" justify="space-between">
              <img 
                src="/separaaltoke_extendidodark.svg"
                alt="Separa Altoke" 
                height={28} 
              />
            
            <UnstyledButton onClick={handleOpenModal}>
              {appMode === 'jugador' ? (
                <Avatar color="altoke.5" radius="xl" size="sm" styles={{ placeholder: { color: 'var(--mantine-color-cancha-9)' } }}>
                  {accountsData?.personal?.avatar || 'JP'}
                </Avatar>
              ) : appMode === 'empresa' ? (
                <Avatar src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=100&q=80" radius="md" size="sm" />
              ) : (
                <Avatar color="red" radius="md" size="sm">SA</Avatar>
              )}
            </UnstyledButton>
          </Group>
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          <ScrollArea type="hover" style={{ height: '100%' }}>
            {appMode === 'jugador' && activeTab === 'canchas' && <CourtsView />}
            {appMode === 'jugador' && activeTab === 'social' && <SocialView />}
            {appMode === 'jugador' && activeTab === 'billetera' && <WalletView />}
            {appMode === 'jugador' && activeTab === 'reservas' && <PlayerReservationsView />}
            {appMode === 'jugador' && activeTab === 'perfil' && <ProfileView onLogout={handleLogout} />}
            {appMode === 'jugador' && activeTab === 'registro_empresa' && <CompanyRegistrationView />}

            {appMode === 'empresa' && activeTab === 'reservas' && <CompanyReservationsView />}
            {appMode === 'empresa' && activeTab === 'canchas' && <CompanyCourtsView />}
            {appMode === 'empresa' && activeTab === 'chat' && <ChatView />}
            {appMode === 'empresa' && activeTab === 'empresa' && <CompanyEditView />}
            
            {appMode === 'superadmin' && activeTab === 'admin' && <SuperAdminView />}

            {appMode === 'empresa' && !['reservas', 'canchas', 'chat', 'empresa'].includes(activeTab) && (
              <div style={{ padding: 16 }}>
                <Text c="dimmed">Selecciona una pestaña válida en el menú inferior.</Text>
              </div>
            )}
          </ScrollArea>
        </main>

        <footer style={{ height: 70, borderTop: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}>
          <Group h="100%" grow px="md" gap={0}>
            {appMode === 'jugador' ? (
              <>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('canchas')}>
                  <IconCompass  size={24} color={activeTab === 'canchas' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} stroke={1.5} />
                  <Text fz={11} fw={activeTab === 'canchas' ? 800 : 600} c={activeTab === 'canchas' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} mt={4}>Explorar</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('social')}>
                  <IconUsers size={24} color={activeTab === 'social' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} stroke={1.5} />
                  <Text fz={11} fw={activeTab === 'social' ? 800 : 600} c={activeTab === 'social' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} mt={4}>Social</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('reservas')}>
                  <IconCalendarEvent size={24} color={activeTab === 'reservas' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} stroke={1.5} />
                  <Text fz={11} fw={activeTab === 'reservas' ? 800 : 600} c={activeTab === 'reservas' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} mt={4}>Reservas</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('billetera')}>
                  <IconWallet size={24} color={activeTab === 'billetera' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} stroke={1.5} />
                  <Text fz={11} fw={activeTab === 'billetera' ? 800 : 600} c={activeTab === 'billetera' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} mt={4}>Billetera</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('perfil')}>
                  <IconUser size={24} color={activeTab === 'perfil' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} stroke={1.5} />
                  <Text fz={11} fw={activeTab === 'perfil' ? 800 : 600} c={activeTab === 'perfil' ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-niebla-5)'} mt={4}>Perfil</Text>
                </UnstyledButton>
              </>
            ) : appMode === 'empresa' ? (
              <>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('reservas')}>
                  <IconCalendarEvent size={24} color={activeTab === 'reservas' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'reservas' ? 800 : 600} c={activeTab === 'reservas' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Reservas</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('canchas')}>
                  <IconCompass size={24} color={activeTab === 'canchas' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'canchas' ? 800 : 600} c={activeTab === 'canchas' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Explorar</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('chat')}>
                  <IconMessageCircle size={24} color={activeTab === 'chat' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'chat' ? 800 : 600} c={activeTab === 'chat' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Chat</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('empresa')}>
                  <IconBusinessplan size={24} color={activeTab === 'empresa' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'empresa' ? 800 : 600} c={activeTab === 'empresa' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Empresa</Text>
                </UnstyledButton>
              </>
            ) : (
              <>
                <UnstyledButton className={classes.navItem} onClick={() => setActiveTab('admin')}>
                  <IconUser size={24} color={activeTab === 'admin' ? 'var(--mantine-color-text)' : '#94A3B8'} />
                  <Text fz={11} fw={activeTab === 'admin' ? 800 : 600} c={activeTab === 'admin' ? 'var(--mantine-color-text)' : '#94A3B8'} mt={4}>Admin</Text>
                </UnstyledButton>
              </>
            )}
          </Group>
        </footer>

      </div>

      <Modal 
        opened={modalOpened} 
        onClose={closeModal} 
        title={<Text fw={800} size="lg">Cambiar de Cuenta</Text>}
        centered
        overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
      >
        {accountsData && accountsData.personal && (
          <>
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
                <Avatar color="altoke.5" radius="xl" size="md" styles={{ placeholder: { color: 'var(--mantine-color-cancha-9)' } }}>
                  {accountsData.personal.avatar}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text fw={800}>{accountsData.personal.fullName}</Text>
                  <Text size="xs" c="dimmed">{accountsData.personal.role === 'ADMIN' ? 'Administrador' : 'Jugador'}</Text>
                </div>
              </Group>
            </Card>
          </>
        )}

        {accountsData && accountsData.companies && accountsData.companies.length > 0 && (
          <>
            <Text fw={700} size="sm" c="dimmed" mb="xs">EMPRESAS Y SEDES</Text>
            {accountsData.companies.map((company: any) => (
              <div key={company.id}>
                <Group gap={6} mt="md" mb="xs">
                  <IconBuilding size={16}/>
                  <Text size="xs" fw={800}>{company.commercialName}</Text>
                </Group>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {company.venues.map((venue: any) => (
                    <Card 
                      key={venue.id}
                      padding="sm" 
                      radius="md" 
                      withBorder 
                      style={{ cursor: 'pointer', borderColor: (appMode === 'empresa' && activeVenueId === venue.id) ? 'var(--mantine-color-text)' : undefined }}
                      onClick={() => switchToEmpresa(company.id, venue.id)}
                    >
                      <Group wrap="nowrap">
                        <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name)}&background=random`} radius="md" size="md" />
                        <div style={{ flex: 1 }}>
                          <Text fw={800} size="sm">{venue.name}</Text>
                          <Text size="xs" c="dimmed"><IconMapPin size={10} /> {venue.address}</Text>
                        </div>
                      </Group>
                    </Card>
                  ))}
                  {company.venues.length === 0 && (
                    <Text size="xs" c="dimmed" fs="italic">No hay sedes registradas en esta empresa.</Text>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {accountsData && accountsData.isSuperAdmin && (
          <>
            <Text fw={700} size="sm" c="dimmed" mt="lg" mb="xs">ADMINISTRACIÓN SISTEMA</Text>
            <Card 
              padding="sm" 
              radius="md" 
              withBorder 
              style={{ cursor: 'pointer', borderColor: appMode === 'superadmin' ? 'var(--mantine-color-text)' : undefined }}
              onClick={switchToSuperAdmin}
            >
              <Group wrap="nowrap">
                <Avatar color="red" radius="md" size="md">SA</Avatar>
                <div style={{ flex: 1 }}>
                  <Text fw={800} size="sm">Super Admin</Text>
                  <Text size="xs" c="dimmed">Separa Altoke (Plataforma)</Text>
                </div>
              </Group>
            </Card>
          </>
        )}
      </Modal>

    </Center>
  );
}

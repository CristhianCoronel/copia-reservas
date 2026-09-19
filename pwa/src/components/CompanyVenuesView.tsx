import { useState, useEffect } from 'react';
import { Card, Text, Group, Button, Modal, TextInput, ActionIcon, Box, UnstyledButton, Grid, Select, Switch } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconMapPin, IconArrowLeft, IconSettings, IconClock, IconCalendarOff } from '@tabler/icons-react';
import { apiCall } from '../api';

export function CompanyVenuesView({ company, onVenuesChanged }: { company: any, onVenuesChanged: () => void }) {
  // Main List vs Manage Venue
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);
  
  // Settings Sections: null = menu, 'datos' | 'horario' | 'excepciones'
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Modals for creating a venue from the list
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  // Schedules state
  const [schedules, setSchedules] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);

  const venues = company?.venues?.filter((v: any) => v.estado !== 'INACTIVA') || [];
  const activeVenue = venues.find((v: any) => v.id === activeVenueId);

  // Load Schedules
  useEffect(() => {
    if (activeVenueId && (activeSection === 'horario' || activeSection === 'excepciones')) {
      loadSchedules();
    }
  }, [activeVenueId, activeSection]);

  const loadSchedules = async () => {
    try {
      const res = await apiCall(`/api/v1/business/venues/${activeVenueId}/schedules`);
      if (res.status && res.data) {
        // Initialize 7 days if empty
        const defaultWeek = [0, 1, 2, 3, 4, 5, 6].map(d => ({
          dia_semana: d,
          hora_apertura: '08:00',
          hora_cierre: '22:00',
          activo: false
        }));
        
        if (res.data.regular && res.data.regular.length > 0) {
          const loaded = defaultWeek.map(dw => {
            const found = res.data.regular.find((r: any) => r.dia_semana === dw.dia_semana);
            if (found) {
              return { ...found, activo: true };
            }
            return dw;
          });
          setSchedules(loaded);
        } else {
          setSchedules(defaultWeek);
        }

        setExceptions(res.data.exceptions || []);
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateVenue = async () => {
    // TODO: Ubigeo is currently hardcoded in backend, it should be fetched from the system later
    await apiCall(`/api/v1/business/companies/${company.id}/venues`, 'POST', {
      nombre, direccion, telefono
    });
    setIsCreateModalOpen(false);
    onVenuesChanged();
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (confirm('¿Estás seguro de que deseas inhabilitar esta sede?')) {
      await apiCall(`/api/v1/business/venues/${venueId}`, 'DELETE');
      if (activeVenueId === venueId) {
        setActiveVenueId(null);
        setActiveSection(null);
      }
      onVenuesChanged();
    }
  };

  const handleSaveDatosGenerales = async () => {
    if (!activeVenueId) return;
    await apiCall(`/api/v1/business/venues/${activeVenueId}`, 'PUT', {
      nombre, direccion, telefono
    });
    onVenuesChanged();
    alert('Datos guardados correctamente.');
  };

  const handleSaveSchedules = async () => {
    if (!activeVenueId) return;
    const payload = schedules.filter(s => s.activo).map(s => ({
      dia_semana: s.dia_semana,
      hora_apertura: s.hora_apertura,
      hora_cierre: s.hora_cierre
    }));
    await apiCall(`/api/v1/business/venues/${activeVenueId}/schedules`, 'POST', payload);
    alert('Horario regular guardado.');
  };

  const [newExcFecha, setNewExcFecha] = useState('');
  const [newExcEstado, setNewExcEstado] = useState('CERRADO');
  const [newExcTodoElDia, setNewExcTodoElDia] = useState(true);
  const [newExcDesc, setNewExcDesc] = useState('');
  const [newExcApertura, setNewExcApertura] = useState('');
  const [newExcCierre, setNewExcCierre] = useState('');

  const handleAddException = async () => {
    if (!activeVenueId || !newExcFecha) return;
    
    let apertura = null;
    let cierre = null;
    
    if (!newExcTodoElDia) {
      if (!newExcApertura || !newExcCierre) {
         alert("Debe especificar las horas de apertura y cierre si no es todo el día.");
         return;
      }
      apertura = newExcApertura;
      cierre = newExcCierre;
    }
    
    await apiCall(`/api/v1/business/venues/${activeVenueId}/exceptions`, 'POST', {
      fecha_excepcion: newExcFecha,
      estado_operativo: newExcEstado,
      hora_apertura: apertura,
      hora_cierre: cierre,
      descripcion: newExcDesc
    });
    setNewExcFecha('');
    setNewExcDesc('');
    setNewExcApertura('');
    setNewExcCierre('');
    setNewExcTodoElDia(true);
    loadSchedules();
  };

  const handleDeleteException = async (id: string) => {
    if (!activeVenueId) return;
    await apiCall(`/api/v1/business/venues/${activeVenueId}/exceptions/${id}`, 'DELETE');
    loadSchedules();
  };

  const startManaging = (venue: any) => {
    setActiveVenueId(venue.id);
    setActiveSection(null);
    setNombre(venue.name);
    setDireccion(venue.direccion || '');
    setTelefono(venue.telefono || '');
  };

  const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // VIEW 1: Venues List
  if (!activeVenueId) {
    return (
      <Box p={16}>
        <Group justify="space-between" mb="xl">
          <div>
            <Text fw={800} size="xl">Gestión de Sedes</Text>
            <Text c="dimmed" size="sm">Administra los locales físicos de tu empresa.</Text>
          </div>
          <Button leftSection={<IconPlus size={20} />} color="dark" onClick={() => {
            setNombre(''); setDireccion(''); setTelefono(''); setIsCreateModalOpen(true);
          }}>
            NUEVA SEDE
          </Button>
        </Group>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {venues.map((venue: any) => (
            <Card key={venue.id} padding="md" radius="md" withBorder>
              <Group justify="space-between" align="flex-start" mb="xs">
                <div>
                  <Text fw={800} size="lg">{venue.name}</Text>
                  <Group gap="xs" mt={4}>
                    <IconMapPin size={16} color="gray" />
                    <Text size="sm" c="dimmed">{venue.direccion || 'Sin dirección registrada'}</Text>
                  </Group>
                </div>
                <Group gap="xs">
                  <Button variant="light" size="xs" onClick={() => startManaging(venue)}>Administrar</Button>
                  <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteVenue(venue.id)}>
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
          {venues.length === 0 && (
            <Text c="dimmed" ta="center" mt="xl">No tienes sedes activas. Crea una para comenzar.</Text>
          )}
        </div>

        <Modal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={<Text fw={800}>Crear Nueva Sede</Text>} centered>
          <TextInput label="Nombre de la Sede" placeholder="Ej. Sede Norte" value={nombre} onChange={(e) => setNombre(e.currentTarget.value)} required mb="md" />
          <TextInput label="Dirección" placeholder="Av. Principal 123" value={direccion} onChange={(e) => setDireccion(e.currentTarget.value)} required mb="md" />
          <TextInput label="Teléfono de Contacto" placeholder="+51 987654321" value={telefono} onChange={(e) => setTelefono(e.currentTarget.value)} required mb="xl" />
          <Button fullWidth color="dark" onClick={handleCreateVenue}>Guardar Sede</Button>
        </Modal>
      </Box>
    );
  }

  // VIEW 2: Manage Specific Venue
  return (
    <Box p={16}>
      <Group mb="xl">
        <ActionIcon variant="subtle" color="gray" onClick={() => {
          if (activeSection) setActiveSection(null);
          else setActiveVenueId(null);
        }}>
          <IconArrowLeft size={20} />
        </ActionIcon>
        <div>
          <Text fw={800} size="lg">{activeSection ? 
            (activeSection === 'datos' ? 'Datos Generales' : activeSection === 'horario' ? 'Horario de Atención' : 'Feriados y Excepciones') 
            : activeVenue?.name}</Text>
          {activeSection && <Text size="xs" c="dimmed">{activeVenue?.name}</Text>}
        </div>
      </Group>

      {!activeSection && (
        <Grid>
          <Grid.Col span={12}>
            <UnstyledButton onClick={() => setActiveSection('datos')} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))' }}>
              <Group wrap="nowrap">
                <IconSettings size={32} color="var(--mantine-color-text)" />
                <div>
                  <Text fw={800}>Datos Generales</Text>
                  <Text size="sm" c="dimmed">Nombre, dirección, teléfono y ubicación GPS.</Text>
                </div>
              </Group>
            </UnstyledButton>
          </Grid.Col>
          <Grid.Col span={12}>
            <UnstyledButton onClick={() => setActiveSection('horario')} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))' }}>
              <Group wrap="nowrap">
                <IconClock size={32} color="var(--mantine-color-text)" />
                <div>
                  <Text fw={800}>Horario de Atención</Text>
                  <Text size="sm" c="dimmed">Días de la semana y horas de apertura regulares.</Text>
                </div>
              </Group>
            </UnstyledButton>
          </Grid.Col>
          <Grid.Col span={12}>
            <UnstyledButton onClick={() => setActiveSection('excepciones')} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))' }}>
              <Group wrap="nowrap">
                <IconCalendarOff size={32} color="var(--mantine-color-text)" />
                <div>
                  <Text fw={800}>Feriados y Excepciones</Text>
                  <Text size="sm" c="dimmed">Cierres por mantenimiento o feriados específicos.</Text>
                </div>
              </Group>
            </UnstyledButton>
          </Grid.Col>
        </Grid>
      )}

      {activeSection === 'datos' && (
        <Card withBorder padding="md" radius="md">
          <TextInput label="Nombre de la Sede" value={nombre} onChange={(e) => setNombre(e.currentTarget.value)} required mb="md" />
          <TextInput label="Dirección" value={direccion} onChange={(e) => setDireccion(e.currentTarget.value)} required mb="md" />
          <TextInput label="Teléfono de Contacto" value={telefono} onChange={(e) => setTelefono(e.currentTarget.value)} required mb="xl" />
          <Button fullWidth color="dark" onClick={handleSaveDatosGenerales}>Guardar Cambios</Button>
        </Card>
      )}

      {activeSection === 'horario' && (
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed" mb="md">Marca los días que la sede está abierta y define sus horas de operación.</Text>
          {schedules.map((s, index) => (
            <Group key={s.dia_semana} mb="sm" align="center" justify="space-between">
              <Switch 
                label={<Text fw={600} w={80}>{diasNombres[s.dia_semana]}</Text>}
                checked={s.activo} 
                onChange={(e) => {
                  const copy = [...schedules];
                  copy[index].activo = e.currentTarget.checked;
                  setSchedules(copy);
                }} 
              />
              {s.activo ? (
                <Group gap="xs">
                  <TextInput type="time" value={s.hora_apertura} onChange={e => {
                    const copy = [...schedules]; copy[index].hora_apertura = e.currentTarget.value; setSchedules(copy);
                  }} />
                  <Text size="sm">-</Text>
                  <TextInput type="time" value={s.hora_cierre} onChange={e => {
                    const copy = [...schedules]; copy[index].hora_cierre = e.currentTarget.value; setSchedules(copy);
                  }} />
                </Group>
              ) : (
                <Text size="sm" c="dimmed" fs="italic">Cerrado</Text>
              )}
            </Group>
          ))}
          <Button fullWidth color="dark" mt="xl" onClick={handleSaveSchedules}>Guardar Horario Semanal</Button>
        </Card>
      )}

      {activeSection === 'excepciones' && (
        <Box>
          <Card withBorder padding="md" radius="md" mb="xl">
            <Text fw={800} mb="sm">Añadir Excepción</Text>
            <Group grow mb="md">
              <TextInput type="date" label="Fecha" value={newExcFecha} onChange={e => setNewExcFecha(e.currentTarget.value)} />
              <Select label="Estado" value={newExcEstado} onChange={val => setNewExcEstado(val || 'CERRADO')} data={[{value:'CERRADO', label:'Cerrado'}, {value:'ABIERTO_ESPECIAL', label:'Abierto Especial'}]} />
            </Group>
            
            <Switch 
              label={<Text fw={600} size="sm">Todo el día</Text>} 
              checked={newExcTodoElDia} 
              onChange={e => setNewExcTodoElDia(e.currentTarget.checked)} 
              mb="md" 
            />

            {!newExcTodoElDia && (
              <Group grow mb="md">
                <TextInput type="time" label="Hora Apertura" value={newExcApertura} onChange={e => setNewExcApertura(e.currentTarget.value)} />
                <TextInput type="time" label="Hora Cierre" value={newExcCierre} onChange={e => setNewExcCierre(e.currentTarget.value)} />
              </Group>
            )}
            <TextInput label="Motivo (Opcional)" placeholder="Ej. Feriado Nacional" value={newExcDesc} onChange={e => setNewExcDesc(e.currentTarget.value)} mb="md" />
            <Button color="dark" onClick={handleAddException}>Registrar Excepción</Button>
          </Card>

          <Text fw={800} mb="md">Excepciones Registradas</Text>
          {exceptions.map((exc) => (
            <Card key={exc.id} withBorder padding="sm" mb="sm">
              <Group justify="space-between">
                <div>
                  <Text fw={800}>{exc.fecha_excepcion} <Badge color={exc.estado_operativo === 'CERRADO' ? 'red' : 'blue'}>{exc.estado_operativo}</Badge></Text>
                  {(exc.hora_apertura && exc.hora_cierre) ? (
                    <Text size="sm" c="dimmed">Horario: {exc.hora_apertura} - {exc.hora_cierre}</Text>
                  ) : (
                    <Text size="sm" c="dimmed">Todo el día</Text>
                  )}
                  {exc.descripcion && <Text size="sm" c="dimmed">{exc.descripcion}</Text>}
                </div>
                <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteException(exc.id)}><IconTrash size={18} /></ActionIcon>
              </Group>
            </Card>
          ))}
          {exceptions.length === 0 && <Text c="dimmed" size="sm">No hay excepciones registradas.</Text>}
        </Box>
      )}

    </Box>
  );
}

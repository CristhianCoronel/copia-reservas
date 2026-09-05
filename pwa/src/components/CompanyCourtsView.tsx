import { useState } from 'react';
import { Card, Text, Group, Button, Divider, Badge, Modal, TextInput, Select, MultiSelect, NumberInput, Textarea, ActionIcon } from '@mantine/core';
import { IconPlus, IconTag, IconCalendarTime, IconLock, IconCheck, IconTrash } from '@tabler/icons-react';

interface CompanyCourt {
  id: string;
  name: string;
  sport: string;
  modalities: string[];
  basePrice: number;
}

const mockCourts: CompanyCourt[] = [
  { id: '1', name: 'Cancha 1 - Sintético Pro', sport: 'Fútbol', modalities: ['Fútbol 5', 'Fútbol 7'], basePrice: 60.00 },
  { id: '2', name: 'Cancha 2 - Principal', sport: 'Fútbol', modalities: ['Fútbol 7'], basePrice: 80.00 }
];

export function CompanyCourtsView() {
  const [courts, setCourts] = useState<CompanyCourt[]>(mockCourts);
  
  // Modal States
  const [isNewCourtOpen, setIsNewCourtOpen] = useState(false);
  const [isTarifaOpen, setIsTarifaOpen] = useState(false);
  const [isBloqueoOpen, setIsBloqueoOpen] = useState(false);

  // Selected Court for Modals
  const [selectedCourt, setSelectedCourt] = useState<CompanyCourt | null>(null);

  const openTarifa = (court: CompanyCourt) => {
    setSelectedCourt(court);
    setIsTarifaOpen(true);
  };

  const openBloqueo = (court: CompanyCourt) => {
    setSelectedCourt(court);
    setIsBloqueoOpen(true);
  };

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl">Gestión de Canchas</Text>
      <Text c="dimmed" size="sm" mb="xl">
        Administra tus espacios físicos, tarifas dinámicas y mantenimientos.
      </Text>

      <Button fullWidth leftSection={<IconPlus size={20} />} color="dark" size="md" mb="xl" onClick={() => setIsNewCourtOpen(true)}>
        NUEVA CANCHA
      </Button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {courts.map(court => (
          <Card key={court.id} padding="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start" mb="xs">
              <div>
                <Text fw={800} size="lg">{court.name}</Text>
                <Text size="sm" c="dimmed">{court.sport}</Text>
              </div>
              <ActionIcon color="red" variant="subtle"><IconTrash size={18} /></ActionIcon>
            </Group>

            <Group gap="xs" mb="md">
              {court.modalities.map(mod => (
                <Badge key={mod} color="gray" variant="light" size="sm">{mod}</Badge>
              ))}
            </Group>

            <Divider my="sm" />

            <Group grow gap="xs">
              <Button variant="light" color="dark" leftSection={<IconTag size={16} />} onClick={() => openTarifa(court)}>
                TARIFA
              </Button>
              <Button variant="filled" color="red" leftSection={<IconLock size={16} />} onClick={() => openBloqueo(court)}>
                BLOQUEAR
              </Button>
            </Group>
          </Card>
        ))}
      </div>

      {/* MODAL: Nueva Cancha */}
      <Modal opened={isNewCourtOpen} onClose={() => setIsNewCourtOpen(false)} title={<Text fw={800}>Crear Nueva Cancha</Text>} centered>
        <TextInput label="Nombre Identificador" placeholder="Ej. Cancha 3 - Loza Sur" required mb="md" />
        <Select 
          label="Deporte (Catálogo Oficial)" 
          placeholder="Selecciona el deporte" 
          data={['Fútbol', 'Pádel', 'Básquet', 'Tenis', 'Vóley']} 
          required 
          mb="md" 
        />
        <MultiSelect 
          label="Modalidades / Formatos" 
          placeholder="Añade formatos" 
          data={['Fútbol 5', 'Fútbol 6', 'Fútbol 7', 'Fútbol 11']} 
          searchable 
          mb="md" 
        />
        <Button fullWidth color="dark" mt="md" onClick={() => setIsNewCourtOpen(false)}>Guardar Cancha</Button>
      </Modal>

      {/* MODAL: Tarifas Dinámicas */}
      <Modal opened={isTarifaOpen} onClose={() => setIsTarifaOpen(false)} title={<Text fw={800}>Configurar Tarifas: {selectedCourt?.name}</Text>} centered size="lg">
        <Text size="sm" c="dimmed" mb="md">Define el costo base por hora y los recargos según el momento del día.</Text>
        
        <Card withBorder mb="md" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))">
          <Text fw={700} mb="xs">Tarifa Diurna (Lunes a Viernes)</Text>
          <Group grow>
            <NumberInput label="Precio Base (S/.)" defaultValue={60} prefix="S/. " />
            <Group grow align="flex-end">
              <TextInput label="Inicio" defaultValue="08:00" type="time" />
              <TextInput label="Fin" defaultValue="18:00" type="time" />
            </Group>
          </Group>
        </Card>

        <Card withBorder mb="md" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))">
          <Text fw={700} mb="xs">Tarifa Nocturna (Lunes a Viernes)</Text>
          <Group grow>
            <NumberInput label="Precio Base (S/.)" defaultValue={80} prefix="S/. " />
            <NumberInput label="Recargo por Luz (S/.)" defaultValue={10} prefix="+ S/. " />
          </Group>
        </Card>
        
        <Button fullWidth color="dark" mt="xl" onClick={() => setIsTarifaOpen(false)}>Actualizar Tarifario</Button>
      </Modal>

      {/* MODAL: Bloqueos */}
      <Modal opened={isBloqueoOpen} onClose={() => setIsBloqueoOpen(false)} title={<Text fw={800}>Bloquear Cancha: {selectedCourt?.name}</Text>} centered>
        <Text size="sm" c="dimmed" mb="md">Impide que los clientes reserven esta cancha durante un rango de tiempo específico.</Text>
        
        <Select 
          label="Motivo del Bloqueo" 
          placeholder="Selecciona el motivo" 
          data={['MANTENIMIENTO', 'MAL_CLIMA', 'REPARACION', 'EVENTO_INTERNO']} 
          required 
          mb="md" 
        />
        
        <Group grow mb="md">
          <TextInput label="Inicio" type="datetime-local" required />
          <TextInput label="Fin" type="datetime-local" required />
        </Group>

        <Textarea label="Descripción detallada (Interna)" placeholder="Ej. Cambio de césped en área norte..." minRows={2} mb="xl" />

        <Button fullWidth color="red" leftSection={<IconLock size={16} />} onClick={() => setIsBloqueoOpen(false)}>
          Aplicar Bloqueo
        </Button>
      </Modal>
    </div>
  );
}

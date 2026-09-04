import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, ScrollArea, Modal, Select, TextInput, Divider, Loader, Center } from '@mantine/core';
import { IconPlayFootball, IconBallTennis, IconBallBasketball, IconSun, IconMoon, IconCheck, IconAlertTriangle, IconPlant } from '@tabler/icons-react';
import { apiCall } from '../api';

interface Court {
  id: string;
  name: string;
  sport: string;
  surface: string;
  isCovered: boolean;
  hasLights: boolean;
  regularPrice: number;
  peakPrice: number;
  services: string[];
  rules: string;
  imageColor: string;
}

export function CourtsView() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('TODOS');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>('19:00 - 20:00 (Tarifa Nocturna / Luz)');

  useEffect(() => {
    async function loadCourts() {
      try {
        const res = await apiCall('/business/courts');
        if (res.status) {
          setCourts(res.data);
        }
      } catch (error) {
        console.error("Error al cargar canchas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCourts();
  }, []);

  const filteredCourts = selectedSport === 'TODOS' 
    ? courts 
    : courts.filter(c => c.sport === selectedSport);

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  const isPeakHour = selectedTimeSlot?.includes('Nocturna') || false;
  const currentPrice = selectedCourt ? (isPeakHour ? selectedCourt.peakPrice : selectedCourt.regularPrice) : 0;

  const handleConfirmBooking = async () => {
    try {
      await apiCall('/player/reservations', 'POST', {
        courtId: selectedCourt?.id,
        date: '2026-08-30',
        time: selectedTimeSlot
      });
      setBookingConfirmed(true);
      setTimeout(() => {
        setBookingConfirmed(false);
        setSelectedCourt(null);
      }, 2500);
    } catch (error) {
      console.error("Error al reservar", error);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Text fw={700} mb="xs">Filtrar por deporte</Text>
      <ScrollArea type="never" mb="md">
        <Group wrap="nowrap" gap="xs">
          {['TODOS', 'FUTBOL5', 'PADEL', 'BASQUET'].map((sport) => (
            <Button 
              key={sport} 
              variant={selectedSport === sport ? 'filled' : 'outline'}
              color={selectedSport === sport ? 'dark' : 'gray'}
              radius="xl"
              size="xs"
              onClick={() => setSelectedSport(sport)}
            >
              {sport}
            </Button>
          ))}
        </Group>
      </ScrollArea>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
        {filteredCourts.map(court => (
          <Card key={court.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section 
              style={{ 
                backgroundColor: court.imageColor, 
                height: 80, 
                padding: 16, 
                opacity: 0.8,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}
            >
              <Group justify="space-between">
                <Badge color="dark" size="sm" variant="filled">{court.sport}</Badge>
                {court.isCovered && <Badge color="gray" size="sm" variant="light">Techada</Badge>}
              </Group>
              <Text fw={800} size="lg" mt="xs">{court.name}</Text>
            </Card.Section>

            <Group gap={6} mt="md" mb="md"><IconPlant size={16} color="gray" /><Text size="sm" c="dimmed">Superficie: {court.surface}</Text></Group>

            <Group grow gap="xs" mb="md">
              <Card padding="sm" radius="md" withBorder style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed"><IconSun size={12} /> Día</Text>
                <Text fw={800} c="dark">S/. {court.regularPrice}/h</Text>
              </Card>
              <Card padding="sm" radius="md" withBorder style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed"><IconMoon size={12} /> Noche</Text>
                <Text fw={800} c="dark">S/. {court.peakPrice}/h</Text>
              </Card>
            </Group>

            <Text size="xs" fw={700} c="dimmed" mb={4}>Servicios de la Sede:</Text>
            <Group gap={4} mb="md">
              {court.services.map(s => (
                <Badge key={s} color="gray" variant="light" size="xs" radius="sm">✓ {s}</Badge>
              ))}
            </Group>

            <Group gap={4} mb="lg">
              <IconAlertTriangle size={14} color="#F59E0B" />
              <Text size="xs" c="#F59E0B" fs="italic">{court.rules}</Text>
            </Group>

            <Button fullWidth onClick={() => setSelectedCourt(court)}>
              Reservar Cancha
            </Button>
          </Card>
        ))}
      </div>

      <Modal 
        opened={selectedCourt !== null} 
        onClose={() => setSelectedCourt(null)} 
        title={<Text fw={800} size="lg">Confirmar Reserva</Text>}
        centered
        overlayProps={{ backgroundOpacity: 0.8, blur: 3 }}
      >
        {!bookingConfirmed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Text fw={700} c="dark">{selectedCourt?.name}</Text>
            
            <TextInput 
              label="Fecha de Juego:" 
              defaultValue="2026-08-30"
            />
            
            <Select 
              label="Horario / Franja:"
              data={[
                '17:00 - 18:00 (Tarifa Día)',
                '18:00 - 19:00 (Tarifa Día)',
                '19:00 - 20:00 (Tarifa Nocturna / Luz)',
                '20:00 - 21:00 (Tarifa Nocturna / Luz)',
              ]}
              value={selectedTimeSlot}
              onChange={setSelectedTimeSlot}
            />

            <Card padding="md" radius="md" withBorder mt="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total a Pagar:</Text>
                <Text size="xl" fw={800} c="dark">S/. {currentPrice.toFixed(2)}</Text>
              </Group>
            </Card>

            <Button fullWidth size="md" mt="sm" onClick={handleConfirmBooking}>
              Solicitar Reserva Ahora
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <IconCheck size={48} color="#ee5e00" style={{ margin: '0 auto' }} />
            <Text fw={800} size="xl" c="dark" mt="md">¡Reserva Solicitada!</Text>
            <Text c="dimmed" mt="xs">Espera la confirmación de la sede en la pestaña Reservas.</Text>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, Divider, Center, Loader, Tabs, ActionIcon, Modal, Avatar, CopyButton, Tooltip, FileInput, Collapse } from '@mantine/core';
import { IconCalendarEvent, IconClock, IconShare, IconCopy, IconCheck, IconWallet, IconUpload, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface Payment {
  id: string;
  amount: number;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  user: string;
  avatar?: string;
}

interface PlayerBooking {
  id: string;
  courtName: string;
  venueName: string;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalPrice: number;
  pendingAmount: number;
  payments: Payment[];
}

export function PlayerReservationsView() {
  const [bookings, setBookings] = useState<PlayerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('proximas');
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [voucherModalBooking, setVoucherModalBooking] = useState<PlayerBooking | null>(null);

  useEffect(() => {
    // Simulating API call with rich mock data
    setTimeout(() => {
      setBookings([
        {
          id: 'res_1',
          courtName: 'Cancha 1 (Techada)',
          venueName: 'Padel Club Sur',
          date: 'Viernes 5 de Septiembre',
          time: '20:00 - 21:30',
          status: 'CONFIRMED',
          totalPrice: 120,
          pendingAmount: 60,
          payments: [
            { id: 'p1', user: 'Juan Pérez (Tú)', status: 'APROBADO', amount: 30, avatar: 'JP' },
            { id: 'p2', user: 'Mario Vargas', status: 'APROBADO', amount: 30, avatar: 'MV' },
            { id: 'p3', user: 'Carlos Díaz', status: 'PENDIENTE', amount: 30, avatar: 'CD' },
            { id: 'p4', user: 'Luis García', status: 'PENDIENTE', amount: 30, avatar: 'LG' }
          ]
        },
        {
          id: 'res_2',
          courtName: 'Cancha Principal Fútbol 7',
          venueName: 'Complejo Triple Doble',
          date: 'Sábado 6 de Septiembre',
          time: '18:00 - 19:00',
          status: 'PENDING',
          totalPrice: 140,
          pendingAmount: 140,
          payments: []
        },
        {
          id: 'res_3',
          courtName: 'Cancha 3',
          venueName: 'Padel Club Sur',
          date: 'Lunes 1 de Septiembre',
          time: '19:00 - 20:30',
          status: 'COMPLETED',
          totalPrice: 120,
          pendingAmount: 0,
          payments: [
            { id: 'p5', user: 'Juan Pérez (Tú)', status: 'APROBADO', amount: 120, avatar: 'JP' }
          ]
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING');
  const pastBookings = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  const toggleExpand = (id: string) => {
    setExpandedBookings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderBookingCard = (booking: PlayerBooking) => {
    const isExpanded = expandedBookings[booking.id] || false;

    return (
      <Card key={booking.id} padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" align="flex-start" mb="sm">
          <div>
            <Text fw={800} size="lg">{booking.courtName}</Text>
            <Text size="sm" c="dimmed">{booking.venueName}</Text>
          </div>
          <Badge 
            color={booking.status === 'CONFIRMED' ? 'green' : booking.status === 'COMPLETED' ? 'dark' : booking.status === 'CANCELLED' ? 'red' : 'orange'} 
            variant="light"
          >
            {booking.status === 'CONFIRMED' ? 'CONFIRMADA' : booking.status === 'COMPLETED' ? 'FINALIZADA' : booking.status === 'CANCELLED' ? 'CANCELADA' : 'PENDIENTE PAGO'}
          </Badge>
        </Group>

        <Group gap="xl" mb="md">
          <Group gap="xs">
            <IconCalendarEvent size={16} color="#94A3B8" />
            <Text size="sm">{booking.date}</Text>
          </Group>
          <Group gap="xs">
            <IconClock size={16} color="#94A3B8" />
            <Text size="sm">{booking.time}</Text>
          </Group>
        </Group>

        <Divider mb="md" />

        <Group justify="space-between" align="center">
          <div>
            <Text size="xs" c="dimmed">Total:</Text>
            <Text fw={800} size="lg" c="dark">S/. {booking.totalPrice.toFixed(2)}</Text>
          </div>

          {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
            <CopyButton value={`https://separaaltoke.com/r/${booking.id}`} timeout={2000}>
              {({ copied, copy }) => (
                <Button color={copied ? 'teal' : 'gray'} variant="light" size="sm" onClick={copy} leftSection={copied ? <IconCheck size={16} /> : <IconShare size={16} />}>
                  {copied ? 'Enlace' : 'Compartir'}
                </Button>
              )}
            </CopyButton>
          )}
        </Group>

        {booking.pendingAmount > 0 && (
          <Group justify="space-between" mt="md" p="sm" style={{ backgroundColor: 'var(--mantine-color-red-light)', borderRadius: 'var(--mantine-radius-md)' }}>
            <div>
              <Text size="xs" fw={700} c="red.9">Falta Pagar</Text>
              <Text fw={800} size="md" c="red.9">S/. {booking.pendingAmount.toFixed(2)}</Text>
            </div>
            <Button color="red.9" size="xs" onClick={() => setVoucherModalBooking(booking)}>
              SUBIR VOUCHER
            </Button>
          </Group>
        )}

        {booking.payments.length > 0 && (
          <>
            <Button 
              variant="subtle" 
              color="dark" 
              fullWidth 
              mt="md" 
              rightSection={isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />} 
              onClick={() => toggleExpand(booking.id)}
            >
              Ver Pagos ({booking.payments.length})
            </Button>
            
            <Collapse expanded={isExpanded}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {booking.payments.map((payment, idx) => (
                  <Group key={idx} justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap">
                      <Avatar radius="xl" color={payment.status === 'APROBADO' ? 'green' : payment.status === 'RECHAZADO' ? 'red' : 'gray'} size="sm">{payment.avatar}</Avatar>
                      <div>
                        <Text size="sm" fw={700}>{payment.user}</Text>
                        <Text size="xs" c="dimmed">S/. {payment.amount.toFixed(2)}</Text>
                      </div>
                    </Group>
                    <Badge color={payment.status === 'APROBADO' ? 'green' : payment.status === 'RECHAZADO' ? 'red' : 'orange'} variant="light">
                      {payment.status}
                    </Badge>
                  </Group>
                ))}
              </div>
            </Collapse>
          </>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl">Mis Reservas</Text>
      <Text c="dimmed" size="sm" mb="xl">
        Historial de tus próximos partidos, estado de pago y reservas pasadas.
      </Text>

      <Tabs value={activeTab} onChange={setActiveTab} color="dark" variant="pills" radius="md">
        <Tabs.List grow mb="xl">
          <Tabs.Tab value="proximas">Próximas</Tabs.Tab>
          <Tabs.Tab value="historial">Historial</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="proximas">
          {upcomingBookings.length === 0 ? (
            <Text c="dimmed" ta="center">No tienes reservas activas.</Text>
          ) : upcomingBookings.map(renderBookingCard)}
        </Tabs.Panel>

        <Tabs.Panel value="historial">
          {pastBookings.length === 0 ? (
            <Text c="dimmed" ta="center">No tienes reservas en el historial.</Text>
          ) : pastBookings.map(renderBookingCard)}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={!!voucherModalBooking} onClose={() => setVoucherModalBooking(null)} title={<Text fw={800} size="lg">Subir Comprobante de Pago</Text>} centered>
        <Text size="sm" c="dimmed" mb="lg">
          Sube la captura de pantalla de tu transferencia, Yape o Plin para confirmar tu reserva en {voucherModalBooking?.venueName}.
        </Text>
        
        <FileInput 
          label="Comprobante" 
          placeholder="Toca para subir imagen" 
          accept="image/png,image/jpeg,application/pdf"
          leftSection={<IconUpload size={14} />}
          mb="xl"
          size="md"
        />
        
        <Button fullWidth color="dark" onClick={() => setVoucherModalBooking(null)}>Enviar Voucher</Button>
      </Modal>
    </div>
  );
}

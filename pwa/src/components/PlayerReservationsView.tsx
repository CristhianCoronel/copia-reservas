import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, Divider, Center, Loader } from '@mantine/core';
import { IconCalendarEvent, IconClock } from '@tabler/icons-react';
import { apiCall } from '../api';

interface PlayerBooking {
  id: string;
  courtName: string;
  venueName: string;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'PENDING';
  amount: number;
}

export function PlayerReservationsView() {
  const [bookings, setBookings] = useState<PlayerBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await apiCall('/player/reservations/me');
        if (res.status) {
          setBookings(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl">Mis Reservas</Text>
      <Text c="dimmed" size="sm" mb="xl">
        Historial de tus próximos partidos y estado de pago.
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bookings.length === 0 ? (
          <Text c="dimmed" ta="center">No tienes reservas activas.</Text>
        ) : bookings.map((booking) => (
          <Card key={booking.id} padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="flex-start" mb="sm">
              <div>
                <Text fw={800} size="lg">{booking.courtName}</Text>
                <Text size="sm" c="dimmed">{booking.venueName}</Text>
              </div>
              <Badge 
                color={booking.status === 'CONFIRMED' ? 'green' : 'orange'} 
                variant="light"
              >
                {booking.status === 'CONFIRMED' ? 'CONFIRMADO' : 'PENDIENTE'}
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
                <Text size="xs" c="dimmed">Total a pagar:</Text>
                <Text fw={800} size="lg" c="dark">S/. {booking.amount.toFixed(2)}</Text>
              </div>
              
              {booking.status === 'PENDING' && (
                <Button color="dark" variant="outline">
                  SUBIR VOUCHER
                </Button>
              )}
            </Group>
          </Card>
        ))}
      </div>
    </div>
  );
}

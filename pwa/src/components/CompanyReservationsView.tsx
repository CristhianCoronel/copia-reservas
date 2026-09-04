import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, Divider, ActionIcon, Center, Loader } from '@mantine/core';
import { IconCheck, IconX, IconShieldCheck, IconPhone, IconMapPin, IconClock, IconCreditCard } from '@tabler/icons-react';
import { apiCall } from '../api';

interface PendingBooking {
  id: string;
  userName: string;
  phone: string;
  courtName: string;
  date: string;
  time: string;
  amount: number;
  paymentMethod: string;
}

export function CompanyReservationsView() {
  const [pendingList, setPendingList] = useState<PendingBooking[]>([]);
  const [confirmedCount, setConfirmedCount] = useState<number>(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPending() {
      try {
        const res = await apiCall('/business/reservations/pending');
        if (res.status) {
          setPendingList(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadPending();
  }, []);

  const handleApproveBooking = async (id: string) => {
    try {
      await apiCall(`/business/reservations/${id}/approve`, 'POST');
      setPendingList(prev => prev.filter(item => item.id !== id));
      setConfirmedCount(prev => prev + 1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectBooking = (id: string) => {
    // Para simplificar, lo borramos de la interfaz (podrías añadir un endpoint en el mock para rechazar)
    setPendingList(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Header Sede */}
      <Card padding="md" radius="md" withBorder mb="lg">
        <Group justify="space-between" align="center">
          <div>
            <Text size="xs" fw={800} c="dark" style={{ letterSpacing: 1 }}>GESTIÓN ERP DE SEDE</Text>
            <Text size="lg" fw={800}>Complejo Deportivo Triple Doble</Text>
          </div>
          <Badge color="green" variant="light" size="lg">ABIERTO</Badge>
        </Group>
      </Card>

      {/* KPI Cards */}
      <Group grow gap="xs" mb="xl">
        <Card padding="sm" radius="md" withBorder style={{ textAlign: 'center' }}>
          <Text fw={800} size="xl">85%</Text>
          <Text size="xs" c="dimmed">Ocupación Hoy</Text>
        </Card>
        <Card padding="sm" radius="md" withBorder style={{ textAlign: 'center' }}>
          <Text fw={800} size="xl" c="dark">{confirmedCount}</Text>
          <Text size="xs" c="dimmed">Confirmadas</Text>
        </Card>
        <Card padding="sm" radius="md" withBorder style={{ textAlign: 'center' }}>
          <Text fw={800} size="xl" c="yellow">{pendingList.length}</Text>
          <Text size="xs" c="dimmed">Pendientes Pago</Text>
        </Card>
      </Group>

      {/* Sección Reservas PENDING */}
      <div style={{ marginBottom: 24 }}>
        <Text fw={800} size="lg">Reservas por Validar (PENDING)</Text>
        <Text size="xs" c="dimmed" mb="md">Valida la recepción del pago externo para confirmar el turno en cancha.</Text>

        {pendingList.length === 0 ? (
          <Card padding="xl" radius="md" withBorder style={{ textAlign: 'center' }}>
            <IconCheck size={40} color="#ee5e00" style={{ margin: '0 auto', marginBottom: 8 }} />
            <Text c="dimmed" size="sm">¡No hay reservas pendientes de pago!</Text>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingList.map((item) => (
              <Card key={item.id} padding="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text fw={800} size="lg">{item.userName}</Text>
                  <Text fw={800} size="xl" c="dark">S/. {item.amount}.00</Text>
                </Group>
                
                <Group gap={6} mb={4}><IconPhone size={16} color="gray" /><Text size="sm" c="dimmed">WhatsApp: {item.phone}</Text></Group>
                <Group gap={6} mb={4}><IconMapPin size={16} color="gray" /><Text size="sm" c="dimmed">{item.courtName}</Text></Group>
                <Group gap={6} mb={4}><IconClock size={16} color="gray" /><Text size="sm" c="dimmed">Horario: {item.time}</Text></Group>
                <Group gap={6} mt={4} mb="md"><IconCreditCard size={16} color="orange" /><Text size="sm" c="yellow" fw={600}>Método: {item.paymentMethod}</Text></Group>

                <Group gap="sm">
                  <Button flex={1} variant="light" color="red" onClick={() => handleRejectBooking(item.id)}>
                    Rechazar
                  </Button>
                  <Button flex={2} color="dark" onClick={() => handleApproveBooking(item.id)}>
                    Confirmar Pago ✓
                  </Button>
                </Group>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Personal / Contrato */}
      <div>
        <Text fw={800} size="lg" mb="sm">Personal en Turno (Contrato)</Text>
        <Card padding="md" radius="md" withBorder>
          <Group wrap="nowrap">
            <IconShieldCheck size={32} color="#025865" />
            <div style={{ flex: 1 }}>
              <Text fw={700}>Marcos Benítez</Text>
              <Text size="xs" c="dimmed">Rol: RECEPCIONISTA (Contrato Activo)</Text>
            </div>
            <Text size="xs" fw={800} c="dark">08:00 - 22:00</Text>
          </Group>
        </Card>
      </div>
    </div>
  );
}

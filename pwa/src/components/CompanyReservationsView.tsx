import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, ActionIcon, Center, Loader, Tabs, Select, Modal, TextInput, Switch, Alert } from '@mantine/core';
import { IconCheck, IconPhone, IconMapPin, IconClock, IconCreditCard, IconCalendarEvent, IconReceipt2, IconWallet, IconTrash } from '@tabler/icons-react';
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('agenda');
  const [selectedCourt, setSelectedCourt] = useState<string | null>('1');

  // Modales
  const [manualResModal, setManualResModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  // Datos mock para Agenda
  const schedule = [
    { time: '18:00', status: 'LIBRE', user: null, phone: null, paymentStatus: null },
    { time: '19:00', status: 'OCUPADO', user: 'Juan Pérez', phone: '999888777', paymentStatus: 'CONFIRMADO' },
    { time: '20:00', status: 'OCUPADO', user: 'Carlos Gómez', phone: '911222333', paymentStatus: 'PENDIENTE' },
    { time: '21:00', status: 'BLOQUEADO', user: 'Mantenimiento de Luces', phone: null, paymentStatus: null },
    { time: '22:00', status: 'LIBRE', user: null, phone: null, paymentStatus: null },
  ];

  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [pendingList, setPendingList] = useState<PendingBooking[]>([
    {
      id: 'p1',
      userName: 'Carlos Gómez',
      phone: '911222333',
      courtName: 'Cancha 1 - Sintético Pro',
      date: 'Hoy',
      time: '20:00',
      amount: 60,
      paymentMethod: 'Yape'
    }
  ]);

  const handleApproveBooking = (id: string) => {
    setPendingList(prev => prev.filter(item => item.id !== id));
  };

  const openSlotAction = (slot: any) => {
    setSelectedSlot(slot);
    if (slot.status === 'LIBRE') {
      setManualResModal(true);
    } else if (slot.status === 'OCUPADO') {
      setDetailModal(true);
    }
  };

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl" mb="xs">Operaciones Diarias</Text>
      <Text c="dimmed" size="sm" mb="xl">Gestiona la agenda y valida los comprobantes de tus clientes.</Text>

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="agenda" leftSection={<IconCalendarEvent size={16} />}>Agenda de Turnos</Tabs.Tab>
          <Tabs.Tab value="pagos" leftSection={<IconReceipt2 size={16} />}>
            Por Validar {pendingList.length > 0 && <Badge color="red" size="sm" circle ml={4}>{pendingList.length}</Badge>}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="agenda" pt="md">
          <Select 
            label="Cancha"
            value={selectedCourt}
            onChange={setSelectedCourt}
            data={[
              { value: '1', label: 'Cancha 1 - Sintético Pro' },
              { value: '2', label: 'Cancha 2 - Principal' }
            ]}
            mb="xl"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedule.map((slot) => (
              <Card 
                key={slot.time} 
                padding="sm" 
                radius="md" 
                withBorder 
                bg={slot.status === 'BLOQUEADO' ? 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))' : undefined}
                style={{ cursor: slot.status !== 'BLOQUEADO' ? 'pointer' : 'default', opacity: slot.status === 'BLOQUEADO' ? 0.6 : 1 }}
                onClick={() => slot.status !== 'BLOQUEADO' && openSlotAction(slot)}
              >
                <Group wrap="nowrap" align="center">
                  <Text fw={800} size="lg" w={55}>{slot.time}</Text>
                  
                  <div style={{ flex: 1, borderLeft: '2px solid #eaeaea', paddingLeft: 12 }}>
                    {slot.status === 'LIBRE' && <Text c="dimmed" fw={600}>Turno Disponible</Text>}
                    {slot.status === 'BLOQUEADO' && <Text c="dimmed" fw={600}>Bloqueo: {slot.user}</Text>}
                    {slot.status === 'OCUPADO' && (
                      <>
                        <Text fw={700}>{slot.user}</Text>
                        <Badge 
                          color={slot.paymentStatus === 'CONFIRMADO' ? 'green' : 'yellow'} 
                          variant="light" 
                          size="xs"
                        >
                          Pago: {slot.paymentStatus}
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  {slot.status === 'LIBRE' && (
                    <Badge color="blue" variant="filled">RESERVAR</Badge>
                  )}
                </Group>
              </Card>
            ))}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="pagos" pt="md">
          <Text fw={800} size="md" mb="xs">Comprobantes Recibidos</Text>
          <Text size="sm" c="dimmed" mb="md">Verifica el abono en tu cuenta y confirma el turno.</Text>
          
          {pendingList.length === 0 ? (
            <Card padding="xl" radius="md" withBorder style={{ textAlign: 'center' }}>
              <IconCheck size={40} color="#ee5e00" style={{ margin: '0 auto', marginBottom: 8 }} />
              <Text c="dimmed" size="sm">¡Todo al día!</Text>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingList.map((item) => (
                <Card key={item.id} padding="md" radius="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={800} size="lg">{item.userName}</Text>
                    <Text fw={800} size="xl" c="dark">S/. {item.amount}.00</Text>
                  </Group>
                  <Group gap={6} mb={4}><IconPhone size={16} color="gray" /><Text size="sm" c="dimmed">{item.phone}</Text></Group>
                  <Group gap={6} mb={4}><IconMapPin size={16} color="gray" /><Text size="sm" c="dimmed">{item.courtName} a las {item.time}</Text></Group>
                  <Group gap={6} mt={4} mb="md"><IconCreditCard size={16} color="orange" /><Text size="sm" c="yellow" fw={600}>Vía {item.paymentMethod}</Text></Group>

                  <Group gap="sm">
                    <Button flex={1} variant="light" color="red" onClick={() => handleApproveBooking(item.id)}>
                      Rechazar
                    </Button>
                    <Button flex={2} color="dark" onClick={() => handleApproveBooking(item.id)}>
                      Aprobar Pago
                    </Button>
                  </Group>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Modal: Reserva Manual */}
      <Modal opened={manualResModal} onClose={() => setManualResModal(false)} title={<Text fw={800}>Registrar Reserva Manual</Text>} centered>
        <Alert color="blue" mb="md" variant="light">
          Agendando para: <b>Hoy a las {selectedSlot?.time}</b>
        </Alert>
        <TextInput label="Nombre del Cliente" placeholder="Ej. Luis Ramírez" required mb="md" />
        <TextInput label="Celular (Opcional)" placeholder="999888777" mb="md" />
        <Switch label="El cliente ya pagó en caja" mb="xl" color="green" />
        <Button fullWidth color="dark" onClick={() => setManualResModal(false)}>Crear Reserva</Button>
      </Modal>

      {/* Modal: Detalle Ocupado */}
      <Modal opened={detailModal} onClose={() => setDetailModal(false)} title={<Text fw={800}>Detalle del Turno</Text>} centered>
        <Card withBorder bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))" mb="md">
          <Text fw={800} size="lg">{selectedSlot?.user}</Text>
          <Text c="dimmed" mb="xs">Cel: {selectedSlot?.phone}</Text>
          <Badge color={selectedSlot?.paymentStatus === 'CONFIRMADO' ? 'green' : 'yellow'}>
            ESTADO: {selectedSlot?.paymentStatus}
          </Badge>
        </Card>

        <Button fullWidth variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={() => {setDetailModal(false); setCancelModal(true);}}>
          Cancelar Reserva
        </Button>
      </Modal>

      {/* Modal: Cancelar / Reembolso */}
      <Modal opened={cancelModal} onClose={() => setCancelModal(false)} title={<Text fw={800} c="red">Cancelar Turno</Text>} centered>
        <Text size="sm" mb="md">Al cancelar, liberarás la cancha para que otros puedan agendar.</Text>
        <Alert icon={<IconWallet size={16} />} title="Saldo a Favor (Monedero Sede)" color="grape" variant="light" mb="xl">
          <Text size="sm" mb="md">Si el cliente ya había pagado un adelanto, ¿deseas mantener ese dinero como saldo a favor para su próxima reserva en tu local?</Text>
          <Switch label="Sí, abonar a la Libreta de Saldos del cliente" color="grape" defaultChecked />
        </Alert>
        <Group grow>
          <Button variant="default" onClick={() => setCancelModal(false)}>Atrás</Button>
          <Button color="red" onClick={() => setCancelModal(false)}>Confirmar Cancelación</Button>
        </Group>
      </Modal>
    </div>
  );
}

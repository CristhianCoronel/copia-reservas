import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, Center, Loader, Tabs, Select, Modal, TextInput, Switch, Alert, ActionIcon } from '@mantine/core';
import { IconCheck, IconPhone, IconMapPin, IconCreditCard, IconCalendarEvent, IconReceipt2, IconWallet, IconTrash } from '@tabler/icons-react';
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

export function CompanyReservationsView({ localVenueId }: { localVenueId?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('agenda');
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [courts, setCourts] = useState<{value: string, label: string}[]>([]);
  
  // Format date to YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [schedule, setSchedule] = useState<any[]>([]);

  const [manualResModal, setManualResModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  // Manual reservation form state
  const [manualUserName, setManualUserName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAlreadyPaid, setManualAlreadyPaid] = useState(false);

  const [pendingList, setPendingList] = useState<PendingBooking[]>([]);

  useEffect(() => {
    if (!localVenueId) return;
    
    // Load courts for venue
    apiCall(`/api/v1/business/venues/${localVenueId}/courts`).then(res => {
      if (res && res.data) {
        const mapped = res.data.map((c: any) => ({ value: c.id, label: c.name }));
        setCourts(mapped);
        if (mapped.length > 0 && !selectedCourt) {
          setSelectedCourt(mapped[0].value);
        }
      }
    });
  }, [localVenueId]);

  const loadSchedule = async () => {
    if (!selectedCourt || !selectedDate) return;
    setLoading(true);
    try {
      const res = await apiCall(`/api/v1/business/courts/${selectedCourt}/schedule?date=${selectedDate}`);
      if (res && res.data) {
        const { openingTime, closingTime, reservations, blocks } = res.data;
        
        // Generate hourly slots
        const slots = [];
        const openHour = parseInt(openingTime.split(':')[0]);
        const closeHour = parseInt(closingTime.split(':')[0]);
        
        for (let i = openHour; i < closeHour; i++) {
          const timeStr = `${i.toString().padStart(2, '0')}:00`;
          const endStr = `${(i+1).toString().padStart(2, '0')}:00`;
          
          let status = 'LIBRE';
          let user = null;
          let phone = null;
          let paymentStatus = null;
          let resId = null;

          // Check if blocked
          const blocked = blocks.find((b: any) => b.start <= timeStr && b.end > timeStr);
          if (blocked) {
            status = 'BLOQUEADO';
            user = blocked.reason;
          } else {
            // Check if reserved
            const reserved = reservations.find((r: any) => r.start <= timeStr && r.end > timeStr);
            if (reserved) {
              status = reserved.status; // 'OCUPADO', 'PENDIENTE_PAGO', etc.
              user = reserved.userName;
              phone = reserved.phone;
              paymentStatus = reserved.paymentStatus;
              resId = reserved.id;
            }
          }

          slots.push({
            id: resId,
            time: timeStr,
            status,
            user,
            phone,
            paymentStatus
          });
        }
        setSchedule(slots);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'agenda') {
      loadSchedule();
    }
  }, [selectedCourt, selectedDate, activeTab]);

  const loadPending = async () => {
    if (!localVenueId) return;
    try {
      const res = await apiCall(`/api/v1/business/venues/${localVenueId}/reservations/pending`);
      if (res && res.data) {
        setPendingList(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'pagos') {
      loadPending();
    }
  }, [activeTab, localVenueId]);

  const handleApproveBooking = async (id: string) => {
    await apiCall(`/api/v1/business/reservations/${id}/approve`, 'PUT');
    loadPending();
  };
  
  const handleRejectBooking = async (id: string) => {
    await apiCall(`/api/v1/business/reservations/${id}/cancel`, 'PUT');
    loadPending();
  };

  const openSlotAction = (slot: any) => {
    setSelectedSlot(slot);
    if (slot.status === 'LIBRE') {
      setManualUserName('');
      setManualPhone('');
      setManualAlreadyPaid(false);
      setManualResModal(true);
    } else if (slot.status !== 'BLOQUEADO') {
      setDetailModal(true);
    }
  };
  
  const handleCreateManualReservation = async () => {
    if (!selectedCourt || !selectedDate || !selectedSlot) return;
    try {
      await apiCall(`/api/v1/business/courts/${selectedCourt}/reservations?date=${selectedDate}`, 'POST', {
        userName: manualUserName,
        phone: manualPhone,
        alreadyPaid: manualAlreadyPaid,
        time: selectedSlot.time
      });
      setManualResModal(false);
      loadSchedule();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelReservation = async () => {
    if (!selectedSlot?.id) return;
    try {
      await apiCall(`/api/v1/business/reservations/${selectedSlot.id}/cancel`, 'PUT');
      setCancelModal(false);
      loadSchedule();
    } catch (e) {
      console.error(e);
    }
  };

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
          <Group mb="xl" grow>
            <Select 
              label="Cancha"
              value={selectedCourt}
              onChange={(val) => setSelectedCourt(val)}
              data={courts}
            />
            <TextInput 
              label="Fecha"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.currentTarget.value)}
            />
          </Group>
          
          {loading ? <Center p="xl"><Loader color="dark" /></Center> : (
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
                      {slot.status !== 'LIBRE' && slot.status !== 'BLOQUEADO' && (
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
          )}
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
                    <Button flex={1} variant="light" color="red" onClick={() => handleRejectBooking(item.id)}>
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

      <Modal opened={manualResModal} onClose={() => setManualResModal(false)} title={<Text fw={800}>Registrar Reserva Manual</Text>} centered>
        <Alert color="blue" mb="md" variant="light">
          Agendando para: <b>{selectedDate} a las {selectedSlot?.time}</b>
        </Alert>
        <TextInput label="Nombre del Cliente" placeholder="Ej. Luis Ramírez" required mb="md" value={manualUserName} onChange={e => setManualUserName(e.target.value)} />
        <TextInput label="Celular (Opcional)" placeholder="999888777" mb="md" value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
        <Switch label="El cliente ya pagó en caja" mb="xl" color="green" checked={manualAlreadyPaid} onChange={e => setManualAlreadyPaid(e.currentTarget.checked)} />
        <Button fullWidth color="dark" onClick={handleCreateManualReservation} disabled={!manualUserName}>Crear Reserva</Button>
      </Modal>

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

      <Modal opened={cancelModal} onClose={() => setCancelModal(false)} title={<Text fw={800} c="red">Cancelar Turno</Text>} centered>
        <Text size="sm" mb="md">Al cancelar, liberarás la cancha para que otros puedan agendar.</Text>
        <Alert icon={<IconWallet size={16} />} title="Saldo a Favor (Monedero Sede)" color="grape" variant="light" mb="xl">
          <Text size="sm" mb="md">Si el cliente ya había pagado un adelanto, ¿deseas mantener ese dinero como saldo a favor para su próxima reserva en tu local?</Text>
          <Switch label="Sí, abonar a la Libreta de Saldos del cliente" color="grape" defaultChecked />
        </Alert>
        <Group grow>
          <Button variant="default" onClick={() => setCancelModal(false)}>Atrás</Button>
          <Button color="red" onClick={handleCancelReservation}>Confirmar Cancelación</Button>
        </Group>
      </Modal>
    </div>
  );
}

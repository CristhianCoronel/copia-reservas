import { useState, useEffect, useRef } from 'react';
import { Card, Text, Group, Badge, Button, Center, Loader, Tabs, Modal, TextInput, ActionIcon, Alert, ScrollArea, Image, UnstyledButton } from '@mantine/core';
import { IconCheck, IconPhone, IconMapPin, IconCreditCard, IconCalendarEvent, IconReceipt2, IconWallet, IconTrash, IconBuilding, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
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
  comprobanteUrl?: string;
}

export function CompanyReservationsView({ activeCompanyId }: { activeCompanyId?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('agenda');
  const [selectedCourt, setSelectedCourt] = useState<string | null>('todos');
  const [selectedCourtName, setSelectedCourtName] = useState<string | null>('Todas las Canchas');
  
  const [courtSelectModal, setCourtSelectModal] = useState(false);
  const [venuesSummary, setVenuesSummary] = useState<any[]>([]);
  
  // Format date to YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState<any[]>([]);

  const [detailModal, setDetailModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const [pendingList, setPendingList] = useState<PendingBooking[]>([]);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeCompanyId) return;
    
    // Load courts summary for company
    apiCall(`/api/v1/business/companies/${activeCompanyId}/courts-summary`).then(res => {
      if (res && res.data) {
        setVenuesSummary(res.data);
      }
    });
  }, [activeCompanyId]);

  const loadSchedule = async () => {
    if (!selectedDate || venuesSummary.length === 0) return;
    setLoading(true);
    try {
      let courtsToFetch: any[] = [];
      if (selectedCourt === 'todos') {
        venuesSummary.forEach(v => {
          v.courts.forEach((c: any) => courtsToFetch.push({ courtId: c.id, courtName: c.name, venueName: v.venueName }));
        });
      } else {
        let vName = '';
        let cName = '';
        venuesSummary.forEach(v => {
          const c = v.courts.find((co: any) => co.id === selectedCourt);
          if (c) { vName = v.venueName; cName = c.name; }
        });
        courtsToFetch.push({ courtId: selectedCourt, courtName: cName, venueName: vName });
      }

      const allSlots: any[] = [];

      for (const court of courtsToFetch) {
        const res = await apiCall(`/api/v1/business/courts/${court.courtId}/schedule?date=${selectedDate}`);
        if (res && res.data) {
          const { reservations } = res.data;
          reservations.forEach((r: any) => {
            allSlots.push({
              id: r.id,
              time: r.start,
              endTime: r.end,
              status: r.status,
              user: r.userName,
              phone: r.phone,
              paymentStatus: r.paymentStatus,
              amount: r.amount,
              courtName: court.courtName,
              venueName: court.venueName
            });
          });
        }
      }

      allSlots.sort((a, b) => a.time.localeCompare(b.time));
      setSchedule(allSlots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'agenda') {
      loadSchedule();
    }
  }, [selectedCourt, selectedDate, activeTab, venuesSummary]);

  const loadPending = async () => {
    if (!activeCompanyId) return;
    try {
      const res = await apiCall(`/api/v1/business/companies/${activeCompanyId}/reservations/pending`);
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
  }, [activeTab, activeCompanyId]);

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
    setDetailModal(true);
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

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    // Compensa por la zona horaria al manipular dias
    d.setUTCHours(12);
    d.setUTCDate(d.getUTCDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl" mb="xs">Operaciones Diarias</Text>
      <Text c="dimmed" size="sm" mb="xl">Gestiona la agenda y valida los comprobantes de tus clientes.</Text>

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="agenda" leftSection={<IconCalendarEvent size={16} />}>Agenda de Turnos</Tabs.Tab>
          <Tabs.Tab 
            value="pagos" 
            leftSection={<IconReceipt2 size={16} />}
            rightSection={pendingList.length > 0 ? <Badge color="red" size="sm" circle>{pendingList.length}</Badge> : undefined}
          >
            Por Validar
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="agenda" pt="md">
          <Group mb="xl" grow>
            <Button 
              variant="default"
              size="md"
              onClick={() => setCourtSelectModal(true)}
              rightSection={<IconMapPin size={18} color="#94A3B8" />}
              style={{ justifyContent: 'space-between', fontWeight: selectedCourtName ? 700 : 400, color: 'var(--mantine-color-text)' }}
            >
              {selectedCourtName}
            </Button>
          </Group>

          <Group justify="space-between" align="center" mb="xl" style={{ backgroundColor: 'var(--mantine-color-gray-0)', padding: '8px 16px', borderRadius: 8 }}>
            <ActionIcon variant="subtle" color="dark" onClick={() => changeDate(-1)}>
              <IconChevronLeft size={20} />
            </ActionIcon>
            
            <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => dateInputRef.current?.showPicker()}>
              <Text fw={700} size="md" style={{ textTransform: 'capitalize' }}>{formatDateLabel(selectedDate)}</Text>
              <IconCalendarEvent size={18} color="var(--mantine-color-blue-6)" />
            </Group>
            
            <input 
              ref={dateInputRef}
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
            />

            <ActionIcon variant="subtle" color="dark" onClick={() => changeDate(1)}>
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
          
          {loading ? <Center p="xl"><Loader color="dark" /></Center> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {schedule.length === 0 ? (
                <Text ta="center" c="dimmed" mt="xl">No hay reservas registradas en esta fecha.</Text>
              ) : schedule.map((slot, idx) => (
                <Card 
                  key={`${slot.time}-${idx}`} 
                  padding="sm" 
                  radius="md" 
                  withBorder 
                  style={{ cursor: 'pointer' }}
                  onClick={() => openSlotAction(slot)}
                >
                  <Group wrap="nowrap" align="flex-start">
                    <div style={{ width: 60, flexShrink: 0 }}>
                      <Text fw={800} size="lg">{slot.time}</Text>
                      <Text size="xs" c="dimmed">{slot.endTime}</Text>
                    </div>
                    
                    <div style={{ flex: 1, borderLeft: '2px solid #eaeaea', paddingLeft: 12 }}>
                      <Text fw={700}>{slot.user}</Text>
                      <Group gap={4} mt={2} mb={4}>
                        <IconMapPin size={12} color="gray" />
                        <Text size="xs" c="dimmed">{slot.courtName} ({slot.venueName})</Text>
                      </Group>
                      <Group gap="xs" mt={4}>
                        <Badge 
                          color={slot.paymentStatus === 'CONFIRMADO' ? 'green' : (slot.paymentStatus === 'PENDIENTE' ? 'yellow' : 'gray')} 
                          variant="light" 
                          size="xs"
                        >
                          Pago: {slot.paymentStatus}
                        </Badge>
                        {slot.amount > 0 && <Text size="xs" fw={700} c="green.7">S/. {slot.amount}</Text>}
                      </Group>
                    </div>
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
                  <Group gap={6} mt={4} mb="md"><IconCreditCard size={16} color="orange" /><Text size="sm" c="yellow" fw={600} style={{ textTransform: 'capitalize' }}>Vía {item.paymentMethod.replace(/_/g, ' ').toLowerCase()}</Text></Group>

                  {item.comprobanteUrl && (
                    <UnstyledButton mb="md" onClick={() => setImageModal(item.comprobanteUrl!)}>
                      <Group gap="xs">
                        <IconReceipt2 size={16} color="var(--mantine-color-blue-6)" />
                        <Text size="sm" c="blue" td="underline">Ver comprobante adjunto</Text>
                      </Group>
                    </UnstyledButton>
                  )}

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

      <Modal opened={detailModal} onClose={() => setDetailModal(false)} title={<Text fw={800}>Detalle de la Reserva</Text>} centered>
        <Card withBorder bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))" mb="md">
          <Text fw={800} size="lg">{selectedSlot?.user}</Text>
          <Text c="dimmed" mb="xs">Cel: {selectedSlot?.phone}</Text>
          <Text size="sm" mb="xs"><IconMapPin size={14} style={{verticalAlign: 'middle', marginRight: 4}}/>{selectedSlot?.courtName} ({selectedSlot?.venueName})</Text>
          <Group justify="space-between" align="center" mt="sm">
            <Badge color={selectedSlot?.paymentStatus === 'CONFIRMADO' ? 'green' : 'yellow'}>
              ESTADO: {selectedSlot?.paymentStatus}
            </Badge>
            <Text fw={700}>Total: S/. {selectedSlot?.amount}</Text>
          </Group>
        </Card>

        <Button fullWidth variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={() => {setDetailModal(false); setCancelModal(true);}}>
          Cancelar Reserva
        </Button>
      </Modal>

      <Modal opened={cancelModal} onClose={() => setCancelModal(false)} title={<Text fw={800} c="red">Cancelar Turno</Text>} centered>
        <Text size="sm" mb="md">Al cancelar, liberarás la cancha para que otros puedan agendar.</Text>
        <Group grow>
          <Button variant="default" onClick={() => setCancelModal(false)}>Atrás</Button>
          <Button color="red" onClick={handleCancelReservation}>Confirmar Cancelación</Button>
        </Group>
      </Modal>

      <Modal opened={!!imageModal} onClose={() => setImageModal(null)} title="Comprobante de Pago" centered>
         {imageModal && <Image src={imageModal} radius="md" alt="Comprobante" fit="contain" style={{ maxHeight: '70vh' }} />}
      </Modal>

      <Modal 
        opened={courtSelectModal} 
        onClose={() => setCourtSelectModal(false)} 
        title={<Text fw={800} size="lg">Seleccionar Cancha</Text>}
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Card 
          padding="md" 
          radius="md" 
          withBorder 
          mb="xl"
          style={{ cursor: 'pointer', borderColor: selectedCourt === 'todos' ? 'var(--mantine-color-blue-5)' : undefined }}
          onClick={() => {
            setSelectedCourt('todos');
            setSelectedCourtName('Todas las Canchas');
            setCourtSelectModal(false);
          }}
        >
          <Text fw={800} size="md" ta="center">Mostrar Todas</Text>
        </Card>

        {venuesSummary.map(venue => (
          <div key={venue.venueId} style={{ marginBottom: 20 }}>
            <Group gap={6} mb="sm">
              <IconBuilding size={16} color="var(--mantine-color-cancha-5)" />
              <Text fw={800} size="sm">{venue.venueName}</Text>
            </Group>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {venue.courts.map((court: any) => (
                <Card 
                  key={court.id}
                  padding="md" 
                  radius="md" 
                  withBorder 
                  style={{ cursor: 'pointer', borderColor: selectedCourt === court.id ? 'var(--mantine-color-cancha-5)' : undefined }}
                  onClick={() => {
                    setSelectedCourt(court.id);
                    setSelectedCourtName(`${court.name} (${venue.venueName})`);
                    setCourtSelectModal(false);
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Text fw={700} size="sm">{court.name}</Text>
                    {court.pendingCount > 0 && (
                      <Badge color="red" variant="filled" size="sm">
                        {court.pendingCount} por validar
                      </Badge>
                    )}
                  </Group>
                </Card>
              ))}
              {venue.courts.length === 0 && (
                <Text size="xs" c="dimmed" fs="italic" pl={22}>No hay canchas registradas en esta sede.</Text>
              )}
            </div>
          </div>
        ))}
      </Modal>
    </div>
  );
}


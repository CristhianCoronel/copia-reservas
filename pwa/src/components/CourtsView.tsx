import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, ScrollArea, Modal, Loader, Center, UnstyledButton, Drawer, Checkbox, RangeSlider, ActionIcon, Image, Tabs } from '@mantine/core';
import { IconSun, IconMoon, IconCheck, IconAlertTriangle, IconFilter, IconMapPin, IconBrandWhatsapp, IconChevronLeft, IconChevronRight, IconClock, IconStar } from '@tabler/icons-react';
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
  images?: string[];
  address?: string;
  companyName?: string;
  distanceKm?: number;
  whatsapp?: string;
}

interface AvailabilitySlot {
  time: string;
  isPeak: boolean;
  price: number;
  available: boolean;
}

export function CourtsView() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('TODOS');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today.toISOString().split('T')[0];
  });
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<AvailabilitySlot[]>([]);

  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [fetchingCourts, setFetchingCourts] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sportsList, setSportsList] = useState<string[]>([]);

  const datesList = (() => {
    const dates = [];
    const baseDate = new Date();

    baseDate.setHours(12, 0, 0, 0);
    baseDate.setDate(baseDate.getDate() + (weekOffset * 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  })();

  const weekTitle = (() => {
    const first = datesList[0];
    const last = datesList[6];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `(${first.getDate()}-${last.getDate()} ${months[first.getMonth()]})`;
  })();

  const getDayName = (date: Date, index: number, isCurrentWeek: boolean) => {
    if (isCurrentWeek && index === 0) return 'Hoy';
    if (isCurrentWeek && index === 1) return 'Mañ';
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  };

  const getFormattedDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
  };

  useEffect(() => {
    if (datesList.length > 0 && !selectedDate) {
      setSelectedDate(datesList[0].toISOString().split('T')[0]);
    }
  }, [weekOffset]);

  useEffect(() => {
    async function loadSports() {
      try {
        const res = await apiCall('/api/v1/system/catalogs');
        if (res.status && res.data?.sports) {
          setSportsList(res.data.sports.filter((s: any) => s.is_active).map((s: any) => s.name));
        }
      } catch (e) { console.error(e); }
    }
    loadSports();
  }, []);

  const handleDateSelect = (dateStr: string) => {
    if (dateStr === selectedDate) return;
    setSelectedDate(dateStr);
  };

  useEffect(() => {
    if (selectedCourt) {
      const mockAvail = [
        {time: "16:00 - 17:00", isPeak: false, price: selectedCourt.regularPrice, available: true},
        {time: "17:00 - 18:00", isPeak: false, price: selectedCourt.regularPrice, available: true},
        {time: "18:00 - 19:00", isPeak: true, price: selectedCourt.peakPrice, available: true},
        {time: "19:00 - 20:00", isPeak: true, price: selectedCourt.peakPrice, available: false},
        {time: "20:00 - 21:00", isPeak: true, price: selectedCourt.peakPrice, available: true},
        {time: "21:00 - 22:00", isPeak: true, price: selectedCourt.peakPrice, available: true},
        {time: "22:00 - 23:00", isPeak: true, price: selectedCourt.peakPrice, available: true}
      ];

      setLoadingAvailability(true);
      setSelectedTimeSlots([]);
      apiCall(`/api/v1/business/courts/${selectedCourt.id}/availability?date=${selectedDate}`)
        .then(res => {
          if (res.status === undefined || (res.data && res.data.length > 0)) {
            setAvailability(res.data);
          } else {
            setAvailability(mockAvail);
          }
        })
        .catch(() => {
          setAvailability(mockAvail);
        })
        .finally(() => setLoadingAvailability(false));
    }
  }, [selectedCourt, selectedDate]);

  useEffect(() => {
    async function loadCourts() {
      if (!selectedDate) return;
      setFetchingCourts(true);
      try {
        const res = await apiCall(`/api/v1/b2c/canchas?date=${selectedDate}`);
        if (res.status === undefined || res.data) {
          setCourts(res.data);
        }
      } catch (error) {
        console.error("Error al cargar canchas:", error);
      } finally {
        setFetchingCourts(false);
        setLoading(false);
      }
    }
    loadCourts();
  }, [selectedDate]);

  const filteredCourts = selectedSport === 'TODOS' 
    ? courts 
    : courts.filter(c => c.sport === selectedSport);

  const currentPrice = selectedTimeSlots.reduce((acc, slot) => acc + slot.price, 0);

  const handleConfirmBooking = async () => {
    try {
      await apiCall('/api/v1/b2c/reservas/', 'POST', {
        usuario_id: "11111111-1111-1111-1111-111111111111", // ::!todo!::Usar ID de usuario real
        cancha_id: selectedCourt?.id,
        fecha_reserva: selectedDate,
        hora_inicio: selectedTimeSlots[0].time.split(' - ')[0] + ":00",
        hora_fin: selectedTimeSlots[selectedTimeSlots.length - 1].time.split(' - ')[1] + ":00",
        monto_total: currentPrice
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

  const handleSlotToggle = (slot: AvailabilitySlot) => {
    const isSelected = selectedTimeSlots.some(s => s.time === slot.time);
    if (isSelected) {
      if (selectedTimeSlots.length === 1) {
        setSelectedTimeSlots([]);
        return;
      }
      const hours = selectedTimeSlots.map(s => parseInt(s.time.split(':')[0])).sort((a, b) => a - b);
      const slotHour = parseInt(slot.time.split(':')[0]);
      
      if (slotHour === hours[0] || slotHour === hours[hours.length - 1]) {
        setSelectedTimeSlots(selectedTimeSlots.filter(s => s.time !== slot.time));
      } else {
        alert('Debes mantener horas continuas. Deselecciona los extremos primero.');
      }
    } else {
      if (selectedTimeSlots.length === 0) {
        setSelectedTimeSlots([slot]);
      } else {
        const hours = selectedTimeSlots.map(s => parseInt(s.time.split(':')[0])).sort((a, b) => a - b);
        const slotHour = parseInt(slot.time.split(':')[0]);
        if (slotHour === hours[0] - 1 || slotHour === hours[hours.length - 1] + 1) {
          setSelectedTimeSlots([...selectedTimeSlots, slot]);
        } else {
          setSelectedTimeSlots([slot]);
        }
      }
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Group justify="space-between" mb="xs">
        <Text fw={700}>Fecha a jugar</Text>
        <Group gap="xs">
          <Text size="xs" fw={700} c="var(--mantine-color-cancha-9)">{weekTitle}</Text>
          <ActionIcon variant="filled" color="cancha.9" size="sm" onClick={() => setWeekOffset(o => Math.max(0, o - 1))} disabled={weekOffset === 0}><IconChevronLeft size={16} stroke={1.5} /></ActionIcon>
          <ActionIcon variant="filled" color="cancha.9" size="sm" onClick={() => setWeekOffset(o => o + 1)}><IconChevronRight size={16} stroke={1.5} /></ActionIcon>
        </Group>
      </Group>
      <ScrollArea type="never" mb="lg">
        <Group wrap="nowrap" gap="xs">
          {datesList.map((d, index) => {
            const dateStr = d.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            return (
              <UnstyledButton 
                key={dateStr}
                onClick={() => handleDateSelect(dateStr)}
                style={{ 
                  height: 'auto', 
                  padding: '8px 16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: isSelected ? 'var(--mantine-color-cancha-9)' : 'transparent',
                  color: isSelected ? 'var(--mantine-color-white)' : 'var(--mantine-color-text)',
                  border: `1px solid ${isSelected ? 'var(--mantine-color-cancha-9)' : 'var(--mantine-color-default-border)'}`,
                  borderRadius: 'var(--mantine-radius-md)'
                }}
              >
                <Text size="xs" fw={isSelected ? 800 : 500}>{getDayName(d, index, weekOffset === 0)}</Text>
                <Text size="md" fw={800}>{d.getDate()}</Text>
              </UnstyledButton>
            );
          })}
        </Group>
      </ScrollArea>
      
      <Group justify="space-between" mb="xs">
        <Text fw={700}>Filtrar por deporte</Text>
        <Button variant="default" size="xs" radius="xl" leftSection={<IconFilter size={14} stroke={1.5}/>} onClick={() => setFiltersDrawerOpen(true)}>
          Más Filtros
        </Button>
      </Group>
      
      <ScrollArea type="never" mb="md">
        <Group wrap="nowrap" gap="xs">
          {['TODOS', ...sportsList].map((sport) => (
            <Button 
              key={sport} 
              variant={selectedSport === sport ? 'filled' : 'outline'}
              color={selectedSport === sport ? 'cancha.9' : 'gray'}
              radius="xl"
              size="xs"
              onClick={() => setSelectedSport(sport)}
            >
              {sport}
            </Button>
          ))}
        </Group>
      </ScrollArea>

      {(loading || fetchingCourts) ? (
        <Center p="xl" mt="xl"><Loader color="cancha.9" /></Center>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
          {filteredCourts.map(court => (
            <Card key={court.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section 
              style={{ 
                backgroundColor: 'var(--mantine-color-cancha-2)', 
                backgroundImage: court.images && court.images.length > 0 
                  ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url(${court.images[0]})` 
                  : 'linear-gradient(to bottom right, var(--mantine-color-cancha-2), var(--mantine-color-cancha-3))',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: 140, 
                padding: 12, 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start'
              }}
            >
              <Group gap={8}>
                <Badge color="var(--mantine-color-cancha-9)" size="sm" variant="filled" c="white">{court.sport}</Badge>
                {court.isCovered && <Badge bg="#DEF0E6" c="cancha.9" size="sm" variant="filled">Techada</Badge>}
              </Group>
            </Card.Section>
            
            <Text fw={800} size="lg" mt="md" c="dark">{court.name}</Text>
            
            <Group gap={6} mt="xs">
              <IconMapPin size={16} color="var(--mantine-color-dimmed)" stroke={1.5} />
              <Text size="sm" c="dimmed">{court.distanceKm ? `${court.distanceKm} km` : '2.0 km'} - {court.address || court.companyName}</Text>
            </Group>

            <Group gap={4} mt="sm">
              {court.services.map((s: string) => (
                <Badge key={s} bg="#DEF0E6" c="cancha.9" variant="filled" size="xs" radius="sm">{s}</Badge>
              ))}
            </Group>



            <Group justify="space-between" mt="lg" align="flex-end" wrap="nowrap">
              <div>
                <Text size="xs" c="dimmed" mb={4} fw={600}>Precio:</Text>
                <Group gap={12}>
                  <Group gap={4}>
                    <IconSun size={16} color="var(--mantine-color-yellow-6)" stroke={1.5} />
                    <Text fw={800} size="sm" c="dark">S/{court.regularPrice}<Text component="span" size="xs" c="dimmed" fw={500}>/hora</Text></Text>
                  </Group>
                  <Group gap={4}>
                    <IconMoon size={16} color="var(--mantine-color-indigo-6)" stroke={1.5} />
                    <Text fw={800} size="sm" c="dark">S/{court.peakPrice}<Text component="span" size="xs" c="dimmed" fw={500}>/hora</Text></Text>
                  </Group>
                </Group>
              </div>
              <Button color="altoke.5" c="cancha.9" radius="xl" onClick={() => { setSelectedCourt(court); setCurrentImageIndex(0); }}>
                Separar Altoke
              </Button>
            </Group>
            </Card>
          ))}
        </div>
      )}

      <Drawer 
        opened={selectedCourt !== null} 
        onClose={() => { setSelectedCourt(null); setBookingConfirmed(false); setSelectedTimeSlots([]); }} 
        title={<Text fw={800} size="lg">Detalles de la Cancha</Text>}
        position="bottom"
        size="95%"
        styles={{ content: { maxWidth: 480, margin: '0 auto' } }}
      >
        {selectedCourt && !bookingConfirmed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 }}>
            {selectedCourt.images && selectedCourt.images.length > 0 && (
              <div style={{ position: 'relative', width: 'calc(100% + 32px)', margin: '-16px -16px 16px -16px', height: 220, overflow: 'hidden' }}>
                 <Image src={selectedCourt.images[currentImageIndex]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 {selectedCourt.images.length > 1 && (
                    <>
                      <ActionIcon variant="white" color="dark" radius="xl" style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }} onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : selectedCourt.images!.length - 1)}><IconChevronLeft size={16}/></ActionIcon>
                      <ActionIcon variant="white" color="dark" radius="xl" style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }} onClick={() => setCurrentImageIndex(i => i < selectedCourt.images!.length - 1 ? i + 1 : 0)}><IconChevronRight size={16}/></ActionIcon>
                    </>
                 )}
              </div>
            )}
            
            <div>
              <Text fw={800} size="xl">{selectedCourt.name}</Text>
              <Text c="dimmed" size="sm">{selectedCourt.companyName} • {selectedCourt.address}</Text>
            </div>

            <Tabs defaultValue="disponibilidad" color="dark">
              <Tabs.List>
                <Tabs.Tab value="disponibilidad" fw={600}>Disponibilidad</Tabs.Tab>
                <Tabs.Tab value="politicas" fw={600}>Políticas</Tabs.Tab>
                <Tabs.Tab value="reglas" fw={600}>Reglas</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="disponibilidad" pt="md">
                <Text fw={700} size="sm" mb="sm">Horarios y Precios ({getFormattedDate(selectedDate)})</Text>
                {loadingAvailability ? (
                  <Center p="sm"><Loader size="sm" color="dark" /></Center>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {availability.map(slot => (
                      <Button 
                        key={slot.time}
                        variant={selectedTimeSlots.some(s => s.time === slot.time) ? 'filled' : 'outline'}
                        color={!slot.available ? 'gray' : selectedTimeSlots.some(s => s.time === slot.time) ? 'dark' : 'gray'}
                        disabled={!slot.available}
                        onClick={() => handleSlotToggle(slot)}
                        size="md"
                        fullWidth
                        styles={{ label: { width: '100%' } }}
                        style={{ padding: '0 16px' }}
                      >
                        <Group justify="space-between" style={{ width: '100%' }}>
                          <Text size="sm">{slot.time}</Text>
                          <Text size="sm" fw={700}>S/. {slot.price}</Text>
                        </Group>
                      </Button>
                    ))}
                  </div>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="politicas" pt="md">
                <Text size="sm">Las políticas de reserva incluyen llegar 15 minutos antes. En caso de inasistencia no hay devolución. El pago asegura el bloque horario.</Text>
              </Tabs.Panel>

              <Tabs.Panel value="reglas" pt="md">
                <Group gap={4} wrap="nowrap" align="flex-start">
                  <IconAlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Text size="sm">{selectedCourt.rules}</Text>
                </Group>
              </Tabs.Panel>
            </Tabs>
            
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'var(--mantine-color-body)', padding: '16px', borderTop: '1px solid var(--mantine-color-default-border)', zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
              <Group wrap="nowrap">
                {selectedCourt.whatsapp && (
                  <Button component="a" href={`https://wa.me/${selectedCourt.whatsapp.replace('+', '')}`} target="_blank" color="teal" variant="light" size="md" style={{ flexGrow: 0, padding: '0 12px' }}>
                    <IconBrandWhatsapp size={24} />
                  </Button>
                )}
                <Button size="md" color="dark" onClick={handleConfirmBooking} disabled={selectedTimeSlots.length === 0} style={{ flex: 1 }}>
                  {selectedTimeSlots.length > 0 ? `Reservar (S/. ${currentPrice.toFixed(2)})` : 'Seleccionar hora'}
                </Button>
              </Group>
            </div>
          </div>
        ) : selectedCourt && bookingConfirmed ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <IconCheck size={48} color="#ee5e00" style={{ margin: '0 auto' }} />
            <Text fw={800} size="xl" c="dark" mt="md">¡Reserva Solicitada!</Text>
            <Text c="dimmed" mt="xs">Espera la confirmación de la sede en la pestaña Reservas.</Text>
          </div>
        ) : null}
      </Drawer>

      <Drawer 
        opened={filtersDrawerOpen} 
        onClose={() => setFiltersDrawerOpen(false)} 
        position="bottom" 
        title={<Text fw={800}>Filtros Avanzados</Text>}
        padding="md"
        styles={{ content: { maxWidth: 480, margin: '0 auto' } }}
      >
        <Text fw={700} size="sm" mb="md">Rango de Precios</Text>
        <RangeSlider 
          defaultValue={[40, 100]} 
          min={30} max={150} 
          step={5}
          label={(value) => `S/. ${value}`}
          marks={[{ value: 40, label: 'S/. 40' }, { value: 100, label: 'S/. 100' }]} 
          mb="xl"
          color="cancha.9"
        />

        <Text fw={700} size="sm" mt="xl" mb="md">Horario de Juego</Text>
        <RangeSlider 
          defaultValue={[8, 26]} 
          min={8} max={26} 
          step={1}
          minRange={1}
          label={(value) => value >= 24 ? `0${value - 24}:00` : `${value}:00`}
          marks={[
            { value: 8, label: <Group gap={4}><IconSun size={12}/>08:00</Group> }, 
            { value: 14, label: '14:00' }, 
            { value: 20, label: '20:00' }, 
            { value: 26, label: <Group gap={4}><IconMoon size={12}/>02:00</Group> }
          ]} 
          mb="xl"
          color="cancha.9"
        />

        <Text fw={700} size="sm" mt="xl" mb="xs">Servicios</Text>
        <Group gap="sm" mb="xl">
          {["Estacionamiento", "Tienda Snack", "Baños", "Duchas", "Vestidores", "WiFi", "Seguridad", "Cámara"].map(s => (
            <Checkbox key={s} label={s} color="cancha.9" defaultChecked={s === 'Estacionamiento' || s === 'Baños'} />
          ))}
        </Group>

        <Button fullWidth color="cancha.9" onClick={() => setFiltersDrawerOpen(false)}>Aplicar Filtros</Button>
      </Drawer>
    </div>
  );
}

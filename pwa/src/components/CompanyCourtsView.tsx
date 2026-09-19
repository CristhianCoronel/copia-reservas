import { useState, useEffect } from 'react';
import { Card, Text, Group, Button, Badge, Modal, TextInput, Select, MultiSelect, ActionIcon, UnstyledButton, Grid, Box, NumberInput } from '@mantine/core';
import { IconPlus, IconTrash, IconCalendarTime, IconLock, IconSettings, IconAffiliate, IconArrowLeft, IconCopy, IconCurrencyDollar } from '@tabler/icons-react';
import { apiCall } from '../api';

interface CompanyCourt {
  id: string;
  name: string;
  sport: string;
  modalities: string[];
  basePrice: number;
  blocked_court_ids?: string[];
}

export function CompanyCourtsView({ activeVenueId, company }: { activeVenueId: string | null, company?: any }) {
  const [localVenueId, setLocalVenueId] = useState<string | null>(
    company?.venues?.[0]?.id || null
  );

  useEffect(() => {
    if (company?.venues?.length > 0 && !localVenueId) {
      setLocalVenueId(company.venues[0].id);
    }
  }, [company]);

  // View state: null = menu, 'canchas' | 'solapamientos' | 'horarios' = specific setting
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  
  const [courts, setCourts] = useState<CompanyCourt[]>([]);
  
  // Canchas state
  const [isNewCourtOpen, setIsNewCourtOpen] = useState(false);
  const [sportsOptions, setSportsOptions] = useState<string[]>([]);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtSport, setNewCourtSport] = useState<string | null>(null);
  const [newCourtModalities, setNewCourtModalities] = useState<string[]>([]);

  // Horario State
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleData, setScheduleData] = useState<any>(null);

  // Modals State
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffStart, setTariffStart] = useState('16:00');
  const [tariffEnd, setTariffEnd] = useState('17:00');
  const [tariffPrice, setTariffPrice] = useState<number | string>(60);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockStart, setBlockStart] = useState('08:00');
  const [blockEnd, setBlockEnd] = useState('12:00');
  const [blockReason, setBlockReason] = useState('MANTENIMIENTO');

  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [replicateSourceDate, setReplicateSourceDate] = useState('');

  const loadCourts = async () => {
    if (!localVenueId) return;
    try {
      const res = await apiCall(`/api/v1/business/venues/${localVenueId}/courts`);
      if (res.data) setCourts(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadCourts();
  }, [localVenueId]);

  useEffect(() => {
    async function loadSports() {
      try {
        const res = await apiCall('/api/v1/system/catalogs');
        if (res.status && res.data?.sports) {
          setSportsOptions(res.data.sports.filter((s: any) => s.is_active).map((s: any) => s.name));
        }
      } catch (e) { console.error(e); }
    }
    loadSports();
  }, []);

  const handleSaveCourt = async () => {
    if (!localVenueId) return;
    await apiCall(`/api/v1/business/venues/${localVenueId}/courts`, 'POST', {
      name: newCourtName,
      sport: newCourtSport || 'Fútbol',
      modalities: newCourtModalities
    });
    setIsNewCourtOpen(false);
    loadCourts();
  };

  const handleSaveSolapamientos = async (courtId: string, blockedIds: string[]) => {
    await apiCall(`/api/v1/business/courts/${courtId}/solapamientos`, 'PUT', {
      blocked_court_ids: blockedIds
    });
    loadCourts();
  };

  const loadSchedule = async () => {
    if (!selectedCourtId || !selectedDate) return;
    try {
      const res = await apiCall(`/api/v1/business/courts/${selectedCourtId}/schedule?date=${selectedDate}`);
      if (res.status) {
        setScheduleData(res.data);
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (activeSetting === 'horarios') {
      loadSchedule();
    }
  }, [activeSetting, selectedCourtId, selectedDate]);

  // Helpers
  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return { h, m, totalMinutes: h * 60 + m };
  };

  const handleSaveTariff = async () => {
    if (!selectedCourtId || !selectedDate) return;
    
    const newStart = parseTime(tariffStart).totalMinutes;
    const newEnd = parseTime(tariffEnd).totalMinutes;

    if (newStart >= newEnd) {
      alert("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    const hasOverlap = scheduleData?.tariffs?.some((t: any) => {
      const existingStart = parseTime(t.start).totalMinutes;
      const existingEnd = parseTime(t.end).totalMinutes;
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasOverlap) {
      alert("El rango de horas se solapa con una tarifa ya existente.");
      return;
    }
    
    // Create new intervals list appending the new tariff
    const currentIntervals = scheduleData?.tariffs?.map((t: any) => ({
      hora_inicio: t.start,
      hora_fin: t.end,
      precio: t.price
    })) || [];
    
    currentIntervals.push({
      hora_inicio: tariffStart,
      hora_fin: tariffEnd,
      precio: Number(tariffPrice)
    });

    const res = await apiCall(`/api/v1/business/courts/${selectedCourtId}/schedule`, 'POST', {
      date: selectedDate,
      intervals: currentIntervals
    });

    if (res.status) {
      setIsTariffModalOpen(false);
      loadSchedule();
    }
  };

  const handleSaveBlock = async () => {
    if (!selectedCourtId || !selectedDate) return;
    
    const res = await apiCall(`/api/v1/business/courts/${selectedCourtId}/blocks`, 'POST', {
      fecha_hora_inicio: `${selectedDate}T${blockStart}:00Z`,
      fecha_hora_fin: `${selectedDate}T${blockEnd}:00Z`,
      motivo: blockReason,
      descripcion: `Bloqueo ingresado manualmente`
    });

    if (res.status) {
      setIsBlockModalOpen(false);
      loadSchedule();
    }
  };

  const handleReplicate = async () => {
    if (!selectedCourtId || !selectedDate || !replicateSourceDate) return;
    
    // 1. Fetch source schedule
    const sourceRes = await apiCall(`/api/v1/business/courts/${selectedCourtId}/schedule?date=${replicateSourceDate}`);
    if (sourceRes.status && sourceRes.data?.tariffs) {
      const sourceIntervals = sourceRes.data.tariffs.map((t: any) => ({
        hora_inicio: t.start,
        hora_fin: t.end,
        precio: t.price
      }));
      
      // 2. Post to current date
      const saveRes = await apiCall(`/api/v1/business/courts/${selectedCourtId}/schedule`, 'POST', {
        date: selectedDate,
        intervals: sourceIntervals
      });
      
      if (saveRes.status) {
        setIsReplicateModalOpen(false);
        loadSchedule();
      }
    }
  };



  const renderCalendarView = () => {
    if (!scheduleData || !scheduleData.openingTime || !scheduleData.closingTime) return null;

    const opening = parseTime(scheduleData.openingTime);
    const closing = parseTime(scheduleData.closingTime);
    
    const startHour = opening.h;
    let endHour = closing.h;
    if (closing.m > 0) endHour += 1;

    const hours = [];
    for (let i = startHour; i <= endHour; i++) {
      hours.push(i);
    }

    const PIXELS_PER_MINUTE = 1.5;
    const PIXELS_PER_HOUR = 60 * PIXELS_PER_MINUTE;

    const getBlockStyle = (startStr: string, endStr: string) => {
      const start = parseTime(startStr);
      const end = parseTime(endStr);
      const startOffsetMinutes = (start.totalMinutes - (startHour * 60));
      const durationMinutes = end.totalMinutes - start.totalMinutes;
      
      return {
        top: `${startOffsetMinutes * PIXELS_PER_MINUTE}px`,
        height: `${durationMinutes * PIXELS_PER_MINUTE}px`,
      };
    };

    return (
      <Box style={{ position: 'relative', marginTop: 20, paddingBottom: 20 }}>
        {/* Hours Column */}
        {hours.map(h => (
          <Group key={`hour-${h}`} wrap="nowrap" align="flex-start" gap="sm" style={{ height: PIXELS_PER_HOUR, borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Text size="xs" c="dimmed" w={45} ta="right" mt={-8}>
              {h.toString().padStart(2, '0')}:00
            </Text>
            <div style={{ flex: 1, height: '100%' }} />
          </Group>
        ))}

        {/* Absolute Container for Blocks */}
        <div style={{ position: 'absolute', top: 0, left: 60, right: 0, bottom: 0 }}>
          
          {/* Tariffs (Background Layer) */}
          {scheduleData.tariffs?.map((t: any, i: number) => (
            <div key={`t-${i}`} style={{
              position: 'absolute',
              left: '2%', right: '2%',
              backgroundColor: 'var(--mantine-color-green-light)',
              color: 'var(--mantine-color-green-dark)',
              borderLeft: '4px solid var(--mantine-color-green-filled)',
              borderRadius: '4px 8px 8px 4px',
              padding: '6px 12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              ...getBlockStyle(t.start, t.end)
            }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Text size="sm" fw={700}>Tarifa Activa</Text>
                <Badge color="green" variant="filled" size="sm">S/. {t.price}</Badge>
              </Group>
              <Text size="xs" mt={4} fw={600} opacity={0.8}>{t.start} - {t.end}</Text>
            </div>
          ))}

          {/* Reservations */}
          {scheduleData.reservations?.map((r: any, i: number) => (
            <div key={`r-${i}`} style={{
              position: 'absolute',
              left: '5%', right: '5%',
              backgroundColor: r.status === 'CONFIRMADA' ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-orange-filled)',
              color: '#fff',
              borderRadius: 8,
              padding: '6px 12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              zIndex: 10,
              ...getBlockStyle(r.start, r.end)
            }}>
              <Text size="sm" fw={800}>Reserva {r.status}</Text>
              <Text size="xs" opacity={0.8}>{r.start} - {r.end}</Text>
            </div>
          ))}

          {/* Blocks */}
          {scheduleData.blocks?.map((b: any, i: number) => (
            <div key={`b-${i}`} style={{
              position: 'absolute',
              left: '10%', right: '10%',
              backgroundColor: 'var(--mantine-color-red-filled)',
              color: '#fff',
              borderRadius: 8,
              padding: '6px 12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              ...getBlockStyle(b.start, b.end)
            }}>
              <IconLock size={20} opacity={0.8} />
              <Text size="sm" fw={800} ta="center" mt={4}>Bloqueo Excepcional</Text>
              <Text size="xs" opacity={0.8} ta="center">{b.reason}</Text>
            </div>
          ))}
        </div>
      </Box>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Header Area */}
      {!activeSetting ? (
        <Group justify="space-between" mb="xl">
          <div>
            <Text fw={800} size="xl">Gestión de Canchas</Text>
            <Text c="dimmed" size="sm">Administra espacios, solapamientos, tarifas y reservas por fecha.</Text>
          </div>
        </Group>
      ) : (
        <Group mb="xl">
          <ActionIcon variant="subtle" color="gray" onClick={() => setActiveSetting(null)}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Text fw={800} size="lg">
            {activeSetting === 'canchas' && 'Canchas Base'}
            {activeSetting === 'solapamientos' && 'Solapamientos'}
            {activeSetting === 'horarios' && 'Horario y Tarifas'}
          </Text>
        </Group>
      )}

      {/* Sede Selector */}
      {company && !company.isSingleVenue && !activeSetting && (
        <Select
          label="Sede Activa"
          value={localVenueId}
          onChange={(val) => { if (val) setLocalVenueId(val) }}
          allowDeselect={false}
          data={company.venues?.map((v: any) => ({ value: v.id, label: v.name })) || []}
          mb="xl"
          style={{ maxWidth: 400 }}
        />
      )}

      {/* Main Content */}
      {localVenueId ? (
        <>
          {/* Menu Options */}
          {!activeSetting && (
            <Grid>
              <Grid.Col span={12}>
                <UnstyledButton
                  onClick={() => setActiveSetting('canchas')}
                  style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))' }}
                >
                  <Group wrap="nowrap">
                    <IconSettings size={32} color="var(--mantine-color-text)" />
                    <div>
                      <Text fw={800}>Canchas Base</Text>
                      <Text size="sm" c="dimmed">Gestiona las canchas físicas y sus características de deporte.</Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Grid.Col>
              
              <Grid.Col span={12}>
                <UnstyledButton
                  onClick={() => setActiveSetting('solapamientos')}
                  style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))' }}
                >
                  <Group wrap="nowrap">
                    <IconAffiliate size={32} color="var(--mantine-color-text)" />
                    <div>
                      <Text fw={800}>Solapamientos</Text>
                      <Text size="sm" c="dimmed">Configura bloqueos cruzados automáticos entre canchas compartidas.</Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Grid.Col>
              
              <Grid.Col span={12}>
                <UnstyledButton
                  onClick={() => setActiveSetting('horarios')}
                  style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))' }}
                >
                  <Group wrap="nowrap">
                    <IconCalendarTime size={32} color="var(--mantine-color-text)" />
                    <div>
                      <Text fw={800}>Horarios y Tarifas</Text>
                      <Text size="sm" c="dimmed">Define precios, disponibilidad y bloqueos excepcionales por día.</Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Grid.Col>
            </Grid>
          )}

          {/* Config Views */}
          {activeSetting === 'canchas' && (
            <Box>
              <Button leftSection={<IconPlus size={20} />} color="dark" size="md" mb="xl" onClick={() => setIsNewCourtOpen(true)}>
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
                    <Group gap="xs">
                      {court.modalities.map(mod => (
                        <Badge key={mod} color="gray" variant="light" size="sm">{mod}</Badge>
                      ))}
                    </Group>
                  </Card>
                ))}
              </div>
            </Box>
          )}

          {activeSetting === 'solapamientos' && (
            <Box>
              <Text size="sm" c="dimmed" mb="xl">Configura qué canchas se bloquean automáticamente cuando se reserva otra (por ej. una cancha de Fútbol 7 que usa dos de Fútbol 5).</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {courts.map(court => (
                  <Card key={court.id} padding="md" radius="md" withBorder>
                    <Text fw={800} mb="xs">{court.name}</Text>
                    <MultiSelect
                      placeholder="Selecciona canchas bloqueadas por esta"
                      data={courts.filter(c => c.id !== court.id).map(c => ({ value: c.id, label: c.name }))}
                      value={court.blocked_court_ids || []}
                      onChange={(val) => handleSaveSolapamientos(court.id, val)}
                      searchable
                    />
                  </Card>
                ))}
              </div>
            </Box>
          )}

          {activeSetting === 'horarios' && (
            <Box>
              <Group grow mb="md" align="flex-end">
                <Select
                  label="Seleccionar Cancha"
                  placeholder="Elige una cancha"
                  data={courts.map(c => ({ value: c.id, label: c.name }))}
                  value={selectedCourtId}
                  onChange={(val) => setSelectedCourtId(val)}
                />
                <TextInput
                  type="date"
                  label="Seleccionar Fecha"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.currentTarget.value)}
                />
              </Group>

              {selectedCourtId && scheduleData ? (
                <Card withBorder radius="md" padding="md" mt="xl">
                  <Group justify="space-between" mb="md">
                    <div>
                      <Text fw={800}>Vista Diaria: {selectedDate}</Text>
                      <Text size="sm" c="dimmed">Horario de atención: {scheduleData.openingTime} - {scheduleData.closingTime}</Text>
                    </div>
                    <Group>
                      {scheduleData.tariffs?.length === 0 && (
                        <Button color="blue" variant="light" leftSection={<IconCopy size={16} />} onClick={() => setIsReplicateModalOpen(true)}>Replicar de otro día</Button>
                      )}
                      <Button color="green" variant="light" leftSection={<IconCurrencyDollar size={16} />} onClick={() => setIsTariffModalOpen(true)}>
                        Añadir Tarifa
                      </Button>
                      <Button color="red" variant="light" leftSection={<IconLock size={16} />} onClick={() => setIsBlockModalOpen(true)}>
                        Añadir Bloqueo
                      </Button>
                    </Group>
                  </Group>
                  
                  {renderCalendarView()}
                </Card>
              ) : (
                <Text c="dimmed" ta="center" mt="xl">Selecciona una cancha y una fecha para configurar su horario y visualizar el calendario.</Text>
              )}
            </Box>
          )}
        </>
      ) : (
        <Text c="dimmed">Seleccione una sede para continuar.</Text>
      )}

      <Modal opened={isNewCourtOpen} onClose={() => setIsNewCourtOpen(false)} title={<Text fw={800}>Crear Nueva Cancha</Text>} centered>
        <TextInput label="Nombre Identificador" placeholder="Ej. Cancha 3 - Loza Sur" value={newCourtName} onChange={(e) => setNewCourtName(e.currentTarget.value)} required mb="md" />
        <Select 
          label="Deporte (Catálogo Oficial)" 
          placeholder="Selecciona el deporte" 
          value={newCourtSport} onChange={(val) => setNewCourtSport(val)}
          data={sportsOptions} 
          required 
          mb="md" 
        />
        <MultiSelect 
          label="Modalidades / Formatos" 
          placeholder="Añade formatos" 
          value={newCourtModalities} onChange={(val) => setNewCourtModalities(val)}
          data={['Fútbol 5', 'Fútbol 6', 'Fútbol 7', 'Fútbol 11']} 
          searchable 
          mb="md" 
        />
        <Button fullWidth color="dark" mt="md" onClick={handleSaveCourt}>Guardar Cancha</Button>
      </Modal>

      {/* Modals for Schedule config */}
      <Modal opened={isTariffModalOpen} onClose={() => setIsTariffModalOpen(false)} title={<Text fw={800}>Configurar Tarifa por Hora</Text>} centered>
        <Group grow mb="md">
          <TextInput type="time" label="Hora de Inicio" value={tariffStart} onChange={(e) => setTariffStart(e.currentTarget.value)} required />
          <TextInput type="time" label="Hora de Fin" value={tariffEnd} onChange={(e) => setTariffEnd(e.currentTarget.value)} required />
        </Group>
        <NumberInput label="Precio (S/.)" placeholder="Ej. 60" value={tariffPrice} onChange={setTariffPrice} min={0} required mb="md" />
        <Button fullWidth color="green" mt="md" onClick={handleSaveTariff}>Añadir Tarifa al Horario</Button>
      </Modal>

      <Modal opened={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title={<Text fw={800}>Añadir Bloqueo Excepcional</Text>} centered>
        <Group grow mb="md">
          <TextInput type="time" label="Hora de Inicio" value={blockStart} onChange={(e) => setBlockStart(e.currentTarget.value)} required />
          <TextInput type="time" label="Hora de Fin" value={blockEnd} onChange={(e) => setBlockEnd(e.currentTarget.value)} required />
        </Group>
        <Select 
          label="Motivo" 
          value={blockReason} 
          onChange={(v) => v && setBlockReason(v)} 
          data={['MANTENIMIENTO', 'EVENTO_PRIVADO', 'FERIADO']} 
          required 
          mb="md" 
        />
        <Button fullWidth color="red" mt="md" onClick={handleSaveBlock}>Bloquear Cancha</Button>
      </Modal>

      <Modal opened={isReplicateModalOpen} onClose={() => setIsReplicateModalOpen(false)} title={<Text fw={800}>Copiar Configuración de Otro Día</Text>} centered>
        <Text size="sm" c="dimmed" mb="md">Selecciona un día en el calendario que ya tenga las tarifas configuradas. Estas tarifas se copiarán al día actual ({selectedDate}).</Text>
        <TextInput type="date" label="Día de origen" value={replicateSourceDate} onChange={(e) => setReplicateSourceDate(e.currentTarget.value)} required mb="md" />
        <Button fullWidth color="blue" mt="md" onClick={handleReplicate}>Copiar Tarifas</Button>
      </Modal>
    </div>
  );
}

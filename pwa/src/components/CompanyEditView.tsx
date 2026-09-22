import { useState, useEffect } from 'react';
import { 
  Card, Text, Group, Button, TextInput, ActionIcon, Tabs, Select, Switch, Alert, 
  Badge, Table, NumberInput, Textarea, Loader, Center, Modal, Stack 
} from '@mantine/core';
import { 
  IconPlus, IconTrash, IconBuildingStore, IconSettings, IconUsers, IconLock, 
  IconCheck, IconCrown, IconMapPin, IconAlertCircle, IconDeviceFloppy 
} from '@tabler/icons-react';
import { apiCall } from '../api';

export function CompanyEditView({ company, onCompanyChanged }: { company?: any; onCompanyChanged?: () => void }) {
  const companyId = company?.id;

  const [activeTab, setActiveTab] = useState<string | null>('empresa');
  const [activeSede, setActiveSede] = useState<string | null>(company?.venues?.[0]?.id || null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingVenue, setLoadingVenue] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Company State
  const [isSingleSede, setIsSingleSede] = useState<boolean>(company?.isSingleVenue ?? true);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [planNombre, setPlanNombre] = useState<string>('Freemium');
  const [politicaCancelacion, setPoliticaCancelacion] = useState<string>('');
  const [terminosCondiciones, setTerminosCondiciones] = useState<string>('');
  const [savingCompany, setSavingCompany] = useState(false);

  // Sede State
  const [venueNombre, setVenueNombre] = useState<string>('');
  const [venueDireccion, setVenueDireccion] = useState<string>('');
  const [venueReferencia, setVenueReferencia] = useState<string>('');
  const [venueTelefono, setVenueTelefono] = useState<string>('');
  const [venueEmail, setVenueEmail] = useState<string>('');
  const [venueMapsUrl, setVenueMapsUrl] = useState<string>('');
  const [savingVenue, setSavingVenue] = useState(false);

  // Services State
  const [serviciosSede, setServiciosSede] = useState<any[]>([]);
  const [catalogoServicios, setCatalogoServicios] = useState<any[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [addingService, setAddingService] = useState(false);

  // Rules State
  const [tipoAdelanto, setTipoAdelanto] = useState<string>('PORCENTAJE');
  const [valorAdelanto, setValorAdelanto] = useState<number>(50);
  const [minutosEspera, setMinutosEspera] = useState<number>(15);
  const [maxHorasContinuas, setMaxHorasContinuas] = useState<number>(2);
  const [horasCancelacion, setHorasCancelacion] = useState<number>(24);
  const [savingRules, setSavingRules] = useState(false);

  // Staff State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<string>('RECEPCIONISTA');
  const [addingStaff, setAddingStaff] = useState(false);

  // Load Company details
  useEffect(() => {
    if (companyId) {
      loadCompanyDetails();
    }
  }, [companyId]);

  // Load Venue details & Services when activeSede changes
  useEffect(() => {
    if (activeSede) {
      loadVenueDetails(activeSede);
      loadVenueServices(activeSede);
      if (companyId) {
        loadVenueStaff(activeSede);
      }
    }
  }, [activeSede, companyId]);

  // Load Catalog of master services once
  useEffect(() => {
    apiCall('/api/v1/system/catalogs/servicios')
      .then(res => {
        if (res.status && res.data) {
          setCatalogoServicios(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const loadCompanyDetails = async () => {
    setLoadingCompany(true);
    try {
      const res = await apiCall(`/api/v1/b2b/business/companies/${companyId}`);
      if (res.status && res.data) {
        setIsSingleSede(res.data.es_sede_unica ?? true);
        setIsPremium(res.data.is_premium ?? false);
        setPlanNombre(res.data.plan_nombre || 'Freemium');
        setPoliticaCancelacion(res.data.politica_cancelacion || '');
        setTerminosCondiciones(res.data.terminos_condiciones || '');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingCompany(false);
    }
  };

  const loadVenueDetails = async (venueId: string) => {
    setLoadingVenue(true);
    try {
      const res = await apiCall(`/api/v1/b2b/business/venues/${venueId}`);
      if (res.status && res.data) {
        setVenueNombre(res.data.nombre || '');
        setVenueDireccion(res.data.direccion || '');
        setVenueReferencia(res.data.referencia || '');
        setVenueTelefono(res.data.telefono || '');
        setVenueEmail(res.data.email || '');
        setVenueMapsUrl(res.data.maps_url || '');

        setTipoAdelanto(res.data.tipo_adelanto_requerido || 'PORCENTAJE');
        setValorAdelanto(Number(res.data.valor_adelanto_requerido) || 0);
        setMinutosEspera(Number(res.data.reserva_minutos_espera) || 15);
        setMaxHorasContinuas(Number(res.data.max_horas_reserva_continua) || 2);
        setHorasCancelacion(Number(res.data.horas_limite_cancelacion) || 24);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingVenue(false);
    }
  };

  const loadVenueServices = async (venueId: string) => {
    try {
      const res = await apiCall(`/api/v1/b2b/business/venues/${venueId}/services`);
      if (res.status && res.data) {
        setServiciosSede(res.data);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const loadVenueStaff = async (venueId: string) => {
    try {
      const res = await apiCall(`/api/v1/b2b/business/companies/${companyId}/venues/${venueId}/staff`);
      if (res.status && res.data) {
        setStaffList(res.data);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyId) return;
    setSavingCompany(true);
    setFeedback(null);
    try {
      await apiCall(`/api/v1/b2b/business/companies/${companyId}`, 'PUT', {
        es_sede_unica: isSingleSede,
        politica_cancelacion: politicaCancelacion,
        terminos_condiciones: terminosCondiciones
      });
      setFeedback({ type: 'success', message: 'Políticas y configuración global guardadas correctamente.' });
      if (onCompanyChanged) onCompanyChanged();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error al guardar configuración de empresa.' });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveVenue = async () => {
    if (!activeSede) return;
    setSavingVenue(true);
    setFeedback(null);
    try {
      await apiCall(`/api/v1/b2b/business/venues/${activeSede}`, 'PUT', {
        nombre: venueNombre,
        direccion: venueDireccion,
        referencia: venueReferencia,
        telefono: venueTelefono,
        email: venueEmail,
        maps_url: isPremium ? venueMapsUrl : undefined
      });
      setFeedback({ type: 'success', message: 'Datos de la sede guardados correctamente.' });
      if (onCompanyChanged) onCompanyChanged();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error al guardar datos de la sede.' });
    } finally {
      setSavingVenue(false);
    }
  };

  const handleAddService = async () => {
    if (!activeSede || !servicioSeleccionado) return;
    setAddingService(true);
    try {
      await apiCall(`/api/v1/b2b/business/venues/${activeSede}/services`, 'POST', {
        servicio_id: servicioSeleccionado,
        es_gratuito: true
      });
      setServicioSeleccionado(null);
      await loadVenueServices(activeSede);
    } catch (e: any) {
      alert(e.message || 'Error al agregar servicio');
    } finally {
      setAddingService(false);
    }
  };

  const handleRemoveService = async (serviceIdOrLinkId: string) => {
    if (!activeSede) return;
    try {
      await apiCall(`/api/v1/b2b/business/venues/${activeSede}/services/${serviceIdOrLinkId}`, 'DELETE');
      await loadVenueServices(activeSede);
    } catch (e: any) {
      alert(e.message || 'Error al remover servicio');
    }
  };

  const handleSaveRules = async () => {
    if (!activeSede) return;
    setSavingRules(true);
    setFeedback(null);
    try {
      await apiCall(`/api/v1/b2b/business/venues/${activeSede}`, 'PUT', {
        tipo_adelanto_requerido: tipoAdelanto,
        valor_adelanto_requerido: valorAdelanto,
        reserva_minutos_espera: minutosEspera,
        max_horas_reserva_continua: maxHorasContinuas,
        horas_limite_cancelacion: horasCancelacion
      });
      setFeedback({ type: 'success', message: 'Reglas operativas de la sede actualizadas correctamente.' });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error al actualizar reglas de la sede.' });
    } finally {
      setSavingRules(false);
    }
  };

  const handleAddStaff = async () => {
    if (!companyId || !activeSede || !newStaffUsername) return;
    setAddingStaff(true);
    try {
      const cleanUsername = newStaffUsername.replace(/^@/, '').trim();
      await apiCall(`/api/v1/b2b/business/companies/${companyId}/venues/${activeSede}/staff`, 'POST', {
        username: cleanUsername,
        rol: newStaffRole
      });
      setStaffModalOpen(false);
      setNewStaffUsername('');
      await loadVenueStaff(activeSede);
    } catch (e: any) {
      alert(e.message || 'Error al asignar colaborador');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleRemoveStaff = async (contractId: string) => {
    if (confirm('¿Estás seguro de revocar el acceso a este colaborador?')) {
      try {
        await apiCall(`/api/v1/b2b/business/contracts/${contractId}`, 'DELETE');
        if (activeSede) await loadVenueStaff(activeSede);
      } catch (e: any) {
        alert(e.message || 'Error al revocar contrato');
      }
    }
  };

  const availableServicesForSelect = catalogoServicios
    .filter(cs => !serviciosSede.some(ss => ss.servicio_id === cs.id || ss.nombre === cs.nombre))
    .map(cs => ({ value: cs.id, label: cs.nombre }));

  const venueOptions = company?.venues?.map((v: any) => ({ value: v.id, label: v.name })) || [
    { value: 'sede-1', label: 'Sede Principal' }
  ];

  if (loadingCompany && !companyId) {
    return (
      <Center style={{ height: 300 }}>
        <Loader color="cancha.6" />
      </Center>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Group justify="space-between" align="center" mb="md">
        <div>
          <Text fw={800} size="xl">Gestión de Empresa y Sede</Text>
          <Text c="dimmed" size="sm">
            {company?.name || 'Administra la información, reglas y tu personal.'}
          </Text>
        </div>
        {isPremium ? (
          <Badge color="green" variant="light" leftSection={<IconCrown size={12} />}>{planNombre}</Badge>
        ) : (
          <Badge color="orange" variant="light" leftSection={<IconCrown size={12} />}>{planNombre}</Badge>
        )}
      </Group>

      {feedback && (
        <Alert 
          icon={feedback.type === 'success' ? <IconCheck size={18} /> : <IconAlertCircle size={18} />} 
          title={feedback.type === 'success' ? 'Operación Exitosa' : 'Error'} 
          color={feedback.type === 'success' ? 'teal' : 'red'} 
          withCloseButton 
          onClose={() => setFeedback(null)} 
          mb="md"
        >
          {feedback.message}
        </Alert>
      )}

      {!isSingleSede && (
        <Select
          label="Sede Activa"
          value={activeSede}
          onChange={setActiveSede}
          data={venueOptions}
          mb="xl"
          placeholder="Selecciona una sede"
        />
      )}

      <Tabs value={activeTab} onChange={(val) => { setActiveTab(val); setFeedback(null); }} variant="outline" radius="md">
        <Tabs.List>
          <Tabs.Tab value="empresa" leftSection={<IconBuildingStore size={16} />}>Empresa</Tabs.Tab>
          <Tabs.Tab value="datos" leftSection={<IconMapPin size={16} />}>Sede Local</Tabs.Tab>
          <Tabs.Tab value="reglas" leftSection={<IconSettings size={16} />}>Reglas</Tabs.Tab>
          <Tabs.Tab value="personal" leftSection={<IconUsers size={16} />}>Personal</Tabs.Tab>
        </Tabs.List>

        {/* TAB 1: EMPRESA */}
        <Tabs.Panel value="empresa" pt="md">
          <Alert icon={<IconBuildingStore size={20} />} title="Configuración a Nivel Empresa" color="indigo" mb="md" variant="light">
            <Text size="sm">
              Estos ajustes afectan a <strong>todas las sedes</strong> de tu empresa de manera global.
            </Text>
          </Alert>

          <Card withBorder padding="md" radius="md" mb="md">
            <Group justify="space-between" align="center">
              <div>
                <Text fw={800}>Modo de Sede Única</Text>
                <Text size="xs" c="dimmed">Activa esto si tu empresa opera en un único local para simplificar la interfaz.</Text>
              </div>
              <Switch checked={isSingleSede} onChange={(e) => setIsSingleSede(e.currentTarget.checked)} size="md" />
            </Group>
          </Card>
          
          <Card withBorder padding="md" radius="md">
            <Text fw={800} size="md" mb="xs">Políticas Globales de la Empresa</Text>
            <Textarea 
              label="Política de Cancelación y Devoluciones" 
              value={politicaCancelacion}
              onChange={(e) => setPoliticaCancelacion(e.currentTarget.value)}
              placeholder="Ej: Se aceptan cancelaciones sin penalidad hasta 24 horas antes del partido..."
              minRows={3}
              mb="md"
            />
            <Textarea 
              label="Términos y Condiciones" 
              value={terminosCondiciones}
              onChange={(e) => setTerminosCondiciones(e.currentTarget.value)}
              placeholder="Ej: 1. El local no se responsabiliza por pérdida de objetos personales..."
              minRows={3}
              mb="md"
            />
            <Button 
              fullWidth 
              color="dark" 
              onClick={handleSaveCompany} 
              loading={savingCompany}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Guardar Políticas
            </Button>
          </Card>
        </Tabs.Panel>

        {/* TAB 2: SEDE LOCAL */}
        <Tabs.Panel value="datos" pt="md">
          <Alert icon={<IconMapPin size={20} />} title="Configuración de Sede" color="blue" mb="md" variant="light">
            <Text size="sm">
              Estos datos de ubicación y servicios aplican únicamente a la sede seleccionada.
            </Text>
          </Alert>

          {loadingVenue ? (
            <Center style={{ height: 180 }}>
              <Loader color="cancha.6" />
            </Center>
          ) : (
            <Card withBorder padding="md" radius="md">
              <TextInput 
                label="Nombre del Local (Sede)" 
                value={venueNombre} 
                onChange={(e) => setVenueNombre(e.currentTarget.value)} 
                mb="md" 
                required 
              />
              <TextInput 
                label="Dirección Física" 
                value={venueDireccion} 
                onChange={(e) => setVenueDireccion(e.currentTarget.value)} 
                mb="md" 
                required 
              />
              <TextInput 
                label="Referencia de Llegada" 
                value={venueReferencia} 
                onChange={(e) => setVenueReferencia(e.currentTarget.value)} 
                placeholder="Ej: Frente al parque central..." 
                mb="md" 
              />
              
              <Group grow mb="md">
                <TextInput 
                  label="Teléfono de Recepción" 
                  value={venueTelefono} 
                  onChange={(e) => setVenueTelefono(e.currentTarget.value)} 
                  required 
                />
                <TextInput 
                  label="Email de Contacto" 
                  value={venueEmail} 
                  onChange={(e) => setVenueEmail(e.currentTarget.value)} 
                  placeholder="Sede opcional" 
                />
              </Group>
              
              <TextInput 
                label="URL de Google Maps" 
                value={venueMapsUrl}
                onChange={(e) => setVenueMapsUrl(e.currentTarget.value)}
                placeholder="https://maps.google.com/..." 
                mb="md"
                disabled={!isPremium}
                description={!isPremium ? "Beneficio exclusivo de Cuenta Premium" : "Enlace directo para apertura en Google Maps"}
              />

              <Text size="sm" fw={700} mt="xl" mb="xs">Servicios Incluidos en Sede</Text>
              
              <Group align="flex-end" mb="md">
                <Select 
                  style={{ flex: 1 }}
                  placeholder="Seleccionar servicio para agregar..." 
                  data={availableServicesForSelect}
                  value={servicioSeleccionado}
                  onChange={setServicioSeleccionado}
                  disabled={availableServicesForSelect.length === 0}
                />
                <Button 
                  onClick={handleAddService} 
                  disabled={!servicioSeleccionado}
                  loading={addingService}
                  leftSection={<IconPlus size={14} />}
                >
                  Añadir
                </Button>
              </Group>

              <Table striped withTableBorder mb="xl">
                <Table.Tbody>
                  {serviciosSede.map(s => (
                    <Table.Tr key={s.id || s.servicio_id}>
                      <Table.Td>{s.nombre}</Table.Td>
                      <Table.Td w={50}>
                        <ActionIcon 
                          color="red" 
                          variant="subtle" 
                          onClick={() => handleRemoveService(s.id || s.servicio_id)}
                        >
                          <IconTrash size={16}/>
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {serviciosSede.length === 0 && (
                    <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" size="sm" ta="center">No hay servicios agregados a esta sede</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>

              <Button 
                fullWidth 
                color="dark" 
                onClick={handleSaveVenue}
                loading={savingVenue}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                Guardar Sede
              </Button>
            </Card>
          )}
        </Tabs.Panel>

        {/* TAB 3: REGLAS */}
        <Tabs.Panel value="reglas" pt="md">
          <Alert icon={<IconSettings size={20} />} title="Reglas por Sede" color="blue" mb="md" variant="light">
            <Text size="sm">
              Estas reglas de negocio aplican únicamente a la sede seleccionada.
            </Text>
          </Alert>
          <Card withBorder padding="md" radius="md" mb="md">
            <Text fw={800} size="md" mb="md">Configuración Operativa (Por Sede)</Text>
            
            <Group grow align="flex-start" mb="md">
              <Select 
                label="Tipo de Adelanto Requerido" 
                value={tipoAdelanto}
                onChange={(val) => setTipoAdelanto(val || 'PORCENTAJE')}
                data={[
                  { value: 'PORCENTAJE', label: 'Porcentaje (%)' },
                  { value: 'MONTO_FIJO', label: 'Monto Fijo (S/.)' },
                  { value: 'NINGUNO', label: 'Ninguno (Reserva Directa)' }
                ]}
              />
              <NumberInput 
                label="Valor del Adelanto" 
                value={valorAdelanto} 
                onChange={(val) => setValorAdelanto(Number(val) || 0)}
                min={0} 
                description="Monto o % requerido para confirmar el turno."
                disabled={tipoAdelanto === 'NINGUNO'}
              />
            </Group>
            
            <Group grow align="flex-start" mb="md">
              <NumberInput 
                label="Tiempo de Espera (min)" 
                value={minutosEspera} 
                onChange={(val) => setMinutosEspera(Number(val) || 15)}
                min={5} 
                description="Minutos antes de liberar la cancha si no se envía voucher."
              />
              <NumberInput 
                label="Límite Horas Continuas" 
                value={maxHorasContinuas} 
                onChange={(val) => setMaxHorasContinuas(Number(val) || 2)}
                min={1} 
                description="Máximo de horas seguidas por cliente."
              />
            </Group>
            
            <NumberInput 
              label="Límite de Cancelación (hrs)" 
              value={horasCancelacion} 
              onChange={(val) => setHorasCancelacion(Number(val) || 24)}
              min={0} 
              mb="md"
              description="Horas previas mínimas para cancelar sin penalidad."
            />
            
            <Button 
              fullWidth 
              color="dark" 
              onClick={handleSaveRules}
              loading={savingRules}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Actualizar Reglas de Sede
            </Button>
          </Card>
        </Tabs.Panel>

        {/* TAB 4: PERSONAL */}
        <Tabs.Panel value="personal" pt="md">
          <Alert icon={<IconUsers size={20} />} title="Personal de Sede" color="blue" mb="md" variant="light">
            <Text size="sm">
              El personal configurado aquí tendrá acceso únicamente a las operaciones de la sede seleccionada.
            </Text>
          </Alert>
          {!isPremium ? (
            <Alert icon={<IconLock size={20} />} title="Plan Freemium" color="orange" mb="md">
              <Text size="sm">
                Actualmente solo tú tienes acceso a administrar esta sede. Para otorgar contratos (credenciales de acceso) a tus recepcionistas u operarios sin compartir tu contraseña, necesitas actualizar a un Plan Premium.
              </Text>
              <Button color="orange" mt="md" size="xs">Ver Planes Premium</Button>
            </Alert>
          ) : (
            <>
              <Group justify="space-between" align="center" mb="md">
                <Text fw={800} size="md">Colaboradores de la Sede</Text>
                <Button 
                  size="xs" 
                  color="dark" 
                  leftSection={<IconPlus size={14} />}
                  onClick={() => setStaffModalOpen(true)}
                >
                  Añadir Trabajador
                </Button>
              </Group>

              <Card withBorder padding="0" radius="md" style={{ overflow: 'hidden' }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Username / Nombre</Table.Th>
                      <Table.Th>Rol</Table.Th>
                      <Table.Th>Alcance</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {staffList.map(st => (
                      <Table.Tr key={st.id}>
                        <Table.Td>
                          <Text size="sm" fw={600}>@{st.username}</Text>
                          <Text size="xs" c="dimmed">{st.fullName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={st.rol === 'ADMINISTRADOR' ? 'dark' : st.rol === 'RECEPCIONISTA' ? 'blue' : 'gray'} 
                            variant="light"
                          >
                            {st.rol}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c={st.is_global ? 'indigo' : 'dimmed'}>
                            {st.is_global ? 'Global (Toda la empresa)' : 'Sede local'}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <ActionIcon 
                            color="red" 
                            variant="subtle" 
                            onClick={() => handleRemoveStaff(st.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {staffList.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text c="dimmed" size="sm" ta="center" py="md">No hay colaboradores adicionales asignados a esta sede</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Card>

              {/* Modal Añadir Trabajador */}
              <Modal 
                opened={staffModalOpen} 
                onClose={() => setStaffModalOpen(false)} 
                title={<Text fw={800}>Asignar Nuevo Colaborador</Text>}
                centered
              >
                <Stack gap="md">
                  <TextInput 
                    label="Username del Usuario" 
                    placeholder="ej. @jugador_pro o jugador_pro" 
                    value={newStaffUsername} 
                    onChange={(e) => setNewStaffUsername(e.currentTarget.value)}
                    description="El usuario debe estar previamente registrado en Separa Altoke."
                    required 
                  />
                  <Select 
                    label="Rol Asignado" 
                    value={newStaffRole} 
                    onChange={(val) => setNewStaffRole(val || 'RECEPCIONISTA')} 
                    data={[
                      { value: 'RECEPCIONISTA', label: 'Recepcionista (Atención y Validación de Pagos)' },
                      { value: 'ADMINISTRADOR', label: 'Administrador de Sede' },
                      { value: 'OPERADOR_MANTENIMIENTO', label: 'Operador de Mantenimiento' }
                    ]}
                  />
                  <Button 
                    color="dark" 
                    fullWidth 
                    onClick={handleAddStaff} 
                    loading={addingStaff}
                    disabled={!newStaffUsername.trim()}
                  >
                    Asignar Contrato
                  </Button>
                </Stack>
              </Modal>
            </>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

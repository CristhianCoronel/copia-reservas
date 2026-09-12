import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, Loader, Center, Tabs, Table, ActionIcon, Modal, Stack, TextInput, Alert } from '@mantine/core';
import { IconCheck, IconX, IconDatabase, IconBuildingStore, IconListDetails, IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import { apiCall } from '../api';

export function SuperAdminView() {
  const [loading, setLoading] = useState(true);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [registeredCompanies, setRegisteredCompanies] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<{sports: any[], services: any[]}>({ sports: [], services: [] });
  const [selectedCompanyReservations, setSelectedCompanyReservations] = useState<any | null>(null);
  const [selectedPendingCompany, setSelectedPendingCompany] = useState<any | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // CRUD state for catalogs
  const [editingSport, setEditingSport] = useState<any | null>(null);
  const [newSportName, setNewSportName] = useState('');
  const [editingService, setEditingService] = useState<any | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');

  const reloadCatalogs = async () => {
    try {
      const catRes = await apiCall('/api/v1/system/catalogs');
      if (catRes.status) setCatalogs(catRes.data);
    } catch (e) { console.error(e); }
  };

  const handleSaveSport = async () => {
    if (!newSportName.trim()) return;
    try {
      if (editingSport?.id) {
        await apiCall(`/api/v1/system/catalogs/deportes/${editingSport.id}`, 'PUT', { nombre: newSportName, is_active: editingSport.is_active ?? true });
      } else {
        await apiCall('/api/v1/system/catalogs/deportes', 'POST', { nombre: newSportName });
      }
      setEditingSport(null); setNewSportName('');
      await reloadCatalogs();
    } catch (e) { console.error(e); }
  };

  const handleDeleteSport = async (id: string) => {
    if (!confirm('¿Eliminar este deporte?')) return;
    try {
      await apiCall(`/api/v1/system/catalogs/deportes/${id}`, 'DELETE');
      await reloadCatalogs();
    } catch (e: any) { setFeedbackMsg({ text: e.message || 'No se pudo eliminar', type: 'error' }); }
  };

  const handleSaveService = async () => {
    if (!newServiceName.trim()) return;
    try {
      if (editingService?.id) {
        await apiCall(`/api/v1/system/catalogs/servicios/${editingService.id}`, 'PUT', { nombre: newServiceName, categoria: newServiceCategory || null });
      } else {
        await apiCall('/api/v1/system/catalogs/servicios', 'POST', { nombre: newServiceName, categoria: newServiceCategory || null });
      }
      setEditingService(null); setNewServiceName(''); setNewServiceCategory('');
      await reloadCatalogs();
    } catch (e) { console.error(e); }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      await apiCall(`/api/v1/system/catalogs/servicios/${id}`, 'DELETE');
      await reloadCatalogs();
    } catch (e: any) { setFeedbackMsg({ text: e.message || 'No se pudo eliminar', type: 'error' }); }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [compRes, regRes, catRes] = await Promise.all([
          apiCall('/api/v1/b2b/system/companies/pending'),
          apiCall('/api/v1/b2b/system/companies/registered'),
          apiCall('/api/v1/system/catalogs')
        ]);
        
        if (compRes.data) setPendingCompanies(compRes.data);
        else if (Array.isArray(compRes)) setPendingCompanies(compRes);

        if (regRes.data) setRegisteredCompanies(regRes.data);
        else if (Array.isArray(regRes)) setRegisteredCompanies(regRes);

        if (catRes.status && catRes.data) setCatalogs(catRes.data);
        else if (catRes.data) setCatalogs(catRes.data);
      } catch (e) {
        console.error("Error al cargar datos del sistema", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiCall(`/api/v1/b2b/system/companies/${id}/status`, 'PUT', { status: 'APROBADA' });
      setPendingCompanies(pendingCompanies.filter(c => c.id !== id));
      setFeedbackMsg({ text: "Empresa aprobada exitosamente", type: 'success' });
    } catch (e) {
      console.error(e);
      setFeedbackMsg({ text: "Error al aprobar la empresa", type: 'error' });
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('¿Estás seguro de rechazar esta empresa?')) return;
    try {
      await apiCall(`/api/v1/b2b/system/companies/${id}/status`, 'PUT', { status: 'RECHAZADA' });
      setPendingCompanies(pendingCompanies.filter(c => c.id !== id));
      setFeedbackMsg({ text: "Empresa rechazada", type: 'success' });
    } catch (e) {
      console.error(e);
      setFeedbackMsg({ text: "Error al rechazar la empresa", type: 'error' });
    }
  };

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl" mb="md">Panel de Super Admin</Text>
      
      {feedbackMsg && (
        <Alert 
          color={feedbackMsg.type === 'success' ? 'green' : 'red'} 
          variant="light" 
          mb="md" 
          withCloseButton 
          onClose={() => setFeedbackMsg(null)}
        >
          <Text size="sm" fw={500}>{feedbackMsg.text}</Text>
        </Alert>
      )}

      <Tabs defaultValue="empresas" color="dark">
        <Tabs.List mb="md">
          <Tabs.Tab value="empresas" leftSection={<IconBuildingStore size={16} />}>Empresas Pendientes</Tabs.Tab>
          <Tabs.Tab value="registradas" leftSection={<IconCheck size={16} />}>Empresas Registradas</Tabs.Tab>
          <Tabs.Tab value="catalogos" leftSection={<IconDatabase size={16} />}>Catálogos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="empresas">
          {pendingCompanies.length === 0 ? (
            <Text c="dimmed">No hay empresas pendientes de aprobación.</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingCompanies.map(c => (
                <Card key={c.id} withBorder shadow="sm" radius="md" padding="md">
                  <Group justify="space-between" mb="xs">
                    <Badge color="orange">{c.status || 'PENDIENTE'}</Badge>
                    <Text size="xs" c="dimmed">RUC: {c.document}</Text>
                  </Group>
                  <Text fw={700}>{c.companyName}</Text>
                  <Text size="sm" c="dimmed" mb="md">{c.contactName}</Text>
                  <Group grow mb="xs">
                    <Button color="green" onClick={() => handleApprove(c.id)}>Aprobar</Button>
                    <Button variant="outline" color="red" onClick={() => handleReject(c.id)}>Rechazar</Button>
                  </Group>
                  <Button variant="subtle" size="xs" fullWidth onClick={() => setSelectedPendingCompany(c)}>
                    Ver Detalles Completos
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="registradas">
          {registeredCompanies.length === 0 ? (
            <Text c="dimmed">No hay empresas registradas.</Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Empresa</Table.Th>
                  <Table.Th>Dueño</Table.Th>
                  <Table.Th>Canchas</Table.Th>
                  <Table.Th>Reservas (7 Días)</Table.Th>
                  <Table.Th>Plan</Table.Th>
                  <Table.Th>Afiliado Desde</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {registeredCompanies.map(c => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text fw={700} size="sm">{c.companyName}</Text>
                    </Table.Td>
                    <Table.Td>{c.ownerName}</Table.Td>
                    <Table.Td>{c.courtsCount}</Table.Td>
                    <Table.Td><Badge color="orange" variant="light">{c.reservasLastWeek}</Badge></Table.Td>
                    <Table.Td><Badge color="blue">{c.planName}</Badge></Table.Td>
                    <Table.Td>{c.since}</Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="light" leftSection={<IconListDetails size={14} />} onClick={() => setSelectedCompanyReservations(c)}>
                        Ver Reservas
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="catalogos">
          <Group justify="space-between" mb="xs">
            <Text fw={700}>Deportes</Text>
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setEditingSport({}); setNewSportName(''); }}>
              Agregar
            </Button>
          </Group>

          {editingSport && (
            <Card withBorder radius="md" p="sm" mb="sm" bg="var(--mantine-color-gray-0)">
              <TextInput
                label={editingSport.id ? 'Editar Deporte' : 'Nuevo Deporte'}
                placeholder="Nombre del deporte"
                value={newSportName}
                onChange={(e) => setNewSportName(e.currentTarget.value)}
                mb="xs"
              />
              <Group gap="xs">
                <Button size="xs" onClick={handleSaveSport}>Guardar</Button>
                <Button size="xs" variant="light" color="gray" onClick={() => { setEditingSport(null); setNewSportName(''); }}>Cancelar</Button>
              </Group>
            </Card>
          )}

          <Table striped highlightOnHover withTableBorder mb="lg">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th w={90}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {catalogs.sports.length === 0 ? (
                <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" ta="center" size="sm">Sin deportes</Text></Table.Td></Table.Tr>
              ) : catalogs.sports.map(s => (
                <Table.Tr key={s.id}>
                  <Table.Td><Text fw={600} size="sm">{s.name}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={s.is_active ? 'green' : 'red'} variant="light" size="sm">
                      {s.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon size="sm" variant="light" onClick={() => { setEditingSport(s); setNewSportName(s.name); }}>
                        <IconPencil size={14} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="light" color="red" onClick={() => handleDeleteSport(s.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="space-between" mb="xs">
            <Text fw={700}>Servicios</Text>
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setEditingService({}); setNewServiceName(''); setNewServiceCategory(''); }}>
              Agregar
            </Button>
          </Group>

          {editingService && (
            <Card withBorder radius="md" p="sm" mb="sm" bg="var(--mantine-color-gray-0)">
              <TextInput
                label={editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
                placeholder="Nombre del servicio"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.currentTarget.value)}
                mb="xs"
              />
              <TextInput
                label="Categoría (opcional)"
                placeholder="Ej: Comodidad, Equipamiento"
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.currentTarget.value)}
                mb="xs"
              />
              <Group gap="xs">
                <Button size="xs" onClick={handleSaveService}>Guardar</Button>
                <Button size="xs" variant="light" color="gray" onClick={() => { setEditingService(null); setNewServiceName(''); setNewServiceCategory(''); }}>Cancelar</Button>
              </Group>
            </Card>
          )}

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Categoría</Table.Th>
                <Table.Th w={90}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {catalogs.services.length === 0 ? (
                <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" ta="center" size="sm">Sin servicios</Text></Table.Td></Table.Tr>
              ) : catalogs.services.map(s => (
                <Table.Tr key={s.id}>
                  <Table.Td><Text fw={600} size="sm">{s.name}</Text></Table.Td>
                  <Table.Td>{s.category || '—'}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon size="sm" variant="light" onClick={() => { setEditingService(s); setNewServiceName(s.name); setNewServiceCategory(s.category || ''); }}>
                        <IconPencil size={14} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="light" color="red" onClick={() => handleDeleteService(s.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      {/* Modal para ver reservas de la empresa */}
      <Modal 
        opened={!!selectedCompanyReservations} 
        onClose={() => setSelectedCompanyReservations(null)}
        title={<Text fw={700} size="sm">Reservas de {selectedCompanyReservations?.companyName}</Text>}
        fullScreen
        transitionProps={{ transition: 'slide-up' }}
        styles={{ content: { maxWidth: 480, margin: '0 auto' } }}
      >
        {selectedCompanyReservations && (
          <Stack>
            <Group gap="xs">
              <Text fw={600} size="sm">Total por Estado:</Text>
              {Object.entries(selectedCompanyReservations.reservasStats).map(([estado, count]) => (
                <Badge key={estado} variant="light" color={estado === 'CONFIRMADA' ? 'green' : 'orange'}>
                  {estado}: {count as any}
                </Badge>
              ))}
            </Group>
            
            {selectedCompanyReservations.reservas.length === 0 ? (
              <Text c="dimmed">No hay reservas registradas.</Text>
            ) : (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Solicitante</Table.Th>
                    <Table.Th>Estado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedCompanyReservations.reservas.map((r: any) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>{r.fecha}</Table.Td>
                      <Table.Td>{r.solicitante}</Table.Td>
                      <Table.Td><Badge size="sm" color={r.estado === 'CONFIRMADA' ? 'green' : 'orange'}>{r.estado}</Badge></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        )}
      </Modal>
      {/* Modal para ver detalles de empresa pendiente */}
      <Modal 
        opened={!!selectedPendingCompany} 
        onClose={() => setSelectedPendingCompany(null)}
        title={<Text fw={700}>Detalles de Empresa Pendiente</Text>}
      >
        {selectedPendingCompany && (
          <Stack>
            <TextInput label="Nombre Comercial" value={selectedPendingCompany.companyName} readOnly />
            <TextInput label="RUC" value={selectedPendingCompany.document} readOnly />
            <TextInput label="Representante Legal / Contacto" value={selectedPendingCompany.contactName} readOnly />
            <TextInput label="Teléfono de Contacto" value={selectedPendingCompany.phone} readOnly />
            {/* Si el backend envía email y fecha, se podrían mostrar aquí. Por ahora mostraremos lo que esté en selectedPendingCompany */}
            {selectedPendingCompany.email && <TextInput label="Email de Contacto" value={selectedPendingCompany.email} readOnly />}
            
            <Text fw={700} mt="md" size="sm" c="dimmed">DATOS DEL CREADOR (USUARIO REGISTRADO)</Text>
            <TextInput label="Persona que registró" value={`${selectedPendingCompany.creatorName} (Doc: ${selectedPendingCompany.creatorDocument || 'N/A'})`} readOnly />
            {selectedPendingCompany.creatorEmail && <TextInput label="Correo de la Cuenta" value={selectedPendingCompany.creatorEmail} readOnly />}
            {selectedPendingCompany.creatorPhone && <TextInput label="Celular de la Cuenta" value={selectedPendingCompany.creatorPhone} readOnly />}
            {selectedPendingCompany.creatorCreatedAt && <TextInput label="Fecha y Hora de Creación de Cuenta" value={new Date(selectedPendingCompany.creatorCreatedAt).toLocaleString('es-PE')} readOnly />}
            {selectedPendingCompany.createdAt && <TextInput label="Fecha y Hora de Solicitud de Empresa" value={new Date(selectedPendingCompany.createdAt).toLocaleString('es-PE')} readOnly />}
            
            <Group grow mt="md">
              <Button color="green" onClick={() => { handleApprove(selectedPendingCompany.id); setSelectedPendingCompany(null); }}>Aprobar</Button>
              <Button variant="outline" color="red" onClick={() => { handleReject(selectedPendingCompany.id); setSelectedPendingCompany(null); }}>Rechazar</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}

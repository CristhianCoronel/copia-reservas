import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Button, Loader, Center, Tabs, Table, ActionIcon } from '@mantine/core';
import { IconCheck, IconX, IconDatabase, IconBuildingStore } from '@tabler/icons-react';
import { apiCall } from '../api';

export function SuperAdminView() {
  const [loading, setLoading] = useState(true);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<{sports: any[], services: any[]}>({ sports: [], services: [] });

  useEffect(() => {
    async function loadData() {
      try {
        const [compRes, catRes] = await Promise.all([
          apiCall('/api/v1/system/companies/pending'),
          apiCall('/api/v1/system/catalogs')
        ]);
        
        if (compRes.status) setPendingCompanies(compRes.data);
        if (catRes.status) setCatalogs(catRes.data);
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
      await apiCall(`/system/companies/${id}/status`, 'PUT', { status: 'APROBADA' });
      setPendingCompanies(pendingCompanies.filter(c => c.id !== id));
      alert("Empresa Aprobada Exitosamente");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl" mb="md">Panel de Super Admin</Text>
      
      <Tabs defaultValue="empresas" color="dark">
        <Tabs.List mb="md">
          <Tabs.Tab value="empresas" leftSection={<IconBuildingStore size={16} />}>Empresas Pendientes</Tabs.Tab>
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
                    <Badge color="orange">{c.status}</Badge>
                    <Text size="xs" c="dimmed">RUC: {c.ruc}</Text>
                  </Group>
                  <Text fw={700}>{c.commercialName}</Text>
                  <Text size="sm" c="dimmed" mb="md">{c.name}</Text>
                  <Group grow>
                    <Button color="green" onClick={() => handleApprove(c.id)}>Aprobar</Button>
                    <Button variant="outline" color="red">Rechazar</Button>
                  </Group>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="catalogos">
          <Text fw={700} mb="xs">Deportes Activos</Text>
          <Card withBorder radius="md" padding="sm" mb="md">
            <Group gap="xs">
              {catalogs.sports.map(s => (
                <Badge key={s.id} variant="light" color="dark">{s.name}</Badge>
              ))}
            </Group>
          </Card>

          <Text fw={700} mb="xs">Servicios Activos</Text>
          <Card withBorder radius="md" padding="sm">
            <Group gap="xs">
              {catalogs.services.map(s => (
                <Badge key={s.id} variant="light" color="gray">{s.name}</Badge>
              ))}
            </Group>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, Text, Group, Button, Divider, Center, Loader } from '@mantine/core';
import { IconPlus, IconTag, IconCalendarTime, IconLock } from '@tabler/icons-react';
import { apiCall } from '../api';

interface CompanyCourt {
  id: string;
  name: string;
  sport: string;
  basePrice: number;
}

export function CompanyCourtsView() {
  const [courts, setCourts] = useState<CompanyCourt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await apiCall('/business/courts');
        if (res.status) {
          // El API devuelve 'regularPrice', lo mapeamos a 'basePrice'
          const mapped = res.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            sport: c.sport,
            basePrice: c.regularPrice
          }));
          setCourts(mapped);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourts();
  }, []);

  if (loading) {
    return <Center p="xl"><Loader color="dark" /></Center>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl">Gestión de Canchas</Text>
      <Text c="dimmed" size="sm" mb="xl">
        Administra tarifas, horarios y bloqueos por mantenimiento.
      </Text>

      <Button fullWidth leftSection={<IconPlus size={20} />} color="dark" size="md" mb="xl">
        NUEVA CANCHA
      </Button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {courts.map(court => (
          <Card key={court.id} padding="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start" mb="sm">
              <div>
                <Text fw={800} size="lg">{court.name}</Text>
                <Text size="sm" c="dimmed">{court.sport}</Text>
              </div>
              <Text fw={800} size="xl" c="dark">S/. {court.basePrice} <Text span size="sm" c="dimmed">/ hr</Text></Text>
            </Group>

            <Divider my="sm" />

            <Group grow gap="xs">
              <Button variant="light" color="dark" leftSection={<IconTag size={16} />}>
                TARIFA
              </Button>
              <Button variant="light" color="dark" leftSection={<IconCalendarTime size={16} />}>
                HORARIO
              </Button>
              <Button variant="filled" color="red" leftSection={<IconLock size={16} />}>
                BLOQUEAR
              </Button>
            </Group>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Box, Title, Text, Card, Group, Button } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownLeft } from '@tabler/icons-react';

export function WalletView() {
  return (
    <Box p="md">
      <Title order={2} mb="md">Mi Billetera</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-filled)', color: 'white' }}>
        <Text size="sm" fw={500} style={{ opacity: 0.8 }}>Saldo Disponible</Text>
        <Title order={1}>S/ 45.00</Title>
        <Text size="xs" mt="sm">Retenido en partidas abiertas: S/ 0.00</Text>
      </Card>
      
      <Group grow mt="md">
        <Button variant="light" leftSection={<IconArrowDownLeft size={16} />}>Recargar</Button>
        <Button variant="light" color="gray" leftSection={<IconArrowUpRight size={16} />}>Retirar</Button>
      </Group>

      <Title order={4} mt="xl" mb="md">Últimos Movimientos</Title>
      <Text c="dimmed" size="sm" ta="center" mt="xl">No hay movimientos recientes.</Text>
    </Box>
  );
}

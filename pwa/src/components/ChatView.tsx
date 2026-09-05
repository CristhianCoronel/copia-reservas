import { Box, Title, Text, Group, Avatar } from '@mantine/core';

export function ChatView() {
  return (
    <Box p="md">
      <Title order={2} mb="md">Chats</Title>
      <Text c="dimmed" size="sm" mb="xl">Centro de notificaciones y acciones.</Text>
      
      <Group wrap="nowrap" mb="md" style={{ cursor: 'pointer' }}>
        <Avatar color="blue" radius="xl">S</Avatar>
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={700}>Sede Triple Doble</Text>
          <Text size="xs" c="dimmed" truncate>Por favor envía el comprobante de...</Text>
        </div>
      </Group>
    </Box>
  );
}

import { Box, Title, Text, Group, Avatar, Badge, ActionIcon, ScrollArea, TextInput, Card, Button, Center, Divider } from '@mantine/core';
import { IconChevronLeft, IconSend, IconPaperclip, IconCheck, IconX, IconReceipt, IconCalendarEvent } from '@tabler/icons-react';

interface ChatViewProps {
  activeChat: string | null;
  setActiveChat: (chat: string | null) => void;
}

export function ChatView({ activeChat, setActiveChat }: ChatViewProps) {
  if (activeChat) {
    return (
      <Box style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
        {/* Header del Chat Interno */}
        <Group wrap="nowrap" mb={0} align="center" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', padding: '16px 16px 12px 16px' }}>
          <ActionIcon variant="subtle" color="dark" onClick={() => setActiveChat(null)}>
            <IconChevronLeft size={20} />
          </ActionIcon>
          <Avatar color={activeChat.includes('Sede') ? 'blue' : 'dark'} radius="xl" size="sm">
            {activeChat.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={800}>{activeChat}</Text>
          </div>
        </Group>

        {/* Historial de Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Objeto Interactivo: RESERVA (Enviado por la Sede) */}
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%', width: '100%' }}>
              <Text size="xs" c="dimmed" mb={4}>{activeChat} • 18:29</Text>
              <Card withBorder radius="md" padding="sm" shadow="sm">
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Avatar color="blue" radius="sm"><IconCalendarEvent size={20} /></Avatar>
                    <div>
                      <Text size="sm" fw={800}>Reserva Generada</Text>
                      <Text size="xs" c="dimmed">Cancha 1 (Techada)</Text>
                    </div>
                  </Group>
                  <Badge color="orange" variant="light">PENDIENTE</Badge>
                </Group>
                
                <Divider my="xs" />
                
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" fw={700}>Sábado 6 Sep, 18:00</Text>
                    <Text size="xs" c="dimmed">Total: S/. 120.00</Text>
                  </div>
                  <Button size="xs" color="dark" variant="light">Ver Detalle</Button>
                </Group>
              </Card>
            </div>

            {/* Mensaje de texto normal (Sede) */}
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <Text size="xs" c="dimmed" mb={4}>{activeChat} • 18:30</Text>
              <Box bg="light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-6))" p="sm" style={{ borderRadius: '0 12px 12px 12px' }}>
                <Text size="sm">Hola, por favor envía el comprobante de pago para confirmar tu reserva de hoy a las 8pm.</Text>
              </Box>
            </div>

            {/* Mensaje de texto normal (Usuario) */}
            <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
              <Text size="xs" c="dimmed" mb={4} ta="right">Tú • 18:31</Text>
              <Box bg="dark" c="white" p="sm" style={{ borderRadius: '12px 0 12px 12px' }}>
                <Text size="sm">¡Claro! Aquí lo tienes.</Text>
              </Box>
            </div>

            {/* Objeto Interactivo: COMPROBANTE_PAGO (Enviado por el Usuario) */}
            <div style={{ alignSelf: 'flex-end', maxWidth: '85%', width: '100%' }}>
              <Text size="xs" c="dimmed" mb={4} ta="right">Tú • 18:32</Text>
              <Card withBorder radius="md" padding="sm" shadow="sm">
                <Group wrap="nowrap" mb="sm">
                  <Avatar color="teal" radius="sm"><IconReceipt size={20} /></Avatar>
                  <div>
                    <Text size="sm" fw={800}>Comprobante de Pago</Text>
                    <Text size="xs" c="dimmed">Yape • S/. 120.00</Text>
                  </div>
                </Group>
                <div style={{ height: 100, backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text size="xs" c="dimmed">[Imagen del Comprobante]</Text>
                </div>
                <Badge color="orange" variant="light" fullWidth mt="sm">EN REVISIÓN</Badge>
              </Card>
            </div>
            
            {/* Objeto Interactivo: INVITACION (Ejemplo adicional) */}
             <Center my="lg">
                <Text size="xs" c="dimmed">-- Ejemplo de Objeto Interactivo: Invitación --</Text>
             </Center>
             <div style={{ alignSelf: 'flex-start', maxWidth: '85%', width: '100%' }}>
              <Card withBorder radius="md" padding="sm" shadow="sm">
                <Text size="sm" fw={800} mb={4}>Invitación a Equipo</Text>
                <Text size="xs" c="dimmed" mb="md">Te he invitado a unirte a mi equipo "Los Galácticos FC". ¡Anímate!</Text>
                <Group grow>
                  <Button size="xs" color="gray" variant="light" leftSection={<IconX size={14} />}>Rechazar</Button>
                  <Button size="xs" color="dark" leftSection={<IconCheck size={14} />}>Aceptar</Button>
                </Group>
              </Card>
            </div>

          </div>
        </div>

        {/* Input Area */}
        <Group wrap="nowrap" align="flex-end" style={{ padding: '0 16px 16px 16px' }}>
          <ActionIcon size={36} variant="light" color="gray">
            <IconPaperclip size={20} />
          </ActionIcon>
          <TextInput 
            placeholder="Escribe un mensaje..." 
            style={{ flex: 1 }} 
          />
          <ActionIcon size={36} color="dark" variant="filled">
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </Box>
    );
  }

  return (
    <Box pt="sm">
      <Group wrap="nowrap" mb="lg" style={{ cursor: 'pointer' }} onClick={() => setActiveChat('Sede Triple Doble')}>
        <Avatar color="blue" radius="xl">S</Avatar>
        <div style={{ flex: 1 }}>
          <Group justify="space-between" mb={2}>
            <Text size="sm" fw={700}>Sede Triple Doble</Text>
            <Text size="xs" c="dimmed">18:32</Text>
          </Group>
          <Text size="xs" c="dimmed" truncate>Por favor envía el comprobante de pago.</Text>
        </div>
      </Group>

      <Group wrap="nowrap" mb="lg" style={{ cursor: 'pointer' }} onClick={() => setActiveChat('Mario Vargas')}>
        <Avatar color="dark" radius="xl">M</Avatar>
        <div style={{ flex: 1 }}>
          <Group justify="space-between" mb={2}>
            <Text size="sm" fw={800}>Mario Vargas</Text>
            <Group gap={6}>
              <Badge color="red" variant="filled" size="xs" circle>1</Badge>
              <Text size="xs" fw={800} c="dark">Ayer</Text>
            </Group>
          </Group>
          <Text size="xs" fw={700} truncate>Te he invitado a unirte a "Los Galácticos FC".</Text>
        </div>
      </Group>

      <Group wrap="nowrap" mb="lg" style={{ cursor: 'pointer' }} onClick={() => setActiveChat('Soporte Separa Altoke')}>
        <Avatar color="orange" radius="xl">SA</Avatar>
        <div style={{ flex: 1 }}>
          <Group justify="space-between" mb={2}>
            <Text size="sm" fw={700}>Soporte Separa Altoke</Text>
            <Text size="xs" c="dimmed">Lun</Text>
          </Group>
          <Text size="xs" c="dimmed" truncate>Tu cuenta ha sido verificada correctamente.</Text>
        </div>
      </Group>
    </Box>
  );
}

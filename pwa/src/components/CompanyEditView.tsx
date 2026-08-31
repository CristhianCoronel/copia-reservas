import { Card, Text, Group, Button, TextInput, ActionIcon } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export function CompanyEditView() {
  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl">Perfil de la Empresa</Text>
      <Text c="dimmed" size="sm" mb="xl">
        Actualiza la información visible para los jugadores.
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <TextInput 
          label={<Text size="xs" fw={700} c="tocaTeal" style={{ letterSpacing: 1 }}>NOMBRE DEL LOCAL</Text>}
          defaultValue="Canchas Toca Revancha Norte"
        />
        <TextInput 
          label={<Text size="xs" fw={700} c="tocaTeal" style={{ letterSpacing: 1 }}>DIRECCIÓN</Text>}
          defaultValue="Av. Principal 1234, Ciudad"
        />
        <TextInput 
          label={<Text size="xs" fw={700} c="tocaTeal" style={{ letterSpacing: 1 }}>TELÉFONO DE CONTACTO</Text>}
          defaultValue="+1 234 567 8900"
        />
      </div>

      <div style={{ marginBottom: 32 }}>
        <Group justify="space-between" align="center" mb="md">
          <Text fw={800} size="lg">Promociones Activas</Text>
          <Button size="xs" color="tocaTeal" variant="light" leftSection={<IconPlus size={14} />}>
            NUEVA
          </Button>
        </Group>

        <Card padding="md" radius="md" withBorder>
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text fw={800} size="md">20% Dcto. Horario Valle</Text>
              <Text size="sm" c="dimmed">Lunes a Viernes de 8am a 4pm.</Text>
            </div>
            <ActionIcon color="red" variant="subtle" size="lg">
              <IconTrash size={20} />
            </ActionIcon>
          </Group>
        </Card>
      </div>

      <Button fullWidth size="lg" color="tocaOrange">
        GUARDAR CAMBIOS
      </Button>
    </div>
  );
}

import { useState } from 'react';
import { Card, Text, Group, Button, TextInput, ActionIcon, Tabs, Select, Switch, Alert, Badge, Table, NumberInput, Textarea } from '@mantine/core';
import { IconPlus, IconTrash, IconBuildingStore, IconSettings, IconUsers, IconLock, IconCheck, IconCrown } from '@tabler/icons-react';

export function CompanyEditView() {
  const [activeTab, setActiveTab] = useState<string | null>('datos');
  const [activeSede, setActiveSede] = useState<string | null>('sede-1');
  
  // ::!todo!::Conectar con API real
  const isPremium = false;

  return (
    <div style={{ padding: 16 }}>
      <Group justify="space-between" align="center" mb="md">
        <div>
          <Text fw={800} size="xl">Gestión de Sede</Text>
          <Text c="dimmed" size="sm">Administra la información, reglas y tu personal.</Text>
        </div>
        {!isPremium && <Badge color="orange" variant="light" leftSection={<IconCrown size={12} />}>Freemium</Badge>}
      </Group>

      <Select
        label="Sede Activa"
        value={activeSede}
        onChange={setActiveSede}
        data={[
          { value: 'sede-1', label: 'Triple Doble - Sede Los Olivos' },
          { value: 'sede-2', label: 'Triple Doble - Sede Surco (Próximamente)' }
        ]}
        mb="xl"
      />

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List>
          <Tabs.Tab value="datos" leftSection={<IconBuildingStore size={16} />}>
            General
          </Tabs.Tab>
          <Tabs.Tab value="reglas" leftSection={<IconSettings size={16} />}>
            Reglas
          </Tabs.Tab>
          <Tabs.Tab value="personal" leftSection={<IconUsers size={16} />}>
            Personal
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="datos" pt="md">
          <Card withBorder padding="md" radius="md">
            <TextInput label="Nombre del Local" defaultValue="Sede Los Olivos" mb="md" />
            <TextInput label="Dirección Física" defaultValue="Av. Palmeras 1234" mb="md" />
            <TextInput label="Teléfono de Recepción" defaultValue="987654321" mb="md" />
            
            <TextInput 
              label="URL de Google Maps" 
              placeholder="https://maps.google.com/..." 
              mb="md"
              disabled={!isPremium}
              description={!isPremium ? "Beneficio exclusivo de Cuenta Premium" : ""}
            />

            <Text size="sm" fw={700} mt="xl" mb="xs">Servicios Incluidos</Text>
            <Group gap="sm" mb="xl">
              <Switch label="Estacionamiento" defaultChecked />
              <Switch label="Duchas con agua caliente" defaultChecked />
              <Switch label="Kiosko / Bebidas" defaultChecked />
              <Switch label="Wi-Fi Gratuito" />
            </Group>

            <Button fullWidth color="dark">Guardar Cambios</Button>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="reglas" pt="md">
          <Card withBorder padding="md" radius="md" mb="md">
            <Text fw={800} size="md" mb="md">Configuración de Pagos en Reservas</Text>
            
            <Group grow align="flex-start" mb="md">
              <NumberInput 
                label="Adelanto Requerido (%)" 
                defaultValue={20} 
                min={0} 
                max={100} 
                description="Porcentaje que el cliente debe pagar para confirmar el turno."
              />
              <NumberInput 
                label="Tiempo de Espera (min)" 
                defaultValue={15} 
                min={5} 
                max={1440}
                description="Minutos antes de liberar la cancha si no se envía voucher."
              />
            </Group>
          </Card>

          <Card withBorder padding="md" radius="md">
            <Text fw={800} size="md" mb="xs">Políticas de la Sede</Text>
            <Textarea 
              label="Política de Cancelación" 
              defaultValue="Se aceptan cancelaciones sin penalidad hasta 24 horas antes del partido. De lo contrario, se retiene el adelanto."
              minRows={3}
              mb="md"
            />
            <Textarea 
              label="Reglas Internas" 
              defaultValue="1. Prohibido chimpunes de metal.\n2. No se venden bebidas alcohólicas a menores."
              minRows={3}
              mb="md"
            />
            <Button fullWidth color="dark">Actualizar Reglas</Button>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="personal" pt="md">
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
                <Button size="xs" color="dark" leftSection={<IconPlus size={14} />}>
                  Añadir Trabajador
                </Button>
              </Group>

              <Card withBorder padding="0" radius="md" style={{ overflow: 'hidden' }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Username</Table.Th>
                      <Table.Th>Rol</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>@mbenitez</Table.Td>
                      <Table.Td><Badge color="blue" variant="light">RECEPCIONISTA</Badge></Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <ActionIcon color="red" variant="subtle"><IconTrash size={16} /></ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>@admin_general</Table.Td>
                      <Table.Td><Badge color="dark" variant="light">ADMINISTRADOR</Badge></Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <IconCheck size={16} color="green" />
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Card>
            </>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

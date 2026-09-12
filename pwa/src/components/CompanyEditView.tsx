import { useState } from 'react';
import { Card, Text, Group, Button, TextInput, ActionIcon, Tabs, Select, Switch, Alert, Badge, Table, NumberInput, Textarea } from '@mantine/core';
import { IconPlus, IconTrash, IconBuildingStore, IconSettings, IconUsers, IconLock, IconCheck, IconCrown, IconMapPin } from '@tabler/icons-react';

export function CompanyEditView() {
  const [activeTab, setActiveTab] = useState<string | null>('empresa');
  const [activeSede, setActiveSede] = useState<string | null>('sede-1');
  const [isSingleSede, setIsSingleSede] = useState(true);
  const [serviciosSede, setServiciosSede] = useState<{id: string, nombre: string}[]>([
    { id: '1', nombre: 'Estacionamiento' }
  ]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  
  // ::!todo!::Conectar con API real
  const isPremium = false;

  return (
    <div style={{ padding: 16 }}>
      <Group justify="space-between" align="center" mb="md">
        <div>
          <Text fw={800} size="xl">Gestión de Empresa y Sede</Text>
          <Text c="dimmed" size="sm">Administra la información, reglas y tu personal.</Text>
        </div>
        {!isPremium && <Badge color="orange" variant="light" leftSection={<IconCrown size={12} />}>Freemium</Badge>}
      </Group>

      {!isSingleSede && (
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
      )}

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List>
          <Tabs.Tab value="empresa" leftSection={<IconBuildingStore size={16} />}>Empresa</Tabs.Tab>
          <Tabs.Tab value="datos" leftSection={<IconMapPin size={16} />}>Sede Local</Tabs.Tab>
          <Tabs.Tab value="reglas" leftSection={<IconSettings size={16} />}>Reglas</Tabs.Tab>
          <Tabs.Tab value="personal" leftSection={<IconUsers size={16} />}>Personal</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="empresa" pt="md">
          <Card withBorder padding="md" radius="md" mb="md">
            <Group justify="space-between" align="center" mb="md">
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
              defaultValue="Se aceptan cancelaciones sin penalidad hasta 24 horas antes del partido. De lo contrario, se retiene el adelanto."
              minRows={3}
              mb="md"
            />
            <Textarea 
              label="Términos y Condiciones" 
              defaultValue="1. El local no se responsabiliza por pérdida de objetos personales.\n2. Todo jugador acepta el riesgo deportivo al ingresar."
              minRows={3}
              mb="md"
            />
            <Button fullWidth color="dark">Guardar Políticas</Button>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="datos" pt="md">
          <Card withBorder padding="md" radius="md">
            <TextInput label="Nombre del Local (Sede)" defaultValue="Sede Los Olivos" mb="md" />
            <TextInput label="Dirección Física" defaultValue="Av. Palmeras 1234" mb="md" />
            <TextInput label="Referencia de Llegada" placeholder="Ej: Frente al parque central..." mb="md" />
            
            <Group grow mb="md">
              <TextInput label="Teléfono de Recepción" defaultValue="987654321" />
              <TextInput label="Email de Contacto" placeholder="Sede opcional" />
            </Group>
            
            <TextInput 
              label="URL de Google Maps" 
              placeholder="https://maps.google.com/..." 
              mb="md"
              disabled={!isPremium}
              description={!isPremium ? "Beneficio exclusivo de Cuenta Premium" : ""}
            />

            <Text size="sm" fw={700} mt="xl" mb="xs">Servicios Incluidos en Sede</Text>
            
            <Group align="flex-end" mb="md">
              <Select 
                style={{ flex: 1 }}
                placeholder="Seleccionar servicio para agregar..." 
                data={[
                  { value: '2', label: 'Duchas con agua caliente' },
                  { value: '3', label: 'Kiosko / Bebidas' },
                  { value: '4', label: 'Wi-Fi Gratuito' }
                ]}
                value={servicioSeleccionado}
                onChange={setServicioSeleccionado}
              />
              <Button onClick={() => setServicioSeleccionado(null)} disabled={!servicioSeleccionado}>Añadir</Button>
            </Group>

            <Table striped withTableBorder mb="xl">
              <Table.Tbody>
                {serviciosSede.map(s => (
                  <Table.Tr key={s.id}>
                    <Table.Td>{s.nombre}</Table.Td>
                    <Table.Td w={50}>
                      <ActionIcon color="red" variant="subtle"><IconTrash size={16}/></ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {serviciosSede.length === 0 && (
                  <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" size="sm" ta="center">No hay servicios agregados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            <Button fullWidth color="dark">Guardar Sede</Button>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="reglas" pt="md">
          <Card withBorder padding="md" radius="md" mb="md">
            <Text fw={800} size="md" mb="md">Configuración Operativa (Por Sede)</Text>
            
            <Group grow align="flex-start" mb="md">
              <Select 
                label="Tipo de Adelanto Requerido" 
                defaultValue="PORCENTAJE"
                data={[
                  { value: 'PORCENTAJE', label: 'Porcentaje (%)' },
                  { value: 'MONTO_FIJO', label: 'Monto Fijo (S/.)' },
                  { value: 'NINGUNO', label: 'Ninguno (Reserva Directa)' }
                ]}
              />
              <NumberInput 
                label="Valor del Adelanto" 
                defaultValue={20} 
                min={0} 
                description="Monto o % requerido para confirmar el turno."
              />
            </Group>
            
            <Group grow align="flex-start" mb="md">
              <NumberInput 
                label="Tiempo de Espera (min)" 
                defaultValue={15} 
                min={5} 
                description="Minutos antes de liberar la cancha si no se envía voucher."
              />
              <NumberInput 
                label="Límite Horas Continuas" 
                defaultValue={2} 
                min={1} 
                description="Máximo de horas seguidas por cliente."
              />
            </Group>
            
            <NumberInput 
              label="Límite de Cancelación (hrs)" 
              defaultValue={24} 
              min={0} 
              mb="md"
              description="Horas previas mínimas para cancelar sin penalidad."
            />
            
            <Button fullWidth color="dark">Actualizar Reglas de Sede</Button>
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

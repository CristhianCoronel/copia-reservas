import { useState } from 'react';
import { Card, Text, TextInput, Button, Group, Center, Loader, Alert } from '@mantine/core';
import { IconBuilding, IconCheck, IconBuildingSkyscraper, IconUser } from '@tabler/icons-react';
import { apiCall } from '../api';

export function CompanyRegistrationView() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    ruc: '',
    commercialName: '',
    legalName: ''
  });

  const handleRegister = async () => {
    if (!form.ruc || !form.commercialName) {
      alert("Comienza por llenar los datos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiCall('/system/companies/register', 'POST', form);
      if (res.status) {
        setSuccess(true);
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al registrar la empresa.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Center p="xl" style={{ flexDirection: 'column', gap: 16, textAlign: 'center', height: '100%' }}>
        <IconCheck size={64} color="#10B981" />
        <Text fw={800} size="xl">¡Solicitud Enviada!</Text>
        <Text c="dimmed">Tu empresa ha sido registrada. Nuestro equipo la revisará y se contactará contigo para activarla en Separa Altoke.</Text>
      </Center>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl" mb="md">Registra tu Complejo Deportivo</Text>
      <Text c="dimmed" size="sm" mb="xl">
        Únete a Separa Altoke como aliado B2B y comienza a recibir reservas directamente en tu local.
      </Text>

      <Card withBorder padding="md" radius="md">
        <Text fw={700} mb="sm"><IconBuildingSkyscraper size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Datos de la Empresa</Text>
        
        <TextInput 
          label="RUC" 
          placeholder="Ej: 20123456789" 
          mb="md" 
          value={form.ruc}
          onChange={(e) => setForm({...form, ruc: e.currentTarget.value})}
        />
        
        <TextInput 
          label="Razón Social" 
          placeholder="Nombre legal completo" 
          mb="md"
          value={form.legalName}
          onChange={(e) => setForm({...form, legalName: e.currentTarget.value})}
        />

        <TextInput 
          label="Nombre Comercial" 
          placeholder="Nombre del complejo" 
          mb="xl"
          value={form.commercialName}
          onChange={(e) => setForm({...form, commercialName: e.currentTarget.value})}
        />

        <Alert title="Atención" color="blue" mb="md">
          Al registrar la empresa, se enviará a evaluación y tú quedarás como administrador principal.
        </Alert>

        <Button fullWidth color="dark" onClick={handleRegister} loading={loading}>
          Enviar Solicitud
        </Button>
      </Card>
    </div>
  );
}

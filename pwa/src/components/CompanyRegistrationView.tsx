import { useState } from 'react';
import { Card, Text, TextInput, Button, Group, Center, Alert } from '@mantine/core';
import { IconBuildingSkyscraper, IconCheck, IconPhone, IconShieldLock } from '@tabler/icons-react';
import { apiCall } from '../api';

export function CompanyRegistrationView() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // ::!todo!::Validar usuario real
  const [isUserPhoneVerified, setIsUserPhoneVerified] = useState(false);

  const [form, setForm] = useState({
    ruc: '',
    commercialName: '',
    legalName: '',
    phone: ''
  });

  const handleRegister = async () => {
    if (!form.ruc || !form.commercialName || !form.phone) {
      alert("Comienza por llenar los datos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiCall('/api/v1/b2b/empresas', 'POST', {
        ...form,
        creada_por_persona_id: "pe2a3b5c7-1234-4a5b-6c7d-8e9f0a1b2c3d" // ::!todo!::Usar ID de usuario real
      });
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
        <Text c="dimmed">
          Tu empresa ha sido registrada y se encuentra en estado <b>PENDIENTE</b>. Nuestro equipo verificará los datos corporativos para evitar suplantaciones y se contactará contigo.
        </Text>
        <Button variant="light" color="dark" mt="md" onClick={() => setSuccess(false)}>
          Registrar otra empresa
        </Button>
      </Center>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Text fw={800} size="xl" mb="md">Registra tu Empresa B2B</Text>
      <Text c="dimmed" size="sm" mb="xl">
        Únete a Separa Altoke como aliado y comienza a recibir reservas directamente en tu local.
      </Text>

      {!isUserPhoneVerified && (
        <Alert 
          icon={<IconShieldLock size={20} />} 
          title="Verificación Requerida" 
          color="red" 
          variant="filled" 
          mb="xl"
          styles={{ title: { fontWeight: 800 } }}
        >
          <Text size="sm" mb="sm">
            Para registrar y administrar una empresa, tu cuenta personal debe tener un número de teléfono verificado mediante SMS por seguridad.
          </Text>
          <Button color="white" c="red" size="xs" onClick={() => setIsUserPhoneVerified(true)}>
            [Simular Verificación Telefónica]
          </Button>
        </Alert>
      )}

      <Card withBorder padding="md" radius="md" style={{ opacity: isUserPhoneVerified ? 1 : 0.5, pointerEvents: isUserPhoneVerified ? 'auto' : 'none' }}>
        <Text fw={700} mb="md"><IconBuildingSkyscraper size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Datos de la Empresa</Text>
        
        <TextInput 
          label="RUC (Registro Único de Contribuyentes)" 
          placeholder="Ej: 20123456789" 
          mb="md" 
          required
          value={form.ruc}
          onChange={(e) => setForm({...form, ruc: e.currentTarget.value})}
        />
        
        <TextInput 
          label="Razón Social" 
          placeholder="Nombre legal completo inscrito en SUNAT" 
          mb="md"
          required
          value={form.legalName}
          onChange={(e) => setForm({...form, legalName: e.currentTarget.value})}
        />

        <TextInput 
          label="Nombre Comercial" 
          placeholder="Nombre público del complejo deportivo" 
          mb="md"
          required
          value={form.commercialName}
          onChange={(e) => setForm({...form, commercialName: e.currentTarget.value})}
        />

        <TextInput 
          label="Teléfono de Contacto" 
          placeholder="Teléfono comercial de la empresa" 
          mb="xl"
          leftSection={<IconPhone size={16} />}
          required
          value={form.phone}
          onChange={(e) => setForm({...form, phone: e.currentTarget.value})}
        />

        <Alert title="Contrato Administrativo" color="blue" variant="light" mb="xl">
          <Text size="sm">
            Al registrar la empresa, el sistema te asignará automáticamente un contrato de <b>ADMINISTRADOR (ADMIN_EMPRESA)</b> vinculado a tu cuenta personal. Las empresas no inician sesión directamente.
          </Text>
        </Alert>

        <Button fullWidth color="dark" onClick={handleRegister} loading={loading} disabled={!isUserPhoneVerified}>
          Enviar Solicitud de Registro
        </Button>
      </Card>
    </div>
  );
}

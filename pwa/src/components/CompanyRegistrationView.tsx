import { useState } from 'react';
import { Card, Text, TextInput, Button, Group, Center, Alert, ActionIcon } from '@mantine/core';
import { IconBuildingSkyscraper, IconCheck, IconPhone, IconShieldLock, IconArrowLeft } from '@tabler/icons-react';
import { apiCall } from '../api';

interface CompanyRegistrationProps {
  onNavigate?: (tab: string) => void;
}

export function CompanyRegistrationView({ onNavigate }: CompanyRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // ::!todo!::Validar usuario real
  const [isUserPhoneVerified, setIsUserPhoneVerified] = useState(false);

  const [form, setForm] = useState({
    ruc: '',
    commercialName: '',
    legalName: '',
    phone: '',
    email: ''
  });

  const handleRegister = async () => {
    setErrorMsg(null);
    if (!form.ruc || !form.commercialName || !form.phone || !form.email) {
      setErrorMsg("Comienza por llenar los datos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const accRes = await apiCall('/api/v1/player/profile/me/accounts');
      const userId = accRes?.data?.personal?.id || accRes?.personal?.id;

      if (!userId) {
        setErrorMsg("Error: No se pudo obtener tu ID de usuario.");
        setLoading(false);
        return;
      }

      const res = await apiCall('/api/v1/b2b/empresas', 'POST', {
        ruc: form.ruc,
        razon_social: form.legalName,
        nombre_comercial: form.commercialName,
        telefono_contacto: form.phone,
        email_contacto: form.email,
        creada_por_persona_id: userId
      });
      if (res.status !== undefined) {
        alert("¡Solicitud enviada! La empresa está en proceso de aceptación.");
        onNavigate('perfil');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Hubo un error al registrar la empresa.");
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
        {onNavigate && (
          <Button variant="subtle" color="dark" onClick={() => onNavigate('perfil')}>
            Volver a mi perfil
          </Button>
        )}
      </Center>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Group mb="md" align="center">
        {onNavigate && (
          <ActionIcon variant="subtle" color="dark" onClick={() => onNavigate('perfil')}>
            <IconArrowLeft size={20} />
          </ActionIcon>
        )}
        <Text fw={800} size="xl">Registra tu empresa</Text>
      </Group>
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

      {errorMsg && (
        <Alert color="red" variant="light" mb="md" withCloseButton onClose={() => setErrorMsg(null)}>
          <Text size="sm" fw={500}>{errorMsg}</Text>
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
          mb="md"
          leftSection={<IconPhone size={16} />}
          required
          value={form.phone}
          onChange={(e) => setForm({...form, phone: e.currentTarget.value})}
        />

        <TextInput 
          label="Correo de Contacto" 
          placeholder="email@empresa.com" 
          mb="xl"
          required
          value={form.email}
          onChange={(e) => setForm({...form, email: e.currentTarget.value})}
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

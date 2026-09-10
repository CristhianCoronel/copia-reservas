import { useState } from 'react';
import { Box, Title, Text, Card, Group, Button, Modal, FileInput, Image, Divider, Badge } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownLeft, IconUpload, IconReceipt, IconCheck } from '@tabler/icons-react';

export function WalletView() {
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);

  const transactions = [
    { id: 1, type: 'INGRESO', amount: 50.00, concept: 'Recarga de Saldo (Aprobada)', date: '05 Sep 2026, 14:30', status: 'COMPLETADO' },
    { id: 2, type: 'EGRESO', amount: 60.00, concept: 'Pago Reserva (Cancha 1)', date: '03 Sep 2026, 18:00', status: 'COMPLETADO' },
    { id: 3, type: 'INGRESO', amount: 15.00, concept: 'Bono por Referido', date: '01 Sep 2026, 10:15', status: 'COMPLETADO' },
    { id: 4, type: 'INGRESO', amount: 20.00, concept: 'Reembolso (Partida Cancelada)', date: '28 Ago 2026, 21:00', status: 'COMPLETADO' },
  ];

  return (
    <Box p="md">
      <Card 
        shadow="md" 
        padding="xl" 
        radius="lg" 
        withBorder={false} 
        style={{ 
          background: 'linear-gradient(135deg, #025865 0%, #0d9488 100%)', 
          color: 'white',
          boxShadow: '0 8px 24px rgba(2, 88, 101, 0.25)'
        }}
      >
        <Text size="sm" fw={600} style={{ opacity: 0.85 }}>Saldo Disponible</Text>
        <Title order={1} mt={8} style={{ fontSize: 36, letterSpacing: '-0.5px' }}>S/. 45.00</Title>
        
        <Group gap="xs" mt="lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '6px 12px', borderRadius: 20, display: 'inline-flex' }}>
          <Text size="xs" fw={500} style={{ opacity: 0.9 }}>Retenido en partidas:</Text>
          <Text size="xs" fw={800}>S/. 0.00</Text>
        </Group>
      </Card>
      
      <Group grow mt="md">
        <Button 
          color="dark" 
          variant="filled" 
          leftSection={<IconArrowDownLeft size={16} />}
          onClick={() => setRechargeModalOpen(true)}
        >
          Recargar Saldo
        </Button>
      </Group>

      <Title order={4} mt="xl" mb="md">Últimos Movimientos</Title>
      
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {transactions.map((tx) => (
          <Card key={tx.id} padding="sm" radius="md" withBorder>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Box 
                  style={{ 
                    backgroundColor: tx.type === 'INGRESO' ? 'var(--mantine-color-green-light)' : 'var(--mantine-color-red-light)',
                    color: tx.type === 'INGRESO' ? 'var(--mantine-color-green-9)' : 'var(--mantine-color-red-9)',
                    padding: 8,
                    borderRadius: 8,
                    display: 'flex'
                  }}
                >
                  {tx.type === 'INGRESO' ? <IconArrowDownLeft size={20} /> : <IconArrowUpRight size={20} />}
                </Box>
                <div>
                  <Text size="sm" fw={700}>{tx.concept}</Text>
                  <Text size="xs" c="dimmed">{tx.date}</Text>
                </div>
              </Group>
              <Text 
                fw={800} 
                c={tx.type === 'INGRESO' ? 'green.7' : 'dark'}
              >
                {tx.type === 'INGRESO' ? '+' : '-'}S/. {tx.amount.toFixed(2)}
              </Text>
            </Group>
          </Card>
        ))}
      </Box>

      <Modal 
        opened={rechargeModalOpen} 
        onClose={() => {
          setRechargeModalOpen(false);
          setVoucherFile(null);
        }} 
        title={<Text fw={800}>Recargar Monedero</Text>}
        centered
      >
        <Text size="sm" mb="md">
          Para recargar tu saldo virtual, realiza una transferencia a las cuentas de la plataforma y adjunta el comprobante.
        </Text>

        <Card withBorder bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))" mb="md">
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={700}>BCP - SeparaAltoke S.A.C.</Text>
          </Group>
          <Text size="xs">Cuenta Soles: 191-98765432-0-12</Text>
          <Text size="xs">CCI: 002-191-009876543212-55</Text>
          <Divider my="sm" />
          <Text size="xs" fw={700}>Yape / Plin: 999 888 777</Text>
        </Card>

        <FileInput
          label="Comprobante de Pago"
          placeholder="Sube tu imagen o PDF"
          accept="image/png,image/jpeg,application/pdf"
          value={voucherFile}
          onChange={setVoucherFile}
          leftSection={<IconUpload size={16} />}
          mb="md"
        />

        {voucherFile && (
          <Box mb="md" style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--mantine-color-default-border)' }}>
            <Image src={URL.createObjectURL(voucherFile)} height={200} fit="cover" />
          </Box>
        )}

        <Button 
          fullWidth 
          color="dark" 
          disabled={!voucherFile}
          leftSection={<IconCheck size={16} />}
          onClick={() => {
            // ::!todo!::Conectar con API real
            setRechargeModalOpen(false);
            setVoucherFile(null);
          }}
        >
          Enviar para Revisión
        </Button>
      </Modal>

    </Box>
  );
}

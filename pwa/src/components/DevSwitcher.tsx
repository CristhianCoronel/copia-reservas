import { useState, useEffect, useRef } from 'react';
import { ActionIcon, Modal, Card, Text, Group, Badge, ScrollArea, Avatar } from '@mantine/core';
import { IconTool } from '@tabler/icons-react';
import { apiCall } from '../api';
import { storage } from '../storage';

const HARCODED_USERS: Record<string, string> = {
  'admin_altoke': 'admin_altoke-',
  'jespinoza': '321azonipsej-',
  'dueno_chiclayo': 'dueno_chiclayo-',
  'jugador_pro': 'jugador_pro-'
};

interface DevSwitcherProps {
  onLogin?: () => void;
}

export function DevSwitcher({ onLogin }: DevSwitcherProps) {
  const [opened, setOpened] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const isEnabled = import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

  const [position, setPosition] = useState({ bottom: 80, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0, right: 0, bottom: 0 });

  useEffect(() => {
    if (isEnabled && opened) {
      apiCall('/api/v1/auth/dev/users').then(res => {
        if (res && res.data) {
          setUsers(res.data);
        }
      });
    }
  }, [isEnabled, opened]);

  if (!isEnabled) return null;

  const handleLogin = async (username: string) => {
    const password = HARCODED_USERS[username] || `${username}-`;
    try {
      const res = await apiCall('/api/v1/auth/login', 'POST', { email: username, password });
      if (res && res.data && res.data.token) {
        storage.setItem('separaaltokeid', res.data.token);
        // Clear active modes to let it auto-resolve based on role
        storage.removeItem('appMode');
        storage.removeItem('activeCompanyId');
        storage.removeItem('activeVenueId');
        window.dispatchEvent(new Event('DEV_LOGIN_SUCCESS'));
        window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'perfil' }));
        setOpened(false);
      } else {
        alert('Login failed: ' + (res?.message || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Login error');
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY, right: position.right, bottom: position.bottom };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setPosition({ right: startPos.current.right - dx, bottom: startPos.current.bottom - dy });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsDragging(false);
    const el = e.currentTarget;
    el.releasePointerCapture(e.pointerId);
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
      setOpened(true);
    }
  };

  return (
    <>
      <ActionIcon 
        size="xl" 
        radius="xl" 
        color="dark" 
        variant="filled" 
        style={{ position: 'fixed', bottom: position.bottom, right: position.right, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: isDragging ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <IconTool size={24} />
      </ActionIcon>

      <Modal opened={opened} onClose={() => setOpened(false)} title={<Text fw={800} size="lg">Dev Tools - Cambiar Usuario</Text>} centered>
        <Text size="sm" mb="md" c="dimmed">Selecciona un usuario de prueba para iniciar sesión rápidamente.</Text>
        <ScrollArea h={400}>
          {users.map(u => (
            <Card key={u.id} withBorder mb="sm" padding="sm" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => handleLogin(u.username)}>
              <Group wrap="nowrap">
                <Avatar color={u.role === 'ADMIN' ? 'red' : 'blue'} radius="xl">
                  {u.username.substring(0, 2).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text fw={700}>{u.name}</Text>
                  <Text size="xs" c="dimmed">@{u.username} • Clave: {HARCODED_USERS[u.username] || `${u.username}-`}</Text>
                </div>
                <Badge color={u.role === 'ADMIN' ? 'red' : 'blue'}>{u.role}</Badge>
              </Group>
            </Card>
          ))}
        </ScrollArea>
      </Modal>
    </>
  );
}

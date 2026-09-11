import { useState, useEffect } from 'react';
import { Box, Title, Text, Group, Avatar, Badge, ActionIcon, ScrollArea, TextInput, Card, Button, Center, Divider, Loader } from '@mantine/core';
import { IconChevronLeft, IconSend, IconPaperclip, IconCheck, IconX, IconReceipt, IconCalendarEvent, IconMessageCircle } from '@tabler/icons-react';
import { apiCall } from '../api';

interface ChatViewProps {
  activeChat?: any | null;
  setActiveChat?: (chat: any | null) => void;
}

export function ChatView({ activeChat: propsActiveChat, setActiveChat: propsSetActiveChat }: ChatViewProps) {
  const [localActiveChat, setLocalActiveChat] = useState<any | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeChat = propsActiveChat !== undefined ? propsActiveChat : localActiveChat;
  const setActiveChat = propsSetActiveChat !== undefined ? propsSetActiveChat : setLocalActiveChat;

  useEffect(() => {
    async function loadChats() {
      try {
        const res = await apiCall('/api/v1/player/social/chats');
        if (res.status && res.data) {
          setChats(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingChats(false);
      }
    }
    if (!activeChat) {
      loadChats();
    }
  }, [activeChat]);

  useEffect(() => {
    async function loadMessages() {
      if (!activeChat) return;
      setLoadingMessages(true);
      try {
        const res = await apiCall(`/api/v1/player/social/chats/${activeChat.id}/messages`);
        if (res.status && res.data) {
          setMessages(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();
  }, [activeChat]);

  const handleInteract = async (mensajeId: string, action: string) => {
    try {
      const res = await apiCall('/api/v1/player/social/interact', 'POST', { mensaje_id: mensajeId, action });
      if (res.status) {
        // Actualizar el estado local
        setMessages(prev => prev.map(m => {
          if (m.id === mensajeId) {
            return {
              ...m,
              datos_objeto: {
                ...(m.datos_objeto || {}),
                estado: action === 'ACEPTAR' || action === 'APROBAR' ? (action === 'ACEPTAR' ? 'ACEPTADA' : 'APROBADO') : (action === 'RECHAZAR' ? 'RECHAZADA' : 'RECHAZADO')
              }
            };
          }
          return m;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (activeChat) {
    const chatTitle = activeChat.referencia_nombre || (activeChat.tipo_canal === 'EQUIPO' ? 'Equipo' : activeChat.tipo_canal === 'PARTIDA_ABIERTA' ? 'Junta' : 'Chat');

    return (
      <Box style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
        <Group wrap="nowrap" mb={0} align="center" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', padding: '16px 16px 12px 16px' }}>
          <ActionIcon variant="subtle" color="dark" onClick={() => setActiveChat(null)}>
            <IconChevronLeft size={20} />
          </ActionIcon>
          <Avatar color={activeChat.tipo_canal === 'EQUIPO' ? 'blue' : 'dark'} radius="xl" size="sm">
            {chatTitle.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={800}>{chatTitle}</Text>
          </div>
        </Group>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {loadingMessages ? (
            <Center style={{ flex: 1 }}><Loader color="dark" /></Center>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg) => {
                const isMe = msg.remitente_nombre === 'Desconocido' || false; // Necesitaríamos el ID de usuario local, por ahora todos a la izquierda salvo nosotros si lo sabemos. (Asumiremos todos izq por ahora para simplificar o si sabemos que somos nosotros).
                
                const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                if (msg.tipo_mensaje === 'TEXTO') {
                  return (
                    <div key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                      <Text size="xs" c="dimmed" mb={4}>{msg.remitente_nombre} • {time}</Text>
                      <Box bg="light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-6))" p="sm" style={{ borderRadius: '0 12px 12px 12px' }}>
                        <Text size="sm">{msg.contenido_texto}</Text>
                      </Box>
                    </div>
                  );
                }

                if (msg.tipo_mensaje === 'NOTIFICACION_RESERVA') {
                   return (
                     <div key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '85%', width: '100%' }}>
                      <Text size="xs" c="dimmed" mb={4}>{msg.remitente_nombre} • {time}</Text>
                      <Card withBorder radius="md" padding="sm" shadow="sm">
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <Avatar color="blue" radius="sm"><IconCalendarEvent size={20} /></Avatar>
                            <div>
                              <Text size="sm" fw={800}>Reserva Generada</Text>
                              <Text size="xs" c="dimmed">{msg.contenido_texto}</Text>
                            </div>
                          </Group>
                          <Badge color="orange" variant="light">PENDIENTE</Badge>
                        </Group>
                      </Card>
                    </div>
                   );
                }

                if (msg.tipo_mensaje === 'COMPROBANTE_PAGO') {
                   const estado = msg.datos_objeto?.estado || 'EN REVISIÓN';
                   return (
                     <div key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '85%', width: '100%' }}>
                      <Text size="xs" c="dimmed" mb={4}>{msg.remitente_nombre} • {time}</Text>
                      <Card withBorder radius="md" padding="sm" shadow="sm">
                        <Group wrap="nowrap" mb="sm">
                          <Avatar color="teal" radius="sm"><IconReceipt size={20} /></Avatar>
                          <div>
                            <Text size="sm" fw={800}>Comprobante de Pago</Text>
                            <Text size="xs" c="dimmed">{msg.contenido_texto}</Text>
                          </div>
                        </Group>
                        <div style={{ height: 100, backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {msg.datos_objeto?.url ? (
                            <img src={msg.datos_objeto.url} alt="Comprobante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Text size="xs" c="dimmed">[Imagen del Comprobante]</Text>
                          )}
                        </div>
                        {estado === 'EN REVISIÓN' || !estado ? (
                           <Group grow mt="sm">
                             <Button size="xs" color="gray" variant="light" leftSection={<IconX size={14} />} onClick={() => handleInteract(msg.id, 'RECHAZAR')}>Rechazar</Button>
                             <Button size="xs" color="dark" leftSection={<IconCheck size={14} />} onClick={() => handleInteract(msg.id, 'APROBAR')}>Aprobar</Button>
                           </Group>
                        ) : (
                           <Badge color={estado === 'APROBADO' ? 'green' : 'red'} variant="light" fullWidth mt="sm">{estado}</Badge>
                        )}
                      </Card>
                    </div>
                   );
                }

                if (msg.tipo_mensaje === 'INVITACION') {
                  const estado = msg.datos_objeto?.estado || 'PENDIENTE';
                  return (
                    <div key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '85%', width: '100%' }}>
                      <Text size="xs" c="dimmed" mb={4}>{msg.remitente_nombre} • {time}</Text>
                      <Card withBorder radius="md" padding="sm" shadow="sm">
                        <Text size="sm" fw={800} mb={4}>Invitación a Equipo</Text>
                        <Text size="xs" c="dimmed" mb="md">{msg.contenido_texto}</Text>
                        
                        {estado === 'PENDIENTE' ? (
                          <Group grow>
                            <Button size="xs" color="gray" variant="light" leftSection={<IconX size={14} />} onClick={() => handleInteract(msg.id, 'RECHAZAR')}>Rechazar</Button>
                            <Button size="xs" color="dark" leftSection={<IconCheck size={14} />} onClick={() => handleInteract(msg.id, 'ACEPTAR')}>Aceptar</Button>
                          </Group>
                        ) : (
                          <Badge color={estado === 'ACEPTADA' ? 'green' : 'red'} variant="light" fullWidth>{estado}</Badge>
                        )}
                      </Card>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

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
    <Box p={propsActiveChat !== undefined ? 0 : 16}>
      {propsActiveChat === undefined && (
        <Group gap="xs" mb="xl">
          <IconMessageCircle size={24} />
          <Text fw={800} size="xl">Bandeja de Mensajes</Text>
        </Group>
      )}

      {loadingChats ? (
        <Center p="xl"><Loader color="dark" /></Center>
      ) : chats.length === 0 ? (
        <Center p="xl"><Text c="dimmed">No tienes mensajes.</Text></Center>
      ) : (
        chats.map((chat) => {
          const title = chat.referencia_nombre || (chat.tipo_canal === 'EQUIPO' ? 'Equipo' : chat.tipo_canal === 'PARTIDA_ABIERTA' ? 'Junta' : 'Chat');
          const lastMsg = chat.ultimo_mensaje;
          
          return (
            <Group key={chat.id} wrap="nowrap" mb="lg" style={{ cursor: 'pointer' }} onClick={() => setActiveChat(chat)}>
              <Avatar color="dark" radius="xl">{title.charAt(0)}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group justify="space-between" mb={2}>
                  <Text size="sm" fw={800}>{title}</Text>
                  <Group gap={6}>
                    {chat.no_leidos > 0 && <Badge color="red" variant="filled" size="xs" circle>{chat.no_leidos}</Badge>}
                  </Group>
                </Group>
                <Text size="xs" fw={chat.no_leidos > 0 ? 700 : 400} c={chat.no_leidos > 0 ? 'dark' : 'dimmed'} truncate>
                  {lastMsg ? (lastMsg.tipo_mensaje === 'TEXTO' ? lastMsg.contenido_texto : `[${lastMsg.tipo_mensaje}]`) : 'Sin mensajes'}
                </Text>
              </div>
            </Group>
          );
        })
      )}
    </Box>
  );
}

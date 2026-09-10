import { createTheme, virtualColor, colorsTuple } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'altoke',

  autoContrast: true,

  headings: {
    fontFamily: 'Manrope, sans-serif',
    sizes: {
      h1: { fontSize: '2.125rem', lineHeight: '1.2', fontWeight: '800' },
      h2: { fontSize: '1.5625rem', lineHeight: '1.2', fontWeight: '700' },
      h3: { fontSize: '1.1875rem', lineHeight: '1.2', fontWeight: '600' },
    }
  },
  colors: {
    cancha: [
      "#F1FAF5", "#DEF0E6", "#BCE0CE", "#8CC7AA", "#55A883",
      "#2F8A63", "#1F6E4E", "#14573E", "#0A4530", "#003322"
    ],
    altoke: [
      "#FAFFE8", "#F3FFD1", "#E7FFA8", "#D4FF70", "#BFFF33",
      "#AAFF00", "#96CC00", "#86B300", "#698C00", "#4D6600"
    ],
    niebla: [
      "#F4F9EC", "#E7EDDF", "#D3DBC9", "#B7C0AC", "#8D9782",
      "#6B7660", "#4E5847", "#363F30", "#20261C", "#0E0F0A"
    ],
    gray: [
      "#F4F9EC", "#E7EDDF", "#D3DBC9", "#B7C0AC", "#8D9782",
      "#6B7660", "#4E5847", "#363F30", "#20261C", "#0E0F0A"
    ],
    dark: [
      "#F4F9EC",

      "#D3DBC9",

      "#B7C0AC",

      "#6B7660",

      "#363F30",

      "#20261C",

      "#141812",

      "#0E0F0A",

      "#0A0B07",

      "#050503"

    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
        fw: 600,
      }
    },
    Card: {
      defaultProps: {
        radius: 'xl',

      }
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
        fw: 600,
      }
    },
  }
});

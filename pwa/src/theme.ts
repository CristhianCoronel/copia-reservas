import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'dark',
  colors: {},
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        fw: 800,
      }
    }
  }
});

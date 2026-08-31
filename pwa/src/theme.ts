import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'tocaOrange',
  primaryShade: 7,
  colors: {
    tocaOrange: [
      '#fff0e5',
      '#ffdfcb',
      '#ffbf99',
      '#ff9d63',
      '#ff7f36',
      '#ff6b18',
      '#ff5f06',
      '#ee5e00', // Principal index 7
      '#d74800',
      '#be3b00'
    ],
    tocaTeal: [
      '#eefcfb',
      '#dbf4f3',
      '#b3e8e6',
      '#88dcd8',
      '#62d1cc',
      '#4ac9c3',
      '#3bc5be',
      '#025865', // Principal index 7
      '#279c96',
      '#1b8782'
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        fw: 800,
      }
    }
  }
});

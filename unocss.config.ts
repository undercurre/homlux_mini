import { defineConfig } from 'unocss'
import presetWeapp from 'unocss-preset-weapp'
export default defineConfig({
  include: [/\.wxml$/],
  presets: [presetWeapp({})],
  theme: {
    colors: {
      blue: '#488fff',
      black: {
        primary: '#27282A',
        secondary: '#555659',
        tips: '#a2a2a2',
      },
      gray: {
        primary: '#ddd',
        secondary: '#eff0f3',
      },
      red: '#ff3849',
      yellow: '#fbbb32',
      green: '#57d435',
      purple: '#7b5de9',
    },
  },
})

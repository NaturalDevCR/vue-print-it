import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue Print It',
  description: 'Vue 3 browser and bridge printing plugin',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples' },
      { text: 'npm', link: 'https://www.npmjs.com/package/vue-print-it' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Print Options', link: '/guide/options' },
          { text: 'Browser Printing', link: '/guide/browser-printing' },
          { text: 'Bridge Printing', link: '/guide/bridge' },
          { text: 'Framework Setup', link: '/guide/frameworks' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api/' },
          { text: 'Examples', link: '/examples' },
          { text: 'Release Checklist', link: '/release' }
        ]
      }
    ],
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/NaturalDevCR/vue-print-it' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright (c) 2026 NaturalDevCR'
    }
  }
})

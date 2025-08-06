/**
 * Extrae todos los estilos CSS de la página actual
 */
export function extractPageStyles(): string {
  const styles: string[] = [];
  
  // Obtener estilos inline
  const styleElements = document.querySelectorAll('style');
  styleElements.forEach(style => {
    styles.push(style.innerHTML);
  });
  
  // Obtener estilos de hojas de estilo externas
  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
  linkElements.forEach(link => {
    try {
      const sheet = (link as HTMLLinkElement).sheet;
      if (sheet && sheet.cssRules) {
        const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        styles.push(rules);
      }
    } catch (e) {
      // Ignorar errores de CORS para hojas de estilo externas
      console.warn('No se pudieron obtener estilos de:', (link as HTMLLinkElement).href);
    }
  });
  
  return styles.join('\n');
}

/**
 * Agrega estilos CSS a una ventana
 */
export function addStylesToWindow(win: Window, styles: string[]): void {
  styles.forEach(style => {
    if (style.startsWith('http') || style.startsWith('/')) {
      // Es una URL de hoja de estilos
      const link = win.document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');
      link.setAttribute('href', style);
      win.document.head.appendChild(link);
    } else {
      // Es CSS inline
      const styleElement = win.document.createElement('style');
      styleElement.textContent = style;
      win.document.head.appendChild(styleElement);
    }
  });
}

/**
 * Agrega estilos automáticamente extraídos de la página
 */
export function addAutoStyles(win: Window): void {
  const extractedStyles = extractPageStyles();
  if (extractedStyles) {
    const styleElement = win.document.createElement('style');
    styleElement.textContent = extractedStyles;
    win.document.head.appendChild(styleElement);
  }
}
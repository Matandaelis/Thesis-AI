import { PLExtension } from 'paperlib-api/api';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';

// Import React components
import SidebarUI from './ui/SidebarUI';
import DetailsUI from './ui/DetailsUI';
import ToolbarButtonUI from './ui/ToolbarButtonUI';
import DrawerUI from './ui/DrawerUI';
import FloatingPanelUI from './ui/FloatingPanelUI';

class ThesisAIExtension extends PLExtension {
  private roots: Root[] = [];

  constructor() {
    super({
      id: 'thesis-ai-paperlib-ext',
      defaultPreference: {},
    });
  }

  async initialize() {
    // 1. Mount Sidebar UI
    await this.mountReactComponent('sidebar-extension-slot', SidebarUI);

    // 2. Mount Details UI
    await this.mountReactComponent('details-metadata-slot', DetailsUI);

    // 3. Mount Toolbar Button
    await this.mountReactComponent('toolbar-actions-slot', ToolbarButtonUI);

    // 4. Mount Custom Drawer Content
    await this.mountReactComponent('drawer-extension-slot', DrawerUI);

    // 5. Mount Global Floating Panel
    await this.mountReactComponent('global-overlay-slot', FloatingPanelUI);
  }

  async dispose() {
    // Unmount all React roots to prevent memory leaks
    this.roots.forEach((root) => root.unmount());
    this.roots = [];
  }

  /**
   * Helper to mount a React component into a specific Paperlib UI slot.
   * @param slotName The ID of the slot provided by Paperlib.
   * @param Component The React component to render.
   */
  private async mountReactComponent(slotName: string, Component: React.FC) {
    const slot = await (this as any).api.ui.getSlot(slotName);
    
    if (!slot) {
      console.warn(`Slot '${slotName}' not found.`);
      return;
    }

    const container = document.createElement('div');
    container.className = 'react-extension-container';
    container.style.width = '100%';
    container.style.height = '100%';

    // Create React Root
    const root = createRoot(container);
    root.render(React.createElement(Component));
    
    // Store root reference for cleanup
    this.roots.push(root);

    // Mount the DOM node to the Paperlib slot
    slot.mount(container);
  }
}

export default new ThesisAIExtension();

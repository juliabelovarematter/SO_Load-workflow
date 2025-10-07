// --- imports (keep at top of file)
import { driver, type DriveStep, type Config } from "driver.js";
import "driver.js/dist/driver.css";

// --- keys
const STEP_KEY = "loadsTourStep";
const DISMISS_KEY = "loadsTourDismissed";

// --- state flags
let advancing = false;
let tourStarting = false; // Prevent multiple simultaneous tour starts
let currentDriverInstance: any = null;
let tourAborted = false; // Global abort flag

// --- storage helpers
function setStep(step: string) { localStorage.setItem(STEP_KEY, step); }
function getStep(): string { return localStorage.getItem(STEP_KEY) || "1"; }
function isDismissed(): boolean { return localStorage.getItem(DISMISS_KEY) === "true"; }
function markDismissed() { localStorage.setItem(DISMISS_KEY, "true"); }

// --- wait helpers (only keep ONE copy in the file)
function waitForElement(selector: string, timeout = 12000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout waiting for ${selector}`)); }, timeout);
  });
}
async function waitForAny(selectors: string[], per = 8000): Promise<string> {
  for (const s of selectors) if (document.querySelector(s)) return s;
  for (const s of selectors) { try { await waitForElement(s, per); return s; } catch { /* try next */ } }
  throw new Error(`None of selectors resolved: ${selectors.join(", ")}`);
}

// --- selectors for Step 2 + Step 3
const SEL = {
  relatedSoClickTargets: [
    ".ant-select[name='relatedSO'] .ant-select-selector",
    "[data-testid='related-so-select'] .ant-select-selector",
    ".ant-select[data-field='relatedSalesOrder'] .ant-select-selector",
    "div[role='combobox'][aria-controls*='related']",
    "#related-so-select .ant-select-selector",
    ".ant-form-item-control-input .ant-select-selector"
  ],
  materialsTabButton: [
    "div[role='tab']#rc-tabs-3-tab-materials",
    ".ant-tabs-tab-btn:has([data-testid='materials-tab'])",
    ".ant-tabs-tab:has(.ant-tabs-tab-btn span[data-testid='materials-tab'])",
    "[data-testid='materials-tab']" // last-resort label target
  ],
};

// Mark the SO Materials header cell with an attribute for reliable targeting
function markSoMaterialsHeader(): HTMLElement | null {
  const headers = Array.from(document.querySelectorAll('table thead th')) as HTMLElement[];
  for (const th of headers) {
    const text = th.textContent?.trim() || '';
    if (/^SO\s+Materials$/i.test(text)) {
      th.setAttribute('data-so-materials-header', 'true');
      return th;
    }
  }
  return null;
}

async function waitForSoMaterialsHeader(timeout = 1500): Promise<HTMLElement | null> {
  const found = markSoMaterialsHeader();
  if (found) return found;
  return new Promise(resolve => {
    const obs = new MutationObserver(() => {
      const el = markSoMaterialsHeader();
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(markSoMaterialsHeader()); }, timeout);
  });
}

// --- utilities: hide default Driver.js footer buttons (Previous/Done/Next)
function ensureDriverButtonsHiddenCss() {
  const styleId = 'driver-hide-footer-buttons';
  if (document.getElementById(styleId)) return;
  const css = `/* per-step showButtons controls visibility; no global hiding */`;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
}

// --- simple cleanup
function cleanupExistingTour() {
  if (currentDriverInstance) {
    try {
      currentDriverInstance.destroy();
      currentDriverInstance = null;
    } catch (err) {
      console.log('❌ Error cleaning up:', err);
    }
  }
}

// --- common driver config for these steps
function makeDriverConfig(): Config {
  return {
    allowClose: true,  // Enable close button (X)
    showButtons: [],   // No default buttons - per-step buttons will override
    showProgress: false,
    smoothScroll: true,
    stagePadding: 4,
    animate: true,
    onDestroyStarted: () => {
      // If the tour is destroyed because the user skipped/closed (not because of advancing to the next step)
      if (!advancing) {
        console.log('🚫 User dismissed/skipped tour - marking as dismissed');
        localStorage.setItem("loadsTourDismissed", "true");
        // Clear any stored step so nothing resumes accidentally
        localStorage.removeItem(STEP_KEY);
        // Block subsequent steps in this session and persist skip
        tourAborted = true;
        try { if (currentDriverInstance) currentDriverInstance.destroy(); } catch {}
        try { localStorage.setItem('tourSkipped', 'true'); } catch {}
      } else {
        console.log('✅ Tour advancing - not marking as dismissed');
      }
    },
    onDeselected: () => {
      // If aborted, ensure the driver is fully reset/destroyed
      if (tourAborted && currentDriverInstance) {
        try { currentDriverInstance.destroy(); } catch {}
        currentDriverInstance = null;
      }
    },
    onDestroyed: () => {
      console.log('💀 Driver instance completely destroyed!');
      currentDriverInstance = null;
    },
  };
}

/**
 * Step 2: highlight "Related Sales Order #" SELECT — advance on single CLICK
 * - When user clicks the combobox, immediately set step=3, destroy tour, then launch Step 3.
 */
export async function startLoadsTourStep2() {
  if (isDismissed() || tourAborted) return;
  if (getStep() !== "2") return;

  // Clean up any existing tours first
  cleanupExistingTour();

  const clickSel = await waitForAny(SEL.relatedSoClickTargets);
  if (tourAborted) return;
  ensureDriverButtonsHiddenCss();
  const d = driver(makeDriverConfig());
  currentDriverInstance = d; // Track the current instance

  const steps: DriveStep[] = [
    {
      element: clickSel,
      popover: {
        title: "Assign Sales Order",
        description: `<div style="margin-bottom: 12px;">Select the Sales Order which the Load should be assigned to</div><div style="text-align: left;"><a href="#" onclick="window.skipLoadsTour(); return false;" style="text-decoration: underline; color: #1890ff; cursor: pointer;">Skip Tour</a></div>`,
        side: "left",
      },
      onHighlighted: () => {
        // SENIOR ENGINEER SOLUTION: Remove all default buttons for Step 2
        setTimeout(() => {
          const popover = document.querySelector('.driver-popover');
          if (popover) {
            const footer = popover.querySelector('.driver-popover-footer');
            if (footer) {
              footer.remove();
              console.log('✅ Step 2: Removed default buttons (Previous/Done)');
            }
          }
        }, 50);
      },
      onHighlightStarted: (el) => {
        if (!el) return;
        console.log('🎯 Step 2: Successfully highlighted Related SO field');
        console.log('🎯 Element:', el);
        console.log('🎯 Element text:', el.textContent);
        console.log('🎯 Element classes:', el.className);
        
        // Listen to single user click (no 'change' required)
        const onClick = () => {
          console.log('🎯 Step 2: Related SO field clicked!');
          advancing = true;
          setStep("3");
          d.destroy();              // tear down Step 2
          currentDriverInstance = null; // Clear global instance
          
          console.log('✅ Step 2 destroyed, localStorage set to step 3');
          
          // AUTO-START STEP 3 IMMEDIATELY WITH DEBUGGING
          setTimeout(() => {
            console.log('🚀 Auto-starting Step 3...');
            console.log('📋 Checking localStorage before Step 3:', localStorage.getItem('loadsTourStep'));
            
            // Check if Materials tab is visible first
            const materialsTab = document.querySelector('[data-testid="materials-tab"]');
            console.log('📋 Materials tab found:', !!materialsTab);
            
            // Try multiple approaches to start Step 3
            startLoadsTourStep3().catch(error => {
              console.error('❌ Failed to auto-start Step 3:', error);
              console.log('🔄 Retrying Step 3 after 1 second...');
              
              // Retry after 1 second in case DOM wasn't ready
              setTimeout(() => {
                console.log('🔄 Second attempt to start Step 3...');
                startLoadsTourStep3().catch(retryError => {
                  console.error('❌ Second attempt failed:', retryError);
                });
              }, 1000);
            });
          }, 100);
          
          advancing = false;
        };
        el.addEventListener("click", onClick, { once: true });
        // AntD sometimes delegates clicks to the inner selector
        const inner = (el as HTMLElement).querySelector(".ant-select-selector, [role='combobox']");
        if (inner && inner !== el) inner.addEventListener("click", onClick, { once: true });
      },
    },
  ];

  d.setSteps(steps);
  d.drive();
}

/**
 * Step 3: highlight "Materials" tab — advance on CLICK
 */
export async function startLoadsTourStep3() {
  console.log('🎯 StartLoadsTourStep3 called...');
  console.log('📋 Is dismissed:', isDismissed());
  console.log('📋 Current step:', getStep());
  
  if (isDismissed() || tourAborted) {
    console.log('❌ Step 3 cancelled - tour dismissed');
    return;
  }
  if (getStep() !== "3") {
    console.log('❌ Step 3 cancelled - wrong step:', getStep());
    return;
  }

  console.log('✅ Step 3 conditions met, starting...');

  // Clean up any existing tours first
  cleanupExistingTour();

  console.log('🔍 Looking for Materials tab elements...');
  
  const tabSel = await waitForAny(SEL.materialsTabButton);
  console.log('✅ Found Materials tab selector:', tabSel);
  
  if (tourAborted) return;
  ensureDriverButtonsHiddenCss();
  const d = driver(makeDriverConfig());
  currentDriverInstance = d; // Track the current instance

  const steps: DriveStep[] = [
    {
      element: tabSel,
      popover: {
        title: "Load Materials",
        description: `<div style=\"margin-bottom: 12px;\">Click on Materials tab to view & manage Load Materials</div><div style=\"text-align: left;\"><a href=\"#\" onclick=\"window.skipLoadsTour(); return false;\" style=\"text-decoration: underline; color: #1890ff; cursor: pointer;\">Skip Tour</a></div>`,
      },
      onHighlighted: () => {
        // SENIOR ENGINEER SOLUTION: Remove all default buttons for Step 3
        setTimeout(() => {
          const popover = document.querySelector('.driver-popover');
          if (popover) {
            const footer = popover.querySelector('.driver-popover-footer');
            if (footer) {
              footer.remove();
              console.log('✅ Step 3: Removed default buttons (Previous/Done)');
            }
          }
        }, 50);
      },
      onHighlightStarted: (el) => {
        if (!el) return;
        const onClick = () => {
          advancing = true;
          setStep("4");
          try { d.moveNext(); } catch {}
        };
        el.addEventListener("click", onClick, { once: true });
        const btn = (el as HTMLElement).closest('.ant-tabs-tab')?.querySelector('.ant-tabs-tab-btn') as HTMLElement | null;
        if (btn && btn !== el) btn.addEventListener('click', onClick, { once: true });
      },
    },
    {
      element: "div[style*='font-size: 14px'][style*='font-weight: 600'][style*='color: rgb(55, 65, 81)']",
      popover: {
        title: "SO Materials",
        description: "This section displays all Sales Order materials.",
        side: "bottom",
      },
      // showButtons: ['previous', 'next'], // Step 4: Previous + Next
      onHighlighted: () => {
        // Guard against abort
        if (tourAborted || localStorage.getItem('tourSkipped') === 'true') return;
      }
    },
    {
      element: "button.ant-btn-dangerous.ant-btn-icon-only",
      popover: {
        title: "Delete SO Material from the Load",
        description: "After deleting the material it will be removed only from this Load, but kept on the SO.",
        side: "left",
      },
      // showButtons: ['previous', 'next'], // Step 5: show navigation buttons
      onHighlighted: () => {
        if (tourAborted || localStorage.getItem('tourSkipped') === 'true') return;
      }
    },
    {
      element: () => {
        // Find button containing "Add SO Material" text
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.includes('Add SO Material')) {
            return btn;
          }
        }
        return document.body; // Fallback to body if not found
      },
      popover: {
        title: "Add Sales Order Materials",
        description: "If you removed SO materials from the load, you can add them back here",
        side: "top",
      },
      // showButtons: ['previous', 'next'], // Step 6: show navigation buttons
      onHighlighted: () => {
        if (tourAborted || localStorage.getItem('tourSkipped') === 'true') return;
      }
    },
    {
      element: () => {
        // Find button containing "Add Material" text (not "Add SO Material")
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.trim();
          if (text && (text.includes('Add Material') && !text.includes('Add SO Material'))) {
            return btn;
          }
        }
        return document.body; // Fallback to body if not found
      },
      popover: {
        title: "Add Other Materials",
        description: "Here you're able to add other materials, which are not included into the Sales Order.",
        side: "bottom",
      },
      // showButtons: ['previous', 'next'], // Step 7: show navigation buttons
      onHighlighted: () => {
        if (tourAborted || localStorage.getItem('tourSkipped') === 'true') return;
      }
    },
    {
      element: () => {
        // Find "Add to SO" checkbox area - look for label containing "Add to SO"
        const labels = document.querySelectorAll('label');
        for (const label of labels) {
          if (label.textContent?.includes('Add to SO')) {
            // Return the parent container or the label itself for highlighting
            return label.closest('div') || label;
          }
        }
        
        // Fallback: look for checkbox with "Add to SO" in nearby text
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        for (const checkbox of checkboxes) {
          const parent = checkbox.closest('div, label, span');
          if (parent && parent.textContent?.includes('Add to SO')) {
            return parent;
          }
        }
        
        return document.body; // Fallback to body if not found
      },
      popover: {
        title: "Add Material to the SO",
        description: "Check the box \"Add to SO\" if this material should be included into the SO.",
        side: "right",
      },
      // showButtons: ['previous', 'next'], // Step 8: show navigation buttons
      onHighlighted: () => {
        if (tourAborted || localStorage.getItem('tourSkipped') === 'true') return;
      }
    },
    {
      element: () => {
        // Find "Price Unit Weight" toggle - look for label containing "Price Unit Weight"
        const labels = document.querySelectorAll('label');
        for (const label of labels) {
          if (label.textContent?.includes('Price Unit Weight')) {
            // Return the parent container or the label itself for highlighting
            return label.closest('div') || label;
          }
        }
        
        // Fallback: look for switch/toggle with "Price Unit Weight" in nearby text
        const switches = document.querySelectorAll('.ant-switch, input[type="checkbox"]');
        for (const switchEl of switches) {
          const parent = switchEl.closest('div, label, span');
          if (parent && parent.textContent?.includes('Price Unit Weight')) {
            return parent;
          }
        }
        
        // Additional fallback: look for any element containing "Price Unit Weight"
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.textContent?.trim() === 'Price Unit Weight') {
            return el.closest('div, label, span') || el;
          }
        }
        
        return document.body; // Fallback to body if not found
      },
      popover: {
        title: "Price Unit Weight",
        description: "Enable Price Unit Weight to enter material weight in Price Unit. As soon as enabled, weight will be recalculated accordingly.",
        side: "left",
      },
      // showButtons: ['previous', 'next'], // Step 9: show navigation buttons
      onHighlighted: () => {
        if (tourAborted || localStorage.getItem('tourSkipped') === 'true') return;
      }
    },
    {
      element: () => {
        // Find "Stage" toggle - look for label containing "Stage"
        const labels = document.querySelectorAll('label');
        for (const label of labels) {
          if (label.textContent?.includes('Stage')) {
            // Return the parent container or the label itself for highlighting
            return label.closest('div') || label;
          }
        }
        
        // Fallback: look for switch/toggle with "Stage" in nearby text
        const switches = document.querySelectorAll('.ant-switch, input[type="checkbox"]');
        for (const switchEl of switches) {
          const parent = switchEl.closest('div, label, span');
          if (parent && parent.textContent?.includes('Stage')) {
            return parent;
          }
        }
        
        // Additional fallback: look for any element containing "Stage"
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.textContent?.trim() === 'Stage') {
            return el.closest('div, label, span') || el;
          }
        }
        
        return document.body; // Fallback to body if not found
      },
      popover: {
        title: "Stage Materials",
        description: `<div style="margin-bottom: 12px;">To stage Materials, enable this toggle and proceed with weighing the materials. All Materials added from this mode will be marked as staged and can be easily added to the SO with entered weights.</div><div style="text-align: left;"><a href="#" onclick="window.emergencyDismissTour(); return false;" style="text-decoration: underline; color: #1890ff; cursor: pointer;">Skip Tour</a></div>`,
        side: "left",
      },
      // showButtons: ['previous'], // Step 10: show only Previous (no Done button)
      onHighlighted: () => {
        if (tourAborted || localStorage.getItem('tourSkipped') === 'true') return;
        
        console.log('🎯 Step 10 highlighted - creating custom Done button');
        
        // Create custom Done button and add it to the popover
        setTimeout(() => {
          const popover = document.querySelector('.driver-popover');
          if (popover) {
            // Remove ALL existing footers and buttons
            const existingFooters = popover.querySelectorAll('.driver-popover-footer');
            existingFooters.forEach(footer => footer.remove());
            
            // Remove any existing Done buttons
            const existingDoneButtons = popover.querySelectorAll('.driver-done-btn, button:contains("Done")');
            existingDoneButtons.forEach(btn => btn.remove());
            
            // Create custom footer with Done button
            const customFooter = document.createElement('div');
            customFooter.className = 'driver-popover-footer';
            customFooter.style.cssText = `
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 16px;
              border-top: 1px solid #e8e8e8;
              background: #fafafa;
            `;
            
            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '← Previous';
            prevBtn.className = 'driver-prev-btn';
            prevBtn.style.cssText = `
              background: #fff;
              border: 1px solid #d9d9d9;
              border-radius: 6px;
              padding: 6px 15px;
              cursor: pointer;
              font-size: 14px;
            `;
            prevBtn.onclick = () => {
              if (currentDriverInstance) {
                try {
                  currentDriverInstance.movePrevious();
                } catch (err) {
                  console.log('❌ Error moving to previous step:', err);
                }
              }
            };
            
            // Done button
            const doneBtn = document.createElement('button');
            doneBtn.textContent = 'Done';
            doneBtn.className = 'driver-done-btn-custom';
            doneBtn.style.cssText = `
              background: #1890ff;
              color: white;
              border: none;
              border-radius: 6px;
              padding: 6px 15px;
              cursor: pointer;
              font-size: 14px;
            `;
            doneBtn.onclick = () => {
              console.log('🚨 CUSTOM DONE BUTTON CLICKED - DISMISSING TOUR!');
              emergencyDismissTour();
            };
            
            customFooter.appendChild(prevBtn);
            customFooter.appendChild(doneBtn);
            popover.appendChild(customFooter);
            
            console.log('✅ Custom Done button created and added to popover');
          }
        }, 100);
      }
    }
  ];

  d.setSteps(steps);
  d.drive();
}

// --- Step 1 implementation
export async function startLoadsTourStep1() {
  console.log('🚀 Starting Step 1: Load row selection');
  
  // Clean up any existing tours
  if (currentDriverInstance) {
    try {
      currentDriverInstance.destroy();
      currentDriverInstance = null;
    } catch (err) {
      console.log('❌ Error destroying existing tour:', err);
    }
  }
  
  if (isDismissed()) {
    console.log('🔄 Tour was dismissed, skipping');
    return;
  }

  console.log('🔍 Looking for load row element...');
  
  // Wait a moment for DOM to be ready and check for the load row
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Try multiple approaches to find the load row
  let loadRowElement = document.querySelector("[data-testid='load-row']");
  let rowSelector = "[data-testid='load-row']";
  
  if (!loadRowElement) {
    console.log('❌ Load row not found, trying fallback selectors...');
    
    // Try to find first table body row
    const firstRow = document.querySelector('table tbody tr:first-child');
    if (firstRow) {
      console.log('✅ Using first table row as fallback');
      firstRow.setAttribute('data-testid', 'load-row');
      loadRowElement = firstRow;
      rowSelector = "table tbody tr:first-child";
    } else {
      // Try just any first row
      const anyFirstRow = document.querySelector('table tr:first-child');
      if (anyFirstRow) {
        console.log('✅ Using first table row (any) as fallback');
        anyFirstRow.setAttribute('data-testid', 'load-row');
        loadRowElement = anyFirstRow;
        rowSelector = "table tr:first-child";
      } else {
        console.error('❌ No table rows found at all');
        
        // Show what we can find
        const allElements = document.querySelectorAll('tr, [role="row"]');
        console.log('🔍 Available row-like elements:', allElements.length);
        allElements.forEach((el, i) => {
          console.log(`Element ${i}:`, el.tagName, el.className, el.textContent?.trim().substring(0, 30));
        });
        
        return;
      }
    }
  } else {
    console.log('✅ Found load row element with data-testid');
  }

  const config: Config = {
    allowClose: true,
    showButtons: [],
    showProgress: false,
    smoothScroll: true,
    stagePadding: 8,
    animate: true,
    onDestroyStarted: () => {
      console.log('🔚 Step 1 tour being destroyed...');
      if (!advancing) {
        console.log('❌ User dismissed Step 1 - marking as dismissed');
        markDismissed();
      } else {
        console.log('✅ Step 1 completed - advancing to step 2');
      }
    },
    onDestroyed: () => {
      console.log('💀 Step 1 completely destroyed!');
      currentDriverInstance = null;
    },
  };

  const d = driver(config);
  currentDriverInstance = d; // Track the current instance
  console.log('🎯 Step 1 Driver instance created');

  const steps: DriveStep[] = [{
    element: rowSelector,
    popover: {
      title: "Load",
      description: `<div style="margin-bottom: 12px;">Click on the Load row to view & manage Load information</div><div style="text-align: left;"><a href="#" onclick="window.skipLoadsTour(); return false;" style="text-decoration: underline; color: #1890ff; cursor: pointer;">Skip Tour</a></div>`,
    },
    onDeselected: () => {
      // If the user dismissed the tour (via Skip or Close), make sure step is cleared
      if (isDismissed()) {
        console.log('🔒 Step 1 onDeselected - tour dismissed, clearing step');
        localStorage.removeItem(STEP_KEY);
      }
    },
    onHighlighted: () => {
      // SENIOR ENGINEER SOLUTION: Remove all default buttons for Step 1
      setTimeout(() => {
        const popover = document.querySelector('.driver-popover');
        if (popover) {
          const footer = popover.querySelector('.driver-popover-footer');
          if (footer) {
            footer.remove();
            console.log('✅ Step 1: Removed default buttons (Previous/Done)');
          }
        }
      }, 50);
    },
    onHighlightStarted: (el) => {
      if (!el) return;
      console.log('🎯 Load row highlighted - adding click listener...');
      
      // Pre-calc cells so the handler can remove listeners if needed
      const cells = el.querySelectorAll('td');

      const clickHandler = () => {
        // GUARD: If user skipped the tour, ignore any lingering listeners
        if (isDismissed()) {
          console.log('🚫 Tour is dismissed – ignoring row click and removing listeners');
          el.removeEventListener("click", clickHandler as any);
          cells.forEach(cell => cell.removeEventListener("click", clickHandler as any));
          return;
        }
        console.log('🎯 Load row clicked - Step 1 complete!');
        
        advancing = true;
        setStep("2");
        
        // Destroy Step 1 ONLY - do NOT start Step 2 immediately
        d.destroy();
        currentDriverInstance = null;
        advancing = false;
        
        console.log('✅ Step 1 destroyed, localStorage set to step 2');
      };
      
      // Add listener to the row
      el.addEventListener("click", clickHandler, { once: true });
      
      // Also add listeners to all cells in the row
      cells.forEach(cell => {
        cell.addEventListener("click", clickHandler, { once: true });
      });
    },
  }];

  ensureDriverButtonsHiddenCss();
  d.setSteps(steps);
  console.log('🚀 Starting loads tour Step 1...');
  d.drive();
}

/**
 * Public API: Resume Loads Tour from current step
 */
export function resumeLoadsTour(): void {
  if (isDismissed()) return;
  
  const step = getStep();
  switch (step) {
    case "1":
      startLoadsTourStep1();
      break;
    case "2":
      startLoadsTourStep2();
      break;
    case "3":
      startLoadsTourStep3();
      break;
    default:
      console.log('⚠️ No tour trigger - step:', step);
  }
}

/** Skip Tour Function - Kills tour from ANY step */
function skipLoadsTour() {
  console.log('🚫 Tour skipped by user from step:', getStep());
  
  // Set advancing flag to prevent onDestroyStarted from interfering
  advancing = true;
  tourAborted = true;
  
  // Mark tour as dismissed
  localStorage.setItem("loadsTourDismissed", "true");
  try { localStorage.setItem('tourSkipped', 'true'); } catch {}
  
  // Clear the tour step
  localStorage.removeItem("loadsTourStep");
  
  // Destroy current tour if running
  if (currentDriverInstance) {
    try {
      console.log('💀 Destroying driver instance on skip...');
      currentDriverInstance.destroy();
      currentDriverInstance = null;
    } catch (err) {
      console.log('❌ Error destroying tour on skip:', err);
    }
  }
  
  // Reset advancing flag
  advancing = false;
  
  console.log('✅ Tour completely killed - will not auto-start');
}

/** Helper function to restart the tour */
export function restartLoadsTour() {
  console.log('🔄 Restarting loads tour...');
  
  // Clear all tour flags and reset to step 1
  localStorage.removeItem("loadsTourDismissed");
  localStorage.removeItem("tourSkipped");
  localStorage.removeItem("tourCompleted");
  localStorage.setItem("loadsTourStep", "1");
  
  // Start the tour
  startLoadsTour();
}

/** EMERGENCY TOUR DISMISSAL - Global function to force close tour */
function emergencyDismissTour() {
  console.log('🚨 EMERGENCY: Force dismissing tour!');
  
  // Set all dismissal flags
  localStorage.setItem("tourCompleted", "true");
  localStorage.setItem("loadsTourDismissed", "true");
  localStorage.setItem("tourSkipped", "true");
  localStorage.removeItem(STEP_KEY);
  
  // Destroy driver instance
  if (currentDriverInstance) {
    try {
      currentDriverInstance.destroy();
      currentDriverInstance = null;
    } catch (err) {
      console.log('❌ Error destroying tour:', err);
    }
  }
  
  // Remove ALL Driver.js elements from DOM
  const driverElements = document.querySelectorAll('.driver-overlay, .driver-popover, .driver-highlighted-element, .driver-popover-footer, .driver-popover-title, .driver-popover-description');
  driverElements.forEach(el => el.remove());
  
  // Remove any Driver.js styles
  const driverStyles = document.querySelectorAll('style[data-driver], style[id*="driver"]');
  driverStyles.forEach(el => el.remove());
  
  console.log('💀 EMERGENCY TOUR DISMISSED!');
}

/** Global exposure for debugging */
if (typeof window !== 'undefined') {
  (window as any).startLoadsTourStep1 = startLoadsTourStep1;
  (window as any).startLoadsTourStep2 = startLoadsTourStep2;
  (window as any).startLoadsTourStep3 = startLoadsTourStep3;
  (window as any).restartLoadsTour = restartLoadsTour;
  (window as any).skipLoadsTour = skipLoadsTour;
  (window as any).emergencyDismissTour = emergencyDismissTour;
  
  // GLOBAL EMERGENCY: Listen for ANY "Done" button clicks and dismiss tour (one-time only)
  if (!(window as any).__tourDoneListenerAdded) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.textContent?.trim() === 'Done') {
        console.log('🚨 GLOBAL: Done button clicked - dismissing tour!');
        emergencyDismissTour();
      }
    });
    (window as any).__tourDoneListenerAdded = true;
  }
  
  // Test function to verify skip works
  (window as any).testSkipTour = () => {
    console.log('🧪 Testing skip tour functionality...');
    skipLoadsTour();
    console.log('📋 localStorage after skip:', {
      loadsTourDismissed: localStorage.getItem('loadsTourDismissed'),
      loadsTourStep: localStorage.getItem('loadsTourStep')
    });
  };
  
  // Debug helper to manually test Step 3
  (window as any).testStep3 = () => {
    console.log('🧪 Manual Step 3 test triggered');
    setStep('3');
    startLoadsTourStep3();
  };
  
  // Debug helper to check DOM
  (window as any).checkMaterialsTab = () => {
    console.log('🔍 Checking Materials tab in DOM...');
    const tabs = document.querySelectorAll('.ant-tabs-tab');
    console.log('Found tabs:', tabs.length);
    tabs.forEach((tab, i) => {
      console.log(`Tab ${i}: "${tab.textContent?.trim()}" classes: ${tab.className}`);
    });
    const materialsSpan = document.querySelector('[data-testid="materials-tab"]');
    console.log('Materials span exists:', !!materialsSpan);
    return { tabs: tabs.length, materialsSpan: !!materialsSpan };
  };
  
  // Debug helper to manually reset tour to step 1 and start it
  (window as any).resetTourAndStart = () => {
    console.log('🔄 Manually resetting tour to step 1...');
    localStorage.removeItem(DISMISS_KEY);
    localStorage.setItem(STEP_KEY, '1');
    advancing = false;
    console.log('✅ Tour reset to step 1, starting...');
    setTimeout(() => {
      startLoadsTourStep1();
    }, 200);
  };
  
  // EMERGENCY FIX - Force start tour immediately
  (window as any).forceTourNow = () => {
    console.log('🚨 NUCLEAR TOUR START - clearing ALL state');
    
    // Clear ALL localStorage related to tours
    localStorage.removeItem('loadsTourStep');
    localStorage.removeItem('loadsTourDismissed');
    localStorage.removeItem('salesOrderTourStep');
    localStorage.removeItem('salesOrderTourDismissed');
    
    // Reset everything
    advancing = false;
    currentDriverInstance = null;
    
    // Force start IMMEDIATELY
    setTimeout(() => {
      console.log('🚀 NUCLEAR TOUR STARTING NOW!');
      startLoadsTourStep1();
    }, 50);
  };

  // EMERGENCY EMERGENCY - SUPER FORCE
  (window as any).SUPER_FORCE_TOUR = () => {
    console.log('💥 SUPER NUCLEAR TOUR FORCE!');
    
    // Remove ALL driver elements manually
    document.querySelectorAll('[class*="driver"]').forEach(el => el.remove());
    
    // Clear everything
    localStorage.clear();
    
    // Start immediately without any checks
    setTimeout(() => startLoadsTourStep1(), 100);
  };
  
  // Debug helper to check current state
  (window as any).checkTourState = () => {
    console.log('🔍 Current tour state:');
    console.log('- Step:', localStorage.getItem(STEP_KEY));
    console.log('- Dismissed:', !!localStorage.getItem(DISMISS_KEY));
    console.log('- Advancing:', advancing ? 'true' : 'false');
    return {
      step: localStorage.getItem(STEP_KEY),
      dismissed: !!localStorage.getItem(DISMISS_KEY),
      advancing
    };
  };
}

// --- Main Tour Function
/**
 * Public API: start the tour based on current localStorage step
 */
export async function startLoadsTour() {
  // Prevent multiple simultaneous starts
  if (tourStarting) {
    console.log('🚫 Tour already starting, ignoring duplicate call');
    return;
  }
  
  tourStarting = true;
  console.log('🚀 Starting Loads Tour...');
  
  // Prevent multiple tours running simultaneously
  if (currentDriverInstance) {
    console.log('⚠️ Tour already running, destroying existing instance...');
    try {
      currentDriverInstance.destroy();
      currentDriverInstance = null;
    } catch (err) {
      console.log('❌ Error destroying existing tour:', err);
    }
  }
  
  // Check if tour was dismissed, skipped, or completed
  const isDismissed = localStorage.getItem("loadsTourDismissed") === "true";
  const skipped = localStorage.getItem('tourSkipped') === 'true';
  const isCompleted = localStorage.getItem("tourCompleted") === "true";
  
  if (isDismissed || skipped || isCompleted) {
    console.log('🛑 Tour was dismissed/skipped/completed, not auto-starting');
    tourStarting = false;
    return;
  }
  
  const step = getStep();
  console.log('📋 Current step:', step);
  
  switch (step) {
    case "1":
      console.log('🎯 Starting Step 1');
      await startLoadsTourStep1();
      break;
    case "2":
      console.log('🎯 Starting Step 2');
      await startLoadsTourStep2();
      break;
    case "3":
      console.log('🎯 Starting Step 3');
      await startLoadsTourStep3();
      break;
    default:
      console.log('🎯 Starting from Step 1 (default)');
      await startLoadsTourStep1();
  }
  
  // Reset the flag when done
  tourStarting = false;
}
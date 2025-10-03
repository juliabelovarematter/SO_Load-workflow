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
    allowClose: true,
    overlayClickNext: false,
    showButtons: ["close"],
    showProgress: false,
    smoothScroll: true,
    stagePadding: 4,
    onDestroyStarted: () => {
      // Only count as "dismissed" if the user explicitly closes the tour
      if (!advancing) markDismissed();
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
  if (isDismissed()) return;
  if (getStep() !== "2") return;

  // Clean up any existing tours first
  cleanupExistingTour();

  const clickSel = await waitForAny(SEL.relatedSoClickTargets);
  const d = driver(makeDriverConfig());
  currentDriverInstance = d; // Track the current instance

  const steps: DriveStep[] = [
    {
      element: clickSel,
      popover: {
        title: "Assign Sales Order",
        description: "Select the Sales Order which the Load should be assigned to",
        position: "left",
        side: "left",
        align: "start",
      },
      onHighlightStarted: (el) => {
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
  
  if (isDismissed()) {
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
  
  const d = driver(makeDriverConfig());
  currentDriverInstance = d; // Track the current instance

  const steps: DriveStep[] = [
    {
      element: tabSel,
      popover: {
        title: "Load Materials",
        description: "Click on Materials tab to view & manage Load Materials",
        position: "bottom",
      },
      onHighlightStarted: (el) => {
        const onClick = () => {
          advancing = true;
          setStep("4");    // next section (explanatory steps)
          d.destroy();
          currentDriverInstance = null; // Clear global instance
          advancing = false;
        };
        el.addEventListener("click", onClick, { once: true });
        // Some AntD themes render the clickable area on the inner .ant-tabs-tab-btn
        const btn = (el as HTMLElement).closest(".ant-tabs-tab")?.querySelector(".ant-tabs-tab-btn") as HTMLElement | null;
        if (btn && btn !== el) btn.addEventListener("click", onClick, { once: true });
      },
    },
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
    overlayClickNext: false,
    showButtons: ["close"],
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
      description: "Click on the Load row to view & manage Load information",
      position: "bottom",
    },
    onHighlightStarted: (el) => {
      console.log('🎯 Load row highlighted - adding click listener...');
      
      const clickHandler = () => {
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
      const cells = el.querySelectorAll('td');
      cells.forEach(cell => {
        cell.addEventListener("click", clickHandler, { once: true });
      });
    },
  }];

  d.setSteps(steps);
  console.log('🚀 Starting loads tour Step 1...');
  d.drive();
}

/**
 * Public API: Restart Loads Tour from Step 1
 * Clears dismissal and resets tour to step 1
 */
export function restartLoadsTour(): void {
  console.log('🔄 Restarting Loads Tour...');
  localStorage.removeItem(DISMISS_KEY);
  localStorage.setItem(STEP_KEY, "1");
  console.log('✅ Tour restart completed - current step: 1');
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

/** Global exposure for debugging */
if (typeof window !== 'undefined') {
  (window as any).startLoadsTourStep1 = startLoadsTourStep1;
  (window as any).startLoadsTourStep2 = startLoadsTourStep2;
  (window as any).startLoadsTourStep3 = startLoadsTourStep3;
  (window as any).restartLoadsTour = restartLoadsTour;
  (window as any).resumeLoadsTour = resumeLoadsTour;
  
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
  
  if (isDismissed()) {
    console.log('❌ Tour was dismissed, not starting');
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
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

// Tour configuration - click-driven, no buttons
const driverConfig = {
  overlayClickNext: false,
  allowClose: false,
  showProgress: false,
  showButtons: [], // Disable Next/Prev/Close buttons
  overlayOpacity: 0.5,
  stagePadding: 4,
  stageRadius: 4,
  popoverOffset: 10,
  smoothScroll: true,
  disableActiveInteraction: false,
  allowKeyboardControl: false,
  onDestroyStarted: () => {
    console.log('Tour step destroyed')
  },
  onDestroyed: () => {
    console.log('Tour step cleanup complete')
  }
}

// Tour state management
const STORAGE_KEY = 'salesOrderTourStep'

export const getCurrentTourStep = (): string => {
  return localStorage.getItem(STORAGE_KEY) || '1'
}

export const setTourStep = (step: string): void => {
  localStorage.setItem(STORAGE_KEY, step)
}

export const clearTourStep = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

// Utility to wait for element to appear
const waitForElement = (selector: string, timeout = 10000): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector)
    if (existing) {
      resolve(existing)
      return
    }

    const timer = setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Element ${selector} not found within ${timeout}ms`))
    }, timeout)

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (element) {
        clearTimeout(timer)
        observer.disconnect()
        resolve(element)
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    })
  })
}

// Step 1: Highlight SO row
const runStep1 = async (): Promise<void> => {
  try {
    console.log('Step 1: Looking for SO row...')
    const element = await waitForElement('[data-testid="so-row"]')
    console.log('Step 1: Found SO row')
    
    const driverObj = driver(driverConfig)
    
    driverObj.highlight({
      element: '[data-testid="so-row"]',
      popover: {
        title: 'Sales Order Details',
        description: 'Click a Sales Order row to open its details.',
        side: 'bottom',
        align: 'start'
      }
    })

    // Listen for click on SO row
    const handleClick = (event: Event) => {
      const target = event.target as Element
      if (target.closest('[data-testid="so-row"]')) {
        setTourStep('2')
        driverObj.destroy()
        console.log('Step 1 completed - moving to step 2')
      }
    }

    document.addEventListener('click', handleClick, { once: true })
    
  } catch (error) {
    console.warn('Step 1: SO row not found, skipping tour step', error)
  }
}

// Step 2: Highlight Materials tab
const runStep2 = async (): Promise<void> => {
  try {
    console.log('Step 2: Looking for Materials tab...')
    
    // Wait for the tab to be available
    const element = await waitForElement('[data-testid="materials-tab"]')
    console.log('Step 2: Found Materials tab')
    
    const driverObj = driver(driverConfig)
    
    driverObj.highlight({
      element: '[data-testid="materials-tab"]',
      popover: {
        title: 'Sales Order Materials',
        description: 'Click the Materials tab to view and edit order materials.',
        side: 'bottom',
        align: 'start'
      }
    })

    // Listen for tab change event instead of click
    const handleTabChange = () => {
      // Check if Materials tab is now active
      const materialsTab = document.querySelector('[data-testid="materials-tab"]')
      const tabParent = materialsTab?.closest('.ant-tabs-tab')
      if (tabParent?.classList.contains('ant-tabs-tab-active')) {
        setTourStep('3')
        driverObj.destroy()
        console.log('Step 2 completed - moving to step 3')
        
        // Wait a bit for the Materials tab content to load, then start step 3
        setTimeout(() => {
          startSalesOrderTour()
        }, 1000)
      }
    }

    // Listen for DOM changes to detect tab activation
    const observer = new MutationObserver(() => {
      const materialsTab = document.querySelector('[data-testid="materials-tab"]')
      const tabParent = materialsTab?.closest('.ant-tabs-tab')
      if (tabParent?.classList.contains('ant-tabs-tab-active')) {
        observer.disconnect()
        setTourStep('3')
        driverObj.destroy()
        console.log('Step 2 completed - moving to step 3')
        
        // Wait a bit for the Materials tab content to load, then start step 3
        setTimeout(() => {
          startSalesOrderTour()
        }, 1000)
      }
    })

    // Observe the tabs container for changes
    const tabsContainer = document.querySelector('.ant-tabs')
    if (tabsContainer) {
      observer.observe(tabsContainer, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
      })
    }

    // Also listen for click as fallback
    const handleClick = (event: Event) => {
      const target = event.target as Element
      if (target.closest('[data-testid="materials-tab"]')) {
        // Give a small delay for the tab to activate
        setTimeout(() => {
          const materialsTab = document.querySelector('[data-testid="materials-tab"]')
          const tabParent = materialsTab?.closest('.ant-tabs-tab')
          if (tabParent?.classList.contains('ant-tabs-tab-active')) {
            observer.disconnect()
            setTourStep('3')
            driverObj.destroy()
            console.log('Step 2 completed - moving to step 3')
            
            // Wait a bit for the Materials tab content to load, then start step 3
            setTimeout(() => {
              startSalesOrderTour()
            }, 1000)
          }
        }, 100)
      }
    }

    document.addEventListener('click', handleClick, { once: true })
    
  } catch (error) {
    console.warn('Step 2: Materials tab not found, skipping tour step', error)
  }
}

// Step 3: Highlight price unit weight toggle
const runStep3 = async (): Promise<void> => {
  try {
    console.log('Step 3: Looking for price unit weight toggle...')
    
    // Wait for the Materials tab content to be loaded
    const element = await waitForElement('[data-testid="price-unit-weight-toggle"]')
    console.log('Step 3: Found price unit weight toggle')
    
    const driverObj = driver(driverConfig)
    
      driverObj.highlight({
        element: '[data-testid="price-unit-weight-toggle"]',
        popover: {
          title: 'Price Unit Weight',
          description: 'Switch to \'Price Unit Weight\' to enter the net weight in the same unit used for pricing.',
          side: 'bottom',
          align: 'start'
        }
      })

    // Listen for click on toggle
    const handleClick = (event: Event) => {
      const target = event.target as Element
      if (target.closest('[data-testid="price-unit-weight-toggle"]')) {
        setTourStep('4')
        driverObj.destroy()
        console.log('Step 3 completed - moving to step 4')
        
        // Start step 4 after a short delay
        setTimeout(() => {
          startSalesOrderTour()
        }, 500)
      }
    }

    document.addEventListener('click', handleClick, { once: true })
    
  } catch (error) {
    console.warn('Step 3: Price unit weight toggle not found, skipping tour step', error)
  }
}

// Step 4: Highlight material price unit
const runStep4 = async (): Promise<void> => {
  try {
    console.log('Step 4: Looking for material price unit...')
    
    const element = await waitForElement('[data-testid="material-price-unit"]')
    console.log('Step 4: Found material price unit')
    
    const driverObj = driver(driverConfig)
    
      driverObj.highlight({
        element: '[data-testid="material-price-unit"]',
        popover: {
          title: 'Price Unit Configuration',
          description: 'Update the material\'s price unit here. If \'Price Unit Weight\' is enabled, the weight will use the same unit.',
          side: 'bottom',
          align: 'start'
        }
      })

    // Listen for click on price unit select
    const handleClick = (event: Event) => {
      const target = event.target as Element
      if (target.closest('[data-testid="material-price-unit"]')) {
        setTourStep('5')
        driverObj.destroy()
        console.log('Step 4 completed - tour paused, waiting for save button to appear')
        
        // Start monitoring for save button appearance
        monitorSaveButton()
      }
    }

    document.addEventListener('click', handleClick, { once: true })
    
  } catch (error) {
    console.warn('Step 4: Material price unit not found, skipping tour step', error)
  }
}

// Step 5: Highlight save materials button
const runStep5 = async (): Promise<void> => {
  try {
    console.log('Step 5: Looking for save materials button...')
    
    const element = await waitForElement('[data-testid="save-materials-btn"]')
    console.log('Step 5: Found save materials button')
    
    const driverObj = driver(driverConfig)
    
    driverObj.highlight({
      element: '[data-testid="save-materials-btn"]',
      popover: {
        title: 'Save Changes',
        description: 'Click Save to update the Sales Order.',
        side: 'bottom',
        align: 'start'
      }
    })

    // Listen for click on save button
    const handleClick = (event: Event) => {
      const target = event.target as Element
      if (target.closest('[data-testid="save-materials-btn"]')) {
        clearTourStep()
        driverObj.destroy()
        console.log('Step 5 completed - tour finished')
      }
    }

    document.addEventListener('click', handleClick, { once: true })
    
  } catch (error) {
    console.warn('Step 5: Save materials button not found, skipping tour step', error)
  }
}

// Monitor for save button appearance and restart tour
const monitorSaveButton = (): void => {
  console.log('Monitoring for save button appearance...')
  
  const observer = new MutationObserver(() => {
    const saveButton = document.querySelector('[data-testid="save-materials-btn"]')
    if (saveButton && getCurrentTourStep() === '5') {
      console.log('Save button appeared - restarting tour at step 5')
      observer.disconnect()
      startSalesOrderTour()
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })

  // Also check immediately in case button is already there
  const saveButton = document.querySelector('[data-testid="save-materials-btn"]')
  if (saveButton && getCurrentTourStep() === '5') {
    console.log('Save button already present - restarting tour at step 5')
    observer.disconnect()
    startSalesOrderTour()
  }
}

// Check if we're on the correct page for the step
const isOnCorrectPage = (step: string): boolean => {
  const currentPath = window.location.pathname
  
  switch (step) {
    case '1':
      return currentPath.includes('/sales-orders')
    case '2':
    case '3':
    case '4':
    case '5':
      return currentPath.includes('/sales-order/')
    default:
      return false
  }
}

// Auto-reset tour if on wrong page
const autoResetTourIfNeeded = (): void => {
  const currentStep = getCurrentTourStep()
  const currentPath = window.location.pathname
  
  console.log('Auto-reset check: currentStep =', currentStep, 'currentPath =', currentPath)
  
  // If we're on sales-orders page but tour is at step 2+, reset to step 1
  if (currentPath.includes('/sales-orders') && currentStep !== '1') {
    console.log('Auto-resetting tour: on sales-orders page but tour step is', currentStep)
    setTourStep('1')
  }
  
  // If we're on sales-order detail page but tour is at step 1, reset to step 2
  if (currentPath.includes('/sales-order/') && currentStep === '1') {
    console.log('Auto-resetting tour: on sales-order detail page but tour step is 1')
    setTourStep('2')
  }
}

// Main tour function
export const startSalesOrderTour = (): void => {
  const currentPath = window.location.pathname
  console.log('Tour starting on path:', currentPath)
  
  // Auto-reset tour if needed based on current page
  autoResetTourIfNeeded()
  
  const currentStep = getCurrentTourStep()
  console.log(`Starting tour at step ${currentStep} on path: ${currentPath}`)

  // Check if we're on the correct page for this step
  if (!isOnCorrectPage(currentStep)) {
    console.log(`Step ${currentStep} not applicable on current page: ${currentPath}`)
    return
  }

  switch (currentStep) {
    case '1':
      console.log('Running Step 1: SO row highlight')
      runStep1()
      break
    case '2':
      console.log('Running Step 2: Materials tab highlight')
      runStep2()
      break
    case '3':
      console.log('Running Step 3: Price unit weight toggle highlight')
      runStep3()
      break
    case '4':
      console.log('Running Step 4: Material price unit highlight')
      runStep4()
      break
    case '5':
      console.log('Running Step 5: Save materials button highlight')
      runStep5()
      break
    default:
      console.log('Tour completed or invalid step')
  }
}

// Reset tour for testing
export const resetTour = (): void => {
  clearTourStep()
  console.log('Tour reset - will start from step 1')
}

// Check if tour is active
export const isTourActive = (): boolean => {
  return getCurrentTourStep() !== '1' || localStorage.getItem(STORAGE_KEY) !== null
}

// Force start tour from step 1 (for testing)
export const forceStartTour = (): void => {
  setTourStep('1')
  startSalesOrderTour()
}
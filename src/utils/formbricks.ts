import formbricks from '@formbricks/js'

// Clear Formbricks error state and reset
export const clearFormbricksErrorState = () => {
  try {
    // Clear Formbricks-related localStorage items
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('formbricks') || key.includes('Formbricks'))) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log('🗑️ Removed localStorage key:', key)
    })
    
    // Clear Formbricks-related sessionStorage items
    const sessionKeysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.includes('formbricks') || key.includes('Formbricks'))) {
        sessionKeysToRemove.push(key)
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key)
      console.log('🗑️ Removed sessionStorage key:', key)
    })
    
    console.log('✅ Formbricks error state cleared')
    return true
  } catch (error) {
    console.log('⚠️ Failed to clear Formbricks error state:', error)
    return false
  }
}

// Initialize Formbricks (call this once in your app)
export const initializeFormbricks = async () => {
  try {
    console.log('🔄 Initializing Formbricks...')
    
    // Clear any existing error state first
    clearFormbricksErrorState()
    
    // Setup Formbricks
    await formbricks.setup({
      environmentId: "cmfy9tv371mlnx801lfcjfy80", // your environment ID
      appUrl: "https://app.formbricks.com",
    })
    
    // Wait longer for setup to complete
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Logout any existing user first to avoid conflicts
    try {
      await formbricks.logout()
      console.log('✅ Logged out existing Formbricks user')
    } catch (logoutError) {
      console.log('ℹ️ No existing user to logout:', logoutError)
    }
    
    // Use a stable user ID for production prototype
    const userId = "prototype-user-reset"
    await formbricks.setUserId(userId)
    await formbricks.setAttribute("source", "prototype")
    await formbricks.setAttribute("environment", "production")
    
    // Wait a bit more to ensure user setup is complete
    await new Promise(resolve => setTimeout(resolve, 200))
    
    console.log('✅ Formbricks initialized successfully with user:', userId)
    return true
  } catch (error) {
    console.log('⚠️ Formbricks initialization failed:', error)
    return false
  }
}

// Reset user for production prototype (allows survey to show again)
export const resetUserForProduction = async () => {
  try {
    // Logout any existing user first
    try {
      await formbricks.logout()
      console.log('✅ Logged out existing user for reset')
    } catch (logoutError) {
      console.log('ℹ️ No existing user to logout during reset:', logoutError)
    }
    
    // Use a stable user ID that resets the survey state
    const userId = "prototype-user-reset"
    await formbricks.setUserId(userId)
    await formbricks.setAttribute("source", "prototype")
    await formbricks.setAttribute("environment", "production")
    console.log('✅ User reset for production prototype:', userId)
    return userId
  } catch (error) {
    console.log('⚠️ Failed to reset user:', error)
    return null
  }
}

// Trigger survey function
export const triggerSurvey = async (surveyId: string, context?: Record<string, any>) => {
  try {
    console.log('Triggering survey:', surveyId, 'with context:', context)
    
    // Ensure Formbricks is initialized first and wait for it to complete
    const isInitialized = await initializeFormbricks()
    if (!isInitialized) {
      console.log('⚠️ Formbricks initialization failed, cannot trigger survey')
      return
    }
    
    // Wait a bit more to ensure Formbricks is fully ready
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Formbricks should be ready after initialization
    
    console.log('✅ Formbricks is ready, proceeding with survey trigger')
    
    // Use generic event names that are commonly configured in Formbricks
    let eventName = "survey-triggered"
    if (context?.source === 'load-save-updates-button') {
      eventName = "survey-triggered" // Use generic event for Load Materials
    } else if (context?.source === 'so-save-updates-button') {
      eventName = "survey-triggered" // Use generic event for SO Materials
    } else if (context?.source === 'header-button') {
      eventName = "feedback-button-clicked"
    }
    
    console.log('Using event name:', eventName)
    
    // Track the event with proper error handling
    try {
      formbricks.track("button-clicked", { hiddenFields: {} })
      console.log('✅ Button click event sent for survey:', surveyId)
    } catch (trackError) {
      console.log('⚠️ Failed to track event:', trackError)
      return
    }
    
    console.log('ℹ️ Survey should trigger based on CSS class configuration')
    console.log('ℹ️ Survey trigger sent - survey will appear based on Formbricks dashboard configuration')
    
  } catch (error) {
    console.log('⚠️ Failed to trigger survey:', error)
  }
}

// Manual reset function for testing
export const resetUserForTesting = async () => {
  try {
    // Logout any existing user first
    try {
      await formbricks.logout()
      console.log('✅ Logged out existing user for testing')
    } catch (logoutError) {
      console.log('ℹ️ No existing user to logout during testing:', logoutError)
    }
    
    // Use a unique user ID for testing
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await formbricks.setUserId(userId)
    await formbricks.setAttribute("source", "prototype")
    await formbricks.setAttribute("environment", "testing")
    console.log('✅ User reset for testing:', userId)
    return userId
  } catch (error) {
    console.log('⚠️ Failed to reset user for testing:', error)
    return null
  }
}

// Test function to manually trigger surveys
export const testSurveyTrigger = async (surveyId: string, eventName: string) => {
  try {
    console.log('🧪 Testing survey trigger:', surveyId, 'with event:', eventName)
    
    // Ensure Formbricks is initialized
    await initializeFormbricks()
    
    // Track the test event
    formbricks.track(eventName, { hiddenFields: {} })
    
    console.log('✅ Test event sent successfully')
    
    // Also try a generic event
    formbricks.track("survey-triggered", { hiddenFields: {} })
    
    console.log('✅ Generic survey event also sent')
    
  } catch (error) {
    console.log('⚠️ Test failed:', error)
  }
}

// Global initialization - call this when the app starts
export const initializeFormbricksGlobally = async () => {
  try {
    console.log('🚀 Initializing Formbricks globally...')
    await initializeFormbricks()
    console.log('✅ Formbricks global initialization complete')
  } catch (error) {
    console.log('⚠️ Global Formbricks initialization failed:', error)
  }
}

// Your survey ID
export const FEEDBACK_SURVEY_ID = "cmg5eady614awyt01kqe0i5q4"

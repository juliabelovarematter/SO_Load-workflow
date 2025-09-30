import formbricks from '@formbricks/js'

// Initialize Formbricks (call this once in your app)
export const initializeFormbricks = async () => {
  try {
    // Check if already initialized
    if (formbricks.isInitialized) {
      console.log('ℹ️ Formbricks already initialized')
      return true
    }
    
    console.log('🔄 Initializing Formbricks...')
    
    await formbricks.setup({
      environmentId: "cmfy9tv371mlnx801lfcjfy80", // your environment ID
      appUrl: "https://app.formbricks.com",
    })
    
    // Wait a bit for setup to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
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
    
    // Ensure Formbricks is initialized first (only once)
    await initializeFormbricks()
    
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
    
    // Since Formbricks is configured to trigger on CSS class clicks,
    // we just need to ensure the button has the right class and send a simple event
    formbricks.track("button-clicked", {
      surveyId,
      context: context || {},
      timestamp: new Date().toISOString()
    })
    
    console.log('✅ Button click event sent for survey:', surveyId)
    console.log('ℹ️ Survey should trigger based on CSS class configuration')
    
    // Note: Direct survey opening is not available in @formbricks/js
    // Surveys are triggered by events and shown based on dashboard configuration
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
    formbricks.track(eventName, {
      surveyId,
      test: true,
      timestamp: new Date().toISOString()
    })
    
    console.log('✅ Test event sent successfully')
    
    // Also try a generic event
    formbricks.track("survey-triggered", {
      surveyId,
      eventName,
      test: true,
      timestamp: new Date().toISOString()
    })
    
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

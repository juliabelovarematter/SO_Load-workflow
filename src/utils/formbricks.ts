import formbricks from '@formbricks/js'

// Initialize Formbricks (call this once in your app)
export const initializeFormbricks = async () => {
  try {
    await formbricks.setup({
      environmentId: "cmfy9tv371mlnx801lfcjfy80", // your environment ID
      appUrl: "https://app.formbricks.com",
    })
    
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
export const resetUserForTesting = async () => {
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
    console.log('Triggering survey:', surveyId)
    
    // Ensure Formbricks is initialized first
    await initializeFormbricks()
    
    // Reset user for testing to allow survey to show again
    await resetUserForTesting()
    
    // Determine event name based on context
    let eventName = "survey-triggered"
    if (context?.source === 'load-save-updates-button') {
      eventName = "load-save-updates"
    } else if (context?.source === 'so-save-updates-button') {
      eventName = "so-save-updates"
    } else if (context?.source === 'header-button') {
      eventName = "feedback-button-clicked"
    }
    
    // Track the survey trigger event
    formbricks.track(eventName, {
      surveyId,
      context: context || {},
      timestamp: new Date().toISOString()
    })
    
    console.log('✅ Survey trigger event sent successfully')
  } catch (error) {
    console.log('⚠️ Failed to trigger survey:', error)
  }
}

// Your survey ID
export const FEEDBACK_SURVEY_ID = "cmg5eady614awyt01kqe0i5q4"
